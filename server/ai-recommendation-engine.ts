import { storage } from "./storage";
import { generateEmbedding, calculateCosineSimilarity } from "./ai-services";
import type { ProfessionalProfile, CompanyProfile, JobPosting } from "@shared/schema";

// UAE-specific sector mappings and training categories
const UAE_SECTORS = {
  TECHNOLOGY: {
    keywords: ['IT', 'software', 'digital transformation', 'cybersecurity', 'data analytics', 'AI', 'blockchain', 'cloud computing'],
    arabicKeywords: ['تكنولوجيا المعلومات', 'البرمجيات', 'التحول الرقمي', 'الأمن السيبراني', 'تحليل البيانات', 'الذكاء الاصطناعي']
  },
  FINANCE: {
    keywords: ['banking', 'finance', 'accounting', 'investment', 'financial planning', 'compliance', 'risk management', 'islamic finance'],
    arabicKeywords: ['البنوك', 'التمويل', 'المحاسبة', 'الاستثمار', 'التخطيط المالي', 'الامتثال', 'إدارة المخاطر', 'التمويل الإسلامي']
  },
  HEALTHCARE: {
    keywords: ['healthcare', 'medical', 'pharmaceutical', 'patient care', 'health management', 'clinical training'],
    arabicKeywords: ['الرعاية الصحية', 'الطبية', 'الصيدلة', 'رعاية المرضى', 'إدارة الصحة']
  },
  OIL_GAS: {
    keywords: ['oil', 'gas', 'energy', 'petroleum', 'drilling', 'refining', 'upstream', 'downstream', 'petrochemicals'],
    arabicKeywords: ['النفط', 'الغاز', 'الطاقة', 'البترول', 'الحفر', 'التكرير', 'البتروكيماويات']
  },
  LEADERSHIP: {
    keywords: ['leadership', 'management', 'executive coaching', 'team building', 'change management', 'strategic planning'],
    arabicKeywords: ['القيادة', 'الإدارة', 'التدريب التنفيذي', 'بناء الفريق', 'إدارة التغيير', 'التخطيط الاستراتيجي']
  },
  HOSPITALITY: {
    keywords: ['hospitality', 'tourism', 'customer service', 'hotel management', 'event management', 'guest relations'],
    arabicKeywords: ['الضيافة', 'السياحة', 'خدمة العملاء', 'إدارة الفنادق', 'إدارة الفعاليات']
  },
  RETAIL: {
    keywords: ['retail', 'sales', 'customer experience', 'merchandising', 'supply chain', 'e-commerce'],
    arabicKeywords: ['التجزئة', 'المبيعات', 'تجربة العملاء', 'التسويق', 'سلسلة التوريد', 'التجارة الإلكترونية']
  }
};

const TRAINING_FORMATS = {
  ONLINE: 'online',
  IN_PERSON: 'in-person',
  HYBRID: 'hybrid'
};

const LANGUAGES = {
  ENGLISH: 'english',
  ARABIC: 'arabic',
  BILINGUAL: 'bilingual'
};

interface TrainingRequirement {
  sector: string;
  trainingType: string;
  preferredLanguage: string;
  format: string;
  experienceLevel: string;
  budget?: number;
  timeframe?: string;
  specificSkills?: string[];
  location?: string;
}

interface MatchingScore {
  professionalId: number;
  score: number;
  reasons: string[];
  sectorMatch: number;
  languageMatch: number;
  formatMatch: number;
  experienceMatch: number;
  locationMatch: number;
  culturalFit: number;
}

export class AIRecommendationEngine {
  private sectorEmbeddings: Map<string, number[]> = new Map();
  private professionalEmbeddings: Map<number, number[]> = new Map();

  async initialize() {
    try {
      console.log("Initializing AI Recommendation Engine...");
      await this.precomputeSectorEmbeddings();
      await this.precomputeProfessionalEmbeddings();
      console.log("AI Recommendation Engine initialized successfully");
    } catch (error) {
      console.error("Error initializing AI Recommendation Engine:", error);
      // Continue without crashing the server
    }
  }

  private async precomputeSectorEmbeddings() {
    try {
      for (const [sector, data] of Object.entries(UAE_SECTORS)) {
        const sectorText = `${data.keywords.join(' ')} ${data.arabicKeywords.join(' ')}`;
        const embedding = await generateEmbedding(sectorText);
        if (embedding) {
          this.sectorEmbeddings.set(sector, embedding);
        }
      }
    } catch (error) {
      console.log("Using fallback keyword-based sector matching");
      // Continue without embeddings - use keyword-based matching
    }
  }

