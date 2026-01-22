
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export interface InsightResult {
  pitch: string;
  nearbyPoints: string[];
  vibe: string;
  sources: { title: string; uri: string }[];
}

export const getPropertyInsights = async (propertyName: string, location: string): Promise<InsightResult | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for information about the neighborhood of "${propertyName}" at "${location}". 
      Provide:
      1. A short, catchy sales pitch for this stay.
      2. 3 specific nearby points of interest (parks, famous cafes, malls, or transit hubs).
      3. A summary of the neighborhood vibe (e.g., safety, quietness, or accessibility).
      
      Format your response exactly like this:
      PITCH: [Your pitch here]
      POINTS: [Point 1], [Point 2], [Point 3]
      VIBE: [Your vibe summary here]`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    
    // Manual parsing since JSON schema isn't allowed with Google Search tool
    const pitchMatch = text.match(/PITCH:\s*(.*)/i);
    const pointsMatch = text.match(/POINTS:\s*(.*)/i);
    const vibeMatch = text.match(/VIBE:\s*(.*)/i);

    const pitch = pitchMatch ? pitchMatch[1].trim() : "Discover a comfortable stay in a prime location.";
    const nearbyPoints = pointsMatch ? pointsMatch[1].split(',').map(s => s.trim()).filter(s => s) : [];
    const vibe = vibeMatch ? vibeMatch[1].trim() : "Convenient and accessible neighborhood.";

    // Extract grounding sources
    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          sources.push({
            title: chunk.web.title || "Reference Source",
            uri: chunk.web.uri
          });
        }
      });
    }

    // De-duplicate sources
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return { pitch, nearbyPoints, vibe, sources: uniqueSources };
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return null;
  }
};

export const searchPropertiesSmart = async (query: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user is searching for a rental with this query: "${query}". Extract the key requirements: property type (PG, Hostel, Apartment, Room), maximum budget, and preferred area if mentioned. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            maxBudget: { type: Type.NUMBER },
            area: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return null;
  }
};
