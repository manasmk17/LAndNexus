
import OpenAI from 'openai';
import similarity from 'similarity';
import type { JobPosting, ProfessionalProfile } from '@shared/schema';

// Initialize OpenAI only if API key is available
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI();
  }
} catch (error) {
  console.warn("OpenAI client initialization failed. AI matching features will be disabled.");
}

export async function generateJobEmbedding(job: JobPosting): Promise<number[] | null> {
  if (!openai) {
    console.warn("OpenAI client not available. Cannot generate job embedding.");
    return null;
  }
  
  try {
    const jobText = `${job.title} ${job.description} ${job.requirements}`;
    const response = await openai.embeddings.create({
      input: jobText,
      model: "text-embedding-ada-002"
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating job embedding:", error);
    return null;
  }
}

export async function generateProfileEmbedding(profile: ProfessionalProfile): Promise<number[] | null> {
  if (!openai) {
    console.warn("OpenAI client not available. Cannot generate profile embedding.");
    return null;
  }
  
  try {
    const profileText = `${profile.title} ${profile.bio}`;
    const response = await openai.embeddings.create({
      input: profileText,
      model: "text-embedding-ada-002"
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating profile embedding:", error);
    return null;
  }
}

export function calculateMatchScore(jobEmbedding: number[] | null, profileEmbedding: number[] | null): number {
  // If either embedding is null, return 0 (no match)
  if (!jobEmbedding || !profileEmbedding) {
    return 0;
  }
  
  try {
    // The similarity module might have type issues, but we know it works with arrays of numbers
    return similarity(jobEmbedding, profileEmbedding) as number;
  } catch (error) {
    console.error("Error calculating match score:", error);
    return 0;
  }
}
