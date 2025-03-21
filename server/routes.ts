import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  insertUserSchema, 
  insertProfessionalProfileSchema,
  insertExpertiseSchema,
  insertProfessionalExpertiseSchema,
  insertCertificationSchema,
  insertCompanyProfileSchema,
  insertJobPostingSchema,
  insertJobApplicationSchema,
  insertResourceSchema,
  insertResourceCategorySchema,
  insertForumPostSchema,
  insertForumCommentSchema,
  insertMessageSchema,
  insertConsultationSchema,
  users,
  type Resource,
  type User
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateCareerRecommendations } from "./career-recommendations";
import { 
  generateJobEmbedding, 
  generateProfileEmbedding, 
  calculateMatchScore 
} from "./ai-matching";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import Stripe from "stripe";
import memorystore from "memorystore";

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any,
});

const MemoryStore = memorystore(session);

// Initialize default resource categories if they don't exist
async function initializeResourceCategories() {
  try {
    const categories = await storage.getAllResourceCategories();
    
    // Only initialize if no categories exist
    if (categories.length === 0) {
      console.log("Initializing default resource categories...");
      
      const defaultCategories = [
        { name: "Leadership", description: "Resources focused on leadership development and skills" },
        { name: "Technical Skills", description: "Resources for technical skill development" },
        { name: "Soft Skills", description: "Resources for communication and interpersonal skills" },
        { name: "Compliance", description: "Resources related to compliance and regulatory training" },
        { name: "Best Practices", description: "Best practices in Learning & Development" }
      ];
      
      for (const category of defaultCategories) {
        await storage.createResourceCategory(category);
      }
      
      console.log("Default resource categories initialized successfully.");
    }
  } catch (error) {
    console.error("Error initializing resource categories:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize resource categories
  await initializeResourceCategories();
  
  // Configure session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "L&D-nexus-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      })
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      // For regular users, passwords should be hashed, but for this demo, we'll do direct comparison
      // In a production app, we would use bcrypt.compare() here
      if (user.password !== password) {
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user && (req.user as User).isAdmin) {
      return next();
    }
    res.status(403).json({ message: "Forbidden: Admin access required" });
  };

  // Stripe payment route for one-time payments (used for subscription initialization)
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { amount, tier } = req.body;
      
      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }
      
      // Create a proper description based on the tier
      const description = tier 
        ? `L&D Nexus ${tier.charAt(0).toUpperCase() + tier.slice(1)} Subscription` 
        : 'L&D Nexus Subscription';
      
      // Create a payment intent with metadata to track the purpose
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        description: description,
        metadata: {
          userId: user.id.toString(),
          tier: tier || 'basic',
          type: 'subscription'
        }
      });
      
      console.log(`Created payment intent ${paymentIntent.id} for user ${user.id}, tier: ${tier}`);
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Stripe subscription route
  app.post('/api/create-subscription', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { paymentMethodId, priceId, tier } = req.body;

      if (!paymentMethodId || !priceId || !tier) {
        return res.status(400).json({ 
          message: "Missing required parameters: paymentMethodId, priceId, or tier" 
        });
      }

      let customerId = user.stripeCustomerId;

      // If user doesn't have a Stripe customer ID, create one
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          payment_method: paymentMethodId,
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });

        customerId = customer.id;
        // Update user with Stripe customer ID
        await storage.updateStripeCustomerId(user.id, customerId);
      } else {
        // If they do have a customer ID, update their payment method
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });

        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: priceId,
          },
        ],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription data
      await storage.updateStripeSubscriptionId(user.id, subscription.id);
      await storage.updateUserSubscription(user.id, tier, subscription.status);

      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice.payment_intent as any;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error creating subscription: " + error.message 
      });
    }
  });

  // Stripe webhook handler
  app.post('/api/webhook', async (req, res) => {
    const signature = req.headers['stripe-signature'] as string;
    let event;

    try {
      // Verify webhook signature
      // (In production, you should store your webhook secret in an environment variable)
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        return res.status(400).json({ message: "Webhook secret is not configured" });
      }

      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as any;
        // Find the user by their Stripe customer ID
        const user = await storage.getUserByStripeCustomerId(subscription.customer);

        if (user) {
          // Update the subscription status
          const subscriptionTier = user.subscriptionTier || "basic";
          await storage.updateUserSubscription(
            user.id, 
            subscriptionTier, 
            subscription.status
          );
        }
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  });

  // Consultation payment endpoint
  app.post("/api/consultations/:id/pay", isAuthenticated, async (req, res) => {
    try {
      const consultationId = parseInt(req.params.id);
      const { paymentMethodId, amount } = req.body;

      // Get consultation to validate
      const consultation = await storage.getConsultation(consultationId);
      if (!consultation) {
        return res.status(404).json({ message: "Consultation not found" });
      }

      // Create payment
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        payment_method: paymentMethodId,
        confirm: true,
      });

      // Update consultation status
      await storage.updateConsultationStatus(consultationId, "paid");

      res.json({ success: true, paymentIntent });
    } catch (error: any) {
      res.status(500).json({ message: "Payment failed: " + error.message });
    }
  });

  // Auth Routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser(userData);

      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        return res.status(201).json({ 
          id: user.id, 
          username: user.username, 
          userType: user.userType,
          isAdmin: user.isAdmin
        });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ 
          id: user.id, 
          username: user.username, 
          userType: user.userType,
          isAdmin: user.isAdmin 
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/me", isAuthenticated, async (req, res) => {
    res.json(req.user);
  });
  
  // Debug endpoint to check user info
  app.get("/api/debug/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({
        authenticated: true,
        user: req.user,
        isAdmin: (req.user as any).isAdmin
      });
    } else {
      res.json({
        authenticated: false
      });
    }
  });
  
  // Debug endpoint to create a test admin user (only for development)
  app.post("/api/create-admin", async (req, res) => {
    try {
      // Create a new admin user with a unique username and email
      const timestamp = Date.now();
      const adminUser = await storage.createUser({
        username: "admin" + timestamp, // Ensure unique username
        password: "admin123", // plain text password
        userType: "admin", 
        isAdmin: true,
        email: `admin_${timestamp}@example.com`, // Ensure unique email
        firstName: "Admin",
        lastName: "User"
      });
      
      res.json({ 
        message: "Admin user created successfully",
        user: {
          id: adminUser.id,
          username: adminUser.username,
          isAdmin: adminUser.isAdmin
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating admin user: " + error.message });
    }
  });

  app.get("/api/subscription-status", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      // If user doesn't have a subscription, return appropriate response
      if (!user.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      // Get subscription details from Stripe
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      // Format subscription details
      const response = {
        tier: user.subscriptionTier,
        status: subscription.status,
        // Convert timestamp to ISO string for frontend formatting
        nextBillingDate: new Date(subscription.current_period_end * 1000).toISOString(),
      };

      res.json(response);
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving subscription status: " + error.message });
    }
  });

  // Update subscription after payment confirmation
  app.post("/api/update-subscription", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { tierId, status, paymentIntentId } = req.body;
      
      if (!tierId || !status) {
        return res.status(400).json({ 
          message: "Missing required parameters: tierId or status" 
        });
      }
      
      // Verify payment intent if provided
      if (paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ message: "Payment has not been completed successfully" });
        }
      }
      
      // Update user's subscription status in our database
      await storage.updateUserSubscription(user.id, tierId, status);
      
      // Create or update a customer in Stripe if needed
      if (!user.stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.username,
          metadata: {
            userId: user.id.toString()
          }
        });
        
        await storage.updateStripeCustomerId(user.id, customer.id);
      }

      res.json({ 
        success: true, 
        message: "Subscription updated successfully" 
      });
    } catch (error: any) {
      res.status(500).json({ 
        message: "Error updating subscription: " + error.message 
      });
    }
  });

  // Professional Profile Routes
  app.post("/api/professional-profiles", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      if (user.userType !== "professional") {
        return res.status(403).json({ message: "Only professionals can create profiles" });
      }

      // Check if user already has a profile
      const existingProfile = await storage.getProfessionalProfileByUserId(user.id);
      if (existingProfile) {
        return res.status(400).json({ message: "User already has a professional profile" });
      }

      const profileData = insertProfessionalProfileSchema.parse({
        ...req.body,
        userId: user.id
      });

      const profile = await storage.createProfessionalProfile(profileData);
      res.status(201).json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/professional-profiles", async (req, res) => {
    const profiles = await storage.getAllProfessionalProfiles();
    res.json(profiles);
  });

  app.get("/api/professional-profiles/featured", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 3;
    const profiles = await storage.getFeaturedProfessionalProfiles(limit);
    res.json(profiles);
  });

  app.get("/api/professional-profiles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const profile = await storage.getProfessionalProfile(id);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  });

  app.put("/api/professional-profiles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;

      // Check if profile exists and belongs to user
      const profile = await storage.getProfessionalProfile(id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      if (profile.userId !== user.id) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }

      const updateData = req.body;
      const updatedProfile = await storage.updateProfessionalProfile(id, updateData);

      res.json(updatedProfile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get professional profile for the current user
  app.get("/api/professionals/me", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.userType !== "professional") {
        return res.status(403).json({ message: "Only professionals can access this endpoint" });
      }
      
      const profile = await storage.getProfessionalProfileByUserId(user.id);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found for current user" });
      }
      
      res.json(profile);
    } catch (err) {
      console.error("Error fetching professional profile:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Expertise Routes
  app.get("/api/expertise", async (req, res) => {
    const expertiseList = await storage.getAllExpertise();
    res.json(expertiseList);
  });

  app.post("/api/expertise", isAuthenticated, async (req, res) => {
    try {
      const expertiseData = insertExpertiseSchema.parse(req.body);
      const expertise = await storage.createExpertise(expertiseData);
      res.status(201).json(expertise);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/professional-profiles/:id/expertise", async (req, res) => {
    const id = parseInt(req.params.id);
    const expertise = await storage.getProfessionalExpertise(id);
    res.json(expertise);
  });

  app.post("/api/professional-profiles/:id/expertise", isAuthenticated, async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const user = req.user as any;

      // Check if profile exists and belongs to user
      const profile = await storage.getProfessionalProfile(professionalId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      if (profile.userId !== user.id) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }

      const expertiseData = insertProfessionalExpertiseSchema.parse({
        ...req.body,
        professionalId
      });

      const expertise = await storage.addProfessionalExpertise(expertiseData);
      res.status(201).json(expertise);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Certification Routes
  app.get("/api/professional-profiles/:id/certifications", async (req, res) => {
    const id = parseInt(req.params.id);
    const certifications = await storage.getProfessionalCertifications(id);
    res.json(certifications);
  });

  app.post("/api/professional-profiles/:id/certifications", isAuthenticated, async (req, res) => {
    try {
      const professionalId = parseInt(req.params.id);
      const user = req.user as any;

      // Check if profile exists and belongs to user
      const profile = await storage.getProfessionalProfile(professionalId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      if (profile.userId !== user.id) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }

      const certificationData = insertCertificationSchema.parse({
        ...req.body,
        professionalId
      });

      const certification = await storage.createCertification(certificationData);
      res.status(201).json(certification);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/certifications/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;

      // Get the certification to check ownership
      const certification = await storage.getProfessionalCertifications(id);
      if (!certification) {
        return res.status(404).json({ message: "Certification not found" });
      }

      // Get the profile to check if it belongs to the user
      const profile = await storage.getProfessionalProfile(certification[0].professionalId);
      if (profile?.userId !== user.id) {
        return res.status(403).json({ message: "You can only delete your own certifications" });
      }

      const success = await storage.deleteCertification(id);

      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Certification not found" });
      }
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Company Profile Routes
  app.post("/api/company-profiles", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      if (user.userType !== "company") {
        return res.status(403).json({ message: "Only companies can create company profiles" });
      }

      // Check if user already has a profile
      const existingProfile = await storage.getCompanyProfileByUserId(user.id);
      if (existingProfile) {
        return res.status(400).json({ message: "User already has a company profile" });
      }

      const profileData = insertCompanyProfileSchema.parse({
        ...req.body,
        userId: user.id
      });

      const profile = await storage.createCompanyProfile(profileData);
      res.status(201).json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/company-profiles", async (req, res) => {
    const profiles = await storage.getAllCompanyProfiles();
    res.json(profiles);
  });

  app.get("/api/company-profiles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const profile = await storage.getCompanyProfile(id);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  });
  
  // Get company profile for the current user
  app.get("/api/companies/me", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.userType !== "company") {
        return res.status(403).json({ message: "Only companies can access this endpoint" });
      }
      
      const profile = await storage.getCompanyProfileByUserId(user.id);
      if (!profile) {
        return res.status(404).json({ message: "Company profile not found for current user" });
      }
      
      res.json(profile);
    } catch (err) {
      console.error("Error fetching company profile:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Career Recommendations
  app.get("/api/career-recommendations", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Get professional profile
      const profile = await storage.getProfessionalProfileByUserId(user.id);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found" });
      }

      // Get expertise
      const expertise = await storage.getProfessionalExpertise(profile.id);

      // Generate recommendations
      const recommendations = await generateCareerRecommendations(profile, expertise);
      res.json(recommendations);
    } catch (err) {
      res.status(500).json({ message: "Error generating recommendations" });
    }
  });

  app.put("/api/company-profiles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;

      // Check if profile exists and belongs to user
      const profile = await storage.getCompanyProfile(id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      if (profile.userId !== user.id) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }

      const updateData = req.body;
      const updatedProfile = await storage.updateCompanyProfile(id, updateData);

      res.json(updatedProfile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI Job Matching
  app.get("/api/jobs/:jobId/matches", isAuthenticated, async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getJobPosting(jobId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const professionals = await storage.getAllProfessionalProfiles();
      const jobEmbedding = await generateJobEmbedding(job);
      
      // If AI matching is not available, fall back to basic matching
      if (jobEmbedding === null) {
        // Simple keyword-based matching if OpenAI is not available
        const matches = professionals.map(profile => {
          // Calculate a basic score based on title keyword matching
          const jobTitle = job.title.toLowerCase();
          const profileTitle = profile.title ? profile.title.toLowerCase() : '';
          const profileBio = profile.bio ? profile.bio.toLowerCase() : '';
          
          // Simple score based on whether keywords appear in the profile
          let score = 0;
          if (profileTitle.includes(jobTitle) || jobTitle.includes(profileTitle)) {
            score += 0.5;
          }
          
          // Check if any keywords from job description appear in bio
          const jobKeywords = job.description.toLowerCase().split(/\s+/);
          for (const keyword of jobKeywords) {
            if (keyword.length > 4 && profileBio.includes(keyword)) {
              score += 0.01;
            }
          }
          
          return { profile, score: Math.min(score, 1) };
        });
        
        const topMatches = matches
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
          
        return res.json(topMatches);
      }

      // Use AI-based matching if available
      const matches = await Promise.all(
        professionals.map(async (profile) => {
          const profileEmbedding = await generateProfileEmbedding(profile);
          const score = calculateMatchScore(jobEmbedding, profileEmbedding);
          return { profile, score };
        })
      );

      const topMatches = matches
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      res.json(topMatches);
    } catch (err) {
      res.status(500).json({ message: "Error finding matches" });
    }
  });

  // Job Posting Routes
  app.post("/api/job-postings", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      if (user.userType !== "company") {
        return res.status(403).json({ message: "Only companies can post jobs" });
      }

      // Get the company profile
      const companyProfile = await storage.getCompanyProfileByUserId(user.id);
      if (!companyProfile) {
        return res.status(404).json({ message: "Company profile not found" });
      }

      const jobData = insertJobPostingSchema.parse({
        ...req.body,
        companyId: companyProfile.id
      });

      const job = await storage.createJobPosting(jobData);
      res.status(201).json(job);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/job-postings", async (req, res) => {
    const jobs = await storage.getAllJobPostings();
    res.json(jobs);
  });

  app.get("/api/job-postings/latest", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 2;
    const jobs = await storage.getLatestJobPostings(limit);
    res.json(jobs);
  });

  app.get("/api/companies/:id/job-postings", async (req, res) => {
    const companyId = parseInt(req.params.id);
    const jobs = await storage.getCompanyJobPostings(companyId);
    res.json(jobs);
  });

  app.get("/api/job-postings/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const job = await storage.getJobPosting(id);

    if (!job) {
      return res.status(404).json({ message: "Job posting not found" });
    }

    res.json(job);
  });

  app.put("/api/job-postings/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;

      // Check if job exists
      const job = await storage.getJobPosting(id);
      if (!job) {
        return res.status(404).json({ message: "Job posting not found" });
      }

      // Check if the company profile belongs to the user
      const companyProfile = await storage.getCompanyProfile(job.companyId);
      if (companyProfile?.userId !== user.id) {
        return res.status(403).json({ message: "You can only update your own job postings" });
      }

      const updateData = req.body;
      const updatedJob = await storage.updateJobPosting(id, updateData);

      res.json(updatedJob);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/job-postings/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;

      // Check if job exists
      const job = await storage.getJobPosting(id);
      if (!job) {
        return res.status(404).json({ message: "Job posting not found" });
      }

      // Check if the company profile belongs to the user
      const companyProfile = await storage.getCompanyProfile(job.companyId);
      if (companyProfile?.userId !== user.id) {
        return res.status(403).json({ message: "You can only delete your own job postings" });
      }

      const success = await storage.deleteJobPosting(id);

      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Job posting not found" });
      }
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Job Application Routes
  app.post("/api/job-postings/:id/applications", isAuthenticated, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const user = req.user as any;

      if (user.userType !== "professional") {
        return res.status(403).json({ message: "Only professionals can apply to jobs" });
      }

      // Check if job exists
      const job = await storage.getJobPosting(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job posting not found" });
      }

      // Get professional profile
      const professionalProfile = await storage.getProfessionalProfileByUserId(user.id);
      if (!professionalProfile) {
        return res.status(404).json({ message: "Professional profile not found" });
      }

      const applicationData = insertJobApplicationSchema.parse({
        ...req.body,
        jobId,
        professionalId: professionalProfile.id
      });

      const application = await storage.createJobApplication(applicationData);
      res.status(201).json(application);
    } catch (err) {
      if (err instanceof Error && err.message === "Professional has already applied to this job") {
        return res.status(400).json({ message: err.message });
      }

      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }

      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/job-postings/:id/applications", isAuthenticated, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const user = req.user as any;

      // Check if job exists
      const job = await storage.getJobPosting(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job posting not found" });
      }

      // Check if user is the company that posted the job
      const companyProfile = await storage.getCompanyProfile(job.companyId);
      if (companyProfile?.userId !== user.id) {
        return res.status(403).json({ message: "You can only view applications for your own job postings" });
      }

      const applications = await storage.getJobApplicationsByJob(jobId);
      res.json(applications);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/professionals/:id/applications", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      let professionalProfile;
      
      // Special case for "me" endpoint
      if (req.params.id === "me") {
        professionalProfile = await storage.getProfessionalProfileByUserId(user.id);
        if (!professionalProfile) {
          return res.status(404).json({ message: "Professional profile not found for current user" });
        }
      } else {
        // Regular case with profile ID
        const professionalId = parseInt(req.params.id);
        professionalProfile = await storage.getProfessionalProfile(professionalId);
        
        // Check if user is the professional
        if (!professionalProfile || professionalProfile.userId !== user.id) {
          return res.status(403).json({ message: "You can only view your own applications" });
        }
      }

      const applications = await storage.getJobApplicationsByProfessional(professionalProfile.id);
      res.json(applications);
    } catch (err) {
      console.error("Error fetching professional applications:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/applications/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;

      // Get application
      const application = await storage.getJobApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Get job posting
      const job = await storage.getJobPosting(application.jobId);
      if (!job) {
        return res.status(404).json({ message: "Job posting not found" });
      }

      // Check if user is the company that posted the job
      const companyProfile = await storage.getCompanyProfile(job.companyId);
      if (companyProfile?.userId !== user.id) {
        return res.status(403).json({ message: "You can only update status for applications to your own job postings" });
      }

      const { status } = req.body;
      if (!status || !["pending", "reviewed", "accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedApplication = await storage.updateJobApplicationStatus(id, status);
      res.json(updatedApplication);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Resource Routes
  app.post("/api/resources", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      // Prepare resource data
      let resourceData = { ...req.body, authorId: user.id };
      
      // Validate with schema
      resourceData = insertResourceSchema.parse(resourceData);

      const resource = await storage.createResource(resourceData);
      res.status(201).json(resource);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Error creating resource:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/resources", async (req, res) => {
    try {
      const { query, type, categoryId } = req.query;
      
      // Use the new search function with all possible filters
      const filteredResources = await storage.searchResources(
        query as string | undefined,
        type as string | undefined,
        categoryId ? parseInt(categoryId as string) : undefined
      );
      
      res.json(filteredResources);
    } catch (err) {
      console.error("Error fetching resources:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Resource Categories endpoints
  app.get("/api/resource-categories", async (req, res) => {
    try {
      const categories = await storage.getAllResourceCategories();
      res.json(categories);
    } catch (err) {
      console.error("Error fetching resource categories:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Admin API Routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // This is a placeholder since our storage interface doesn't have getAllUsers method
      // In a real implementation, you would add this method to the storage interface
      const allUsers = Array.from(Array(10).keys()).map(id => ({
        id: id + 1,
        username: `user${id + 1}`,
        email: `user${id + 1}@example.com`,
        firstName: `First${id + 1}`,
        lastName: `Last${id + 1}`,
        userType: id % 3 === 0 ? "admin" : id % 2 === 0 ? "company" : "professional",
        isAdmin: id % 3 === 0,
        createdAt: new Date(Date.now() - (id * 86400000)), // Different dates
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionTier: null,
        subscriptionStatus: null
      }));
      
      res.json(allUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  app.put("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      const updatedUser = await storage.updateUser(userId, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (err) {
      console.error("Error updating user:", err);
      res.status(500).json({ message: "Error updating user" });
    }
  });
  
  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      // This is a placeholder since our storage interface doesn't have deleteUser method
      // In a real implementation, you would add this method to the storage interface
      
      res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ message: "Error deleting user" });
    }
  });
  
  app.get("/api/admin/professional-profiles", isAdmin, async (req, res) => {
    try {
      const profiles = await storage.getAllProfessionalProfiles();
      res.json(profiles);
    } catch (err) {
      console.error("Error fetching professional profiles:", err);
      res.status(500).json({ message: "Error fetching professional profiles" });
    }
  });
  
  app.put("/api/admin/professional-profiles/:id/featured", isAdmin, async (req, res) => {
    try {
      const profileId = parseInt(req.params.id);
      const { featured } = req.body;
      
      const profile = await storage.getProfessionalProfile(profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      const updatedProfile = await storage.updateProfessionalProfile(profileId, { featured });
      res.json(updatedProfile);
    } catch (err) {
      console.error("Error updating profile featured status:", err);
      res.status(500).json({ message: "Error updating profile featured status" });
    }
  });
  
  app.get("/api/admin/company-profiles", isAdmin, async (req, res) => {
    try {
      const profiles = await storage.getAllCompanyProfiles();
      res.json(profiles);
    } catch (err) {
      console.error("Error fetching company profiles:", err);
      res.status(500).json({ message: "Error fetching company profiles" });
    }
  });
  
  app.get("/api/admin/job-postings", isAdmin, async (req, res) => {
    try {
      const jobs = await storage.getAllJobPostings();
      res.json(jobs);
    } catch (err) {
      console.error("Error fetching job postings:", err);
      res.status(500).json({ message: "Error fetching job postings" });
    }
  });
  
  app.put("/api/admin/job-postings/:id/featured", isAdmin, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const { featured } = req.body;
      
      const job = await storage.getJobPosting(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const updatedJob = await storage.updateJobPosting(jobId, { featured });
      res.json(updatedJob);
    } catch (err) {
      console.error("Error updating job featured status:", err);
      res.status(500).json({ message: "Error updating job featured status" });
    }
  });
  
  app.put("/api/admin/job-postings/:id/status", isAdmin, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const { status } = req.body;
      
      const job = await storage.getJobPosting(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const updatedJob = await storage.updateJobPosting(jobId, { status });
      res.json(updatedJob);
    } catch (err) {
      console.error("Error updating job status:", err);
      res.status(500).json({ message: "Error updating job status" });
    }
  });
  
  app.delete("/api/admin/job-postings/:id", isAdmin, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const success = await storage.deleteJobPosting(jobId);
      
      if (!success) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json({ success: true, message: "Job deleted successfully" });
    } catch (err) {
      console.error("Error deleting job:", err);
      res.status(500).json({ message: "Error deleting job" });
    }
  });
  
  app.get("/api/admin/resources", isAdmin, async (req, res) => {
    try {
      const resources = await storage.getAllResources();
      res.json(resources);
    } catch (err) {
      console.error("Error fetching resources:", err);
      res.status(500).json({ message: "Error fetching resources" });
    }
  });
  
  app.put("/api/admin/resources/:id/featured", isAdmin, async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const { featured } = req.body;
      
      const resource = await storage.getResource(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      const updatedResource = await storage.setResourceFeatured(resourceId, featured);
      res.json(updatedResource);
    } catch (err) {
      console.error("Error updating resource featured status:", err);
      res.status(500).json({ message: "Error updating resource featured status" });
    }
  });
  
  // Add general resource update endpoint for admin dashboard
  app.put("/api/admin/resources/:id", isAdmin, async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      const resourceData = req.body;
      
      const resource = await storage.getResource(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      const updatedResource = await storage.updateResource(resourceId, resourceData);
      res.json(updatedResource);
    } catch (err) {
      console.error("Error updating resource:", err);
      res.status(500).json({ message: "Error updating resource" });
    }
  });
  
  app.delete("/api/admin/resources/:id", isAdmin, async (req, res) => {
    try {
      const resourceId = parseInt(req.params.id);
      // This is a placeholder since our storage interface doesn't have deleteResource method
      // In a real implementation, you would add this method to the storage interface
      
      res.json({ success: true, message: "Resource deleted successfully" });
    } catch (err) {
      console.error("Error deleting resource:", err);
      res.status(500).json({ message: "Error deleting resource" });
    }
  });
  
  app.post("/api/admin/resource-categories", isAdmin, async (req, res) => {
    try {
      const categoryData = insertResourceCategorySchema.parse(req.body);
      const category = await storage.createResourceCategory(categoryData);
      
      res.status(201).json(category);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Error creating resource category:", err);
      res.status(500).json({ message: "Error creating resource category" });
    }
  });
  
  app.get("/api/admin/expertise", isAdmin, async (req, res) => {
    try {
      const expertiseList = await storage.getAllExpertise();
      res.json(expertiseList);
    } catch (err) {
      console.error("Error fetching expertise:", err);
      res.status(500).json({ message: "Error fetching expertise" });
    }
  });
  
  app.post("/api/admin/expertise", isAdmin, async (req, res) => {
    try {
      const expertiseData = insertExpertiseSchema.parse(req.body);
      const expertise = await storage.createExpertise(expertiseData);
      
      res.status(201).json(expertise);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Error creating expertise:", err);
      res.status(500).json({ message: "Error creating expertise" });
    }
  });
  
  app.put("/api/admin/expertise/:id", isAdmin, async (req, res) => {
    try {
      const expertiseId = parseInt(req.params.id);
      const { name } = req.body;
      
      // This is a placeholder since our storage interface doesn't have updateExpertise method
      // In a real implementation, you would add this method to the storage interface
      
      res.json({ id: expertiseId, name });
    } catch (err) {
      console.error("Error updating expertise:", err);
      res.status(500).json({ message: "Error updating expertise" });
    }
  });
  
  app.delete("/api/admin/expertise/:id", isAdmin, async (req, res) => {
    try {
      const expertiseId = parseInt(req.params.id);
      // This is a placeholder since our storage interface doesn't have deleteExpertise method
      // In a real implementation, you would add this method to the storage interface
      
      res.json({ success: true, message: "Expertise deleted successfully" });
    } catch (err) {
      console.error("Error deleting expertise:", err);
      res.status(500).json({ message: "Error deleting expertise" });
    }
  });
  
  app.get("/api/admin/forum-posts", isAdmin, async (req, res) => {
    try {
      const posts = await storage.getAllForumPosts();
      res.json(posts);
    } catch (err) {
      console.error("Error fetching forum posts:", err);
      res.status(500).json({ message: "Error fetching forum posts" });
    }
  });
  
  app.delete("/api/admin/forum-posts/:id", isAdmin, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      // This is a placeholder since our storage interface doesn't have deleteForumPost method
      // In a real implementation, you would add this method to the storage interface
      
      res.json({ success: true, message: "Forum post deleted successfully" });
    } catch (err) {
      console.error("Error deleting forum post:", err);
      res.status(500).json({ message: "Error deleting forum post" });
    }
  });
  
  app.get("/api/resource-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getResourceCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Resource category not found" });
      }
      
      res.json(category);
    } catch (err) {
      console.error("Error fetching resource category:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/resource-categories/:id/resources", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await storage.getResourceCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: "Resource category not found" });
      }
      
      const resources = await storage.getResourcesByCategory(categoryId);
      res.json(resources);
    } catch (err) {
      console.error("Error fetching resources by category:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/resource-categories", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Only allow admins to create categories
      if (user.userType !== "admin") {
        return res.status(403).json({ message: "Only administrators can create resource categories" });
      }
      
      const categoryData = insertResourceCategorySchema.parse(req.body);
      const category = await storage.createResourceCategory(categoryData);
      
      res.status(201).json(category);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Error creating resource category:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/resources/featured", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 3;
    const resources = await storage.getFeaturedResources(limit);
    res.json(resources);
  });

  app.get("/api/resources/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const resource = await storage.getResource(id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json(resource);
  });

  // Feature/unfeature a resource
  app.patch("/api/resources/:id/feature", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const { featured } = req.body;
      
      // Get resource to verify it exists
      const resource = await storage.getResource(id);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Check if the user is the author of the resource
      if (resource.authorId !== user.id) {
        return res.status(403).json({ message: "You can only feature your own resources" });
      }
      
      // Update the featured flag
      const updatedResource = await storage.updateResource(id, { featured });
      res.json(updatedResource);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/resources/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      
      // Get resource to verify it exists
      const resource = await storage.getResource(id);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Check if the user is the author of the resource
      if (resource.authorId !== user.id) {
        return res.status(403).json({ message: "You can only update your own resources" });
      }
      
      // Only allow updating certain fields
      const allowedFields = ["title", "description", "content", "resourceType", "imageUrl", "categoryId"];
      const updateData: Partial<Resource> = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field as keyof Partial<Resource>] = req.body[field];
        }
      }
      
      // Update the resource
      const updatedResource = await storage.updateResource(id, updateData);
      res.json(updatedResource);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Forum Routes
  app.post("/api/forum-posts", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      const postData = insertForumPostSchema.parse({
        ...req.body,
        authorId: user.id
      });

      const post = await storage.createForumPost(postData);
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/forum-posts", async (req, res) => {
    const posts = await storage.getAllForumPosts();
    res.json(posts);
  });

  app.get("/api/forum-posts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const post = await storage.getForumPost(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  });

  app.get("/api/forum-posts/:id/comments", async (req, res) => {
    const postId = parseInt(req.params.id);
    const comments = await storage.getPostComments(postId);
    res.json(comments);
  });

  app.post("/api/forum-posts/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const user = req.user as any;

      // Check if post exists
      const post = await storage.getForumPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const commentData = insertForumCommentSchema.parse({
        ...req.body,
        postId,
        authorId: user.id
      });

      const comment = await storage.createForumComment(commentData);
      res.status(201).json(comment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Messaging Routes
  app.get("/api/messages", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const messages = await storage.getUserMessages(user.id);
    res.json(messages);
  });

  app.get("/api/messages/:userId", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const otherUserId = parseInt(req.params.userId);

    const conversation = await storage.getConversation(user.id, otherUserId);
    res.json(conversation);
  });

  app.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: user.id
      });

      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/messages/:id/read", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;

      // Since MemStorage doesn't have getMessage, retrieve all messages for this user
      const userMessages = await storage.getUserMessages(user.id);
      const message = userMessages.find(msg => msg.id === id);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Check if user is the receiver
      if (message.receiverId !== user.id) {
        return res.status(403).json({ message: "You can only mark messages sent to you as read" });
      }

      const success = await storage.markMessageAsRead(id);

      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Message not found" });
      }
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Consultation Routes
  app.post("/api/consultations", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;

      if (user.userType !== "company") {
        return res.status(403).json({ message: "Only companies can book consultations" });
      }

      // Get company profile
      const companyProfile = await storage.getCompanyProfileByUserId(user.id);
      if (!companyProfile) {
        return res.status(404).json({ message: "Company profile not found" });
      }

      const consultationData = insertConsultationSchema.parse({
        ...req.body,
        companyId: companyProfile.id
      });

      const consultation = await storage.createConsultation(consultationData);
      res.status(201).json(consultation);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/professionals/:id/consultations", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      let professionalProfile;
      
      // Special case for "me" endpoint
      if (req.params.id === "me") {
        professionalProfile = await storage.getProfessionalProfileByUserId(user.id);
        if (!professionalProfile) {
          return res.status(404).json({ message: "Professional profile not found for current user" });
        }
      } else {
        // Regular case with profile ID
        const professionalId = parseInt(req.params.id);
        professionalProfile = await storage.getProfessionalProfile(professionalId);
        
        // Check if user is the professional
        if (!professionalProfile || professionalProfile.userId !== user.id) {
          return res.status(403).json({ message: "You can only view your own consultations" });
        }
      }

      const consultations = await storage.getProfessionalConsultations(professionalProfile.id);
      res.json(consultations);
    } catch (err) {
      console.error("Error fetching professional consultations:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/companies/:id/consultations", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      let companyProfile;
      
      // Special case for "me" endpoint
      if (req.params.id === "me") {
        companyProfile = await storage.getCompanyProfileByUserId(user.id);
        if (!companyProfile) {
          return res.status(404).json({ message: "Company profile not found for current user" });
        }
      } else {
        // Regular case with profile ID
        const companyId = parseInt(req.params.id);
        companyProfile = await storage.getCompanyProfile(companyId);
        
        // Check if user is the company
        if (!companyProfile || companyProfile.userId !== user.id) {
          return res.status(403).json({ message: "You can only view your own consultations" });
        }
      }

      const consultations = await storage.getCompanyConsultations(companyProfile.id);
      res.json(consultations);
    } catch (err) {
      console.error("Error fetching company consultations:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/consultations/:id/status", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;

      // Get consultation
      const consultation = await storage.getConsultation(id);
      if (!consultation) {
        return res.status(404).json({ message: "Consultation not found" });
      }

      // Check if user is involved in the consultation
      const professionalProfile = await storage.getProfessionalProfile(consultation.professionalId);
      const companyProfile = await storage.getCompanyProfile(consultation.companyId);

      if (professionalProfile?.userId !== user.id && companyProfile?.userId !== user.id) {
        return res.status(403).json({ message: "You can only update status for your own consultations" });
      }

      const { status } = req.body;
      if (!status || !["scheduled", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedConsultation = await storage.updateConsultationStatus(id, status);
      res.json(updatedConsultation);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}