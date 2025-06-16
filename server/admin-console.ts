
#!/usr/bin/env node

import { storage } from "./storage";

// Command-line admin interface for secure server-side administration
class AdminConsole {
  private adminToken: string;

  constructor() {
    this.adminToken = process.env.ADMIN_TOKEN || "admin-secret-key-2024";
    console.log("🔐 Admin Console Initialized");
    console.log("Available commands: users, jobs, companies, professionals, resources, stats, help");
  }

  async executeCommand(command: string, ...args: string[]) {
    try {
      switch (command.toLowerCase()) {
        case 'users':
          return await this.handleUsersCommand(args);
        case 'jobs':
          return await this.handleJobsCommand(args);
        case 'companies':
          return await this.handleCompaniesCommand(args);
        case 'professionals':
          return await this.handleProfessionalsCommand(args);
        case 'resources':
          return await this.handleResourcesCommand(args);
        case 'stats':
          return await this.showStats();
        case 'help':
          return this.showHelp();
        default:
          console.log(`❌ Unknown command: ${command}`);
          return this.showHelp();
      }
    } catch (error) {
      console.error(`❌ Error executing command: ${error}`);
    }
  }

  private async handleUsersCommand(args: string[]) {
    const action = args[0];
    
    switch (action) {
      case 'list':
        const users = Array.from((storage as any).users.values());
        console.log(`📊 Total Users: ${users.length}`);
        users.forEach((user: any) => {
          console.log(`  ID: ${user.id} | ${user.username} | ${user.email} | Type: ${user.userType}`);
        });
        break;
        
      case 'delete':
        const userId = parseInt(args[1]);
        if (isNaN(userId)) {
          console.log("❌ Invalid user ID");
          return;
        }
        const success = await storage.deleteUser(userId);
        console.log(success ? `✅ User ${userId} deleted` : `❌ Failed to delete user ${userId}`);
        break;
        
      case 'activate':
      case 'deactivate':
        const targetUserId = parseInt(args[1]);
        if (isNaN(targetUserId)) {
          console.log("❌ Invalid user ID");
          return;
        }
        const isActive = action === 'activate';
        const updatedUser = await storage.updateUser(targetUserId, { isActive });
        console.log(updatedUser ? `✅ User ${targetUserId} ${action}d` : `❌ User not found`);
        break;
        
      default:
        console.log("Available user commands: list, delete <id>, activate <id>, deactivate <id>");
    }
  }

  private async handleJobsCommand(args: string[]) {
    const action = args[0];
    
    switch (action) {
      case 'list':
        const jobs = Array.from((storage as any).jobPostings.values());
        console.log(`📊 Total Jobs: ${jobs.length}`);
        jobs.forEach((job: any) => {
          console.log(`  ID: ${job.id} | ${job.title} | Company: ${job.companyId} | Featured: ${job.featured}`);
        });
        break;
        
      case 'feature':
      case 'unfeature':
        const jobId = parseInt(args[1]);
        if (isNaN(jobId)) {
          console.log("❌ Invalid job ID");
          return;
        }
        const featured = action === 'feature';
        const updatedJob = await storage.updateJobPosting(jobId, { featured });
        console.log(updatedJob ? `✅ Job ${jobId} ${action}d` : `❌ Job not found`);
        break;
        
      default:
        console.log("Available job commands: list, feature <id>, unfeature <id>");
    }
  }

  private async handleCompaniesCommand(args: string[]) {
    const action = args[0];
    
    switch (action) {
      case 'list':
        const companies = Array.from((storage as any).companyProfiles.values());
        console.log(`📊 Total Companies: ${companies.length}`);
        companies.forEach((company: any) => {
          console.log(`  ID: ${company.id} | ${company.companyName} | Verified: ${company.verified} | Featured: ${company.featured}`);
        });
        break;
        
      case 'verify':
      case 'unverify':
        const companyId = parseInt(args[1]);
        if (isNaN(companyId)) {
          console.log("❌ Invalid company ID");
          return;
        }
        const verified = action === 'verify';
        const updatedCompany = await storage.updateCompanyProfile(companyId, { verified });
        console.log(updatedCompany ? `✅ Company ${companyId} ${action}ed` : `❌ Company not found`);
        break;
        
      default:
        console.log("Available company commands: list, verify <id>, unverify <id>");
    }
  }

