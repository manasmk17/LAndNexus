import OpenAI from "openai";
import type { JobPosting, ProfessionalProfile, Expertise } from "@shared/schema";
import { generateEmbedding, calculateCosineSimilarity } from "./ai-services";

// UAE-specific AI matching system for L&D Nexus
// Implements sector-specific, bilingual, format-aware, and culturally-aligned matching

interface UAEMatchingProfile {
  profile: ProfessionalProfile;
  sectorExpertise: UAESector[];
  languageCapabilities: LanguageCapability;
  trainingFormatPreferences: TrainingFormat[];
  uaeExperience: UAEExperienceLevel;
  culturalFit: number; // 0-1 score
}

interface UAEJobRequirement {
  job: JobPosting;
  targetSector: UAESector;
  languageRequirements: LanguageRequirement;
  trainingFormat: TrainingFormat;
  uaeContext: UAEBusinessContext;
  urgency: 'low' | 'medium' | 'high';
}

// UAE-specific sector classifications
enum UAESector {
  TECHNOLOGY = 'technology',
  FINANCE = 'finance',
  OIL_GAS = 'oil_gas',
  REAL_ESTATE = 'real_estate',
  TOURISM = 'tourism',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  LOGISTICS = 'logistics',
  GOVERNMENT = 'government',
  MANUFACTURING = 'manufacturing'
}

// Language capabilities in UAE context
interface LanguageCapability {
  arabic: 'native' | 'fluent' | 'conversational' | 'basic' | 'none';
  english: 'native' | 'fluent' | 'conversational' | 'basic' | 'none';
  preferredLanguage: 'arabic' | 'english' | 'bilingual';
  culturalCommunication: number; // Understanding of UAE business communication styles (0-1)
}

interface LanguageRequirement {
  arabicRequired: boolean;
  englishRequired: boolean;
  preferredLanguage: 'arabic' | 'english' | 'bilingual';
  formalityLevel: 'formal' | 'business' | 'casual';
}

// Training delivery formats
enum TrainingFormat {
  IN_PERSON_UAE = 'in_person_uae',
  VIRTUAL_UAE_TIMEZONE = 'virtual_uae_timezone',
  HYBRID_UAE = 'hybrid_uae',
  SELF_PACED_ARABIC = 'self_paced_arabic',
  WORKSHOP_BASED = 'workshop_based',
  MENTORING = 'mentoring'
}

interface UAEBusinessContext {
  emirate: 'abu_dhabi' | 'dubai' | 'sharjah' | 'ajman' | 'ras_al_khaimah' | 'fujairah' | 'umm_al_quwain' | 'multi_emirate';
  companyType: 'multinational' | 'local' | 'sme' | 'startup' | 'government';
  culturalSensitivity: number; // Required level (0-1)
  complianceRequirements: string[];
}

enum UAEExperienceLevel {
  UAE_NATIVE = 5,
  LONG_TERM_RESIDENT = 4,
  EXPERIENCED_EXPAT = 3,
  RECENT_ARRIVAL = 2,
  REMOTE_ONLY = 1
}

// UAE sector-specific keywords and terminology
const UAE_SECTOR_KEYWORDS = {
  [UAESector.TECHNOLOGY]: {
    primary: ['fintech', 'smartcity', 'blockchain', 'ai', 'digital transformation', 'cybersecurity', 'iot'],
    arabic: ['التكنولوجيا المالية', 'المدن الذكية', 'البلوك تشين', 'الذكاء الاصطناعي', 'التحول الرقمي'],
    weight: 1.2 // UAE Tech sector emphasis
  },
  [UAESector.FINANCE]: {
    primary: ['islamic banking', 'sharia compliance', 'adcb', 'emirates nbd', 'financial services', 'investment'],
    arabic: ['المصرفية الإسلامية', 'الامتثال للشريعة', 'الخدمات المالية', 'الاستثمار'],
    weight: 1.3 // High priority in UAE
  },
  [UAESector.OIL_GAS]: {
    primary: ['adnoc', 'petrochemicals', 'energy', 'refineries', 'downstream', 'upstream'],
    arabic: ['البتروكيماويات', 'الطاقة', 'المصافي', 'أدنوك'],
    weight: 1.4 // Core UAE industry
  },
  [UAESector.REAL_ESTATE]: {
    primary: ['emaar', 'dubai properties', 'construction', 'property management', 'development'],
    arabic: ['إعمار', 'العقارات', 'الإنشاءات', 'إدارة الممتلكات', 'التطوير'],
    weight: 1.1
  },
  [UAESector.TOURISM]: {
    primary: ['hospitality', 'expo', 'tourism board', 'heritage', 'cultural tourism'],
    arabic: ['الضيافة', 'إكسبو', 'مجلس السياحة', 'التراث', 'السياحة الثقافية'],
    weight: 1.2 // Growing sector
  }
};

