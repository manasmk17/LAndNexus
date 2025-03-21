
import OpenAI from 'openai';
import type { ProfessionalProfile, Expertise } from '@shared/schema';

const openai = new OpenAI();

interface CareerRecommendation {
  role: string;
  description: string;
  requiredSkills: string[];
  courses: Array<{
    name: string;
    provider: string;
    description: string;
  }>;
  marketDemand: string;
  estimatedSalary: string;
}

export async function generateCareerRecommendations(
  profile: ProfessionalProfile,
  expertise: Expertise[]
): Promise<CareerRecommendation[]> {
  const prompt = `Given an L&D professional with the following profile:
Title: ${profile.title}
Bio: ${profile.bio}
Expertise: ${expertise.map(e => e.name).join(', ')}

Provide 3 career path recommendations including:
- Suitable role
- Role description
- Required skills
- Recommended courses for upskilling
- Market demand
- Estimated salary range

Format as structured data.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a career advisor specializing in Learning & Development careers."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
  });

  const recommendations = JSON.parse(response.choices[0].message.content);
  return recommendations.careers;
}
