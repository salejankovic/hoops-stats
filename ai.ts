
import { GoogleGenAI, Type } from "@google/genai";
import { GameEntry, GameStats } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const aiService = {
  async analyzePerformance(games: GameEntry[]) {
    const ai = getAI();
    const statsSummary = games.map(g => ({
      opponent: g.opponent,
      pts: g.stats.points,
      reb: g.stats.rebounds,
      ast: g.stats.assists,
      pir: g.stats.indexRating,
      result: g.result
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these basketball game stats and provide 3-4 professional coaching insights. 
      Focus on trends, strengths, and specific areas for improvement.
      Format as a JSON array of objects with "title", "content", and "type" (one of: strength, weakness, trend, advice).
      Data: ${JSON.stringify(statsSummary)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              type: { type: Type.STRING }
            },
            required: ["title", "content", "type"]
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error("AI Analysis failed to parse", e);
      return [];
    }
  },

  async parseVoiceInput(text: string): Promise<Partial<GameEntry> | null> {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract basketball statistics from this description: "${text}". 
      Return a JSON object matching this structure:
      {
        "opponent": string,
        "finalScore": string (e.g. "88:82"),
        "result": "W" or "L",
        "stats": {
          "minutes": number, "points": number, "rebounds": number, "assists": number,
          "steals": number, "blocks": number, "turnovers": number, "fouls": number,
          "twoPtMade": number, "twoPtAtt": number, "threePtMade": number, "threePtAtt": number,
          "ftMade": number, "ftAtt": number, "indexRating": number
        }
      }`,
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("AI Voice parsing failed", e);
      return null;
    }
  }
};
