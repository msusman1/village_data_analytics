const FORBIDDEN = [
    /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|GRANT|REVOKE|CALL|EXEC|EXECUTE|INTO\s+OUTFILE|LOAD_FILE|BENCHMARK|SLEEP)\b/i,
    /;\s*\w/,                    // multiple statements
    /--/,                        // comments that can hide things
    /\/\*/,
];

export function validateSQL(sql: string): { safe: boolean; reason?: string } {
    const cleaned = sql.trim();

    if (!cleaned.toLowerCase().startsWith('select') && !cleaned.toLowerCase().startsWith('with')) {
        return {safe: false, reason: 'Only SELECT / WITH queries are allowed'};
    }

    for (const pattern of FORBIDDEN) {
        if (pattern.test(cleaned)) {
            return {safe: false, reason: `Forbidden pattern detected: ${pattern}`};
        }
    }

    // Optional: force a LIMIT on very open queries
    if (!/\bLIMIT\b/i.test(cleaned) && /\bSELECT\b.+\bFROM\b.+people/i.test(cleaned)) {
        // you can auto-append LIMIT 100 here if you want
    }

    return {safe: true};
}