  private async precomputeProfessionalEmbeddings() {
    try {
      const professionals = await storage.getAllProfessionalProfiles();
      
      for (const professional of professionals) {
        const expertise = await storage.getProfessionalExpertise(professional.id);
        const certifications = await storage.getProfessionalCertifications(professional.id);
        
        const professionalText = this.buildProfessionalText(professional, expertise, certifications);
        const embedding = await generateEmbedding(professionalText);
        
        if (embedding) {
          this.professionalEmbeddings.set(professional.id, embedding);
        }
      }
    } catch (error) {
      console.log("Using fallback rule-based professional matching");
      // Continue without embeddings - use rule-based matching
    }
  }

  private buildProfessionalText(professional: any, expertise: any[], certifications: any[]): string {
    const parts = [
      professional.title || '',
      professional.bio || '',
      professional.services || '',
      professional.location || '',
      expertise.map(e => e.name).join(' '),
      certifications.map(c => `${c.name} ${c.issuer}`).join(' '),
      `${professional.yearsExperience} years experience`
    ];
    
    return parts.filter(Boolean).join(' ');
  }

  async findRecommendedTrainers(requirement: TrainingRequirement, limit: number = 10): Promise<MatchingScore[]> {
    console.log("Finding recommended trainers for requirement:", requirement);
    
    const professionals = await storage.getAllProfessionalProfiles();
    const scores: MatchingScore[] = [];

    // Generate requirement embedding
    const requirementText = this.buildRequirementText(requirement);
    const requirementEmbedding = await generateEmbedding(requirementText);

    for (const professional of professionals) {
      const score = await this.calculateMatchingScore(professional, requirement, requirementEmbedding);
      if (score.score > 0.3) { // Minimum threshold
        scores.push(score);
      }
    }

    // Sort by score and apply UAE-specific cultural preferences
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(score => this.enhanceWithCulturalFit(score, requirement));
  }

  private buildRequirementText(requirement: TrainingRequirement): string {
    const sectorKeywords = UAE_SECTORS[requirement.sector as keyof typeof UAE_SECTORS];
    const keywords = sectorKeywords ? 
      [...sectorKeywords.keywords, ...sectorKeywords.arabicKeywords].join(' ') : '';
    
    return [
      requirement.trainingType,
      keywords,
      requirement.preferredLanguage,
      requirement.format,
      requirement.experienceLevel,
      requirement.specificSkills?.join(' ') || '',
      requirement.location || ''
    ].filter(Boolean).join(' ');
  }

  private async calculateMatchingScore(
    professional: any, 
    requirement: TrainingRequirement, 
    requirementEmbedding: number[] | null
  ): Promise<MatchingScore> {
    const professionalEmbedding = this.professionalEmbeddings.get(professional.id);
    
    // Semantic similarity score (if embeddings available)
    let semanticScore = 0;
    if (requirementEmbedding && professionalEmbedding) {
      semanticScore = calculateCosineSimilarity(requirementEmbedding, professionalEmbedding);
    } else {
      // Fallback: enhanced keyword-based semantic matching
      semanticScore = this.calculateKeywordSimilarity(professional, requirement);
    }

    // Individual component scores
    const sectorMatch = this.calculateSectorMatch(professional, requirement);
    const languageMatch = this.calculateLanguageMatch(professional, requirement);
    const formatMatch = this.calculateFormatMatch(professional, requirement);
    const experienceMatch = this.calculateExperienceMatch(professional, requirement);
    const locationMatch = this.calculateLocationMatch(professional, requirement);
    const culturalFit = this.calculateCulturalFit(professional, requirement);

    // Weighted composite score optimized for UAE market
    const weights = professionalEmbedding ? 
      // With AI embeddings
      {
        semantic: 0.25,
        sector: 0.20,
        language: 0.15,
        format: 0.10,
        experience: 0.15,
        location: 0.10,
        cultural: 0.05
      } :
      // Fallback weights (more emphasis on rule-based matching)
      {
        semantic: 0.15,
        sector: 0.25,
        language: 0.20,
        format: 0.10,
        experience: 0.15,
        location: 0.10,
        cultural: 0.05
      };

    const compositeScore = (
      semanticScore * weights.semantic +
      sectorMatch * weights.sector +
      languageMatch * weights.language +
      formatMatch * weights.format +
      experienceMatch * weights.experience +
      locationMatch * weights.location +
      culturalFit * weights.cultural
    );

    const reasons = this.generateMatchingReasons(
      sectorMatch, languageMatch, formatMatch, experienceMatch, locationMatch, culturalFit
    );

    return {
      professionalId: professional.id,
      score: Math.min(compositeScore, 1.0),
      reasons,
      sectorMatch,
      languageMatch,
      formatMatch,
      experienceMatch,
      locationMatch,
      culturalFit
    };
  }

