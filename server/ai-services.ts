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

// Fallback scoring method when AI is not available
function fallbackMatchScore(profile: ProfessionalProfile, job: JobPosting): number {
  let score = 0;
  
  // Title match
  if (profile.title && job.title) {
    const profileTitle = profile.title.toLowerCase();
    const jobTitle = job.title.toLowerCase();
    if (profileTitle.includes(jobTitle) || jobTitle.includes(profileTitle)) {
      score += 0.3;
    }
  }
  
  // Location match
  if (profile.location && job.location && profile.location === job.location) {
    score += 0.2;
  }
  
  // Remote work preference
  if (job.remote) {
    score += 0.1;
  }
  
  // Industry match
  if (profile.industryFocus && job.description) {
    const industry = profile.industryFocus.toLowerCase();
    const description = job.description.toLowerCase();
    if (description.includes(industry)) {
      score += 0.2;
    }
  }
  
  // Rate within compensation range
  if (profile.ratePerHour && job.minCompensation && job.maxCompensation) {
    if (profile.ratePerHour >= job.minCompensation && profile.ratePerHour <= job.maxCompensation) {
      score += 0.2;
    }
  }
  
  return Math.min(score, 1.0);
}