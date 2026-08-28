import {execute} from './gemini';
import {executeSQL} from './executor';
import {buildAnswer, buildVisualization, normalizeRows} from './response-assembler';
import {AIQueryResponse} from "@/server/ai/types.ts";


export async function answerQuery(userQuery: string): Promise<AIQueryResponse> {
    const start = Date.now();

    try {
        // 1. One structured LLM call
        const textToSqlResult = await execute(userQuery);

        // 2. Execute safely
        const {rows, executionMs} = await executeSQL(textToSqlResult.sql);

        // 3. Assemble response
        const normalizedRows = normalizeRows(rows);
        const visualization = buildVisualization(textToSqlResult, normalizedRows);
        const answer = buildAnswer(textToSqlResult, rows);

        const followupQuestions = textToSqlResult.followupQuestions;

        return {
            success: true,
            answer: answer,
            // remove in production if you want
            data: normalizedRows,
            visualization: visualization,
            followupQuestions: followupQuestions,
            meta: {
                rowCount: rows.length,
                executionMs,
            },
        };
    } catch (err: any) {
        return {
            success: false,
            answer: 'Sorry, I could not process that question.',
            data: [],
            visualization: {type: 'PLAIN_TEXT', title: 'Error', description: err.message || 'Unknown error'},
            followupQuestions: [],
            meta: {rowCount: 0, executionMs: Date.now() - start},
            error: err.message,
        };
    }
}