// Enhanced UAE-specific matching algorithm
export class UAEAIMatchingEngine {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Main matching function for UAE context
  async matchProfessionalToJob(
    profile: ProfessionalProfile, 
    job: JobPosting,
    uaeContext?: Partial<UAEBusinessContext>
  ): Promise<{
    overallScore: number;
    sectorScore: number;
    languageScore: number;
    formatScore: number;
    culturalScore: number;
    recommendations: string[];
  }> {
    try {
      // Analyze professional's UAE profile
      const uaeProfile = await this.analyzeUAEProfile(profile);
      
      // Analyze job's UAE requirements
      const uaeJobReq = await this.analyzeUAEJobRequirements(job, uaeContext);
      
      // Calculate sector-specific match
      const sectorScore = this.calculateSectorMatch(uaeProfile, uaeJobReq);
      
      // Calculate language compatibility
      const languageScore = this.calculateLanguageMatch(uaeProfile, uaeJobReq);
      
      // Calculate training format compatibility
      const formatScore = this.calculateFormatMatch(uaeProfile, uaeJobReq);
      
      // Calculate cultural fit
      const culturalScore = this.calculateCulturalMatch(uaeProfile, uaeJobReq);
      
      // Weighted overall score for UAE context
      const overallScore = (
        sectorScore * 0.35 +      // Sector expertise is crucial
        languageScore * 0.25 +    // Language is critical in UAE
        formatScore * 0.20 +      // Format flexibility important
        culturalScore * 0.20      // Cultural fit essential
      );
      
      // Generate actionable recommendations
      const recommendations = this.generateUAERecommendations(
        uaeProfile, uaeJobReq, { sectorScore, languageScore, formatScore, culturalScore }
      );
      
      return {
        overallScore,
        sectorScore,
        languageScore,
        formatScore,
        culturalScore,
        recommendations
      };
      
    } catch (error) {
      console.error('UAE AI matching error:', error);
      // Fallback to basic matching
      return this.fallbackUAEMatching(profile, job);
    }
  }

  // Analyze professional's UAE-specific capabilities
  private async analyzeUAEProfile(profile: ProfessionalProfile): Promise<UAEMatchingProfile> {
    // Extract UAE-relevant information from profile
    const sectorExpertise = this.identifyUAESectors(profile);
    const languageCapabilities = this.assessLanguageCapabilities(profile);
    const trainingFormatPreferences = this.extractFormatPreferences(profile);
    const uaeExperience = this.assessUAEExperience(profile);
    const culturalFit = this.assessCulturalFit(profile);

    return {
      profile,
      sectorExpertise,
      languageCapabilities,
      trainingFormatPreferences,
      uaeExperience,
      culturalFit
    };
  }

  // Analyze job's UAE-specific requirements
  private async analyzeUAEJobRequirements(
    job: JobPosting, 
    context?: Partial<UAEBusinessContext>
  ): Promise<UAEJobRequirement> {
    const targetSector = this.identifyJobSector(job);
    const languageRequirements = this.extractLanguageRequirements(job);
    const trainingFormat = this.determineOptimalFormat(job);
    const uaeContext = this.buildUAEContext(job, context);
    const urgency = this.assessUrgency(job);

    return {
      job,
      targetSector,
      languageRequirements,
      trainingFormat,
      uaeContext,
      urgency
    };
  }

  // Calculate sector-specific matching score
  private calculateSectorMatch(profile: UAEMatchingProfile, jobReq: UAEJobRequirement): number {
    let score = 0;
    
    // Check if professional has expertise in target sector
    const hasSectorExpertise = profile.sectorExpertise.includes(jobReq.targetSector);
    if (hasSectorExpertise) {
      score += 0.7;
    }
    
    // Check for UAE-specific sector keywords in profile
    const sectorKeywords = UAE_SECTOR_KEYWORDS[jobReq.targetSector];
    if (sectorKeywords) {
      const profileText = `${profile.profile.title} ${profile.profile.bio}`.toLowerCase();
      
      // English keywords
      const englishMatches = sectorKeywords.primary.filter(keyword => 
        profileText.includes(keyword.toLowerCase())
      ).length;
      
      // Arabic keywords (if profile contains Arabic)
      const arabicMatches = sectorKeywords.arabic.filter(keyword => 
        profileText.includes(keyword)
      ).length;
      
      const keywordScore = (englishMatches + arabicMatches * 1.1) / sectorKeywords.primary.length;
      score += keywordScore * 0.3;
    }
    
    return Math.min(score, 1);
  }

