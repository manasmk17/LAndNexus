import OpenAI from "openai";
import type { JobPosting, ProfessionalProfile } from "@shared/schema";

// Initialize OpenAI client with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Generates text embeddings using OpenAI's embedding model
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not found - embedding generation disabled");
      return null;
    }

    if (!text || text.trim().length === 0) {
      console.warn("Cannot generate embedding for empty text");
      return null;
    }

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 256, // Smaller dimension for efficiency
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

// Extracts relevant details from a professional profile for embedding
export async function generateProfileEmbedding(profile: ProfessionalProfile): Promise<number[] | null> {
  try {
    // Create a combined text description from relevant profile fields
    const textToEmbed = [
      profile.title,
      profile.bio,
      profile.industryFocus,
      // Additional fields could be added here as the profile schema evolves
    ]
      .filter(Boolean)
      .join(" | ");

    return await generateEmbedding(textToEmbed);
  } catch (error) {
    console.error("Error generating profile embedding:", error);
    return null;
  }
}

// Extracts relevant details from a job posting for embedding
export async function generateJobEmbedding(job: JobPosting): Promise<number[] | null> {
  try {
    // Create a combined text description from relevant job fields
    const textToEmbed = [
      job.title,
      job.description,
      job.requirements,
      job.jobType,
      job.location,
      // Additional fields could be added here as the job schema evolves
    ]
      .filter(Boolean)
      .join(" | ");

    return await generateEmbedding(textToEmbed);
  } catch (error) {
    console.error("Error generating job embedding:", error);
    return null;
  }
}

// Calculate the cosine similarity between two embeddings
export function calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error("Embeddings must have the same dimensions");
  }
  
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += embedding1[i] * embedding1[i];
    magnitude2 += embedding2[i] * embedding2[i];
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  return dotProduct / (magnitude1 * magnitude2);
}

// Calculate a match score between a job and a professional profile
export async function calculateProfileJobMatchScore(
  profile: ProfessionalProfile, 
  job: JobPosting
): Promise<number> {
  try {
    // Generate embeddings for the profile and job
    const profileEmbedding = await generateProfileEmbedding(profile);
    const jobEmbedding = await generateJobEmbedding(job);
    
    // If embeddings could not be generated, fall back to a simpler method
    if (!profileEmbedding || !jobEmbedding) {
      return fallbackMatchScore(profile, job);
    }
    
    // Calculate cosine similarity between embeddings
    const similarity = calculateCosineSimilarity(profileEmbedding, jobEmbedding);
    
    // Normalize similarity to a 0-1 scale (cosine similarity ranges from -1 to 1)
    return (similarity + 1) / 2;
  } catch (error) {
    console.error("Error calculating match score:", error);
    return fallbackMatchScore(profile, job);
  }
}

// Enhanced fallback scoring method when AI is not available
function fallbackMatchScore(profile: ProfessionalProfile, job: JobPosting): number {
  let score = 0;
  let maxScore = 0;
  
  // Title semantic matching (30% weight)
  if (profile.title && job.title) {
    const titleScore = calculateTextSimilarity(profile.title, job.title);
    score += titleScore * 0.3;
    maxScore += 0.3;
  }
  
  // Bio/description matching (25% weight)
  if (profile.bio && job.description) {
    const bioScore = calculateTextSimilarity(profile.bio, job.description);
    score += bioScore * 0.25;
    maxScore += 0.25;
  }
  
  // Location compatibility (15% weight)
  if (profile.location && job.location) {
    let locationScore = 0;
    if (profile.location.toLowerCase() === job.location.toLowerCase()) {
      locationScore = 1.0;
    } else if (job.location.toLowerCase().includes('remote') || 
               profile.location.toLowerCase().includes('remote')) {
      locationScore = 0.8;
    } else if (job.remote) {
      locationScore = 0.7;
    }
    score += locationScore * 0.15;
    maxScore += 0.15;
  }
  
  // Industry focus alignment (15% weight)
  if (profile.industryFocus && job.description) {
    const industryScore = job.description.toLowerCase()
      .includes(profile.industryFocus.toLowerCase()) ? 1.0 : 0;
    score += industryScore * 0.15;
    maxScore += 0.15;
  }
  
  // Experience level matching (10% weight)
  if (profile.title && job.title) {
    const experienceScore = calculateExperienceAlignment(profile.title, job.title);
    score += experienceScore * 0.1;
    maxScore += 0.1;
  }
  
  // Compensation alignment (5% weight)
  if (profile.ratePerHour && (job.minCompensation || job.maxCompensation)) {
    const compensationScore = calculateCompensationMatch(profile.ratePerHour, job.minCompensation, job.maxCompensation);
    score += compensationScore * 0.05;
    maxScore += 0.05;
  }
  
  // Normalize score and ensure minimum baseline
  const normalizedScore = maxScore > 0 ? score / maxScore : 0;
  return Math.max(0.2, Math.min(1.0, normalizedScore));
}

function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const words2 = text2.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersectionArray = words1.filter(x => set2.has(x));
  
  return intersectionArray.length / Math.max(set1.size, set2.size);
}

function calculateExperienceAlignment(profileTitle: string, jobTitle: string): number {
  const seniorityLevels = {
    'intern': 1, 'junior': 2, 'associate': 3, 'mid': 4, 'senior': 5, 
    'lead': 6, 'principal': 7, 'director': 8, 'vp': 9, 'chief': 10
  };
  
  const getLevel = (title: string) => {
    const lower = title.toLowerCase();
    for (const [level, value] of Object.entries(seniorityLevels)) {
      if (lower.includes(level)) return value;
    }
    return 4; // Default to mid-level
  };
  
  const profileLevel = getLevel(profileTitle);
  const jobLevel = getLevel(jobTitle);
  const levelDiff = Math.abs(profileLevel - jobLevel);
  
  // Perfect match = 1.0, 1 level diff = 0.8, 2 levels = 0.6, etc.
  return Math.max(0, 1 - (levelDiff * 0.2));
}

function calculateCompensationMatch(profileRate: number, minCompensation: number | null, maxCompensation: number | null): number {
  if (!minCompensation && !maxCompensation) return 0.5;
  
  const min = minCompensation || 0;
  const max = maxCompensation || minCompensation || profileRate;
  
  // Check if profile rate falls within range
  if (profileRate >= min && profileRate <= max) {
    return 1.0; // Perfect match
  } else if (profileRate < min) {
    // Profile rate is below range
    const ratio = profileRate / min;
    return Math.max(0.1, ratio);
  } else {
    // Profile rate is above range
    const ratio = max / profileRate;
    return Math.max(0.1, ratio);
  }
}