  private calculateKeywordSimilarity(professional: any, requirement: TrainingRequirement): number {
    const professionalText = this.buildProfessionalText(professional, [], []).toLowerCase();
    const requirementText = this.buildRequirementText(requirement).toLowerCase();
    
    // Extract keywords from requirement
    const requirementWords = requirementText.split(/\s+/).filter(word => word.length > 3);
    const professionalWords = professionalText.split(/\s+/);
    
    let matches = 0;
    let totalWords = requirementWords.length;
    
    for (const reqWord of requirementWords) {
      if (professionalWords.some(profWord => 
        profWord.includes(reqWord) || reqWord.includes(profWord)
      )) {
        matches++;
      }
    }
    
    // Add sector-specific keyword bonuses
    const sectorData = UAE_SECTORS[requirement.sector as keyof typeof UAE_SECTORS];
    if (sectorData) {
      const sectorKeywords = [...sectorData.keywords, ...sectorData.arabicKeywords];
      for (const keyword of sectorKeywords) {
        if (professionalText.includes(keyword.toLowerCase())) {
          matches += 0.5; // Bonus for sector keywords
        }
      }
      totalWords += sectorKeywords.length * 0.5;
    }
    
    return totalWords > 0 ? Math.min(matches / totalWords, 1.0) : 0;
  }

  private calculateSectorMatch(professional: any, requirement: TrainingRequirement): number {
    const sectorData = UAE_SECTORS[requirement.sector as keyof typeof UAE_SECTORS];
    if (!sectorData) return 0;

    const professionalText = `${professional.title} ${professional.bio} ${professional.services}`.toLowerCase();
    const allKeywords = [...sectorData.keywords, ...sectorData.arabicKeywords];
    
    let matches = 0;
    for (const keyword of allKeywords) {
      if (professionalText.includes(keyword.toLowerCase())) {
        matches++;
      }
    }
    
    return Math.min(matches / allKeywords.length * 2, 1.0);
  }

  private calculateLanguageMatch(professional: any, requirement: TrainingRequirement): number {
    const professionalText = `${professional.bio} ${professional.services}`.toLowerCase();
    
    switch (requirement.preferredLanguage) {
      case LANGUAGES.ENGLISH:
        return professionalText.includes('english') || 
               !professionalText.includes('arabic') ? 1.0 : 0.7;
      
      case LANGUAGES.ARABIC:
        return professionalText.includes('arabic') || 
               professionalText.includes('عربي') ? 1.0 : 0.3;
      
      case LANGUAGES.BILINGUAL:
        const hasEnglish = professionalText.includes('english') || 
                          !professionalText.includes('arabic');
        const hasArabic = professionalText.includes('arabic') || 
                         professionalText.includes('عربي');
        return hasEnglish && hasArabic ? 1.0 : (hasEnglish || hasArabic ? 0.8 : 0.5);
      
      default:
        return 0.8;
    }
  }

  private calculateFormatMatch(professional: any, requirement: TrainingRequirement): number {
    const professionalText = `${professional.bio} ${professional.services}`.toLowerCase();
    
    switch (requirement.format) {
      case TRAINING_FORMATS.ONLINE:
        return professionalText.includes('online') || 
               professionalText.includes('virtual') || 
               professionalText.includes('remote') ? 1.0 : 0.7;
      
      case TRAINING_FORMATS.IN_PERSON:
        return professionalText.includes('in-person') || 
               professionalText.includes('face-to-face') || 
               professional.location ? 1.0 : 0.8;
      
      case TRAINING_FORMATS.HYBRID:
        const hasOnline = professionalText.includes('online') || 
                         professionalText.includes('virtual');
        const hasInPerson = professionalText.includes('in-person') || 
                           professional.location;
        return hasOnline && hasInPerson ? 1.0 : 0.9;
      
      default:
        return 0.8;
    }
  }

  private calculateExperienceMatch(professional: any, requirement: TrainingRequirement): number {
    const requiredYears = this.parseExperienceLevel(requirement.experienceLevel);
    const professionalYears = professional.yearsExperience || 0;
    
    if (professionalYears >= requiredYears) {
      // Bonus for significantly more experience, but diminishing returns
      const bonus = Math.min((professionalYears - requiredYears) * 0.1, 0.2);
      return Math.min(1.0 + bonus, 1.0);
    } else {
      // Penalty for insufficient experience
      return Math.max(professionalYears / requiredYears, 0.3);
    }
  }

  private parseExperienceLevel(level: string): number {
    switch (level.toLowerCase()) {
      case 'entry': return 1;
      case 'junior': return 2;
      case 'mid': case 'intermediate': return 5;
      case 'senior': return 8;
      case 'executive': case 'expert': return 12;
      default: return 3;
    }
  }