  // Calculate language compatibility score
  private calculateLanguageMatch(profile: UAEMatchingProfile, jobReq: UAEJobRequirement): number {
    const profLang = profile.languageCapabilities;
    const jobLang = jobReq.languageRequirements;
    
    let score = 0;
    
    // Arabic requirement matching
    if (jobLang.arabicRequired) {
      const arabicProficiency = this.getLanguageProficiencyScore(profLang.arabic);
      score += arabicProficiency * 0.5;
    }
    
    // English requirement matching
    if (jobLang.englishRequired) {
      const englishProficiency = this.getLanguageProficiencyScore(profLang.english);
      score += englishProficiency * 0.5;
    }
    
    // Preferred language alignment
    if (profLang.preferredLanguage === jobLang.preferredLanguage || 
        profLang.preferredLanguage === 'bilingual') {
      score += 0.2;
    }
    
    // Cultural communication bonus
    score += profLang.culturalCommunication * 0.3;
    
    return Math.min(score, 1);
  }

  // Calculate training format compatibility
  private calculateFormatMatch(profile: UAEMatchingProfile, jobReq: UAEJobRequirement): number {
    const canDeliverFormat = profile.trainingFormatPreferences.includes(jobReq.trainingFormat);
    let score = canDeliverFormat ? 0.8 : 0.2;
    
    // Bonus for UAE-specific format expertise
    if (jobReq.trainingFormat === TrainingFormat.IN_PERSON_UAE && 
        profile.uaeExperience >= UAEExperienceLevel.EXPERIENCED_EXPAT) {
      score += 0.2;
    }
    
    return Math.min(score, 1);
  }

  // Calculate cultural fit score
  private calculateCulturalMatch(profile: UAEMatchingProfile, jobReq: UAEJobRequirement): number {
    let score = profile.culturalFit;
    
    // UAE experience bonus
    score += (profile.uaeExperience / 5) * 0.3;
    
    // Company type alignment
    if (jobReq.uaeContext.companyType === 'government' && profile.uaeExperience >= UAEExperienceLevel.EXPERIENCED_EXPAT) {
      score += 0.2;
    }
    
    return Math.min(score, 1);
  }

  // Helper methods for analysis
  private identifyUAESectors(profile: ProfessionalProfile): UAESector[] {
    const sectors: UAESector[] = [];
    const profileText = `${profile.title} ${profile.bio} ${profile.industryFocus}`.toLowerCase();
    
    for (const [sector, keywords] of Object.entries(UAE_SECTOR_KEYWORDS)) {
      const hasKeywords = keywords.primary.some(keyword => 
        profileText.includes(keyword.toLowerCase())
      );
      if (hasKeywords) {
        sectors.push(sector as UAESector);
      }
    }
    
    return sectors;
  }

  private assessLanguageCapabilities(profile: ProfessionalProfile): LanguageCapability {
    const profileText = `${profile.title} ${profile.bio}`.toLowerCase();
    
    // Simple language detection (can be enhanced with proper NLP)
    const hasArabic = /[\u0600-\u06FF]/.test(profileText);
    const mentionsArabic = profileText.includes('arabic') || profileText.includes('عربي');
    const mentionsBilingual = profileText.includes('bilingual') || profileText.includes('multilingual');
    
    return {
      arabic: hasArabic || mentionsArabic ? 'fluent' : 'basic',
      english: 'fluent', // Assume English proficiency for platform users
      preferredLanguage: mentionsBilingual ? 'bilingual' : 'english',
      culturalCommunication: hasArabic || mentionsArabic ? 0.8 : 0.5
    };
  }

  private extractFormatPreferences(profile: ProfessionalProfile): TrainingFormat[] {
    const formats: TrainingFormat[] = [];
    const profileText = `${profile.title} ${profile.bio}`.toLowerCase();
    
    if (profileText.includes('online') || profileText.includes('virtual')) {
      formats.push(TrainingFormat.VIRTUAL_UAE_TIMEZONE);
    }
    if (profileText.includes('in-person') || profileText.includes('face-to-face')) {
      formats.push(TrainingFormat.IN_PERSON_UAE);
    }
    if (profileText.includes('hybrid') || profileText.includes('blended')) {
      formats.push(TrainingFormat.HYBRID_UAE);
    }
    if (profileText.includes('workshop') || profileText.includes('seminar')) {
      formats.push(TrainingFormat.WORKSHOP_BASED);
    }
    
    return formats.length > 0 ? formats : [TrainingFormat.VIRTUAL_UAE_TIMEZONE]; // Default
  }

  private assessUAEExperience(profile: ProfessionalProfile): UAEExperienceLevel {
    const profileText = `${profile.title} ${profile.bio} ${profile.location}`.toLowerCase();
    
    if (profileText.includes('uae') || profileText.includes('dubai') || profileText.includes('abu dhabi')) {
      if (profileText.includes('years') && profileText.includes('uae')) {
        return UAEExperienceLevel.LONG_TERM_RESIDENT;
      }
      return UAEExperienceLevel.EXPERIENCED_EXPAT;
    }
    
    return UAEExperienceLevel.REMOTE_ONLY;
  }

