import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { WebSocketServer, WebSocket } from "ws";
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
  insertReviewSchema,
  insertNotificationSchema,
  insertNotificationTypeSchema,
  insertNotificationPreferenceSchema,
  users,
  type Resource,
  type User,
  type Review,
  type Notification,
  type NotificationType,
  type NotificationPreference
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateCareerRecommendations } from "./career-recommendations";
import { 
  getMatchingJobsForProfessional,
  getMatchingProfessionalsForJob
} from "./ai-matching";
import { registerEscrowRoutes } from "./escrow-routes";
import { registerSubscriptionRoutes } from "./subscription-routes";
import { subscriptionService } from "./subscription-service";
import { requireUsageLimit, incrementUserUsage, canUserPerformAction } from "./feature-gate";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import Stripe from "stripe";
import memorystore from "memorystore";

// Initialize Stripe with the API key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
} else {
  console.log('Stripe initialized with secret key.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia" as any,
});




const MemoryStore = memorystore(session);

// Initialize default resource categories if they don't exist
async function initializeResourceCategories() {
  try {
    // Since we're using MemStorage, the categories are already initialized in the constructor
    // This method now just logs the status and doesn't try to interact with the database
    // which was causing the "endpoint is disabled" error
    
    console.log("Resource categories initialization complete.");
    return true;
  } catch (error) {
    console.error("Error initializing resource categories:", error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {

  
  // SEO Routes - Must be first to avoid frontend routing conflicts


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
  
  // Session token mapping for persistent authentication - make it persistent across restarts
  const sessionTokenStore = new Map<string, { userId: number; userType: string; timestamp: number }>();
  
  // Clean up expired tokens periodically
  setInterval(() => {
    const now = Date.now();
    for (const [token, data] of sessionTokenStore.entries()) {
      if (now - data.timestamp > 24 * 60 * 60 * 1000) {
        sessionTokenStore.delete(token);
      }
    }
  }, 60 * 60 * 1000); // Clean up every hour

  // Configure session middleware with enhanced persistence
  const MemoryStore = memorystore(session);
  const sessionStore = new MemoryStore({
    checkPeriod: 60 * 60 * 1000, // Check every hour
    max: 10000,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    stale: false,
    serializer: {
      stringify: function(sess: any) {
        return JSON.stringify(sess);
      },
      parse: function(str: string) {
        return JSON.parse(str);
      }
    }
  });

  app.use(session({
    secret: process.env.SESSION_SECRET || "L&D-nexus-secret-key-very-long-for-production",
    resave: false,
    saveUninitialized: false,
    name: 'ldnexus_session',
    cookie: { 
      secure: false,
      httpOnly: false, // Allow client access for debugging
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
      domain: undefined // Don't restrict domain in development
    },
    store: sessionStore,
    rolling: true
  }));

  // Add session debugging middleware
  app.use((req: any, res: any, next: any) => {
    console.log(`Session debug - ID: ${req.sessionID?.slice(0, 8)}..., User: ${(req.session as any)?.userId || 'none'}`);
    next();
  });

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Session persistence middleware
  app.use((req, res, next) => {
    // Ensure session is properly loaded and maintained
    if (req.session && req.sessionID) {
      // Touch session to update last access time
      req.session.touch();
      
      // Set session activity flag for tracking
      (req.session as any).lastActivity = new Date();
    }
    
    next();
  });

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
      
      // Simplified password verification for debugging
      console.log(`Login attempt for user: ${user.username}, stored password format: ${user.password.includes('.') ? 'hashed' : 'plaintext'}`);
      
      // Handle both hashed and plaintext passwords for compatibility
      if (!user.password.includes('.')) {
        // Direct comparison for plaintext (development/testing)
        if (user.password === password) {
          console.log(`Plaintext password match for user: ${user.username}`);
          return done(null, user);
        } else {
          console.log(`Plaintext password mismatch for user: ${user.username}`);
          return done(null, false, { message: "Incorrect password" });
        }
      } else {
        // Handle hashed passwords
        const [storedHash, salt] = user.password.split('.');
        const keyLen = Buffer.from(storedHash, 'hex').length;
        
        crypto.scrypt(password, salt, keyLen, (err: any, derivedKey: Buffer) => {
          if (err) {
            console.error("Scrypt error:", err);
            return done(err);
          }
          
          try {
            const passwordMatches = crypto.timingSafeEqual(
              Buffer.from(storedHash, 'hex'),
              derivedKey
            );
            
            if (passwordMatches) {
              console.log(`Hashed password match for user: ${user.username}`);
              return done(null, user);
            } else {
              console.log(`Hashed password mismatch for user: ${user.username}`);
              return done(null, false, { message: "Incorrect password" });
            }
          } catch (error) {
            console.error("Password comparison error:", error);
            return done(null, false, { message: "Password verification error" });
          }
        });
      }
    } catch (err) {
      console.error("Error during password verification:", err);
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        // Remove password from user object for security
        const { password, ...safeUser } = user;
        done(null, safeUser);
      } else {
        done(null, false);
      }
    } catch (err) {
      console.error("Error deserializing user:", err);
      done(null, false);
    }
  });

  // Enhanced authentication middleware with comprehensive session support
  const isAuthenticated = async (req: Request, res: Response, next: Function) => {
    try {
      console.log(`Auth check for ${req.method} ${req.path}`);
      console.log(`Session ID: ${req.sessionID?.slice(0, 8)}...`);
      
      // Check for session token in cookies or headers
      const sessionToken = req.cookies.session_token || req.headers['x-session-token'];
      console.log(`Session token: ${sessionToken ? sessionToken.slice(0, 8) + '...' : 'none'}`);
      
      console.log(`Session data:`, {
        authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        hasUser: !!req.user,
        sessionUserId: (req.session as any)?.userId,
        sessionUserType: (req.session as any)?.userType,
        sessionToken: (req.session as any)?.sessionToken,
        cookieToken: sessionToken
      });
      
      // Check passport authentication first
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        console.log(`User authenticated via passport: ${(req.user as any).username}`);
        return next();
      }
      
      // Check session token store for persistent authentication (PRIMARY METHOD)
      if (sessionToken) {
        const tokenData = sessionTokenStore.get(sessionToken);
        if (tokenData) {
          // Check if token is still valid (24 hours)
          const tokenAge = Date.now() - tokenData.timestamp;
          if (tokenAge < 24 * 60 * 60 * 1000) {
            console.log(`Valid session token found for user ID: ${tokenData.userId}`);
            try {
              const user = await storage.getUser(tokenData.userId);
              if (user) {
                const { password, ...safeUser } = user;
                (req as any).user = safeUser;
                
                // Update ALL session data for consistency
                if (req.session) {
                  (req.session as any).userId = user.id;
                  (req.session as any).userType = user.userType;
                  (req.session as any).authenticated = true;
                  (req.session as any).sessionToken = sessionToken;
                  
                  // Force session save
                  req.session.save((err) => {
                    if (err) console.log("Session save error during auth:", err);
                  });
                }
                
                console.log(`Authentication SUCCESS via token store for user: ${user.username} (${user.userType})`);
                return next();
              }
            } catch (error) {
              console.log("Token store user lookup failed:", error);
            }
          } else {
            // Remove expired token
            sessionTokenStore.delete(sessionToken);
            console.log("Session token expired and removed");
          }
        } else {
          console.log("Session token not found in store");
        }
      }
      
      // Check for session token match (fallback)
      if (sessionToken && req.session && (req.session as any).sessionToken === sessionToken) {
        const userId = (req.session as any).userId;
        if (userId) {
          console.log(`Session token validated for user ID: ${userId}`);
          try {
            const user = await storage.getUser(userId);
            if (user) {
              const { password, ...safeUser } = user;
              (req as any).user = safeUser;
              console.log(`Session restored via token for user: ${user.username} (${user.userType})`);
              return next();
            }
          } catch (error) {
            console.log("Token-based user lookup failed:", error);
          }
        }
      }
      
      // Check for user ID in session (comprehensive fallback)
      if (req.session && (req.session as any).userId) {
        const userId = (req.session as any).userId;
        console.log(`Attempting session restoration for user ID: ${userId}`);
        
        try {
          const user = await storage.getUser(userId);
          if (user) {
            const { password, ...safeUser } = user;
            (req as any).user = safeUser;
            console.log(`Session restored for user: ${user.username} (${user.userType})`);
            return next();
          } else {
            console.log(`User ${userId} not found in storage`);
          }
        } catch (error) {
          console.log("Session user lookup failed:", error);
        }
      }
      
      console.log("Authentication failed - sending 401");
      res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Auth middleware error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user && (req.user as User).isAdmin) {
      return next();
    }
    res.status(403).json({ message: "Forbidden: Admin access required" });
  };

  const bypassCSRF = (req: Request, res: Response, next: Function) => {
    console.log(`CSRF protection bypassed for ${req.method} ${req.path}`);
    next();
  };

  // Admin routes have been removed as part of cleanup
  
  // Middleware to automatically authenticate users with persistent auth tokens
  app.use(async (req, res, next) => {
    // Skip token authentication if user is already authenticated via session
    if (req.isAuthenticated()) {
      return next();
    }

    // Check for auth token in cookies
    const authToken = req.cookies.auth_token;
    if (authToken) {
      try {
        const user = await storage.validateAuthToken(authToken);
        if (user) {
          // Log in the user automatically
          req.login(user, (err) => {
            if (err) {
              console.error('Error auto-logging in user with token:', err);
              // Clear invalid token
              res.clearCookie('auth_token');
              return next();
            }
            console.log(`Auto-authenticated user ${user.username} with persistent token`);
            return next();
          });
          return;
        } else {
          // Token is invalid or expired, clear it
          res.clearCookie('auth_token');
        }
      } catch (error) {
        console.error('Error validating auth token:', error);
        res.clearCookie('auth_token');
      }
    }

    next();
  });
  
  // CSRF token endpoint
  app.get('/api/csrf-token', (req: any, res) => {
    try {
      // Generate proper CSRF token using req.csrfToken() if available
      let token;
      if (req.csrfToken && typeof req.csrfToken === 'function') {
        token = req.csrfToken();
      } else {
        // Fallback token generation for development
        token = crypto.randomBytes(32).toString('hex');
      }
      
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      res.json({ csrfToken: token });
    } catch (error) {
      console.error('Error generating CSRF token:', error);
      res.status(500).json({ message: 'Failed to generate CSRF token' });
    }
  });

  // Import payment service
  const { paymentService } = await import("./payment-service");

  // Stripe payment route for one-time payments
  app.post("/api/create-payment-intent", bypassCSRF, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { amount, description = 'One-time payment', currency = 'usd' } = req.body;
      
      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }
      
      const result = await paymentService.createOneTimePaymentIntent(
        user.id,
        amount,
        description,
        currency
      );
      
      console.log(`Created payment intent ${result.paymentIntentId} for user ${user.id}`);
      
      res.json(result);
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Stripe subscription route
  app.post('/api/create-subscription', bypassCSRF, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { planId, billingCycle, currency = 'usd' } = req.body;

      if (!planId || !billingCycle) {
        return res.status(400).json({ 
          message: "Plan ID and billing cycle are required" 
        });
      }

      // Define pricing based on plan and billing cycle
      const pricingMap: { [key: string]: { [key: string]: number } } = {
        'basic': { 'monthly': 9.99, 'yearly': 99.99 },
        'professional': { 'monthly': 29.99, 'yearly': 299.99 },
        'enterprise': { 'monthly': 99.99, 'yearly': 999.99 }
      };

      const amount = pricingMap[planId]?.[billingCycle];
      if (!amount) {
        return res.status(400).json({ 
          message: "Invalid plan or billing cycle" 
        });
      }

      let customerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
          metadata: {
            userId: user.id.toString(),
            userType: user.userType
          }
        });
        
        customerId = customer.id;
        await storage.updateStripeCustomerId(user.id, customerId);
      }

      // Create setup intent for subscription
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: {
          planId,
          billingCycle,
          amount: amount.toString(),
          userId: user.id.toString()
        }
      });

      console.log(`Created setup intent ${setupIntent.id} for user ${user.id}, plan: ${planId}`);
      
      res.json({
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        customerId,
        planDetails: {
          planId,
          billingCycle,
          amount,
          currency
        }
      });
    } catch (error: any) {
      console.error("Error creating subscription setup:", error);
      res.status(500).json({ 
        message: "Error creating subscription setup: " + error.message 
      });
    }
  });

  // Complete subscription after payment method setup
  app.post('/api/complete-subscription', bypassCSRF, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { setupIntentId, planId, billingCycle } = req.body;

      if (!setupIntentId || !planId || !billingCycle) {
        return res.status(400).json({ 
          message: "Setup intent ID, plan ID, and billing cycle are required" 
        });
      }

      // Retrieve the setup intent to get the payment method
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      
      if (setupIntent.status !== 'succeeded') {
        return res.status(400).json({ 
          message: "Payment method setup not completed" 
        });
      }

      const paymentMethodId = setupIntent.payment_method as string;
      let customerId = user.stripeCustomerId;

      // Define pricing based on plan and billing cycle
      const pricingMap: { [key: string]: { [key: string]: number } } = {
        'basic': { 'monthly': 9.99, 'yearly': 99.99 },
        'professional': { 'monthly': 29.99, 'yearly': 299.99 },
        'enterprise': { 'monthly': 99.99, 'yearly': 999.99 }
      };

      const amount = pricingMap[planId]?.[billingCycle];
      if (!amount) {
        return res.status(400).json({ 
          message: "Invalid plan or billing cycle" 
        });
      }

      // Create a one-time payment for the first billing cycle
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        metadata: {
          planId,
          billingCycle,
          userId: user.id.toString(),
          type: 'subscription_payment'
        }
      });

      // Update user with subscription data
      await storage.updateStripeSubscriptionId(user.id, `manual_${Date.now()}`);
      await storage.updateUserSubscription(user.id, planId, 'active');

      res.json({
        success: true,
        paymentIntent: paymentIntent.id,
        status: paymentIntent.status,
        subscriptionTier: planId
      });
    } catch (error: any) {
      console.error("Error completing subscription:", error);
      res.status(500).json({ 
        message: "Error completing subscription: " + error.message 
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
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message });
      }
      
      try {
        // Check if rememberMe is requested
        const rememberMe = req.body.rememberMe === true;
        
        // Configure session based on rememberMe
        if (rememberMe && req.session) {
          // Extend session to 30 days if "Remember Me" is checked
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
          console.log(`Extended session for user ${user.username} to 30 days`);
        }
        
        req.login(user, async (err) => {
          if (err) {
            return next(err);
          }
          
          // Store user ID directly in session for fallback authentication
          (req.session as any).userId = user.id;
          (req.session as any).userType = user.userType;
          (req.session as any).authenticated = true;
          
          // Generate and store a session token for consistent authentication
          const sessionToken = crypto.randomBytes(32).toString('hex');
          (req.session as any).sessionToken = sessionToken;
          
          // Store session token mapping for cross-session authentication
          sessionTokenStore.set(sessionToken, {
            userId: user.id,
            userType: user.userType,
            timestamp: Date.now()
          });
          
          // Store the session token in a cookie for consistent access
          res.cookie('session_token', sessionToken, {
            httpOnly: false, // Allow client access for API calls
            secure: false, // Set to true in production with HTTPS
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
          });
          
          // Force session save to ensure persistence
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error('Session save error:', saveErr);
              return next(saveErr);
            }
            
            console.log(`User ${user.username} authenticated with session ${req.sessionID.slice(0, 8)}...`);
            console.log(`Session stored with userId: ${user.id}, userType: ${user.userType}, token: ${sessionToken.slice(0, 8)}...`);
            
            // Remove sensitive fields
            const { password, resetToken, resetTokenExpiry, ...userWithoutSensitiveInfo } = user;
            
            return res.json({
              ...userWithoutSensitiveInfo,
              sessionPersisted: true,
              sessionToken: sessionToken
            });
          });
        });
      } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error during login' });
      }
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      
      // Clean up session token from store
      const sessionToken = req.cookies.session_token;
      if (sessionToken) {
        sessionTokenStore.delete(sessionToken);
        res.clearCookie('session_token');
        console.log(`Session token ${sessionToken.slice(0, 8)}... removed from store`);
      }
      
      // Revoke legacy auth token if present
      const authToken = req.cookies.auth_token;
      if (authToken) {
        await storage.revokeAuthToken(authToken);
        res.clearCookie('auth_token');
      }
      
      req.logout(() => {
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destruction error:', err);
          }
          res.clearCookie('sessionId');
          res.clearCookie('connect.sid');
          console.log(`User logged out, session ${sessionId.slice(0, 8)}... invalidated`);
          res.json({ message: "Logged out successfully" });
        });
      });
    } catch (error) {
      console.error('Error during logout:', error);
      // Still proceed with logout even if token cleanup fails
      req.logout(() => {
        res.json({ message: "Logged out" });
      });
    }
  });

  // Removed refresh token endpoint - using session-only auth
  
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
    try {
      let user = req.user as any;
      
      // If using JWT tokens, get user from token payload
      if ((req as any).tokenUser) {
        const tokenUser = (req as any).tokenUser;
        user = await storage.getUser(tokenUser.userId);
        if (!user) {
          return res.status(401).json({ message: "User not found" });
        }
      }
      
      if (!user) {
        return res.status(401).json({ message: "User not found in session" });
      }
      
      // Remove sensitive information from user object
      const { password, resetToken, resetTokenExpiry, ...safeUserInfo } = user;
      res.json(safeUserInfo);
    } catch (error) {
      console.error('Error in /api/me:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get user by ID (for resource cards and other components) - Cached
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
      const userInfo = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      };
      
      res.json(userInfo);
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

  app.get("/api/subscription-status", async (req, res) => {
    try {
      // For testing, return a mock subscription status
      // This avoids the need for authentication and Stripe API calls
      const response = {
        tier: "professional",
        status: "active",
        // Set next billing date to 30 days from now
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
    try {
      const limit = parseInt(req.query.limit as string) || 3;
      
      // Create sample data if database is unavailable
      const sampleProfiles = [
        {
          id: 1,
          userId: 1,
          firstName: "John",
          lastName: "Doe",
          title: "Learning & Development Director",
          bio: "Experienced L&D professional with over 10 years in the industry",
          location: "New York, NY",
          rating: 4.9,
          featured: true,
          verified: true,
          yearsExperience: 10
        },
        {
          id: 2,
          userId: 3,
          firstName: "Jane",
          lastName: "Smith",
          title: "Executive Coach",
          bio: "Certified executive coach specializing in leadership development",
          location: "Chicago, IL",
          rating: 4.8,
          featured: true,
          verified: true,
          yearsExperience: 8
        },
        {
          id: 3,
          userId: 5,
          firstName: "David",
          lastName: "Wilson",
          title: "Corporate Trainer",
          bio: "Expert in delivering technical and soft skills training",
          location: "San Francisco, CA",
          rating: 4.7,
          featured: true,
          verified: true,
          yearsExperience: 7
        }
      ];
      
      const profiles = await storage.getFeaturedProfessionalProfiles(limit);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching featured professional profiles:", error);
      // Return empty array on error
      res.json([]);
    }
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
  app.get("/api/professionals/me", async (req, res) => {
    try {
      // For development testing, allow unauthenticated access with a default profile
      if (!req.isAuthenticated()) {
        console.log("DEV MODE: Allowing unauthenticated /api/professionals/me access for testing");
        
        // Return a sample professional profile for testing
        const testProfile = await storage.getProfessionalProfile(5); // Using sample profile ID 5
        if (testProfile) {
          return res.json(testProfile);
        } else {
          return res.status(404).json({ message: "Test professional profile not found" });
        }
      }

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

  // Get job applications for the current professional user
  app.get("/api/professionals/me/applications", async (req, res) => {
    try {
      // For development testing, allow unauthenticated access
      if (!req.isAuthenticated()) {
        console.log("DEV MODE: Allowing unauthenticated /api/professionals/me/applications access for testing");
        
        // Return sample applications for testing
        const testApplications = await storage.getJobApplicationsByProfessional(5); // Using sample profile ID 5
        return res.json(testApplications || []);
      }

      const user = req.user as any;
      
      if (user.userType !== "professional") {
        return res.status(403).json({ message: "Only professionals can access this endpoint" });
      }
      
      const profile = await storage.getProfessionalProfileByUserId(user.id);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found for current user" });
      }
      
      const applications = await storage.getJobApplicationsByProfessional(profile.id);
      res.json(applications || []);
    } catch (err) {
      console.error("Error fetching professional applications:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get consultations for the current professional user
  app.get("/api/professionals/me/consultations", async (req, res) => {
    try {
      // For development testing, allow unauthenticated access
      if (!req.isAuthenticated()) {
        console.log("DEV MODE: Allowing unauthenticated /api/professionals/me/consultations access for testing");
        
        // Return sample consultations for testing
        const testConsultations = await storage.getProfessionalConsultations(5); // Using sample profile ID 5
        return res.json(testConsultations || []);
      }

      const user = req.user as any;
      
      if (user.userType !== "professional") {
        return res.status(403).json({ message: "Only professionals can access this endpoint" });
      }
      
      const profile = await storage.getProfessionalProfileByUserId(user.id);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found for current user" });
      }
      
      const consultations = await storage.getProfessionalConsultations(profile.id);
      res.json(consultations || []);
    } catch (err) {
      console.error("Error fetching professional consultations:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get messages for the current professional user
  app.get("/api/professionals/me/messages", async (req, res) => {
    try {
      // For development testing, allow unauthenticated access
      if (!req.isAuthenticated()) {
        console.log("DEV MODE: Allowing unauthenticated /api/professionals/me/messages access for testing");
        
        // Return sample messages for testing
        const testMessages = await storage.getUserMessages(5); // Using sample user ID 5
        return res.json(testMessages || []);
      }

      const user = req.user as any;
      
      if (user.userType !== "professional") {
        return res.status(403).json({ message: "Only professionals can access this endpoint" });
      }
      
      const messages = await storage.getUserMessages(user.id);
      res.json(messages || []);
    } catch (err) {
      console.error("Error fetching professional messages:", err);
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

      // Handle rate per hour (can be empty string, undefined, or a valid number)
      if (profileData.ratePerHour !== undefined) {
        if (profileData.ratePerHour === '' || profileData.ratePerHour === null) {
          profileData.ratePerHour = null;
        } else {
          const parsedRate = Number(profileData.ratePerHour);
          profileData.ratePerHour = isNaN(parsedRate) ? null : parsedRate;
        }
      }
      
      // Handle years experience (can be empty string, undefined, or a valid number)
      if (profileData.yearsExperience !== undefined) {
        if (profileData.yearsExperience === '' || profileData.yearsExperience === null) {
          profileData.yearsExperience = null;
        } else {
          const parsedYears = Number(profileData.yearsExperience);
          profileData.yearsExperience = isNaN(parsedYears) ? null : parsedYears;
        }
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

  // Work Experience Routes
  app.get("/api/professional-profiles/:id/work-experiences", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid profile ID" });
      }
      
      const profile = await storage.getProfessionalProfile(id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Return work experience from profile's workExperience field
      const workExperiences = profile.workExperience || [];
      res.json(Array.isArray(workExperiences) ? workExperiences : []);
    } catch (err) {
      console.error("Error fetching work experiences:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Testimonials Routes
  app.get("/api/professional-profiles/:id/testimonials", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid profile ID" });
      }
      
      const profile = await storage.getProfessionalProfile(id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Return testimonials from profile's testimonials field
      const testimonials = profile.testimonials || [];
      res.json(Array.isArray(testimonials) ? testimonials : []);
    } catch (err) {
      console.error("Error fetching testimonials:", err);
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

  // Specific routes must come before parameterized routes
  app.get("/api/company-profiles/by-user", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.userType !== "company") {
        return res.status(400).json({ message: "User is not a company" });
      }
      
      const profile = await storage.getCompanyProfileByUserId(user.id);
      if (!profile) {
        return res.json(null);
      }
      
      res.json(profile);
    } catch (err) {
      console.error("Error fetching company profile by user ID:", err);
      res.status(500).json({ message: "Internal server error" });
    }
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
  
  // Get company profile by specific user ID (for messaging system)
  app.get("/api/company-profiles/by-user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const profile = await storage.getCompanyProfileByUserId(userId);
      if (!profile) {
        return res.status(404).json({ message: "Company profile not found for this user" });
      }
      
      res.json(profile);
    } catch (err) {
      console.error("Error fetching company profile by user ID:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get professional profile by specific user ID (for messaging system)
  app.get("/api/professional-profiles/by-user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const profile = await storage.getProfessionalProfileByUserId(userId);
      if (!profile) {
        return res.status(404).json({ message: "Professional profile not found for this user" });
      }
      
      res.json(profile);
    } catch (err) {
      console.error("Error fetching professional profile by user ID:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get subscription plans API
  app.get('/api/subscription-plans', async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ error: 'Failed to fetch subscription plans' });
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
  app.get("/api/jobs/:jobId/matches", async (req, res) => {
    try {
      let jobId: number;
      
      // Special case for "me" endpoint
      if (req.params.jobId === "me") {
        // For development testing allow unauthenticated access with friendly message
        if (!req.isAuthenticated()) {
          console.log("DEV MODE: Allowing unauthenticated /api/jobs/me/matches access for testing");
          
          // Use a default job ID for testing
          console.log("DEV MODE: Using default job ID 10 for testing");
          jobId = 10; // Using a sample job ID that exists in the database
        } else {
          const user = req.user as User;
          if (user.userType !== "company") {
            return res.status(403).json({ message: "Not a company user" });
          }
          
          // For companies, we'd need a specific job ID, not just the company
          return res.status(400).json({ message: "Please specify a job ID, not 'me'" });
        }
      } else {
        // Regular case with numeric ID
        jobId = parseInt(req.params.jobId);
        if (isNaN(jobId)) {
          return res.status(400).json({ message: "Invalid job ID format" });
        }
        
        // Verify the job exists
        const job = await storage.getJobPosting(jobId);
        if (!job) {
          return res.status(404).json({ message: "Job posting not found" });
        }
      }
      
      // Call the controller function with the proper ID
      return getMatchingProfessionalsForJob({
        ...req,
        params: { jobId: jobId.toString() }
      } as any, res);
    } catch (error: any) {
      console.error("Error finding matching professionals:", error);
      res.status(500).json({ message: "Error finding matching professionals" });
    }
  });
  
  // AI Professional Matching with Jobs
  app.get("/api/professionals/:professionalId/matches", async (req, res) => {
    try {
      let professionalId: number;
      
      // Special case for "me" endpoint
      if (req.params.professionalId === "me") {
        // For development testing allow unauthenticated access with friendly message
        if (!req.isAuthenticated()) {
          console.log("DEV MODE: Allowing unauthenticated /api/professionals/me/matches access for testing");
          
          // Use a default professional ID for testing - ID 45 is a sample profile
          console.log("DEV MODE: Using default professional ID 45 for testing");
          professionalId = 45;
        } else {
          const user = req.user as User;
          const professionalProfile = await storage.getProfessionalProfileByUserId(user.id);
          
          if (!professionalProfile) {
            return res.status(404).json({ message: "Professional profile not found for current user" });
          }
          
          professionalId = professionalProfile.id;
        }
      } else {
        // Regular case with numeric ID
        professionalId = parseInt(req.params.professionalId);
        if (isNaN(professionalId)) {
          return res.status(400).json({ message: "Invalid professional ID format" });
        }
        
        // Verify the professional exists
        const professionalProfile = await storage.getProfessionalProfile(professionalId);
        if (!professionalProfile) {
          return res.status(404).json({ message: "Professional profile not found" });
        }
      }
      
      // Call the controller function with the proper ID
      return getMatchingJobsForProfessional({
        ...req,
        params: { professionalId: professionalId.toString() }
      } as any, res);
    } catch (error: any) {
      console.error("Error finding matching jobs:", error);
      res.status(500).json({ message: "Error finding matching jobs" });
    }
  });
  
  // AI Job Matching with Professionals
  // This route is now handled by the endpoint above

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

      console.log("Job posting request data:", JSON.stringify(req.body, null, 2));

      // Clean the data before validation
      const cleanData = {
        ...req.body,
        companyId: companyProfile.id,
        // Ensure duration is handled properly (can be empty string or null)
        duration: req.body.duration || null,
        // Ensure compensation fields are properly typed
        minCompensation: req.body.minCompensation ? parseInt(req.body.minCompensation) : null,
        maxCompensation: req.body.maxCompensation ? parseInt(req.body.maxCompensation) : null
      };

      // Handle expiresInDays conversion to expiresAt if needed
      if (req.body.expiresInDays && !req.body.expiresAt) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + parseInt(req.body.expiresInDays));
        cleanData.expiresAt = expirationDate;
      } else if (req.body.expiresAt && typeof req.body.expiresAt === 'string') {
        // Convert ISO string to Date object
        cleanData.expiresAt = new Date(req.body.expiresAt);
      }

      // Remove expiresInDays as it's not in the schema
      delete cleanData.expiresInDays;

      console.log("Cleaned job data before validation:", {
        ...cleanData,
        expiresAt: cleanData.expiresAt ? `Date object: ${cleanData.expiresAt.toString()}` : null
      });

      // Validate all fields except expiresAt using schema
      const { expiresAt, ...dataForValidation } = cleanData;
      const validatedData = insertJobPostingSchema.omit({ expiresAt: true }).parse(dataForValidation);
      
      // Add back the properly converted expiresAt
      const jobData = { ...validatedData, expiresAt: cleanData.expiresAt };

      const job = await storage.createJobPosting(jobData);
      res.status(201).json(job);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error("Job posting validation errors:", err.errors);
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Job posting error:", err);
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

  // Update job posting endpoint for company users
  app.put("/api/job-postings/:id", isAuthenticated, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const user = req.user as any;

      if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job posting ID" });
      }

      if (user.userType !== "company") {
        return res.status(403).json({ message: "Only companies can update job postings" });
      }

      // Get the job posting to verify ownership
      const existingJob = await storage.getJobPosting(jobId);
      if (!existingJob) {
        return res.status(404).json({ message: "Job posting not found" });
      }

      // Get company profile to verify ownership
      const companyProfile = await storage.getCompanyProfileByUserId(user.id);
      if (!companyProfile || existingJob.companyId !== companyProfile.id) {
        return res.status(403).json({ message: "You can only update your own job postings" });
      }

      // Clean and validate the update data
      const updateData = {
        ...req.body,
        modifiedAt: new Date(),
        // Ensure compensation fields are properly typed
        minCompensation: req.body.minCompensation ? parseInt(req.body.minCompensation) : null,
        maxCompensation: req.body.maxCompensation ? parseInt(req.body.maxCompensation) : null,
        // Handle duration properly
        duration: req.body.duration || null
      };

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.companyId;
      delete updateData.createdAt;

      console.log(`Company ${user.username} updating job posting ${jobId}`);
      
      const updatedJob = await storage.updateJobPosting(jobId, updateData);
      res.json(updatedJob);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error("Job update validation errors:", err.errors);
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Job update error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete job posting endpoint for company users
  app.delete("/api/job-postings/:id", isAuthenticated, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const user = req.user as any;

      if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job posting ID" });
      }

      if (user.userType !== "company") {
        return res.status(403).json({ message: "Only companies can delete job postings" });
      }

      // Get the job posting to verify ownership
      const existingJob = await storage.getJobPosting(jobId);
      if (!existingJob) {
        return res.status(404).json({ message: "Job posting not found" });
      }

      // Get company profile to verify ownership
      const companyProfile = await storage.getCompanyProfileByUserId(user.id);
      if (!companyProfile || existingJob.companyId !== companyProfile.id) {
        return res.status(403).json({ message: "You can only delete your own job postings" });
      }

      // Check if job has applications
      const applications = await storage.getJobApplicationsByJob(jobId);
      const hasApplications = applications.length > 0;

      console.log(`Company ${user.username} deleting job posting ${jobId} (${hasApplications ? 'with' : 'without'} applications)`);

      // Soft delete by setting status to 'deleted' and archived to true
      const deleteData = {
        status: 'deleted',
        archived: true,
        modifiedAt: new Date()
      };

      const deletedJob = await storage.updateJobPosting(jobId, deleteData);
      
      res.json({ 
        message: "Job posting deleted successfully",
        hadApplications: hasApplications,
        applicationsCount: applications.length,
        job: deletedJob
      });
    } catch (err) {
      console.error("Job deletion error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update job status endpoint (pause/resume/close)
  app.patch("/api/job-postings/:id/status", isAuthenticated, async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const user = req.user as any;
      const { status } = req.body;

      if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job posting ID" });
      }

      if (user.userType !== "company") {
        return res.status(403).json({ message: "Only companies can update job status" });
      }

      // Validate status
      const validStatuses = ['open', 'paused', 'closed', 'filled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be one of: open, paused, closed, filled" });
      }

      // Get the job posting to verify ownership
      const existingJob = await storage.getJobPosting(jobId);
      if (!existingJob) {
        return res.status(404).json({ message: "Job posting not found" });
      }

      // Get company profile to verify ownership
      const companyProfile = await storage.getCompanyProfileByUserId(user.id);
      if (!companyProfile || existingJob.companyId !== companyProfile.id) {
        return res.status(403).json({ message: "You can only update your own job postings" });
      }

      console.log(`Company ${user.username} changing job ${jobId} status from ${existingJob.status} to ${status}`);

      const updateData = {
        status,
        modifiedAt: new Date()
      };

      const updatedJob = await storage.updateJobPosting(jobId, updateData);
      res.json(updatedJob);
    } catch (err) {
      console.error("Job status update error:", err);
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
        try {
          // Regular case with profile ID
          const professionalId = parseInt(req.params.id);
          if (isNaN(professionalId)) {
            return res.status(400).json({ message: "Invalid professional ID format" });
          }
          
          professionalProfile = await storage.getProfessionalProfile(professionalId);
          
          // Check if user is the professional
          if (!professionalProfile || professionalProfile.userId !== user.id) {
            return res.status(403).json({ message: "You can only view your own applications" });
          }
        } catch (err) {
          console.error("Error retrieving professional profile:", err);
          return res.status(400).json({ message: "Invalid professional ID" });
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
  
