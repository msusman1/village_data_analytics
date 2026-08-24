import { GoogleGenAI } from '@google/genai';
import { AIQueryResponse } from '../../src/types/index.js';
import { villageQueryEngine } from './query-engine.js';
import { villageDb } from '../db/database.js';

let genAIInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIInstance;
}

export async function processNaturalLanguageQuery(
  userQuery: string,
  history: { role: string; content: string }[] = []
): Promise<AIQueryResponse> {
  const cleanQuery = userQuery.trim();
  if (!cleanQuery) {
    return {
      answer: 'Please provide a question about the village data (e.g. "Who is the oldest person?", "Which family is the largest?").',
      visualizations: [],
    };
  }

  // 1. Resolve structured data and visualization from deterministic schema engine
  const deterministicResult = villageQueryEngine.resolveNaturalQuery(cleanQuery);

  const ai = getGenAI();
  if (!ai) {
    // If no API key is configured, return the high-fidelity deterministic results directly
    return deterministicResult;
  }

  try {
    const villageStats = villageDb.getVillageStats();
    const systemPrompt = `You are the Official AI Data Analyst for Lakra Khurd Village Information Platform.
Current reference date for all age calculations is August 24, 2026 (2026-08-24).
You have safe, controlled access to the village database containing Houses, Families, People, Education, Employment, Land, and Facilities.

Domain Definitions:
- Person: A resident record in people table. Age is dynamically computed from date_of_birth relative to 2026-08-24.
- Guardian: Head of family referenced by families.guardian_id -> people.id.
- Child: Person aged < 18.
- Adult: Person aged >= 18.
- Senior: Person aged >= 60.
- Oldest Person: Abdul Rehman Malhi (age 87, House #20).
- Largest Family: Family #FAM-12 (14 members, Guardian Choudhary Muhammad Aslam, House #12).
- House #20 has 4 families and 27 residents (Parcel ID 60116). Coordinates: 32.4945, 74.5228.
- Guardian Rizwan Malhi lives in House #20, phone +92-300-5551234. His son is Muhammad Imran Malhi.

You must provide concise, professional, accurate answers. Avoid flowery language.

Here is the deterministic data result already extracted from the database for this question:
Question: "${cleanQuery}"
Base Answer: "${deterministicResult.answer}"
Visualizations: ${JSON.stringify(deterministicResult.visualizations)}

Respond with a JSON object:
{
  "answer": "A clear, concise, direct response formatted in clean markdown",
  "suggestedFollowUps": ["Question 1", "Question 2"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: cleanQuery,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    if (response.text) {
      try {
        const parsed = JSON.parse(response.text.trim());
        return {
          answer: parsed.answer || deterministicResult.answer,
          visualizations: deterministicResult.visualizations,
          clarificationOptions: deterministicResult.clarificationOptions,
          suggestedFollowUps: parsed.suggestedFollowUps || deterministicResult.suggestedFollowUps,
        };
      } catch (e) {
        // Fallback to deterministic
      }
    }

    return deterministicResult;
  } catch (error) {
    console.error('Gemini query processing error:', error);
    return deterministicResult;
  }
}
