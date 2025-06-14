import OpenAI from "openai";
import type { JobPosting, ProfessionalProfile } from "@shared/schema";

// Initialize OpenAI client with API key validation
let openai: OpenAI | null = null;
let apiKeyValid = false;

async function initializeOpenAI(): Promise<boolean> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OpenAI API key not found - AI features disabled");
    return false;
  }

  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Test the API key with a minimal request
    await openai.models.list();
    apiKeyValid = true;
    console.log("OpenAI API key validated successfully");
    return true;
  } catch (error: any) {
    console.error("OpenAI API key validation failed:", error.message);
    apiKeyValid = false;
    openai = null;
    return false;
  }
}

// Initialize on startup
initializeOpenAI();

// Generates text embeddings using OpenAI's embedding model
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    if (!apiKeyValid || !openai) {
      console.warn("OpenAI API not available - embedding generation disabled");
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
  } catch (error: any) {
    console.error("Error generating embedding:", error.message);
    if (error.status === 401) {
      console.error("OpenAI API key is invalid or expired");
      apiKeyValid = false;
      openai = null;
    }
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
    console.log(`Calculating match score between "${profile.title || profile.firstName}" and "${job.title}"`);
    
    // Generate embeddings for the profile and job
    const profileEmbedding = await generateProfileEmbedding(profile);
    const jobEmbedding = await generateJobEmbedding(job);
    
    // If embeddings could not be generated, fall back to a simpler method
    if (!profileEmbedding || !jobEmbedding) {
      console.log("Using fallback matching algorithm (OpenAI not available)");
      const fallbackScore = fallbackMatchScore(profile, job);
      console.log(`Fallback score: ${(fallbackScore * 100).toFixed(1)}%`);
      return fallbackScore;
    }
    
    // Calculate cosine similarity between embeddings
    const similarity = calculateCosineSimilarity(profileEmbedding, jobEmbedding);
    console.log(`AI embedding similarity: ${similarity.toFixed(3)}`);
    
    // Normalize similarity to a 0-1 scale (cosine similarity ranges from -1 to 1)
    const aiScore = (similarity + 1) / 2;
    console.log(`AI normalized score: ${(aiScore * 100).toFixed(1)}%`);
    return aiScore;
  } catch (error) {
    console.error("Error calculating match score:", error);
    const fallbackScore = fallbackMatchScore(profile, job);
    console.log(`Error fallback score: ${(fallbackScore * 100).toFixed(1)}%`);
    return fallbackScore;
  }
}

// Enhanced fallback scoring method when AI is not available
function fallbackMatchScore(profile: ProfessionalProfile, job: JobPosting): number {
  let score = 0;
  let maxPossibleScore = 0;
  
  // Title and role matching (40% weight)
  maxPossibleScore += 0.4;
  if (profile.title && job.title) {
    const profileTitle = profile.title.toLowerCase();
    const jobTitle = job.title.toLowerCase();
    
    // Exact match
    if (profileTitle === jobTitle) {
      score += 0.4;
    }
    // Contains match
    else if (profileTitle.includes(jobTitle) || jobTitle.includes(profileTitle)) {
      score += 0.3;
    }
    // Keyword overlap
    else {
      const profileWords = profileTitle.split(/\s+/);
      const jobWords = jobTitle.split(/\s+/);
      const commonWords = profileWords.filter(word => 
        jobWords.some(jWord => jWord.includes(word) || word.includes(jWord))
      );
      if (commonWords.length > 0) {
        score += 0.2 * (commonWords.length / Math.max(profileWords.length, jobWords.length));
      }
    }
  }
  
  // Skills and experience matching (30% weight)
  maxPossibleScore += 0.3;
  if (profile.bio && job.description) {
    const profileText = profile.bio.toLowerCase();
    const jobText = (job.description + ' ' + (job.requirements || '')).toLowerCase();
    
    // Look for common skill keywords
    const skillKeywords = [
      'leadership', 'management', 'training', 'development', 'coaching', 'mentoring',
      'project', 'team', 'communication', 'strategy', 'planning', 'analysis',
      'design', 'implementation', 'evaluation', 'assessment', 'facilitation'
    ];
    
    const profileSkills = skillKeywords.filter(skill => profileText.includes(skill));
    const jobSkills = skillKeywords.filter(skill => jobText.includes(skill));
    const commonSkills = profileSkills.filter(skill => jobSkills.includes(skill));
    
    if (commonSkills.length > 0) {
      score += 0.3 * (commonSkills.length / Math.max(profileSkills.length, jobSkills.length, 1));
    }
  }
  
  // Location compatibility (15% weight)
  maxPossibleScore += 0.15;
  if (job.remote) {
    score += 0.15; // Remote jobs are always compatible
  } else if (profile.location && job.location) {
    if (profile.location.toLowerCase() === job.location.toLowerCase()) {
      score += 0.15;
    } else if (profile.location.toLowerCase().includes(job.location.toLowerCase()) || 
               job.location.toLowerCase().includes(profile.location.toLowerCase())) {
      score += 0.1;
    }
  }
  
  // Compensation alignment (10% weight)
  maxPossibleScore += 0.1;
  if (profile.ratePerHour && job.minCompensation && job.maxCompensation) {
    if (profile.ratePerHour >= job.minCompensation && profile.ratePerHour <= job.maxCompensation) {
      score += 0.1;
    } else if (profile.ratePerHour * 0.9 <= job.maxCompensation && profile.ratePerHour * 1.1 >= job.minCompensation) {
      score += 0.05; // Close range
    }
  }
  
  // Industry alignment (5% weight)
  maxPossibleScore += 0.05;
  if (profile.industryFocus && job.description) {
    const industry = profile.industryFocus.toLowerCase();
    const description = job.description.toLowerCase();
    if (description.includes(industry)) {
      score += 0.05;
    }
  }
  
  // Ensure minimum viable score and normalize
  const normalizedScore = score / maxPossibleScore;
  const minimumScore = 0.2; // 20% minimum for any reasonable match
  
  return Math.max(Math.min(normalizedScore, 1.0), minimumScore);
}