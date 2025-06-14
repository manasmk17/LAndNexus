import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq, desc, and, sql, like, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  professionalProfiles,
  companyProfiles,
  jobPostings,
  jobApplications,
  resources,
  resourceCategories,
  forumPosts,
  forumComments,
  messages,
  consultations,
  authTokens,
} from "../shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/profiles";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG and WebP are allowed."));
    }
  },
});

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// User management routes
router.get("/api/me", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        userType: users.userType,
        isActive: users.isActive,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user[0]);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user by ID (public route for profiles)
router.get("/api/me/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        userType: users.userType,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user[0]);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update user settings
router.put("/api/user/settings", requireAuth, async (req, res) => {
  try {
    const settings = req.body;
    // Here you would typically update user settings in a separate settings table
    // For now, we'll just return success
    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get user settings
router.get("/api/user/settings", requireAuth, async (req, res) => {
  try {
    // Return default settings for now
    const defaultSettings = {
      twoFactorEnabled: false,
      jobAlerts: true,
      applicationAlerts: true,
      messageNotifications: true,
      emailUpdates: false,
      profileVisible: true,
      contactInfoVisible: false,
    };
    res.json(defaultSettings);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Export user data
router.get("/api/user/export-data", requireAuth, async (req, res) => {
  try {
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (userData.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove sensitive information
    const { password, ...safeUserData } = userData[0];
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${req.user.id}.json"`);
    res.json(safeUserData);
  } catch (error) {
    console.error("Error exporting user data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete user account
router.delete("/api/user/delete-account", requireAuth, async (req, res) => {
  try {
    const { password, confirmation } = req.body;
    
    if (confirmation !== `DELETE ${req.user.username}`) {
      return res.status(400).json({ message: "Invalid confirmation" });
    }

    // Verify password
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValidPassword = await bcrypt.compare(password, user[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Delete user (cascade should handle related records)
    await db.delete(users).where(eq(users.id, req.user.id));

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Change password
router.put("/api/auth/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get current user with password
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, req.user.id));

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Professional profiles routes
router.get("/api/professional-profiles/featured", async (req, res) => {
  try {
    const profiles = await db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.featured, true))
      .limit(6);
    res.json(profiles);
  } catch (error) {
    console.error("Error fetching featured profiles:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Resources routes
router.get("/api/resources/featured", async (req, res) => {
  try {
    const featuredResources = await db
      .select()
      .from(resources)
      .where(eq(resources.featured, true))
      .limit(6);
    res.json(featuredResources);
  } catch (error) {
    console.error("Error fetching featured resources:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Job postings routes
router.get("/api/job-postings/latest", async (req, res) => {
  try {
    const latestJobs = await db
      .select()
      .from(jobPostings)
      .orderBy(desc(jobPostings.createdAt))
      .limit(6);
    res.json(latestJobs);
  } catch (error) {
    console.error("Error fetching latest jobs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Company profiles routes
router.get("/api/company-profiles/:id", async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    const company = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.id, companyId))
      .limit(1);

    if (company.length === 0) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(company[0]);
  } catch (error) {
    console.error("Error fetching company profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update company profile
router.put("/api/company-profiles/:id", requireAuth, upload.single('logo'), async (req, res) => {
  try {
    const companyId = parseInt(req.params.id);
    const { companyName, industry, description, website, size, location } = req.body;
    
    const updateData: any = {
      companyName,
      industry,
      description,
      website,
      size,
      location,
    };

    if (req.file) {
      updateData.logoImagePath = req.file.path;
    }

    const result = await db
      .update(companyProfiles)
      .set(updateData)
      .where(eq(companyProfiles.id, companyId))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ message: "Company profile not found" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error updating company profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Professional profile expertise routes
router.get("/api/professional-profiles/:id/expertise", async (req, res) => {
  try {
    // This would typically join with an expertise table
    // For now, return empty array or mock data
    res.json([]);
  } catch (error) {
    console.error("Error fetching expertise:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Professional profile certifications routes
router.get("/api/professional-profiles/:id/certifications", async (req, res) => {
  try {
    // This would typically join with a certifications table
    // For now, return empty array or mock data
    res.json([]);
  } catch (error) {
    console.error("Error fetching certifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Subscription plans route
router.get("/api/subscription-plans", async (req, res) => {
  try {
    // Return mock subscription plans for now
    const plans = [
      {
        id: 21,
        name: "Starter",
        description: "Basic features for individuals",
        price: 0,
        currency: "USD",
        features: ["Basic profile", "Limited messaging"],
      },
      {
        id: 22,
        name: "Professional",
        description: "Advanced features for professionals",
        price: 29,
        currency: "USD",
        features: ["Full profile", "Unlimited messaging", "Priority support"],
      },
      {
        id: 23,
        name: "Enterprise",
        description: "Full features for companies",
        price: 99,
        currency: "USD",
        features: ["Team management", "Analytics", "Custom branding"],
      },
    ];
    res.json(plans);
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Pages route for dynamic content
router.get("/api/pages/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Mock page data - in a real app this would come from a pages table
    const mockPages: Record<string, any> = {
      contact: {
        id: 3,
        slug: "contact",
        title: "Contact Us",
        content: "Get in touch with our team",
      },
      terms: {
        id: 4,
        slug: "terms",
        title: "Terms & Privacy",
        content: "Our terms of service and privacy policy",
      },
    };

    const page = mockPages[slug];
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }

    res.json(page);
  } catch (error) {
    console.error("Error fetching page:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
</replit_final_file>