import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

interface TripInput {
  destination: string;
  days: number;
  budget: string;
  interests: string[];
}

export interface LLMTripResponse {
  itinerary: { day: number; activities: { id: string; description: string }[] }[];
  budget: {
    flights: number;
    accommodation: number;
    food: number;
    activities: number;
    total: number;
  };
  hotels: { name: string; tier: 'Budget' | 'Mid Range' | 'Luxury' }[];
}

export interface LLMRegenerateDayResponse {
  activities: { id: string; description: string }[];
}

export const buildTripPrompt = (input: TripInput): string => {
  return `You are a travel planning assistant. Generate a detailed travel plan for the following trip.

Destination: ${input.destination}
Number of days: ${input.days}
Budget type: ${input.budget}
Interests: ${input.interests.join(', ')}

Respond ONLY with a valid JSON object. No markdown, no explanation, no code blocks. Just raw JSON.

The JSON must follow this exact structure:
{
  "itinerary": [
    {
      "day": 1,
      "activities": [
        { "id": "unique-id-here", "description": "Activity description" }
      ]
    }
  ],
  "budget": {
    "flights": 400,
    "accommodation": 300,
    "food": 150,
    "activities": 100,
    "total": 950
  },
  "hotels": [
    { "name": "Hotel Name", "tier": "Budget" }
  ]
}

Rules:
- Generate exactly ${input.days} days in the itinerary
- Each day should have 3-5 activities relevant to the interests
- Budget numbers must reflect the ${input.budget} budget level and ${input.destination} typical costs
- Suggest 3 hotels: one per tier (Budget, Mid Range, Luxury)
- Activity ids must be unique strings (e.g. "day1-act1")
- tier values must be exactly: "Budget", "Mid Range", or "Luxury"`;
};

export const buildRegenerateDayPrompt = (
  input: TripInput,
  dayNum: number,
  instruction: string,
  existingItinerary: { day: number; activities: { id: string; description: string }[] }[]
): string => {
  const otherDays = existingItinerary
    .filter((d) => d.day !== dayNum)
    .map((d) => `Day ${d.day}: ${d.activities.map((a) => a.description).join(', ')}`)
    .join('\n');

  return `You are a travel planning assistant. Regenerate Day ${dayNum} of a trip to ${input.destination}.

User instruction: "${instruction}"

Activities already planned on OTHER days (do not repeat these):
${otherDays}

Respond ONLY with a valid JSON object. No markdown, no explanation, no code blocks.

{
  "activities": [
    { "id": "unique-id-here", "description": "Activity description" }
  ]
}

Rules:
- Generate 3-5 activities for Day ${dayNum}
- Match the ${input.budget} budget level
- Follow the user instruction: "${instruction}"
- Do NOT repeat any activity already planned on other days
- Activity ids must be unique strings (e.g. "day${dayNum}-act1")`;
};

export const callGemini = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
  });
  return response.text ?? '';
};

export const parseLLMResponse = <T>(raw: string): T => {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned) as T;
};