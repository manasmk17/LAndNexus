
import express from "express";
import {
  isServerAdmin,
  getAdminDashboard,
  getAllUsers,
  updateUserStatus,
  deleteUserAdmin,
  getAllJobsAdmin,
  updateJobStatus,
  getAllProfessionalsAdmin,
  updateProfessionalStatus,
  getAllCompaniesAdmin,
  updateCompanyStatus,
  getAllResourcesAdmin,
  updateResourceStatus,
  getSystemHealth,
  getAuditLogs
} from "./admin-routes";

const adminRouter = express.Router();

// Apply admin authentication to all routes
adminRouter.use(isServerAdmin);

// Dashboard
adminRouter.get("/dashboard", getAdminDashboard);
adminRouter.get("/health", getSystemHealth);
adminRouter.get("/audit-logs", getAuditLogs);

// User Management
adminRouter.get("/users", getAllUsers);
adminRouter.put("/users/:id", updateUserStatus);
adminRouter.delete("/users/:id", deleteUserAdmin);

// Job Management
adminRouter.get("/jobs", getAllJobsAdmin);
adminRouter.put("/jobs/:id", updateJobStatus);

// Professional Management
adminRouter.get("/professionals", getAllProfessionalsAdmin);
adminRouter.put("/professionals/:id", updateProfessionalStatus);

// Company Management
adminRouter.get("/companies", getAllCompaniesAdmin);
adminRouter.put("/companies/:id", updateCompanyStatus);

// Resource Management
adminRouter.get("/resources", getAllResourcesAdmin);
adminRouter.put("/resources/:id", updateResourceStatus);

export { adminRouter };