  private assessCulturalFit(profile: ProfessionalProfile): number {
    const profileText = `${profile.title} ${profile.bio}`.toLowerCase();
    let score = 0.5; // Base score
    
    // Cultural awareness indicators
    if (profileText.includes('cultural') || profileText.includes('cross-cultural')) score += 0.2;
    if (profileText.includes('international') || profileText.includes('multicultural')) score += 0.1;
    if (profileText.includes('middle east') || profileText.includes('gulf')) score += 0.2;
    
    return Math.min(score, 1);
  }

  private identifyJobSector(job: JobPosting): UAESector {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    
    for (const [sector, keywords] of Object.entries(UAE_SECTOR_KEYWORDS)) {
      const hasKeywords = keywords.primary.some(keyword => 
        jobText.includes(keyword.toLowerCase())
      );
      if (hasKeywords) {
        return sector as UAESector;
      }
    }
    
    return UAESector.TECHNOLOGY; // Default sector
  }

  private extractLanguageRequirements(job: JobPosting): LanguageRequirement {
    const jobText = `${job.title} ${job.description} ${job.requirements}`.toLowerCase();
    
    return {
      arabicRequired: jobText.includes('arabic') || jobText.includes('عربي'),
      englishRequired: true, // Default for most positions
      preferredLanguage: jobText.includes('bilingual') ? 'bilingual' : 'english',
      formalityLevel: jobText.includes('government') || jobText.includes('formal') ? 'formal' : 'business'
    };
  }

  private determineOptimalFormat(job: JobPosting): TrainingFormat {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    
    if (jobText.includes('remote') || jobText.includes('virtual')) {
      return TrainingFormat.VIRTUAL_UAE_TIMEZONE;
    }
    if (jobText.includes('hybrid')) {
      return TrainingFormat.HYBRID_UAE;
    }
    if (jobText.includes('workshop')) {
      return TrainingFormat.WORKSHOP_BASED;
    }
    
    return TrainingFormat.IN_PERSON_UAE; // Default for UAE market
  }

  private buildUAEContext(job: JobPosting, context?: Partial<UAEBusinessContext>): UAEBusinessContext {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    
    return {
      emirate: context?.emirate || (jobText.includes('dubai') ? 'dubai' : 'abu_dhabi'),
      companyType: context?.companyType || (jobText.includes('government') ? 'government' : 'multinational'),
      culturalSensitivity: context?.culturalSensitivity || 0.7,
      complianceRequirements: context?.complianceRequirements || []
    };
  }

  private assessUrgency(job: JobPosting): 'low' | 'medium' | 'high' {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    
    if (jobText.includes('urgent') || jobText.includes('asap') || jobText.includes('immediate')) {
      return 'high';
    }
    if (jobText.includes('soon') || jobText.includes('quick')) {
      return 'medium';
    }
    
    return 'low';
  }

  private getLanguageProficiencyScore(level: string): number {
    switch (level) {
      case 'native': return 1.0;
      case 'fluent': return 0.9;
      case 'conversational': return 0.7;
      case 'basic': return 0.4;
      default: return 0.1;
    }
  }

  private generateUAERecommendations(
    profile: UAEMatchingProfile,
    jobReq: UAEJobRequirement,
    scores: { sectorScore: number; languageScore: number; formatScore: number; culturalScore: number }
  ): string[] {
    const recommendations: string[] = [];
    
    if (scores.sectorScore < 0.5) {
      recommendations.push(`Consider gaining more experience in ${jobReq.targetSector} sector specific to UAE market`);
    }
    
    if (scores.languageScore < 0.6) {
      if (jobReq.languageRequirements.arabicRequired && profile.languageCapabilities.arabic === 'basic') {
        recommendations.push("Improve Arabic language skills for better market fit in UAE");
      }
    }
    
    if (scores.formatScore < 0.5) {
      recommendations.push(`Develop expertise in ${jobReq.trainingFormat} training delivery method`);
    }
    
    if (scores.culturalScore < 0.6) {
      recommendations.push("Gain more experience with UAE business culture and practices");
    }
    
    // Positive recommendations
    if (scores.sectorScore > 0.8) {
      recommendations.push(`Excellent sector expertise in ${jobReq.targetSector} - highlight this in your proposal`);
    }
    
    return recommendations;
  }

  // Fallback matching when AI is unavailable
  private fallbackUAEMatching(profile: ProfessionalProfile, job: JobPosting) {
    return {
      overallScore: 0.5,
      sectorScore: 0.5,
      languageScore: 0.5,
      formatScore: 0.5,
      culturalScore: 0.5,
      recommendations: ["Basic matching used - consider providing more detailed profile information"]
    };
  }
}

// Export the enhanced matching engine
export const uaeMatchingEngine = new UAEAIMatchingEngine();