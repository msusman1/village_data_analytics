export type VisualizationType =
    "KPI_CARD" | "TABLE" | "BAR_CHART" | "PIE_CHART" | "PLAIN_TEXT";

export interface AIVisualization {
    type: VisualizationType;
    title?: string;
    value?: string | number;
    subValue?: string;
    description?: string;
    columns?: { key: string; label: string }[];
    rows?: Record<string, any>[];
    data?: Record<string, any>[];
    xKey?: string;
    yKey?: string;
    nameKey?: string;
    valueKey?: string;

}

export interface AIQueryResponse {
    answer: string;
    success: boolean;
    visualization: AIVisualization | null;
    explanation: string;
    sql: string;
    data: any[];                       // rows returned by SQL
    followupQuestions: string[];
    meta: {
        rowCount: number;
        executionMs: number;
    };
    error?: string;
}


export interface Visualization {
    type: VisualizationType;
    title: string;
    xAxisKey?: string | null;
    yAxisKey?: string | null;
    valueKey?: string | null;
}

export interface TextToSqlResult {
    sql: string;
    explanation: string;
    followupQuestions: string[];
    visualization: Visualization
}
