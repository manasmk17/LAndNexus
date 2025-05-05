import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getDB } from "../db";
import { portfolioProjects, insertPortfolioProjectSchema } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "portfolio");
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `portfolio-${uniqueSuffix}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.") as any);
    }
  },
});

// Get all portfolio projects for a professional
router.get("/professional/:professionalId", async (req: Request, res: Response) => {
  try {
    const { professionalId } = req.params;
    const db = getDB();
    
    const projects = await db
      .select()
      .from(portfolioProjects)
      .where(eq(portfolioProjects.professionalId, parseInt(professionalId)))
      .orderBy(portfolioProjects.createdAt);
    
    return res.json(projects);
  } catch (error: any) {
    console.error("Error fetching portfolio projects:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Get a specific portfolio project
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const [project] = await db
      .select()
      .from(portfolioProjects)
      .where(eq(portfolioProjects.id, parseInt(id)));
    
    if (!project) {
      return res.status(404).json({ error: "Portfolio project not found" });
    }
    
    return res.json(project);
  } catch (error: any) {
    console.error("Error fetching portfolio project:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Create a new portfolio project
router.post("/", upload.array("images", 10), async (req: Request, res: Response) => {
  try {
    // Parse project data from JSON string
    const projectData = JSON.parse(req.body.project);
    
    // Validate project data
    const validatedData = insertPortfolioProjectSchema.parse(projectData);
    
    // Process uploaded images
    const files = req.files as Express.Multer.File[];
    const imageUrls = files.map(file => {
      const relativePath = path.relative(process.cwd(), file.path);
      return `/api/uploads/${relativePath.replace(/\\/g, "/")}`;
    });
    
    // Add image URLs to project data
    const projectWithImages = {
      ...validatedData,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };
    
    // Create the project
    const db = getDB();
    const [newProject] = await db
      .insert(portfolioProjects)
      .values(projectWithImages)
      .returning();
    
    return res.status(201).json(newProject);
  } catch (error: any) {
    console.error("Error creating portfolio project:", error);
    
    // Clean up uploaded files in case of error
    if (req.files && Array.isArray(req.files)) {
      (req.files as Express.Multer.File[]).forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    return res.status(400).json({ error: error.message });
  }
});

// Update an existing portfolio project
router.patch("/:id", upload.array("images", 10), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    // Check if project exists
    const [existingProject] = await db
      .select()
      .from(portfolioProjects)
      .where(eq(portfolioProjects.id, parseInt(id)));
    
    if (!existingProject) {
      return res.status(404).json({ error: "Portfolio project not found" });
    }
    
    // Parse and validate project data
    const projectData = JSON.parse(req.body.project);
    const validatedData = insertPortfolioProjectSchema.parse(projectData);
    
    // Process uploaded images
    const files = req.files as Express.Multer.File[];
    const newImageUrls = files.map(file => {
      const relativePath = path.relative(process.cwd(), file.path);
      return `/api/uploads/${relativePath.replace(/\\/g, "/")}`;
    });
    
    // Combine existing and new images
    const existingImageUrls = existingProject.imageUrls as string[] || [];
    const combinedImageUrls = [...existingImageUrls, ...newImageUrls];
    
    // Update the project
    const [updatedProject] = await db
      .update(portfolioProjects)
      .set({
        ...validatedData,
        imageUrls: combinedImageUrls.length > 0 ? combinedImageUrls : undefined,
        updatedAt: new Date(),
      })
      .where(eq(portfolioProjects.id, parseInt(id)))
      .returning();
    
    return res.json(updatedProject);
  } catch (error: any) {
    console.error("Error updating portfolio project:", error);
    
    // Clean up uploaded files in case of error
    if (req.files && Array.isArray(req.files)) {
      (req.files as Express.Multer.File[]).forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    return res.status(400).json({ error: error.message });
  }
});

// Delete a portfolio project
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    // Get the project to access image URLs before deletion
    const [project] = await db
      .select()
      .from(portfolioProjects)
      .where(eq(portfolioProjects.id, parseInt(id)));
    
    if (!project) {
      return res.status(404).json({ error: "Portfolio project not found" });
    }
    
    // Delete the project
    await db
      .delete(portfolioProjects)
      .where(eq(portfolioProjects.id, parseInt(id)));
    
    // Clean up image files
    const imageUrls = project.imageUrls as string[] || [];
    imageUrls.forEach(url => {
      try {
        const filePath = path.join(process.cwd(), url.replace('/api/uploads/', ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error("Error deleting image file:", err);
      }
    });
    
    return res.json({ success: true, message: "Portfolio project deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting portfolio project:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Toggle featured status
router.patch("/:id/featured", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    
    if (typeof featured !== 'boolean') {
      return res.status(400).json({ error: "Featured status must be a boolean" });
    }
    
    const db = getDB();
    const [updatedProject] = await db
      .update(portfolioProjects)
      .set({ featured, updatedAt: new Date() })
      .where(eq(portfolioProjects.id, parseInt(id)))
      .returning();
    
    if (!updatedProject) {
      return res.status(404).json({ error: "Portfolio project not found" });
    }
    
    return res.json(updatedProject);
  } catch (error: any) {
    console.error("Error updating featured status:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;