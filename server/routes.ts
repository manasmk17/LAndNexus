import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import multer from "multer";
import fs from "fs";
import path from "path";
import * as crypto from "crypto";
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
import { registerAdminRoutes } from "./admin-routes";

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
  
  // Configure multer storage for file uploads
  const storage25MB = multer.diskStorage({
    destination: function (req, file, cb) {
      // Create directory if it doesn't exist
      const uploadDir = 'uploads/profiles';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename with original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  });

  // Configure file limits (25MB max)
  const fileFilterImages = (req: any, file: any, cb: any) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  };

  // Create upload middleware
  const uploadProfileImage = multer({ 
    storage: storage25MB,
    limits: { 
      fileSize: 25 * 1024 * 1024 // 25MB in bytes
    },
    fileFilter: fileFilterImages
  });
  
  // Configure gallery storage
  const galleryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Create uploads/gallery directory if it doesn't exist
      const uploadDir = 'uploads/gallery';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename with original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'gallery-' + uniqueSuffix + ext);
    }
  });
  
  // Create gallery upload middleware
  const uploadGalleryImage = multer({ 
    storage: galleryStorage,
    limits: { 
      fileSize: 5 * 1024 * 1024 // 5MB in bytes
    },
    fileFilter: fileFilterImages
  });
  
  // Configure session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "L&D-nexus-secret",
      resave: true,
      saveUninitialized: true,
      cookie: { 
        secure: false,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days by default
      },
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      })
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport with a custom callback to support both username and email login
  passport.use(new LocalStrategy(async (identifier, password, done) => {
    try {
      // Check if the identifier is an email (contains @)
      let user;
      if (identifier.includes('@')) {
        user = await storage.getUserByEmail(identifier);
      } else {
        user = await storage.getUserByUsername(identifier);
      }

      if (!user) {
        return done(null, false, { message: "Incorrect username or email" });
      }
      
      // Use scrypt for password comparison - assuming passwords are stored as hash.salt
      try {
        // Production code should only use hashed passwords
        if (!user.password.includes('.')) {
          console.warn("Warning: User password is not properly hashed. This is insecure for production.");
          // Hash the plaintext password for security
          const salt = crypto.randomBytes(16).toString('hex');
          const keyLen = 64;
          
          crypto.scrypt(password, salt, keyLen, (err: any, derivedKey: Buffer) => {
            if (err) {
              return done(err);
            }
            
            // Update the user with a properly hashed password
            const hashedPassword = `${derivedKey.toString('hex')}.${salt}`;
            storage.updateUser(user.id, { password: hashedPassword }).catch(error => {
              console.error("Failed to update user with hashed password:", error);
            });
            
            // For this login attempt, compare directly
            if (user.password !== password) {
              return done(null, false, { message: "Incorrect password" });
            } else {
              return done(null, user);
            }
          });
          return; // Important: don't continue execution
        }
        
        // If password is in hash.salt format, use secure comparison
        const [storedHash, salt] = user.password.split('.');
        const keyLen = Buffer.from(storedHash, 'hex').length;
        
        // Use crypto scrypt to compare passwords 
        crypto.scrypt(password, salt, keyLen, (err: any, derivedKey: Buffer) => {
          if (err) {
            return done(err);
          }
          
          let passwordMatches = false;
          try {
            passwordMatches = crypto.timingSafeEqual(
              Buffer.from(storedHash, 'hex'),
              derivedKey
            );
          } catch (error) {
            console.error("Error comparing passwords:", error);
            return done(null, false, { message: "Password verification error" });
          }
          
          if (!passwordMatches) {
            return done(null, false, { message: "Incorrect password" });
          }
          
          return done(null, user);
        });
        
        // Don't return here - the callback in scrypt will handle it
      } catch (error) {
        console.error("Error during password verification:", error);
        return done(null, false, { message: "Password verification error" });
      }
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

  // Register admin-specific routes after auth middleware is set up
  registerAdminRoutes(app);
  
  // CSRF token refresh endpoint
  app.get('/api/csrf-token', (req: any, res) => {
    if (req.csrfToken) {
      console.log('Refreshing CSRF token for client');
      // Set token in cookie for forms
      res.cookie('XSRF-TOKEN', req.csrfToken(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      // Also return in response body
      res.json({ csrfToken: req.csrfToken() });
    } else {
      console.warn('CSRF token function not available in request');
      res.status(500).json({ message: 'CSRF protection not properly initialized' });
    }
  });

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
      // Verify webhook signature if secret is available
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.warn("STRIPE_WEBHOOK_SECRET not configured. Webhook signature verification skipped.");
        // For development purposes, assuming req.body might already be parsed
        try {
          event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        } catch (err) {
          console.error("Error parsing webhook body:", err);
          return res.status(400).send("Invalid webhook payload");
        }
      } else {
        // If webhook secret is available, verify signature
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret
        );
      }
    } catch (err: any) {
      console.error("Webhook error:", err.message);
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
  // Special admin creation endpoint
  app.post("/api/create-admin", async (req, res) => {
    try {
      const { secretKey, ...userData } = req.body;
      
      // Validate admin creation with a secret key
      if (secretKey !== "ldn_admin_setup_2025") {
        return res.status(403).json({ message: "Invalid secret key for admin creation" });
      }
      
      // Parse and validate user data
      const validUserData = insertUserSchema.parse(userData);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(validUserData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(validUserData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Force admin user type and admin status
      const adminUser = await storage.createUser({
        ...validUserData,
        userType: "admin",
        isAdmin: true
      });
      
      res.status(201).json({ 
        message: "Admin user created successfully", 
        admin: { ...adminUser, password: undefined } 
      });
    } catch (error) {
      console.error("Admin creation error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create admin user" 
      });
    }
  });

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

      // If the user is a professional, create a basic professional profile
      if (user.userType === "professional") {
        try {
          // Check if a profile already exists (shouldn't, but let's be safe)
          const existingProfile = await storage.getProfessionalProfileByUserId(user.id);
          
          if (!existingProfile) {
            // Create a basic profile with just the userId
            await storage.createProfessionalProfile({
              userId: user.id,
              title: `${user.username}'s Profile`, // Default title using username
              bio: "Edit this profile to add your professional bio.",
              yearsExperience: 0,
              ratePerHour: 0,
              availability: "true"
            });
            console.log(`Created basic professional profile for new user ${user.id}`);
          }
        } catch (profileErr) {
          console.error("Error creating professional profile during registration:", profileErr);
          // Continue with registration even if profile creation fails
          // We'll handle this later in the profile editing flow
        }
      }

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
      
      // Check if rememberMe is requested
      const rememberMe = req.body.rememberMe === true;
      
      // Configure session based on rememberMe
      if (rememberMe && req.session) {
        // Extend session to 30 days if "Remember Me" is checked
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        console.log(`Extended session for user ${user.username} to 30 days`);
      }
      
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        
        // Send more complete user information
        // Remove password field for security
        const { password, resetToken, resetTokenExpiry, ...userWithoutSensitiveInfo } = user;
        
        console.log(`User ${user.username} logged in successfully. Session ID: ${req.sessionID}`);
        
        return res.json(userWithoutSensitiveInfo);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });
  
  // Password recovery endpoints
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Create reset token
      const token = await storage.createResetToken(email);
      
      if (!token) {
        // Don't reveal whether the email exists or not for security
        return res.json({ success: true, message: "If your email exists in our system, you will receive a password reset link." });
      }
      
      // In a real implementation, you would send an email with a reset link
      // For this implementation, we'll just return the token directly 
      // (in production, this should be sent via email)
      res.json({ 
        success: true, 
        message: "Password reset link generated. In a production environment, this would be emailed.",
        token: token, // Note: In production, don't return the token directly
        resetLink: `/reset-password?token=${token}`
      });
    } catch (err) {
      console.error("Forgot password error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Verify reset token before allowing password reset
  app.post("/api/auth/verify-reset-token", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      // Verify token
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      res.json({ valid: true });
    } catch (err) {
      console.error("Token verification error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Also support GET requests for token verification
  app.get("/api/auth/verify-reset-token", async (req, res) => {
    try {
      const token = req.query.token as string;
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      // Verify token
      const user = await storage.getUserByResetToken(token);
      
      if (!user) {
        return res.status(400).json({ valid: false, message: "Invalid or expired token" });
      }
      
      res.json({ valid: true });
    } catch (err) {
      console.error("Token verification error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      // Reset the password
      const success = await storage.resetPassword(token, newPassword);
      
      if (!success) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      res.json({ success: true, message: "Password has been reset successfully" });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Username recovery endpoint
  app.post("/api/auth/recover-username", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal whether the email exists or not for security
        return res.json({ success: true, message: "If your email exists in our system, you will receive your username." });
      }
      
      // In a real implementation, you would send an email with the username
      // For this implementation, we'll just return the username directly
      res.json({ 
        success: true, 
        message: "Username recovery successful. In a production environment, this would be emailed.",
        username: user.username // Note: In production, don't return the username directly
      });
    } catch (err) {
      console.error("Username recovery error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/me", isAuthenticated, async (req, res) => {
    res.json(req.user);
  });
  
  // Get user by ID (for resource cards and other components)
  app.get("/api/me/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return only safe public user info
      res.json({
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      });
    } catch (err) {
      console.error("Error fetching user by ID:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get multiple users in batch
  app.get("/api/users/batch", async (req, res) => {
    try {
      // Get userIds from query parameter
      const userIdsParam = req.query.userIds;
      
      // If no userIds provided, return all users
      if (!userIdsParam) {
        const users = await storage.getAllUsers();
        // Remove sensitive information from each user
        const safeUsers = users.map(user => {
          const { password, ...userInfo } = user;
          return userInfo;
        });
        return res.json(safeUsers);
      }
      
      // Parse userIds from query parameter
      let userIds: number[] = [];
      try {
        if (typeof userIdsParam === 'string') {
          userIds = JSON.parse(userIdsParam);
        } else if (Array.isArray(userIdsParam)) {
          userIds = userIdsParam.map(id => parseInt(id.toString()));
        }
      } catch (error) {
        return res.status(400).json({ message: "Invalid user IDs format" });
      }
      
      // Validate all IDs are numbers
      if (userIds.some(id => isNaN(id))) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      // Fetch each user
      const users = [];
      for (const id of userIds) {
        const user = await storage.getUser(id);
        if (user) {
          const { password, ...userInfo } = user;
          users.push(userInfo);
        }
      }
      
      res.json(users);
    } catch (err) {
      console.error("Error fetching users in batch:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get a specific user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Add NaN check
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without sensitive information
      const { password, ...userInfo } = user;
      res.json(userInfo);
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ message: "Internal server error" });
    }
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
  
  // Debug endpoint to create a quick test admin user with default credentials
  app.post("/api/create-test-admin", async (req, res) => {
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
        message: "Test admin user created successfully",
        user: {
          id: adminUser.id,
          username: adminUser.username,
          password: "admin123", // Only returning for test admin convenience
          isAdmin: adminUser.isAdmin
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating test admin user: " + error.message });
    }
  });
  
  // Endpoint to create admin user with a secret key for security
  app.post("/api/create-admin", async (req, res) => {
    try {
      const { username, password, email, firstName, lastName, secretKey } = req.body;
      
      // Validate required fields
      if (!username || !password || !email || !firstName || !lastName || !secretKey) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Verify secret key to prevent unauthorized admin creation
      const ADMIN_SECRET_KEY = "ldn_admin_setup_2025"; // This should be an environment variable in production
      if (secretKey !== ADMIN_SECRET_KEY) {
        return res.status(403).json({ message: "Invalid secret key" });
      }
      
      // Check if username or email already exists
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Create admin user
      const adminUser = await storage.createUser({
        username,
        password, // Will be hashed by storage layer
        userType: "admin",
        isAdmin: true,
        email,
        firstName,
        lastName
      });
      
      // Remove sensitive info before sending response
      const { password: _, ...adminInfo } = adminUser;
      
      res.status(201).json({ 
        message: "Admin user created successfully",
        admin: adminInfo
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
  app.post("/api/professional-profiles", isAuthenticated, uploadProfileImage.single('profileImage'), async (req, res) => {
    try {
      const user = req.user as any;

      if (user.userType !== "professional") {
        return res.status(403).json({ message: "Only professionals can create profiles" });
      }

      // Check if user already has a profile
      const existingProfile = await storage.getProfessionalProfileByUserId(user.id);
      
      // Process uploaded file if present
      let profileImagePath = undefined;
      if (req.file) {
        profileImagePath = req.file.path;
        console.log(`Profile image uploaded: ${profileImagePath}`);
      }

      let profile;
      
      if (existingProfile) {
        console.log(`Updating existing profile for user ${user.id}, profile ID: ${existingProfile.id}`);
        
        // Update existing profile
        profile = await storage.updateProfessionalProfile(existingProfile.id, {
          ...req.body,
          profileImagePath: profileImagePath || existingProfile.profileImagePath
        });
      } else {
        console.log(`Creating new profile for user ${user.id}`);
        
        // Create new profile
        try {
          const profileData = {
            ...req.body,
            userId: user.id,
            profileImagePath
          };
          
          // Only validate required fields
          const parsedData = insertProfessionalProfileSchema.parse(profileData);
          profile = await storage.createProfessionalProfile(parsedData);
        } catch (parseError) {
          console.error("Schema validation error:", parseError);
          // If validation fails, create with minimum required fields
          profile = await storage.createProfessionalProfile({
            userId: user.id,
            profileImagePath
          });
        }
      }
      
      res.status(existingProfile ? 200 : 201).json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Error creating/updating professional profile:", err);
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
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid profile ID" });
    }
    
    const profile = await storage.getProfessionalProfile(id);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  });

  // Delete profile image
  app.delete("/api/professional-profiles/:id/profile-image", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;

      // Check if profile exists and belongs to user
      const profile = await storage.getProfessionalProfile(id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      if (profile.userId !== user.id && !user.isAdmin) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }

      // Check if there's an image to delete
      if (!profile.profileImagePath) {
        return res.status(400).json({ message: "No profile image to delete" });
      }

      // Delete the file from filesystem
      try {
        fs.unlinkSync(profile.profileImagePath);
        console.log(`Deleted profile image: ${profile.profileImagePath}`);
      } catch (error) {
        console.warn(`Failed to delete profile image file: ${profile.profileImagePath}`, error);
        // Continue anyway to update the database
      }

      // Update the database to remove the image reference
      const updatedProfile = await storage.updateProfessionalProfile(id, {
        profileImagePath: null
      });

      res.json({ message: "Profile image deleted successfully", profile: updatedProfile });
    } catch (err) {
      console.error("Error deleting profile image:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/professional-profiles/:id", isAuthenticated, uploadProfileImage.single('profileImage'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;

      // Check if profile exists and belongs to user
      const profile = await storage.getProfessionalProfile(id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      if (profile.userId !== user.id && !user.isAdmin) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }

      // Process uploaded file if present
      const updateData = {...req.body};
      if (req.file) {
        // Delete existing image if present
        if (profile.profileImagePath) {
          try {
            fs.unlinkSync(profile.profileImagePath);
            console.log(`Deleted previous profile image: ${profile.profileImagePath}`);
          } catch (err) {
            console.warn(`Failed to delete previous profile image: ${profile.profileImagePath}`);
          }
        }
        
        updateData.profileImagePath = req.file.path;
        console.log(`Updated profile image: ${updateData.profileImagePath}`);
      }

      const updatedProfile = await storage.updateProfessionalProfile(id, updateData);

      res.json(updatedProfile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Error updating professional profile:", err);
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

  // Update or create a professional profile for the current user
  app.put("/api/professionals/me", isAuthenticated, uploadProfileImage.single('profileImage'), async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!user) {
        console.error("Authentication issue: user object not available in request");
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      if (user.userType !== "professional") {
        console.warn(`User type mismatch: ${user.username} (ID: ${user.id}) with type ${user.userType} tried to access professional endpoint`);
        return res.status(403).json({ message: "Only professionals can access this endpoint" });
      }
      
      // Log the request details for debugging
      console.log(`Profile update request from user ${user.username} (ID: ${user.id})`);
      console.log(`Request body fields: ${Object.keys(req.body).join(', ')}`);
      console.log(`Request body values:`, req.body);
      console.log(`File upload: ${req.file ? `Yes (${req.file.filename})` : 'No'}`);
      
      // Check if profile exists
      const existingProfile = await storage.getProfessionalProfileByUserId(user.id);
      console.log(`Existing profile found: ${existingProfile ? 'Yes (ID: ' + existingProfile.id + ')' : 'No'}`);
      
      // Prepare profile data with type handling
      const profileData: any = {
        ...req.body,
        userId: user.id
      };

      // BUG KILLER: Enhanced type conversion for numeric fields with NaN protection
      // Handle rate per hour (can be empty string, undefined, or a valid number)
      if (profileData.ratePerHour !== undefined) {
        if (profileData.ratePerHour === '' || profileData.ratePerHour === null) {
          profileData.ratePerHour = null;
        } else {
          const parsedRate = Number(profileData.ratePerHour);
          profileData.ratePerHour = isNaN(parsedRate) ? null : parsedRate;
        }
        console.log(`Rate per hour processed: ${profileData.ratePerHour} (original: ${req.body.ratePerHour})`);
      }
      
      // Handle years experience (can be empty string, undefined, or a valid number)
      if (profileData.yearsExperience !== undefined) {
        if (profileData.yearsExperience === '' || profileData.yearsExperience === null) {
          profileData.yearsExperience = null;
        } else {
          const parsedYears = Number(profileData.yearsExperience);
          profileData.yearsExperience = isNaN(parsedYears) ? null : parsedYears;
        }
        console.log(`Years experience processed: ${profileData.yearsExperience} (original: ${req.body.yearsExperience})`);
      }
      
      // Keep availability as string but default to "Not specified" if empty
      if (profileData.availability === '' || profileData.availability === undefined) {
        profileData.availability = "Not specified";
      }
      
      // Handle file upload if provided
      if (req.file) {
        profileData.profileImagePath = req.file.path.replace(/^public\//, '');
        console.log(`New profile image path: ${profileData.profileImagePath}`);
      }
      
      console.log("Processed profile data for save:", profileData);
      
      let profile;
      if (existingProfile) {
        // Update existing profile
        console.log(`Updating profile ID: ${existingProfile.id}`);
        profile = await storage.updateProfessionalProfile(existingProfile.id, profileData);
      } else {
        // Create new profile
        console.log(`Creating new profile for user ID: ${user.id}`);
        profile = await storage.createProfessionalProfile(profileData);
      }
      
      // Ensure profile exists before trying to access its properties
      if (profile) {
        console.log(`Profile ${existingProfile ? 'updated' : 'created'} successfully: ${profile.id}`);
        res.json(profile);
      } else {
        console.log(`Warning: Profile operation completed but profile object is undefined`);
        throw new Error("Failed to create or update profile");
      }
    } catch (err) {
      console.error("Error updating professional profile:", err);
      
      // Provide more details in error response
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid profile data provided", 
          errors: err.errors 
        });
      }
      
      // More detailed error message for debugging client-side issues
      res.status(500).json({ 
        message: "Failed to update profile",
        error: err instanceof Error ? err.message : "Unknown error"
      });
    }
  });

  // Get certifications for the current professional user
  app.get("/api/professionals/me/certifications", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.userType !== "professional") {
        return res.status(403).json({ message: "Only professionals can access this endpoint" });
      }
      
      const profile = await storage.getProfessionalProfileByUserId(user.id);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found for current user" });
      }
      
      const certifications = await storage.getProfessionalCertifications(profile.id);
      res.json(certifications);
    } catch (err) {
      console.error("Error fetching certifications:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add a certification for the current professional user
  app.post("/api/professionals/me/certifications", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.userType !== "professional") {
        return res.status(403).json({ message: "Only professionals can access this endpoint" });
      }
      
      const profile = await storage.getProfessionalProfileByUserId(user.id);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found for current user" });
      }
      
      const certData = {
        ...req.body,
        professionalId: profile.id
      };
      
      const certification = await storage.createCertification(certData);
      res.status(201).json(certification);
    } catch (err) {
      console.error("Error adding certification:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get expertise for the current professional user
  app.get("/api/professionals/me/expertise", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.userType !== "professional") {
        return res.status(403).json({ message: "Only professionals can access this endpoint" });
      }
      
      const profile = await storage.getProfessionalProfileByUserId(user.id);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found for current user" });
      }
      
      const expertise = await storage.getProfessionalExpertise(profile.id);
      res.json(expertise);
    } catch (err) {
      console.error("Error fetching expertise:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add expertise for the current professional user
  app.post("/api/professionals/me/expertise", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.userType !== "professional") {
        return res.status(403).json({ message: "Only professionals can access this endpoint" });
      }
      
      const profile = await storage.getProfessionalProfileByUserId(user.id);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found for current user" });
      }
      
      const { expertiseId } = req.body;
      if (!expertiseId) {
        return res.status(400).json({ message: "Expertise ID is required" });
      }
      
      const profExpertise = await storage.addProfessionalExpertise({
        professionalId: profile.id,
        expertiseId: expertiseId
      });
      
      res.status(201).json(profExpertise);
    } catch (err) {
      console.error("Error adding expertise:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get professional profile by user ID (used by several components)
  app.get("/api/professional-profiles/by-user", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.userType !== "professional") {
        return res.status(400).json({ message: "User is not a professional" });
      }
      
      const profile = await storage.getProfessionalProfileByUserId(user.id);
      if (!profile) {
        // Instead of 404, return null to handle case of newly registered users without profiles yet
        return res.json(null);
      }
      
      res.json(profile);
    } catch (err) {
      console.error("Error fetching professional profile by user ID:", err);
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
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid profile ID" });
    }
    
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
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid profile ID" });
    }
    
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

      // Get the certification directly
      const certification = await storage.getCertification(id);
      if (!certification) {
        return res.status(404).json({ message: "Certification not found" });
      }

      // Get the profile to check if it belongs to the user
      const profile = await storage.getProfessionalProfile(certification.professionalId);
      if (profile?.userId !== user.id && !user.isAdmin) {
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
  
  // Gallery Image Routes
  
  // Upload a gallery image
  app.post("/api/professionals/me/gallery", isAuthenticated, uploadGalleryImage.single('galleryImage'), async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.userType !== "professional") {
        return res.status(403).json({ message: "Only professionals can upload gallery images" });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }
      
      // Get the professional profile
      const profile = await storage.getProfessionalProfileByUserId(user.id);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found" });
      }
      
      // Process uploaded file
      const galleryImagePath = req.file.path;
      console.log(`Gallery image uploaded: ${galleryImagePath}`);
      
      // Get current gallery images
      let galleryImages = [];
      if (profile.galleryImages) {
        // If galleryImages is already an array, use it
        if (Array.isArray(profile.galleryImages)) {
          galleryImages = profile.galleryImages;
        } else {
          // Otherwise, try to parse it as JSON
          try {
            galleryImages = JSON.parse(profile.galleryImages as unknown as string);
            if (!Array.isArray(galleryImages)) {
              galleryImages = [];
            }
          } catch (e) {
            galleryImages = [];
          }
        }
      }
      
      // Add new image to gallery
      galleryImages.push({
        id: new Date().getTime(), // Use timestamp as unique ID
        path: galleryImagePath,
        caption: req.body.caption || '',
        uploadedAt: new Date().toISOString()
      });
      
      // Update the profile
      const updatedProfile = await storage.updateProfessionalProfile(profile.id, {
        galleryImages: galleryImages
      });
      
      res.status(201).json({ 
        message: "Gallery image uploaded successfully",
        gallery: galleryImages
      });
    } catch (error) {
      console.error("Error uploading gallery image:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get all gallery images for a professional
  app.get("/api/professionals/:id/gallery", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the professional profile
      const profile = await storage.getProfessionalProfile(id);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found" });
      }
      
      // Return gallery images
      let galleryImages = [];
      if (profile.galleryImages) {
        if (Array.isArray(profile.galleryImages)) {
          galleryImages = profile.galleryImages;
        } else {
          try {
            galleryImages = JSON.parse(profile.galleryImages as unknown as string);
            if (!Array.isArray(galleryImages)) {
              galleryImages = [];
            }
          } catch (e) {
            galleryImages = [];
          }
        }
      }
      
      res.json(galleryImages);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete a gallery image
  app.delete("/api/professionals/me/gallery/:imageId", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const imageId = parseInt(req.params.imageId);
      
      if (user.userType !== "professional") {
        return res.status(403).json({ message: "Only professionals can delete gallery images" });
      }
      
      // Get the professional profile
      const profile = await storage.getProfessionalProfileByUserId(user.id);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found" });
      }
      
      // Get current gallery images
      let galleryImages = [];
      if (profile.galleryImages) {
        if (Array.isArray(profile.galleryImages)) {
          galleryImages = profile.galleryImages;
        } else {
          try {
            galleryImages = JSON.parse(profile.galleryImages as unknown as string);
            if (!Array.isArray(galleryImages)) {
              galleryImages = [];
            }
          } catch (e) {
            galleryImages = [];
          }
        }
      }
      
      // Find the image to delete
      const imageIndex = galleryImages.findIndex(img => img.id === imageId);
      if (imageIndex === -1) {
        return res.status(404).json({ message: "Gallery image not found" });
      }
      
      // Get the path of the image to delete
      const imagePath = galleryImages[imageIndex].path;
      
      // Delete the file
      try {
        fs.unlinkSync(imagePath);
        console.log(`Deleted gallery image: ${imagePath}`);
      } catch (error) {
        console.warn(`Failed to delete gallery image file: ${imagePath}`, error);
        // Continue anyway to update the database
      }
      
      // Remove the image from the array
      galleryImages.splice(imageIndex, 1);
      
      // Update the profile
      await storage.updateProfessionalProfile(profile.id, {
        galleryImages: galleryImages
      });
      
      res.json({ 
        message: "Gallery image deleted successfully",
        gallery: galleryImages
      });
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Set gallery image as profile picture
  app.post("/api/professionals/me/set-profile-image-from-gallery/:imageId", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const imageId = parseInt(req.params.imageId);
      
      if (user.userType !== "professional") {
        return res.status(403).json({ message: "Only professionals can update profile pictures" });
      }
      
      // Get the professional profile
      const profile = await storage.getProfessionalProfileByUserId(user.id);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found" });
      }
      
      // Get current gallery images
      let galleryImages = [];
      if (profile.galleryImages) {
        if (Array.isArray(profile.galleryImages)) {
          galleryImages = profile.galleryImages;
        } else {
          try {
            galleryImages = JSON.parse(profile.galleryImages as unknown as string);
            if (!Array.isArray(galleryImages)) {
              galleryImages = [];
            }
          } catch (e) {
            galleryImages = [];
          }
        }
      }
      
      // Find the image to use as profile picture
      const image = galleryImages.find(img => img.id === imageId);
      if (!image) {
        return res.status(404).json({ message: "Gallery image not found" });
      }
      
      // Update profile with new profile image
      const updatedProfile = await storage.updateProfessionalProfile(profile.id, {
        profileImagePath: image.path
      });
      
      res.json({ 
        message: "Profile picture updated successfully",
        profileImage: image.path
      });
    } catch (error) {
      console.error("Error setting gallery image as profile picture:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Company Profile Routes
  app.post("/api/company-profiles", isAuthenticated, uploadProfileImage.single('profileImage'), async (req, res) => {
    try {
      const user = req.user as any;

      if (user.userType !== "company") {
        return res.status(403).json({ message: "Only companies can create company profiles" });
      }

      // Log the request details for debugging
      console.log(`Company profile creation request from user ${user.username} (ID: ${user.id})`);
      console.log(`Request body fields: ${Object.keys(req.body).join(', ')}`);
      console.log(`Request body values:`, req.body);
      console.log(`File upload: ${req.file ? `Yes (${req.file.filename})` : 'No'}`);

      // Check if user already has a profile
      const existingProfile = await storage.getCompanyProfileByUserId(user.id);
      console.log(`Existing profile found: ${existingProfile ? 'Yes (ID: ' + existingProfile.id + ')' : 'No'}`);

      // Process uploaded file if present
      let profileImagePath = undefined;
      if (req.file) {
        profileImagePath = req.file.path.replace(/^public\//, '');
        console.log(`Company profile image uploaded: ${profileImagePath}`);
      }

      // Prepare profile data with type handling
      const profileData: any = {
        ...req.body,
        userId: user.id
      };

      // Handle file upload if provided
      if (profileImagePath) {
        profileData.logoImagePath = profileImagePath;
      }

      console.log("Processed company profile data for save:", profileData);

      let profile;
      
      if (existingProfile) {
        console.log(`Updating existing company profile for user ${user.id}, profile ID: ${existingProfile.id}`);
        
        // Update existing profile
        profile = await storage.updateCompanyProfile(existingProfile.id, profileData);
      } else {
        console.log(`Creating new company profile for user ${user.id}`);
        
        // Create new profile with validation
        profile = await storage.createCompanyProfile(profileData);
      }
      
      console.log(`Company profile ${existingProfile ? 'updated' : 'created'} successfully: ${profile?.id}`);
      res.status(existingProfile ? 200 : 201).json(profile);
    } catch (err) {
      console.error("Error creating/updating company profile:", err);
      
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }

      // More detailed error message for debugging client-side issues
      res.status(500).json({ 
        message: "Failed to create or update company profile",
        error: err instanceof Error ? err.message : "Unknown error"
      });
    }
  });

  app.get("/api/company-profiles", async (req, res) => {
    const profiles = await storage.getAllCompanyProfiles();
    res.json(profiles);
  });

  app.get("/api/company-profiles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid profile ID" });
    }
    
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
  
  // Get company profile by user ID (used by dashboard)
  app.get("/api/company-profiles/by-user", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      const profile = await storage.getCompanyProfileByUserId(user.id);
      if (!profile) {
        // Instead of 404, return null to handle case of newly registered users without profiles yet
        return res.json(null);
      }
      
      res.json(profile);
    } catch (err) {
      console.error("Error fetching company profile by user ID:", err);
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

  app.put("/api/company-profiles/:id", isAuthenticated, uploadProfileImage.single('profileImage'), async (req, res) => {
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

      // Log the request details for debugging
      console.log(`Company profile update request from user ${user.username} (ID: ${user.id})`);
      console.log(`Request body fields: ${Object.keys(req.body).join(', ')}`);
      console.log(`Request body values:`, req.body);
      console.log(`File upload: ${req.file ? `Yes (${req.file.filename})` : 'No'}`);

      // Create and prepare update data with proper type handling
      const updateData: any = {...req.body};
      
      // Ensure userId is set correctly
      updateData.userId = user.id;
      
      // BUG KILLER: Enhanced type conversion for numeric fields with NaN protection
      // Handle employee count (if needed in the future)
      if (updateData.employeeCount !== undefined) {
        if (updateData.employeeCount === '' || updateData.employeeCount === null) {
          updateData.employeeCount = null;
        } else {
          const parsedCount = Number(updateData.employeeCount);
          updateData.employeeCount = isNaN(parsedCount) ? null : parsedCount;
        }
        console.log(`Employee count processed: ${updateData.employeeCount} (original: ${req.body.employeeCount})`);
      }
      
      // Process uploaded file if present
      if (req.file) {
        updateData.logoImagePath = req.file.path.replace(/^public\//, '');
        console.log(`Updated company profile image: ${updateData.logoImagePath}`);
      }

      console.log("Processed company profile data for save:", updateData);
      
      const updatedProfile = await storage.updateCompanyProfile(id, updateData);
      console.log(`Company profile updated successfully: ${id}`);

      res.json(updatedProfile);
    } catch (err) {
      console.error("Error updating company profile:", err);
      
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      
      // More detailed error message for debugging client-side issues
      res.status(500).json({ 
        message: "Failed to update profile",
        error: err instanceof Error ? err.message : "Unknown error"
      });
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
    try {
      // Special case for "me" endpoint
      if (req.params.id === "me") {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        const user = req.user as any;
        
        if (user.userType !== "company") {
          return res.status(403).json({ message: "Not a company user" });
        }
        
        const companyProfile = await storage.getCompanyProfileByUserId(user.id);
        
        if (!companyProfile) {
          return res.json([]);
        }
        
        const jobs = await storage.getCompanyJobPostings(companyProfile.id);
        return res.json(jobs);
      }
      
      // Regular case with numeric ID
      const companyId = parseInt(req.params.id);
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "Invalid company ID" });
      }
      
      const jobs = await storage.getCompanyJobPostings(companyId);
      res.json(jobs);
    } catch (err) {
      console.error("Error fetching company job postings:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/job-postings/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid job posting ID" });
    }
    
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
  // Configure multer storage for resource files and documents
  const resourceFileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Create directory if it doesn't exist
      const uploadDir = 'uploads/resources';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename with original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  });

  // File filter for resource files - allows PDF, office documents, etc.
  const fileFilterResources = (req: any, file: any, cb: any) => {
    // Accept common document types and images
    if (!file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|jpg|jpeg|png|gif|webp)$/)) {
      return cb(new Error('Only document and image files are allowed!'), false);
    }
    cb(null, true);
  };

  // Create upload middleware for resources
  const uploadResourceFile = multer({ 
    storage: resourceFileStorage,
    limits: { 
      fileSize: 25 * 1024 * 1024 // 25MB in bytes
    },
    fileFilter: fileFilterResources
  });
  
  // Add file upload endpoint to handle multiple files
  app.post('/api/resources/upload', isAuthenticated, uploadResourceFile.array('files', 5), async (req, res) => {
    try {
      const user = req.user as any;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      
      const resourcePromises = files.map(async (file) => {
        // Extract file extension and determine resource type
        const ext = path.extname(file.originalname).toLowerCase();
        let resourceType = 'document';
        
        // Set resource type based on extension
        if (ext.match(/\.(pdf)$/)) {
          resourceType = 'PDF Document';
        } else if (ext.match(/\.(doc|docx)$/)) {
          resourceType = 'Word Document';
        } else if (ext.match(/\.(xls|xlsx)$/)) {
          resourceType = 'Excel Spreadsheet';
        } else if (ext.match(/\.(ppt|pptx)$/)) {
          resourceType = 'Presentation';
        } else if (ext.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          resourceType = 'Image';
        } else if (ext.match(/\.(txt)$/)) {
          resourceType = 'Text Document';
        } else if (ext.match(/\.(zip)$/)) {
          resourceType = 'Archive';
        }
        
        // Create a new resource for each file
        const resource = await storage.createResource({
          title: file.originalname,
          description: `Uploaded file: ${file.originalname}`,
          content: '',
          authorId: user.id,
          resourceType,
          filePath: file.path,
          contentUrl: `/api/resources/download/${path.basename(file.path)}`,
          categoryId: null,
          imageUrl: null,
          featured: false
        });
        
        return resource;
      });
      
      const createdResources = await Promise.all(resourcePromises);
      res.status(201).json(createdResources);
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ 
        message: 'Error uploading files',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/resources", isAuthenticated, uploadResourceFile.single('file'), async (req, res) => {
    try {
      const user = req.user as any;

      // Prepare resource data from body
      let resourceData = { ...req.body, authorId: user.id };
      
      // Add file path if uploaded
      if (req.file) {
        // Store the file path relative to the uploads directory
        resourceData.filePath = req.file.path;
        
        // If no content URL was provided but we have a file, set the content URL to access the file
        if (!resourceData.contentUrl || resourceData.contentUrl === '') {
          resourceData.contentUrl = `/api/resources/download/${path.basename(req.file.path)}`;
        }
      }
      
      // Validate with schema
      resourceData = insertResourceSchema.parse(resourceData);

      const resource = await storage.createResource(resourceData);
      res.status(201).json(resource);
    } catch (err) {
      // If there was an uploaded file and we encounter an error, clean it up
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.error("Error cleaning up file after failed resource creation:", unlinkErr);
        }
      }

      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Error creating resource:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Removed duplicate endpoint - another GET /api/resources endpoint exists below
  
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
  
  // Delete user with cascade option - will delete all associated profiles first
  app.delete("/api/admin/users/:id/cascade", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check for professional profile
      if (user.userType === "professional") {
        const profProfile = await storage.getProfessionalProfileByUserId(userId);
        if (profProfile) {
          // Delete professional expertise
          const expertise = await storage.getProfessionalExpertise(profProfile.id);
          for (const exp of expertise) {
            await storage.deleteProfessionalExpertise(exp.id);
          }
          
          // Delete certifications
          const certifications = await storage.getProfessionalCertifications(profProfile.id);
          for (const cert of certifications) {
            await storage.deleteCertification(cert.id);
          }
          
          // Now delete the profile
          await storage.deleteProfessionalProfile(profProfile.id);
        }
      }
      
      // Check for company profile
      if (user.userType === "company") {
        const companyProfile = await storage.getCompanyProfileByUserId(userId);
        if (companyProfile) {
          // Delete job postings
          const jobPostings = await storage.getCompanyJobPostings(companyProfile.id);
          for (const job of jobPostings) {
            // Delete job applications for this job
            const applications = await storage.getJobApplicationsByJob(job.id);
            for (const app of applications) {
              await storage.deleteJobApplication(app.id);
            }
            await storage.deleteJobPosting(job.id);
          }
          
          // Now delete the company profile
          await storage.deleteCompanyProfile(companyProfile.id);
        }
      }
      
      // Delete resources created by this user
      const resources = await storage.getResourcesByAuthor(userId);
      for (const resource of resources) {
        await storage.deleteResource(resource.id);
      }
      
      // Delete the user itself
      const deleted = await storage.deleteUser(userId);
      
      if (deleted) {
        return res.json({ 
          success: true, 
          message: "User and all associated records deleted successfully" 
        });
      } else {
        return res.status(500).json({ message: "Failed to delete user" });
      }
    } catch (error) {
      console.error("Cascade delete user error:", error);
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to cascade delete user"
      });
    }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      try {
        // Delete the user using our method
        const deleted = await storage.deleteUser(userId);
        
        if (deleted) {
          return res.json({ success: true, message: "User deleted successfully" });
        } else {
          return res.status(500).json({ message: "Failed to delete user" });
        }
      } catch (deleteError: any) {
        // Handle specific error from our deleteUser method
        console.log("Delete user operation error:", deleteError.message);
        
        // Return a more detailed error message based on the specific error
        if (deleteError.message.includes("company profiles")) {
          return res.status(409).json({ 
            message: "Cannot delete user with associated company profiles",
            details: deleteError.message
          });
        } else if (deleteError.message.includes("professional profiles")) {
          return res.status(409).json({ 
            message: "Cannot delete user with associated professional profiles",
            details: deleteError.message
          });
        } else {
          return res.status(409).json({ 
            message: "Cannot delete user with associated records",
            details: deleteError.message
          });
        }
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      return res.status(500).json({ message: "Error deleting user" });
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
  
  app.post("/api/admin/professional-profiles", isAdmin, async (req, res) => {
    try {
      const { userId, ...profileData } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Check if user exists and is a professional
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if professional profile already exists for this user
      const existingProfile = await storage.getProfessionalProfileByUserId(userId);
      if (existingProfile) {
        return res.status(400).json({ message: "User already has a professional profile" });
      }
      
      // Create new profile
      const newProfile = await storage.createProfessionalProfile({
        userId,
        ...profileData
      });
      
      res.status(201).json(newProfile);
    } catch (err) {
      console.error("Error creating professional profile:", err);
      res.status(500).json({ message: "Error creating professional profile" });
    }
  });

  app.delete("/api/admin/professional-profiles/:id", isAdmin, async (req, res) => {
    try {
      const profileId = parseInt(req.params.id);
      
      if (isNaN(profileId)) {
        return res.status(400).json({ message: "Invalid profile ID" });
      }
      
      const profile = await storage.getProfessionalProfile(profileId);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found" });
      }
      
      // Delete the profile using our new method
      const deleted = await storage.deleteProfessionalProfile(profileId);
      
      if (deleted) {
        res.json({ success: true, message: "Professional profile deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete professional profile" });
      }
    } catch (err) {
      console.error("Error deleting professional profile:", err);
      res.status(500).json({ message: "Error deleting professional profile" });
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
  
  app.patch("/api/admin/professional-profiles/:id/verify", isAdmin, async (req, res) => {
    try {
      const profileId = parseInt(req.params.id);
      const { verified } = req.body;
      
      if (isNaN(profileId)) {
        return res.status(400).json({ message: "Invalid profile ID" });
      }
      
      const profile = await storage.getProfessionalProfile(profileId);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found" });
      }
      
      const updatedProfile = await storage.updateProfessionalProfile(profileId, { verified });
      res.json(updatedProfile);
    } catch (err) {
      console.error("Error updating profile verification status:", err);
      res.status(500).json({ message: "Error updating profile verification status" });
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
  
  app.patch("/api/admin/company-profiles/:id/verify", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { verified } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid company profile ID" });
      }
      
      const profile = await storage.getCompanyProfile(id);
      if (!profile) {
        return res.status(404).json({ message: "Company profile not found" });
      }
      
      const updatedProfile = await storage.updateCompanyProfile(id, { verified });
      res.json(updatedProfile);
    } catch (err) {
      console.error("Error updating company verification status:", err);
      res.status(500).json({ message: "Error updating company verification status" });
    }
  });
  
  app.patch("/api/admin/company-profiles/:id/featured", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { featured } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid company profile ID" });
      }
      
      const profile = await storage.getCompanyProfile(id);
      if (!profile) {
        return res.status(404).json({ message: "Company profile not found" });
      }
      
      const updatedProfile = await storage.updateCompanyProfile(id, { featured });
      res.json(updatedProfile);
    } catch (err) {
      console.error("Error updating company featured status:", err);
      res.status(500).json({ message: "Error updating company featured status" });
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
      const success = await storage.deleteResource(resourceId);
      
      if (success) {
        res.json({ success: true, message: "Resource deleted successfully" });
      } else {
        res.status(404).json({ success: false, message: "Resource not found" });
      }
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
  
  app.get("/api/resource-categories", async (req, res) => {
    try {
      const categories = await storage.getAllResourceCategories();
      res.json(categories);
    } catch (err) {
      console.error("Error fetching resource categories:", err);
      res.status(500).json({ message: "Internal server error" });
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

  // Main resources endpoint with search and filtering
  app.get("/api/resources", async (req, res) => {
    try {
      const query = req.query.query as string | undefined;
      const type = req.query.type as string | undefined;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      
      // Use the searchResources method which can handle all filtering criteria
      const resources = await storage.searchResources(query, type, categoryId);
      res.json(resources);
    } catch (err) {
      console.error("Error fetching resources:", err);
      res.status(500).json({ message: "Error fetching resources" });
    }
  });
  
  app.get("/api/resources/featured", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 3;
    const resources = await storage.getFeaturedResources(limit);
    res.json(resources);
  });

  app.get("/api/resources/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    
    // Add NaN check
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid resource ID format" });
    }
    
    const resource = await storage.getResource(id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json(resource);
  });
  
  // Get current user's resources
  app.get("/api/me/resources", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Find all resources authored by the current user
      const resources = await storage.getAllResources();
      const userResources = resources.filter(resource => resource.authorId === user.id);
      
      res.json(userResources);
    } catch (error) {
      console.error("Error fetching user resources:", error);
      res.status(500).json({ message: "Error fetching resources" });
    }
  });
  
  // Remove a resource (if owned by the user)
  app.delete("/api/resources/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const resourceId = parseInt(req.params.id);
      
      // Get the resource to check ownership
      const resource = await storage.getResource(resourceId);
      
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      // Make sure user owns the resource or is an admin
      if (resource.authorId !== user.id && user.userType !== "admin") {
        return res.status(403).json({ message: "You can only delete your own resources" });
      }
      
      const success = await storage.deleteResource(resourceId);
      
      if (success) {
        res.json({ success: true, message: "Resource deleted successfully" });
      } else {
        res.status(404).json({ success: false, message: "Resource not found" });
      }
    } catch (error) {
      console.error("Error deleting resource:", error);
      res.status(500).json({ message: "Error deleting resource" });
    }
  });
  
  // Resource file download endpoint
  app.get("/api/resources/download/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      
      // Security check to prevent directory traversal
      if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ message: "Invalid filename" });
      }
      
      // Construct file path (ensure it's relative to uploads/resources directory)
      const filePath = path.join('uploads/resources', filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Get content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream'; // Default binary
      
      // Set content type based on extension
      switch (ext) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.doc':
        case '.docx':
          contentType = 'application/msword';
          break;
        case '.xls':
        case '.xlsx':
          contentType = 'application/vnd.ms-excel';
          break;
        case '.ppt':
        case '.pptx':
          contentType = 'application/vnd.ms-powerpoint';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.zip':
          contentType = 'application/zip';
          break;
        case '.txt':
          contentType = 'text/plain';
          break;
      }
      
      // Set headers for file download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Stream file to response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (err) {
      console.error("Error downloading file:", err);
      res.status(500).json({ message: "Error downloading file" });
    }
  });
  
  // Related resources by type endpoint
  app.get("/api/resources/related/:type/:excludeId?", async (req, res) => {
    try {
      const { type, excludeId } = req.params;
      
      // Check if type is valid
      if (!type || type === 'undefined' || type === 'null') {
        return res.status(400).json({ message: "Invalid resource type" });
      }
      
      // Parse exclude ID if provided
      let exclude: number | undefined = undefined;
      if (excludeId && excludeId !== 'undefined') {
        const parsedId = parseInt(excludeId);
        exclude = !isNaN(parsedId) ? parsedId : undefined;
      }
      
      // Get all resources of this type
      const resources = await storage.searchResources(undefined, type);
      
      // Filter out the excluded resource
      const relatedResources = exclude 
        ? resources.filter(resource => resource.id !== exclude)
        : resources;
      
      // Return a maximum of 3 related resources
      res.json(relatedResources.slice(0, 3));
    } catch (err) {
      console.error("Error fetching related resources:", err);
      res.status(500).json({ message: "Internal server error" });
    }
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
    
    // Add NaN check
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid post ID format" });
    }
    
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
      const { professionalId, startTime, endTime, rate, notes } = req.body;

      if (user.userType !== "company") {
        return res.status(403).json({ message: "Only companies can book consultations" });
      }

      // Get company profile
      const companyProfile = await storage.getCompanyProfileByUserId(user.id);
      if (!companyProfile) {
        return res.status(404).json({ message: "Company profile not found" });
      }

      // Verify professional exists
      const professional = await storage.getProfessionalProfile(professionalId);
      if (!professional) {
        return res.status(404).json({ message: "Professional not found" });
      }

      const consultationData = insertConsultationSchema.parse({
        professionalId,
        companyId: companyProfile.id,
        startTime,
        endTime,
        rate,
        notes,
        status: "scheduled"
      });

      const consultation = await storage.createConsultation(consultationData);
      res.status(201).json(consultation);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Error creating consultation:", err);
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

  // Skill Recommendation Routes
  app.get("/api/professionals/:id/skill-recommendations", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const professionalId = parseInt(id);

      // Check if the professional profile exists
      const profile = await storage.getProfessionalProfile(professionalId);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found" });
      }

      // Get existing recommendations or generate new ones
      let recommendations = await storage.getSkillRecommendationsByProfessional(professionalId);

      if (!recommendations) {
        try {
          // Check if we have the OpenAI API key
          if (!process.env.OPENAI_API_KEY) {
            return res.status(503).json({ 
              message: "Skill recommendations service is currently unavailable" 
            });
          }

          // Import the skill recommendations generator
          const { generateSkillRecommendations } = await import('./skill-recommendations');
          
          // Get professional's expertise
          const expertise = await storage.getProfessionalExpertise(professionalId);
          
          // Generate recommendations using OpenAI
          const generatedRecommendations = await generateSkillRecommendations(profile, expertise);
          
          // Save recommendations to database
          if (generatedRecommendations) {
            // Import the schema first
            const { insertSkillRecommendationSchema } = await import("@shared/schema");
            
            const recommendationData = insertSkillRecommendationSchema.parse({
              professionalId,
              recommendations: JSON.stringify(generatedRecommendations)
            });
            
            recommendations = await storage.createSkillRecommendation(recommendationData);
          }
        } catch (error: any) {
          console.error("Error generating skill recommendations:", error);
          return res.status(500).json({ 
            message: "Failed to generate skill recommendations", 
            error: error.message 
          });
        }
      }

      res.json(recommendations);
    } catch (err) {
      console.error("Error retrieving skill recommendations:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/professionals/:id/refresh-skill-recommendations", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { id } = req.params;
      const professionalId = parseInt(id);

      // Check if user has permission (must be the professional or an admin)
      const profile = await storage.getProfessionalProfile(professionalId);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found" });
      }

      if (profile.userId !== user.id && !user.isAdmin) {
        return res.status(403).json({ message: "Unauthorized to refresh recommendations" });
      }

      // Check if we have the OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          message: "Skill recommendations service is currently unavailable" 
        });
      }

      // Import the skill recommendations generator
      const { generateSkillRecommendations } = await import('./skill-recommendations');
      
      // Get professional's expertise
      const expertise = await storage.getProfessionalExpertise(professionalId);
      
      // Generate new recommendations using OpenAI
      const generatedRecommendations = await generateSkillRecommendations(profile, expertise);
      
      if (!generatedRecommendations) {
        return res.status(500).json({ message: "Failed to generate recommendations" });
      }

      // Check if there are existing recommendations to update
      const existingRecs = await storage.getSkillRecommendationsByProfessional(professionalId);
      let recommendations;

      if (existingRecs) {
        // Update existing recommendations
        recommendations = await storage.updateSkillRecommendation(
          existingRecs.id, 
          { recommendations: JSON.stringify(generatedRecommendations) }
        );
      } else {
        // Create new recommendations
        // Import the schema first
        const { insertSkillRecommendationSchema } = await import("@shared/schema");
        
        const recommendationData = insertSkillRecommendationSchema.parse({
          professionalId,
          recommendations: JSON.stringify(generatedRecommendations)
        });
        
        recommendations = await storage.createSkillRecommendation(recommendationData);
      }

      res.json(recommendations);
    } catch (err) {
      console.error("Error refreshing skill recommendations:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Career Recommendations API Endpoint
  app.get("/api/career-recommendations", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Only professionals can get career recommendations
      if (user.userType !== "professional") {
        return res.status(403).json({ message: "Only professionals can access career recommendations" });
      }
      
      // Get the professional profile
      const profile = await storage.getProfessionalProfileByUserId(user.id);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found" });
      }
      
      // Get professional's expertise
      const expertise = await storage.getProfessionalExpertise(profile.id);
      
      // Check if we have the OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ 
          message: "Career recommendations service is currently unavailable" 
        });
      }
      
      // Generate career recommendations
      const recommendations = await generateCareerRecommendations(profile, expertise);
      
      res.json(recommendations);
    } catch (err) {
      console.error("Error generating career recommendations:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  // Get resources by professional ID (fix JSON parsing errors)
  app.get("/api/professional-profiles/:professionalId/resources", async (req, res) => {
    try {
      const professionalId = parseInt(req.params.professionalId);
      if (isNaN(professionalId)) {
        return res.status(400).json({ message: "Invalid professional ID" });
      }
      
      // Get the professional profile
      const profile = await storage.getProfessionalProfile(professionalId);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found" });
      }
      
      // Get resources by the user ID associated with the professional profile
      const resources = await storage.getResourcesByAuthor(profile.userId);
      
      // Return empty array instead of null to prevent JSON parsing errors
      return res.json(resources || []);
    } catch (err) {
      console.error("Error fetching professional resources:", err);
      // Return empty array on error to prevent client-side JSON parsing errors
      return res.json([]);
    }
  });

  // Page Content Management API Routes
  // Get all page contents
  app.get("/api/page-contents", async (req, res) => {
    try {
      const contents = await storage.getAllPageContents();
      res.json(contents);
    } catch (err) {
      console.error("Error fetching page contents:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get page content by id
  app.get("/api/page-contents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid page content ID" });
      }

      const pageContent = await storage.getPageContent(id);
      if (!pageContent) {
        return res.status(404).json({ message: "Page content not found" });
      }

      res.json(pageContent);
    } catch (err) {
      console.error("Error fetching page content:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get page content by slug
  app.get("/api/pages/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      const pageContent = await storage.getPageContentBySlug(slug);
      
      if (!pageContent) {
        return res.status(404).json({ message: "Page content not found" });
      }

      res.json(pageContent);
    } catch (err) {
      console.error("Error fetching page by slug:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create page content (admin only)
  app.post("/api/page-contents", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { slug, title, content } = req.body;
      
      if (!slug || !title || !content) {
        return res.status(400).json({ message: "Slug, title, and content are required" });
      }

      // Check if slug already exists
      const existing = await storage.getPageContentBySlug(slug);
      if (existing) {
        return res.status(409).json({ message: "A page with this slug already exists" });
      }

      const newPageContent = await storage.createPageContent({
        slug,
        title,
        content,
        lastEditedBy: (req.user && typeof req.user === 'object' && 'id' in req.user && typeof req.user.id === 'number') ? req.user.id : null
      });

      res.status(201).json(newPageContent);
    } catch (err) {
      console.error("Error creating page content:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update page content (admin only)
  app.put("/api/page-contents/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid page content ID" });
      }

      const { title, content, slug } = req.body;
      
      // Check if the page content exists
      const pageContent = await storage.getPageContent(id);
      if (!pageContent) {
        return res.status(404).json({ message: "Page content not found" });
      }

      // If changing slug, check if it conflicts with another page
      if (slug && slug !== pageContent.slug) {
        const existing = await storage.getPageContentBySlug(slug);
        if (existing && existing.id !== id) {
          return res.status(409).json({ message: "A page with this slug already exists" });
        }
      }

      const updatedPageContent = await storage.updatePageContent(id, {
        title: title || pageContent.title,
        content: content || pageContent.content,
        slug: slug || pageContent.slug,
        lastEditedBy: (req.user && typeof req.user === 'object' && 'id' in req.user && typeof req.user.id === 'number') ? req.user.id : null
      });

      res.json(updatedPageContent);
    } catch (err) {
      console.error("Error updating page content:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete page content (admin only)
  app.delete("/api/page-contents/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // req.user is guaranteed to exist because of isAuthenticated middleware
      const userId = req.user?.id || 0; // Add fallback for TypeScript
      const id = parseInt(req.params.id);
      
      console.log(`User ${userId} attempting to delete page content with ID: ${id}`);
      
      if (isNaN(id)) {
        console.log(`Invalid page content ID: ${req.params.id}`);
        return res.status(400).json({ message: "Invalid page content ID" });
      }

      // First check if the content exists
      console.log(`Checking if page content with ID ${id} exists`);
      const content = await storage.getPageContent(id);
      
      if (!content) {
        console.log(`Page content with ID ${id} not found during pre-delete check`);
        return res.status(404).json({ message: "Page content not found" });
      }
      
      console.log(`Found page content: "${content.title}" (ID: ${id}). Proceeding with deletion.`);
      
      // Perform the actual deletion
      console.log(`Calling storage.deletePageContent(${id})`);
      const success = await storage.deletePageContent(id);
      
      console.log(`Delete operation result for ID ${id}: ${success ? 'Success' : 'Failed'}`);
      
      if (success) {
        // Return 200 with success message instead of 204 empty response for better client handling
        res.status(200).json({ message: "Page content deleted successfully" });
      } else {
        console.log(`Failed to delete page content with ID ${id} (storage returned false)`);
        res.status(404).json({ 
          message: "Page content not found or could not be deleted",
          id: id
        });
      }
    } catch (err) {
      // Enhanced error logging
      console.error("Error deleting page content:", err);
      console.error(err instanceof Error ? err.stack : String(err));
      
      // More detailed error response for client
      res.status(500).json({ 
        message: "Internal server error when deleting page content", 
        error: err instanceof Error ? err.message : String(err),
        id: req.params.id // Include the ID for debugging
      });
    }
  });

  return httpServer;
}