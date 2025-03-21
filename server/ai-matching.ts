
import OpenAI from 'openai';
import { similarity } from 'similarity';
import type { JobPosting, ProfessionalProfile } from '@shared/schema';

const openai = new OpenAI();

export async function generateJobEmbedding(job: JobPosting) {
  const jobText = `${job.title} ${job.description} ${job.requirements}`;
  const response = await openai.embeddings.create({
    input: jobText,
    model: "text-embedding-ada-002"
  });
  return response.data[0].embedding;
}

export async function generateProfileEmbedding(profile: ProfessionalProfile) {
  const profileText = `${profile.title} ${profile.bio}`;
  const response = await openai.embeddings.create({
    input: profileText,
    model: "text-embedding-ada-002"
  });
  return response.data[0].embedding;
}

export function calculateMatchScore(jobEmbedding: number[], profileEmbedding: number[]): number {
  return similarity(jobEmbedding, profileEmbedding);
}