  private async handleProfessionalsCommand(args: string[]) {
    const action = args[0];
    
    switch (action) {
      case 'list':
        const professionals = Array.from((storage as any).professionalProfiles.values());
        console.log(`📊 Total Professionals: ${professionals.length}`);
        professionals.forEach((prof: any) => {
          console.log(`  ID: ${prof.id} | ${prof.firstName} ${prof.lastName} | Verified: ${prof.verified} | Featured: ${prof.featured}`);
        });
        break;
        
      case 'verify':
      case 'unverify':
        const profId = parseInt(args[1]);
        if (isNaN(profId)) {
          console.log("❌ Invalid professional ID");
          return;
        }
        const verified = action === 'verify';
        const updatedProf = await storage.updateProfessionalProfile(profId, { verified });
        console.log(updatedProf ? `✅ Professional ${profId} ${action}ed` : `❌ Professional not found`);
        break;
        
      default:
        console.log("Available professional commands: list, verify <id>, unverify <id>");
    }
  }

  private async handleResourcesCommand(args: string[]) {
    const action = args[0];
    
    switch (action) {
      case 'list':
        const resources = await storage.getAllResources();
        console.log(`📊 Total Resources: ${resources.length}`);
        resources.forEach((resource: any) => {
          console.log(`  ID: ${resource.id} | ${resource.title} | Featured: ${resource.featured} | Approved: ${resource.approved}`);
        });
        break;
        
      case 'approve':
      case 'unapprove':
        const resourceId = parseInt(args[1]);
        if (isNaN(resourceId)) {
          console.log("❌ Invalid resource ID");
          return;
        }
        const approved = action === 'approve';
        const updatedResource = await storage.updateResource(resourceId, { approved });
        console.log(updatedResource ? `✅ Resource ${resourceId} ${action}d` : `❌ Resource not found`);
        break;
        
      default:
        console.log("Available resource commands: list, approve <id>, unapprove <id>");
    }
  }

  private async showStats() {
    const stats = {
      users: Array.from((storage as any).users.values()).length,
      jobs: Array.from((storage as any).jobPostings.values()).length,
      companies: Array.from((storage as any).companyProfiles.values()).length,
      professionals: Array.from((storage as any).professionalProfiles.values()).length,
      resources: Array.from((storage as any).resources.values()).length,
    };
    
    console.log("📊 System Statistics:");
    console.log(`  👥 Users: ${stats.users}`);
    console.log(`  💼 Jobs: ${stats.jobs}`);
    console.log(`  🏢 Companies: ${stats.companies}`);
    console.log(`  👨‍💼 Professionals: ${stats.professionals}`);
    console.log(`  📚 Resources: ${stats.resources}`);
  }

  private showHelp() {
    console.log(`
🔐 Admin Console Help

Available Commands:
  users list                    - List all users
  users delete <id>            - Delete user by ID
  users activate <id>          - Activate user
  users deactivate <id>        - Deactivate user
  
  jobs list                    - List all jobs
  jobs feature <id>            - Feature job
  jobs unfeature <id>          - Unfeature job
  
  companies list               - List all companies
  companies verify <id>        - Verify company
  companies unverify <id>      - Unverify company
  
  professionals list           - List all professionals
  professionals verify <id>    - Verify professional
  professionals unverify <id>  - Unverify professional
  
  resources list               - List all resources
  resources approve <id>       - Approve resource
  resources unapprove <id>     - Unapprove resource
  
  stats                        - Show system statistics
  help                         - Show this help message

Usage: node admin-console.js <command> [arguments]
    `);
  }
}

// CLI Interface
if (require.main === module) {
  const console_admin = new AdminConsole();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console_admin.showHelp();
  } else {
    console_admin.executeCommand(args[0], ...args.slice(1));
  }
}

export { AdminConsole };
