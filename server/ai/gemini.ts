import {GoogleGenAI, Schema, Type} from '@google/genai';
import {TextToSqlResult} from "@/server/ai/types.ts";
import {buildSystemPrompt} from "@/server/ai/system-prompt.ts";

const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY})
    : null;

// @ts-ignore
const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        sql: {
            type: Type.STRING,
            description: "Executable read-only MySQL query without backticks, markdown formatting, or newlines.",
        },
        explanation: {
            type: Type.STRING,
            description: "Brief human-readable summary explaining how the question was parsed.",
        },
        followupQuestions: {
            type: Type.ARRAY,
            items: {type: Type.STRING},
            description:
                "2 to 3 follow-up questions related to the same entity/domain as the current query, phrased as the user would ask them.",
        },
        visualization: {
            type: Type.OBJECT,
            properties: {
                type: {
                    type: Type.STRING,
                    enum: ["KPI_CARD", "TABLE", "BAR_CHART", "PIE_CHART", "MAP_MARKERS", "PLAIN_TEXT"],
                },
                title: {type: Type.STRING},
                xAxisKey: {type: Type.STRING, nullable: true},
                yAxisKey: {type: Type.STRING, nullable: true},
                valueKey: {type: Type.STRING, nullable: true},
            },
            required: ["type", "title"],
        },
    },
    required: ["sql", "explanation", "followupQuestions", "visualization"],
};


export async function execute(userQuery: string): Promise<TextToSqlResult> {
    if (!ai) throw new Error('GEMINI_API_KEY is not configured');

    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',          // or gemini-2.0-flash
        contents: [
            {
                role: 'user',
                parts: [{text: `User question: ${userQuery}`}],
            },
        ],
        config: {
            systemInstruction: buildSystemPrompt(),
            responseMimeType: 'application/json',
            responseSchema,
            temperature: 0.1,                 // low temperature for deterministic SQL
        },
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from Gemini');

    return JSON.parse(text) as TextToSqlResult;
}
