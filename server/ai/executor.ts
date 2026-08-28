import {validateSQL} from './sql-safety';
import {prisma} from "@/server/db/prisma.ts";

export async function executeSQL(sql: string): Promise<{ rows: any[]; executionMs: number }> {
    const check = validateSQL(sql);
    if (!check.safe) {
        throw new Error(`SQL rejected: ${check.reason}`);
    }

    const start = Date.now();

    // Prisma raw query
    const rows = await prisma.$queryRawUnsafe<any[]>(sql);

    return {
        rows: Array.isArray(rows) ? rows : [],
        executionMs: Date.now() - start,
    };
}