  private calculateLocationMatch(professional: any, requirement: TrainingRequirement): number {
    if (!requirement.location || !professional.location) return 0.8;
    
    const professionalLocation = professional.location.toLowerCase();
    const requiredLocation = requirement.location.toLowerCase();
    
    // UAE-specific location matching
    const uaeLocations = ['dubai', 'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 'fujairah', 'umm al quwain'];
    const professionalInUAE = uaeLocations.some(loc => professionalLocation.includes(loc));
    const requirementInUAE = uaeLocations.some(loc => requiredLocation.includes(loc));
    
    if (professionalLocation.includes(requiredLocation) || 
        requiredLocation.includes(professionalLocation)) {
      return 1.0;
    }
    
    if (professionalInUAE && requirementInUAE) {
      return 0.9; // Both in UAE, different emirates
    }
    
    if (professionalInUAE || requirementInUAE) {
      return 0.7; // One in UAE, one outside
    }
    
    return 0.6; // Both outside UAE
  }

  private calculateCulturalFit(professional: any, requirement: TrainingRequirement): number {
    const professionalText = `${professional.bio} ${professional.services}`.toLowerCase();
    
    // UAE cultural indicators
    const culturalKeywords = [
      'uae', 'emirates', 'middle east', 'gcc', 'arab', 'islamic',
      'multicultural', 'diverse', 'international', 'cross-cultural'
    ];
    
    let culturalScore = 0.5; // Base score
    
    for (const keyword of culturalKeywords) {
      if (professionalText.includes(keyword)) {
        culturalScore += 0.1;
      }
    }
    
    // Bonus for UAE-specific certifications or experience
    if (professionalText.includes('uae') || professionalText.includes('emirates')) {
      culturalScore += 0.2;
    }
    
    return Math.min(culturalScore, 1.0);
  }

  private generateMatchingReasons(
    sectorMatch: number, languageMatch: number, formatMatch: number, 
    experienceMatch: number, locationMatch: number, culturalFit: number
  ): string[] {
    const reasons = [];
    
    if (sectorMatch > 0.8) reasons.push("Strong sector expertise match");
    if (languageMatch > 0.9) reasons.push("Perfect language capability");
    if (formatMatch > 0.8) reasons.push("Preferred training format available");
    if (experienceMatch > 0.9) reasons.push("Extensive relevant experience");
    if (locationMatch > 0.8) reasons.push("Optimal geographic location");
    if (culturalFit > 0.7) reasons.push("Excellent cultural fit for UAE market");
    
    return reasons;
  }

  private enhanceWithCulturalFit(score: MatchingScore, requirement: TrainingRequirement): MatchingScore {
    // Apply UAE-specific cultural enhancement
    if (score.culturalFit > 0.8 && score.locationMatch > 0.8) {
      score.score = Math.min(score.score * 1.1, 1.0);
      score.reasons.push("Premium UAE cultural and location alignment");
    }
    
    return score;
  }

  async learnFromFeedback(
    professionalId: number, 
    companyId: number, 
    bookingSuccess: boolean, 
    rating?: number, 
    feedback?: string
  ) {
    // Store feedback for continuous learning
    const feedbackData = {
      professionalId,
      companyId,
      bookingSuccess,
      rating,
      feedback,
      timestamp: new Date()
    };
    
    // In a production system, this would update ML model weights
    console.log("Learning from feedback:", feedbackData);
    
    // Update professional embeddings if significant feedback
    if (rating !== undefined && (rating >= 4 || rating <= 2)) {
      await this.updateProfessionalEmbedding(professionalId);
    }
  }

  private async updateProfessionalEmbedding(professionalId: number) {
    const professional = await storage.getProfessionalProfile(professionalId);
    if (professional) {
      const expertise = await storage.getProfessionalExpertise(professionalId);
      const certifications = await storage.getProfessionalCertifications(professionalId);
      
      const professionalText = this.buildProfessionalText(professional, expertise, certifications);
      const embedding = await generateEmbedding(professionalText);
      
      if (embedding) {
        this.professionalEmbeddings.set(professionalId, embedding);
      }
    }
  }

  async getRealtimeRecommendations(partialRequirement: Partial<TrainingRequirement>): Promise<MatchingScore[]> {
    // Provide real-time suggestions as user fills onboarding form
    const requirement: TrainingRequirement = {
      sector: partialRequirement.sector || 'LEADERSHIP',
      trainingType: partialRequirement.trainingType || 'general',
      preferredLanguage: partialRequirement.preferredLanguage || 'ENGLISH',
      format: partialRequirement.format || 'HYBRID',
      experienceLevel: partialRequirement.experienceLevel || 'intermediate'
    };
    
    return this.findRecommendedTrainers(requirement, 5);
  }
}

// Export singleton instance
export const recommendationEngine = new AIRecommendationEngine();