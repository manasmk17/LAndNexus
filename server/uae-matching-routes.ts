import type { Request, Response } from "express";
import { uaeMatchingEngine } from "./uae-ai-matching";
import { storage } from "./storage";

// API endpoints for UAE-specific AI matching functionality

// Enhanced professional matching with UAE context
export async function getUAEMatchingJobsForProfessional(req: Request, res: Response) {
  try {
    const professionalId = parseInt(req.params.professionalId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const sectorFilter = req.query.sector as string;
    const languageFilter = req.query.language as string;
    const formatFilter = req.query.format as string;
    
    if (isNaN(professionalId)) {
      return res.status(400).json({ message: "Invalid professional ID" });
    }
    
    // Get professional profile
    const professional = await storage.getProfessionalProfile(professionalId);
    if (!professional) {
      return res.status(404).json({ message: "Professional profile not found" });
    }
    
    // Get available jobs with optional filters
    const jobs = await storage.getAvailableJobs(limit * 3); // Get more to filter
    
    // Apply UAE-specific matching
    const uaeMatches = [];
    for (const job of jobs) {
      // Apply filters if provided
      if (sectorFilter && !job.description.toLowerCase().includes(sectorFilter.toLowerCase())) {
        continue;
      }
      
      const matchResult = await uaeMatchingEngine.matchProfessionalToJob(professional, job);
      
      if (matchResult.overallScore > 0.3) { // Minimum threshold
        uaeMatches.push({
          job,
          matchScore: Math.round(matchResult.overallScore * 100),
          sectorScore: Math.round(matchResult.sectorScore * 100),
          languageScore: Math.round(matchResult.languageScore * 100),
          formatScore: Math.round(matchResult.formatScore * 100),
          culturalScore: Math.round(matchResult.culturalScore * 100),
          matchStrength: getUAEMatchStrength(matchResult.overallScore),
          recommendations: matchResult.recommendations,
          uaeSpecific: true
        });
      }
    }
    
    // Sort by overall score and limit results
    uaeMatches.sort((a, b) => b.matchScore - a.matchScore);
    const limitedMatches = uaeMatches.slice(0, limit);
    
    return res.json({
      matches: limitedMatches,
      totalFound: uaeMatches.length,
      uaeOptimized: true,
      searchCriteria: {
        sector: sectorFilter,
        language: languageFilter,
        format: formatFilter
      }
    });
    
  } catch (error) {
    console.error("Error in UAE professional matching:", error);
    return res.status(500).json({ message: "Failed to retrieve UAE-optimized job matches" });
  }
}

// Enhanced company matching with UAE context
export async function getUAEMatchingProfessionalsForJob(req: Request, res: Response) {
  try {
    const jobId = parseInt(req.params.jobId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const sectorPreference = req.query.sector as string;
    const languageRequirement = req.query.language as string;
    const formatRequirement = req.query.format as string;
    const emirate = req.query.emirate as string;
    
    if (isNaN(jobId)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }
    
    // Get job posting
    const job = await storage.getJobPosting(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job posting not found" });
    }
    
    // Build UAE context from query parameters
    const uaeContext = {
      emirate: emirate as any,
      companyType: 'multinational' as const,
      culturalSensitivity: 0.7,
      complianceRequirements: []
    };
    
    // Get available professionals
    const professionals = await storage.getAllProfessionalProfiles(limit * 3);
    
    // Apply UAE-specific matching
    const uaeMatches = [];
    for (const professional of professionals) {
      const matchResult = await uaeMatchingEngine.matchProfessionalToJob(
        professional, 
        job, 
        uaeContext
      );
      
      if (matchResult.overallScore > 0.3) {
        uaeMatches.push({
          professional,
          matchScore: Math.round(matchResult.overallScore * 100),
          sectorScore: Math.round(matchResult.sectorScore * 100),
          languageScore: Math.round(matchResult.languageScore * 100),
          formatScore: Math.round(matchResult.formatScore * 100),
          culturalScore: Math.round(matchResult.culturalScore * 100),
          matchStrength: getUAEMatchStrength(matchResult.overallScore),
          recommendations: matchResult.recommendations,
          uaeOptimized: true,
          relevantExperience: extractUAERelevantExperience(professional, job)
        });
      }
    }
    
    // Sort by overall score and apply additional UAE-specific ranking
    uaeMatches.sort((a, b) => {
      // Prioritize higher cultural and language scores in UAE context
      const aUAEBonus = (a.culturalScore + a.languageScore) / 200;
      const bUAEBonus = (b.culturalScore + b.languageScore) / 200;
      
      const aFinalScore = a.matchScore + (aUAEBonus * 10);
      const bFinalScore = b.matchScore + (bUAEBonus * 10);
      
      return bFinalScore - aFinalScore;
    });
    
    const limitedMatches = uaeMatches.slice(0, limit);
    
    return res.json({
      matches: limitedMatches,
      totalFound: uaeMatches.length,
      uaeOptimized: true,
      jobRequirements: {
        sector: sectorPreference,
        language: languageRequirement,
        format: formatRequirement,
        emirate: emirate
      },
      searchInsights: generateUAESearchInsights(uaeMatches, job)
    });
    
  } catch (error) {
    console.error("Error in UAE company matching:", error);
    return res.status(500).json({ message: "Failed to retrieve UAE-optimized professional matches" });
  }
}

// Get UAE market insights and recommendations
export async function getUAEMarketInsights(req: Request, res: Response) {
  try {
    const sector = req.query.sector as string;
    const emirate = req.query.emirate as string;
    
    // Get market data
    const professionals = await storage.getAllProfessionalProfiles(100);
    const jobs = await storage.getAvailableJobs(100);
    
    // Analyze UAE market trends
    const insights = {
      marketOverview: {
        totalProfessionals: professionals.length,
        totalActiveJobs: jobs.length,
        topSectors: analyzeTopUAESectors(professionals, jobs),
        languageDistribution: analyzeLanguageDistribution(professionals),
        formatPreferences: analyzeFormatPreferences(jobs)
      },
      sectorAnalysis: sector ? analyzeSectorSpecific(professionals, jobs, sector) : null,
      emirateAnalysis: emirate ? analyzeEmirateSpecific(professionals, jobs, emirate) : null,
      recommendations: generateMarketRecommendations(professionals, jobs),
      culturalConsiderations: getUAECulturalGuidelines(),
      complianceRequirements: getUAEComplianceRequirements()
    };
    
    return res.json(insights);
    
  } catch (error) {
    console.error("Error generating UAE market insights:", error);
    return res.status(500).json({ message: "Failed to generate market insights" });
  }
}

// Helper functions
function getUAEMatchStrength(score: number): string {
  if (score >= 0.9) return "Exceptional UAE Match";
  if (score >= 0.8) return "Excellent UAE Match";
  if (score >= 0.7) return "Strong UAE Match";
  if (score >= 0.6) return "Good UAE Match";
  if (score >= 0.4) return "Moderate UAE Match";
  return "Basic UAE Match";
}

function extractUAERelevantExperience(professional: any, job: any): string[] {
  const experience = [];
  const profileText = `${professional.title} ${professional.bio}`.toLowerCase();
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  
  // Look for UAE-specific experience indicators
  if (profileText.includes('uae') || profileText.includes('dubai') || profileText.includes('abu dhabi')) {
    experience.push("UAE market experience");
  }
  
  if (profileText.includes('arabic') || profileText.includes('bilingual')) {
    experience.push("Arabic language capabilities");
  }
  
  if (profileText.includes('cultural') || profileText.includes('cross-cultural')) {
    experience.push("Cross-cultural training expertise");
  }
  
  if (profileText.includes('government') && jobText.includes('government')) {
    experience.push("UAE government sector experience");
  }
  
  return experience;
}

function generateUAESearchInsights(matches: any[], job: any): any {
  const insights = {
    averageMatchScore: matches.reduce((sum, match) => sum + match.matchScore, 0) / matches.length,
    topMatchingFactors: [],
    improvementSuggestions: []
  };
  
  // Analyze top matching factors
  const avgScores = {
    sector: matches.reduce((sum, match) => sum + match.sectorScore, 0) / matches.length,
    language: matches.reduce((sum, match) => sum + match.languageScore, 0) / matches.length,
    format: matches.reduce((sum, match) => sum + match.formatScore, 0) / matches.length,
    cultural: matches.reduce((sum, match) => sum + match.culturalScore, 0) / matches.length
  };
  
  const sortedFactors = Object.entries(avgScores)
    .sort(([,a], [,b]) => b - a)
    .map(([factor, score]) => ({ factor, score: Math.round(score) }));
  
  insights.topMatchingFactors = sortedFactors;
  
  // Generate improvement suggestions
  if (avgScores.language < 70) {
    insights.improvementSuggestions.push("Consider Arabic language requirements or bilingual professionals");
  }
  
  if (avgScores.cultural < 60) {
    insights.improvementSuggestions.push("Emphasize UAE cultural experience in job requirements");
  }
  
  return insights;
}

function analyzeTopUAESectors(professionals: any[], jobs: any[]): any[] {
  const sectorCounts = {};
  
  jobs.forEach(job => {
    const text = `${job.title} ${job.description}`.toLowerCase();
    if (text.includes('technology') || text.includes('tech') || text.includes('digital')) {
      sectorCounts['technology'] = (sectorCounts['technology'] || 0) + 1;
    }
    if (text.includes('finance') || text.includes('banking') || text.includes('financial')) {
      sectorCounts['finance'] = (sectorCounts['finance'] || 0) + 1;
    }
    if (text.includes('oil') || text.includes('energy') || text.includes('petroleum')) {
      sectorCounts['oil_gas'] = (sectorCounts['oil_gas'] || 0) + 1;
    }
  });
  
  return Object.entries(sectorCounts)
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function analyzeLanguageDistribution(professionals: any[]): any {
  let arabicCapable = 0;
  let bilingualCapable = 0;
  
  professionals.forEach(prof => {
    const text = `${prof.title} ${prof.bio}`.toLowerCase();
    if (text.includes('arabic') || text.includes('عربي')) {
      arabicCapable++;
    }
    if (text.includes('bilingual') || text.includes('multilingual')) {
      bilingualCapable++;
    }
  });
  
  return {
    arabicCapable,
    bilingualCapable,
    englishOnly: professionals.length - arabicCapable,
    total: professionals.length
  };
}

function analyzeFormatPreferences(jobs: any[]): any {
  const formats = {
    inPerson: 0,
    virtual: 0,
    hybrid: 0
  };
  
  jobs.forEach(job => {
    const text = `${job.title} ${job.description}`.toLowerCase();
    if (text.includes('virtual') || text.includes('online') || text.includes('remote')) {
      formats.virtual++;
    } else if (text.includes('hybrid') || text.includes('blended')) {
      formats.hybrid++;
    } else {
      formats.inPerson++;
    }
  });
  
  return formats;
}

function analyzeSectorSpecific(professionals: any[], jobs: any[], sector: string): any {
  const sectorJobs = jobs.filter(job => 
    `${job.title} ${job.description}`.toLowerCase().includes(sector.toLowerCase())
  );
  
  const sectorProfessionals = professionals.filter(prof => 
    `${prof.title} ${prof.bio} ${prof.industryFocus}`.toLowerCase().includes(sector.toLowerCase())
  );
  
  return {
    jobCount: sectorJobs.length,
    professionalCount: sectorProfessionals.length,
    demandSupplyRatio: sectorJobs.length / (sectorProfessionals.length || 1),
    averageCompensation: sectorJobs.reduce((sum, job) => sum + (job.maxCompensation || 0), 0) / sectorJobs.length
  };
}

function analyzeEmirateSpecific(professionals: any[], jobs: any[], emirate: string): any {
  const emirateJobs = jobs.filter(job => 
    job.location.toLowerCase().includes(emirate.toLowerCase())
  );
  
  const emirateProfessionals = professionals.filter(prof => 
    prof.location?.toLowerCase().includes(emirate.toLowerCase())
  );
  
  return {
    jobCount: emirateJobs.length,
    professionalCount: emirateProfessionals.length,
    localTalentRatio: emirateProfessionals.length / (emirateJobs.length || 1)
  };
}

function generateMarketRecommendations(professionals: any[], jobs: any[]): string[] {
  const recommendations = [];
  
  const techJobs = jobs.filter(j => 
    `${j.title} ${j.description}`.toLowerCase().includes('technology')
  ).length;
  
  const financeJobs = jobs.filter(j => 
    `${j.title} ${j.description}`.toLowerCase().includes('finance')
  ).length;
  
  if (techJobs > financeJobs) {
    recommendations.push("Technology sector shows highest demand - consider specializing in digital transformation and fintech");
  } else {
    recommendations.push("Financial services remain strong - Islamic banking and sharia compliance expertise valuable");
  }
  
  const arabicProfessionals = professionals.filter(p => 
    `${p.title} ${p.bio}`.toLowerCase().includes('arabic')
  ).length;
  
  if (arabicProfessionals < professionals.length * 0.3) {
    recommendations.push("Arabic language skills are in high demand - consider developing bilingual capabilities");
  }
  
  recommendations.push("UAE government initiatives in AI and smart cities create opportunities for specialized training");
  recommendations.push("Cultural sensitivity training increasingly important for multinational companies");
  
  return recommendations;
}

function getUAECulturalGuidelines(): string[] {
  return [
    "Respect for Islamic values and local customs is essential",
    "Business meetings may be scheduled around prayer times",
    "Relationship building is crucial before business discussions",
    "Formal attire and professional demeanor expected",
    "Friday is the holy day - avoid scheduling on Friday afternoons",
    "Ramadan considerations for training schedules and content delivery",
    "Arabic greetings and basic phrases appreciated",
    "Hierarchy and respect for authority emphasized in corporate culture"
  ];
}

function getUAEComplianceRequirements(): string[] {
  return [
    "UAE Labor Law compliance for employment practices",
    "ADGM/DIFC regulations for financial sector training",
    "UAE Data Protection Law (PDPL) for data handling",
    "MOHRE approvals for certain professional training",
    "Emirates Authority for Standardization requirements",
    "Ministry of Education approvals for educational content",
    "NCEMA guidelines for crisis management training",
    "UAE Central Bank regulations for financial training"
  ];
}