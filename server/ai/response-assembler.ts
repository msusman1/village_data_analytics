import {AIVisualization, TextToSqlResult} from "@/server/ai/types.ts";

const firstRowKeys = (rows: any[]) => Object.keys(rows[0] || {});

export function normalizeValue(value: any): any {
    // 1. Handle primitive null / undefined early
    if (value === null || value === undefined) return value;

    // 2. BigInt: keep precision if unsafe integer
    if (typeof value === 'bigint') {
        const num = Number(value);
        return Number.isSafeInteger(num) ? num : value.toString();
    }

    // 3. Date handling
    if (value instanceof Date) {
        return value.toISOString();
    }

    // 4. Prisma Decimal / Decimal.js detection (Duck typing + Class name check)
    const isDecimal =
        (value && typeof value === 'object' && value.constructor?.name === 'Decimal') ||
        (value && typeof value === 'object' && 'd' in value && 's' in value && Array.isArray(value.d));

    if (isDecimal) {
        const stringVal = value.toString();
        const numVal = Number(stringVal);
        // Ensure decimal fits safely into JS floating-point number
        return Number.isFinite(numVal) && Number.isSafeInteger(Math.floor(numVal))
            ? numVal
            : stringVal;
    }

    // 5. Arrays
    if (Array.isArray(value)) {
        return value.map(normalizeValue);
    }

    // 6. Plain Objects
    if (typeof value === 'object' && value.constructor === Object) {
        const normalized: Record<string, any> = {};
        for (const [key, item] of Object.entries(value)) {
            normalized[key] = normalizeValue(item);
        }
        return normalized;
    }

    return value;
}

export function normalizeRows(rows: any[]): Record<string, any>[] {
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => normalizeValue(row));
}


export function buildVisualization(textToSqlResult: TextToSqlResult, rawRows: any[]): AIVisualization | null {
    const rows = normalizeRows(rawRows);
    const {type, title, xAxisKey, yAxisKey, valueKey} = textToSqlResult.visualization;
    const keys = firstRowKeys(rows);


    if (type === 'KPI_CARD') {
        const key = valueKey || keys[0];
        const value = rows[0]?.[key];
        return {
            type: 'KPI_CARD',
            title: title || 'Result',
            value,
            subValue: `${rows.length} row(s)`,
        };
    }

    if (type === 'TABLE') {
        const columns = rows[0]
            ? Object.keys(rows[0]).map(k => ({key: k, label: k}))
            : [];
        return {type: 'TABLE', title: title || 'Results', columns, rows};
    }

    if (type === 'PIE_CHART') {
        const nameKey = xAxisKey || keys[0];
        const chartValueKey = valueKey || yAxisKey || keys[1];
        if (!nameKey || !chartValueKey) return {type: 'PLAIN_TEXT', title, description: textToSqlResult.explanation};
        return {
            type: 'PIE_CHART',
            title,
            data: rows,
            nameKey,
            valueKey: chartValueKey,
        };
    }

    if (type === 'BAR_CHART') {
        const xKey = xAxisKey || keys[0];
        const yKey = yAxisKey || valueKey || keys[1];
        if (!xKey || !yKey) return {type: 'PLAIN_TEXT', description: textToSqlResult.explanation};
        return {
            type: 'BAR_CHART',
            title,
            data: rows,
            xKey,
            yKey,
        };
    }

    // PLAIN_TEXT or fallback. A text visualization is still useful when no
    // rows were returned, because it carries the explanation to the client.
    return {
        type: 'PLAIN_TEXT',
        title: title || 'Result',
        description: textToSqlResult.explanation,
    };
}

export function buildAnswer(textToSqlResult: TextToSqlResult, rows: any[]): string {
    if (rows.length === 0) {
        return `${textToSqlResult.explanation} No matching records were found.`;
    }
    // Simple but effective: let the explanation + first row speak
    return textToSqlResult.explanation;
}
