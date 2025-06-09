import { storage } from "./storage";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

interface ImageHealthReport {
  profileType: string;
  profileId: number;
  imageUrl: string | null;
  status: 'healthy' | 'broken' | 'missing';
  lastChecked: Date;
  responseCode?: number;
}

export class ImageHealthMonitor {
  private healthReports: Map<string, ImageHealthReport> = new Map();
  private isMonitoring = false;
  private checkInterval = 5 * 60 * 1000; // 5 minutes

  async startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log("Image health monitoring started");
    
    // Initial scan
    await this.performHealthCheck();
    
    // Set up periodic monitoring
    setInterval(async () => {
      await this.performHealthCheck();
    }, this.checkInterval);
  }

  async performHealthCheck(): Promise<ImageHealthReport[]> {
    const reports: ImageHealthReport[] = [];
    
    try {
      // Check professional profiles
      const professionalProfiles = await storage.getAllProfessionalProfiles();
      for (const profile of professionalProfiles) {
        const report = await this.checkImageHealth(
          'professional',
          profile.id,
          profile.profileImageUrl
        );
        reports.push(report);
        this.healthReports.set(`professional-${profile.id}`, report);
      }

      // Check company profiles
      const companyProfiles = await storage.getAllCompanyProfiles();
      for (const profile of companyProfiles) {
        // Check both logo_url and logo_image_path
        if (profile.logoUrl) {
          const report = await this.checkImageHealth(
            'company',
            profile.id,
            profile.logoUrl
          );
          reports.push(report);
          this.healthReports.set(`company-logo-${profile.id}`, report);
        }
        
        if (profile.logoImagePath) {
          const report = await this.checkLocalImageHealth(
            'company',
            profile.id,
            profile.logoImagePath
          );
          reports.push(report);
          this.healthReports.set(`company-local-${profile.id}`, report);
        }
      }

      // Log summary
      const broken = reports.filter(r => r.status === 'broken').length;
      const missing = reports.filter(r => r.status === 'missing').length;
      const healthy = reports.filter(r => r.status === 'healthy').length;
      
      console.log(`Image Health Check: ${healthy} healthy, ${broken} broken, ${missing} missing`);
      
      return reports;
    } catch (error) {
      console.error('Error during image health check:', error);
      return reports;
    }
  }

  private async checkImageHealth(
    profileType: string,
    profileId: number,
    imageUrl: string | null
  ): Promise<ImageHealthReport> {
    const report: ImageHealthReport = {
      profileType,
      profileId,
      imageUrl,
      status: 'missing',
      lastChecked: new Date()
    };

    if (!imageUrl) {
      return report;
    }

    try {
      // Check if it's a local path
      if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('uploads/')) {
        return this.checkLocalImageHealth(profileType, profileId, imageUrl);
      }

      // Check external URL
      const response = await fetch(imageUrl, { 
        method: 'HEAD',
        timeout: 5000,
        headers: {
          'User-Agent': 'L&D-Nexus-Image-Health-Monitor/1.0'
        }
      });

      report.responseCode = response.status;
      report.status = response.ok ? 'healthy' : 'broken';

      if (!response.ok) {
        console.warn(`Broken image URL: ${imageUrl} (${response.status})`);
      }

    } catch (error) {
      report.status = 'broken';
      console.warn(`Failed to check image URL: ${imageUrl}`, (error as Error).message);
    }

    return report;
  }

  private async checkLocalImageHealth(
    profileType: string,
    profileId: number,
    imagePath: string
  ): Promise<ImageHealthReport> {
    const report: ImageHealthReport = {
      profileType,
      profileId,
      imageUrl: imagePath,
      status: 'missing',
      lastChecked: new Date()
    };

    if (!imagePath) {
      return report;
    }

    try {
      // Normalize path - remove leading slash if present
      const normalizedPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
      const fullPath = path.resolve(normalizedPath);

      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.isFile() && stats.size > 0) {
          report.status = 'healthy';
        } else {
          report.status = 'broken';
          console.warn(`Local image file exists but is invalid: ${fullPath}`);
        }
      } else {
        report.status = 'broken';
        console.warn(`Local image file not found: ${fullPath}`);
      }

    } catch (error) {
      report.status = 'broken';
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Error checking local image: ${imagePath}`, errorMessage);
    }

    return report;
  }

  getHealthReport(profileType: string, profileId: number): ImageHealthReport | null {
    return this.healthReports.get(`${profileType}-${profileId}`) || null;
  }

  getAllReports(): ImageHealthReport[] {
    return Array.from(this.healthReports.values());
  }

  getBrokenImages(): ImageHealthReport[] {
    return this.getAllReports().filter(report => report.status === 'broken');
  }

  async autoFixBrokenImages(): Promise<number> {
    const brokenImages = this.getBrokenImages();
    let fixedCount = 0;

    for (const report of brokenImages) {
      try {
        if (report.profileType === 'company' && report.imageUrl?.includes('example.com')) {
          // Fix known broken external URLs by setting them to null
          await storage.updateCompanyProfile(report.profileId, { logoUrl: null });
          console.log(`Fixed broken company logo URL for profile ${report.profileId}`);
          fixedCount++;
        }
      } catch (error) {
        console.error(`Failed to auto-fix broken image for ${report.profileType} profile ${report.profileId}:`, error);
      }
    }

    if (fixedCount > 0) {
      console.log(`Auto-fixed ${fixedCount} broken image links`);
      // Re-run health check after fixes
      await this.performHealthCheck();
    }

    return fixedCount;
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log("Image health monitoring stopped");
  }
}

// Export singleton instance
export const imageHealthMonitor = new ImageHealthMonitor();