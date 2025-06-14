import { GoogleGenerativeAI } from "@google/generative-ai";
import type { JobPosting, ProfessionalProfile } from "@shared/schema";

// Initialize Gemini client with API key validation
let gemini: GoogleGenerativeAI | null = null;
let model: any = null;
let apiKeyValid = false;

async function initializeGemini(): Promise<boolean> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Gemini API key not found - AI features disabled");
    return false;
  }

  try {
    gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = gemini.getGenerativeModel({ model: "text-embedding-004" });

    // Test the API key with a minimal request
    await model.embedContent("test");
    apiKeyValid = true;
    console.log("Gemini API key validated successfully");
    return true;
  } catch (error: any) {
    console.error("Gemini API key validation failed:", error.message);
    apiKeyValid = false;
    gemini = null;
    model = null;
    return false;
  }
}

// Initialize on startup
initializeGemini();

// Generates text embeddings using Gemini's embedding model
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    if (!apiKeyValid || !model) {
      console.warn("Gemini API not available - embedding generation disabled");
      return null;
    }

    if (!text || text.trim().length === 0) {
      console.warn("Cannot generate embedding for empty text");
      return null;
    }

    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error: any) {
    console.error("Error generating embedding:", error.message);
    if (error.message.includes("API_KEY_INVALID") || error.message.includes("401")) {
      console.error("Gemini API key is invalid or expired");
      apiKeyValid = false;
      gemini = null;
      model = null;
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
      console.log("Using fallback matching algorithm (Gemini not available)");
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
  let totalScore = 0;
  let components = {
    title: 0,
    skills: 0,
    experience: 0,
    location: 0,
    industry: 0
  };

  // Enhanced title matching (35% weight)
  if (profile.title && job.title) {
    const profileTitle = profile.title.toLowerCase().trim();
    const jobTitle = job.title.toLowerCase().trim();

    // Exact match
    if (profileTitle === jobTitle) {
      components.title = 0.35;
    }
    // High similarity for L&D roles
    else if (profileTitle.includes('learning') && jobTitle.includes('learning')) {
      components.title = 0.30;
    }
    else if (profileTitle.includes('development') && jobTitle.includes('development')) {
      components.title = 0.28;
    }
    // Contains match
    else if (profileTitle.includes(jobTitle) || jobTitle.includes(profileTitle)) {
      components.title = 0.25;
    }
    // Keyword overlap with better scoring
    else {
      const profileWords = profileTitle.split(/\s+/).filter(w => w.length > 2);
      const jobWords = jobTitle.split(/\s+/).filter(w => w.length > 2);
      const commonWords = profileWords.filter(word => 
        jobWords.some(jWord => jWord.includes(word) || word.includes(jWord))
      );
      if (commonWords.length > 0) {
        const overlap = commonWords.length / Math.max(profileWords.length, jobWords.length);
        components.title = 0.15 * overlap;
      }
    }
  }

  // Enhanced skills and experience matching (30% weight)
  if (profile.bio && job.description) {
    const profileText = profile.bio.toLowerCase();
    const jobText = (job.description + ' ' + (job.requirements || '')).toLowerCase();

    // L&D specific keywords with weights
    const ldKeywords = [
      { word: 'learning', weight: 1.0 },
      { word: 'development', weight: 1.0 },
      { word: 'training', weight: 0.9 },
      { word: 'coaching', weight: 0.8 },
      { word: 'mentoring', weight: 0.8 },
      { word: 'leadership', weight: 0.7 },
      { word: 'management', weight: 0.6 },
      { word: 'strategy', weight: 0.5 },
      { word: 'curriculum', weight: 0.9 },
      { word: 'instructional', weight: 0.9 },
      { word: 'facilitation', weight: 0.8 },
      { word: 'workshop', weight: 0.7 }
    ];

    let skillScore = 0;
    let maxSkillScore = 0;

    for (const { word, weight } of ldKeywords) {
      maxSkillScore += weight;
      if (profileText.includes(word) && jobText.includes(word)) {
        skillScore += weight;
      }
    }

    if (maxSkillScore > 0) {
      components.skills = 0.30 * (skillScore / maxSkillScore);
    }
  }

  // Experience level matching (20% weight)
  if (profile.yearsExperience && job.requirements) {
    const jobReqs = job.requirements.toLowerCase();
    const years = profile.yearsExperience;

    // Extract experience requirements from job
    let requiredYears = 0;
    const experienceMatch = jobReqs.match(/(\d+)\s*(?:\+)?\s*years?\s*(?:of\s*)?experience/i);
    if (experienceMatch) {
      requiredYears = parseInt(experienceMatch[1]);
    }

    if (requiredYears > 0) {
      if (years >= requiredYears) {
        // Perfect match or overqualified
        components.experience = 0.20;
      } else if (years >= requiredYears * 0.8) {
        // Close match
        components.experience = 0.15;
      } else if (years >= requiredYears * 0.6) {
        // Reasonable match
        components.experience = 0.10;
      }
    } else {
      // No specific requirement, give moderate score based on general experience
      if (years >= 5) components.experience = 0.15;
      else if (years >= 2) components.experience = 0.10;
      else components.experience = 0.05;
    }
  }

  // Location matching (10% weight)
  if (profile.location && job.location) {
    const profLocation = profile.location.toLowerCase().trim();
    const jobLocation = job.location.toLowerCase().trim();

    if (profLocation === jobLocation) {
      components.location = 0.10;
    } else if (profLocation.includes('remote') || jobLocation.includes('remote')) {
      components.location = 0.08;
    } else if (profLocation.includes(jobLocation) || jobLocation.includes(profLocation)) {
      components.location = 0.06;
    }
  }

  // Industry matching (5% weight)
  if (profile.industryFocus && job.description) {
    const industry = profile.industryFocus.toLowerCase();
    const description = job.description.toLowerCase();
    if (description.includes(industry)) {
      components.industry = 0.05;
    }
  }

  // Calculate total score
  totalScore = components.title + components.skills + components.experience + components.location + components.industry;

  // Add some variance to make scores more realistic (±5%)
  const variance = (Math.random() - 0.5) * 0.1;
  totalScore += variance;

  // Ensure score is between 0.15 and 0.95 for realistic matching
  const finalScore = Math.max(0.15, Math.min(0.95, totalScore));

  console.log(`Detailed match breakdown: Title: ${(components.title*100).toFixed(1)}%, Skills: ${(components.skills*100).toFixed(1)}%, Experience: ${(components.experience*100).toFixed(1)}%, Location: ${(components.location*100).toFixed(1)}%, Industry: ${(components.industry*100).toFixed(1)}%, Final: ${(finalScore*100).toFixed(1)}%`);

  return finalScore;
}