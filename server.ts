import express, {Request, Response} from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import {createServer as createViteServer} from 'vite';
import {
    authenticateAdmin,
    validateSessionToken,
    logoutSessionToken,
    requireAuth,
    AUTH_COOKIE_NAME,
} from './server/auth/auth.service.js';
import apiRoutes from './server/routes/api.js';
import {prisma} from './server/db/prisma.js';
import { queryGemini } from './server/ai/gemini.service.js';

async function startServer() {
    const app = express();
    const PORT = 3000;

    app.use(express.json());
    app.use(cookieParser());

    // ----------------------------------------------------
    // AUTHENTICATION ROUTES
    // ----------------------------------------------------
    app.post('/api/auth/login', async (req: Request, res: Response) => {
        const {email, password} = req.body;
        if (!email || !password) {
            res.status(400).json({error: 'Email and password are required'});
            return;
        }

        const authResult = await authenticateAdmin(email, password);
        if (!authResult.success) {
            res.status(401).json({error: authResult.message || 'Authentication failed'});
            return;
        }

        // Set secure HTTP-only cookie
        res.cookie(AUTH_COOKIE_NAME, authResult.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({
            success: true,
            user: authResult.user,
            token: authResult.token,
        });
    });

    app.post('/api/auth/logout', async (req: Request, res: Response) => {
        const token = req.cookies?.[AUTH_COOKIE_NAME];
        await logoutSessionToken(token);
        res.clearCookie(AUTH_COOKIE_NAME);
        res.json({success: true, message: 'Logged out successfully'});
    });

    app.get('/api/auth/me', async (req: Request, res: Response) => {
        const token = req.cookies?.[AUTH_COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
        const session = await validateSessionToken(token);
        if (!session) {
            res.json({isAuthenticated: false, user: null});
            return;
        }
        res.json({
            isAuthenticated: true,
            user: {
                email: session.email,
                name: session.name,
                role: session.role,
            },
        });
    });

    // ----------------------------------------------------
    // DATA ROUTES (Protected by requireAuth)
    // ----------------------------------------------------
    // Mount Prisma-based API routes
    app.use('/api/houses', requireAuth, apiRoutes);
    app.use('/api/families', requireAuth, apiRoutes);
    app.use('/api/people', requireAuth, apiRoutes);
    app.use('/api/education', requireAuth, apiRoutes);
    app.use('/api/employment', requireAuth, apiRoutes);
    app.use('/api/skills', requireAuth, apiRoutes);
    app.use('/api/land', requireAuth, apiRoutes);
    app.use('/api/vehicles', requireAuth, apiRoutes);
    app.use('/api/household-facilities', requireAuth, apiRoutes);
    app.use('/api/map', requireAuth, apiRoutes);
    app.use('/api/ai', requireAuth, apiRoutes);

    // ----------------------------------------------------
    // DASHBOARD & STATS API
    // ----------------------------------------------------
    app.get('/api/stats', requireAuth, async (req: Request, res: Response) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        try {
            const [
                total_population,
                total_houses,
                total_families,
                males,
                females,
                children_under_5,
                children_under_18,
                seniors_60_plus,
            ] = await Promise.all([
                prisma.people.count(),
                prisma.houses.count(),
                prisma.families.count(),
                prisma.people.count({where: {gender: 'MALE'}}),
                prisma.people.count({where: {gender: 'FEMALE'}}),
                prisma.people.count({where: {dateOfBirth: {gte: new Date(new Date().setFullYear(new Date().getFullYear() - 5))}}}),
                prisma.people.count({where: {dateOfBirth: {gte: new Date(new Date().setFullYear(new Date().getFullYear() - 18))}}}),
                prisma.people.count({where: {dateOfBirth: {lte: new Date(new Date().setFullYear(new Date().getFullYear() - 60))}}}),
            ]);

            res.json({
                total_population,
                total_houses,
                total_families,
                gender_distribution: {male: males, female: females},
                children_under_5,
                children_under_18,
                seniors_60_plus,
                average_family_size: total_families > 0 ? (total_population / total_families).toFixed(1) : 0,
            });
        } catch (error: any) {
            res.status(500).json({error: error.message});
        }
    });

    // ----------------------------------------------------
    // MAP API
    // ----------------------------------------------------
    app.get('/api/map/houses', requireAuth, async (req: Request, res: Response) => {
        try {
            const houses = await prisma.houses.findMany({
                select: {
                    id: true,
                    houseNumber: true,
                    latitude: true,
                    longitude: true,
                    houseType: true,
                    _count: {select: {families: true}},
                },
            });
            res.json(houses);
        } catch (error: any) {
            res.status(500).json({error: error.message});
        }
    });

    // AI ASSISTANT NATURAL LANGUAGE ANALYTICS API
    // ----------------------------------------------------
    app.post('/api/ai/query', requireAuth, async (req: Request, res: Response) => {
        try {
            const {query, history} = req.body;
            if (!query || typeof query !== 'string') {
                res.status(400).json({error: 'Valid natural language query string required'});
                return;
            }


            res.json({"data":333});
        } catch (error) {
            console.error('AI Query handler error:', error);
            res.status(500).json({
                answer: "I couldn't retrieve the requested village data. Please try again.",
                visualizations: [],
            });
        }
    });

    // ----------------------------------------------------
    // VITE DEV MIDDLEWARE / STATIC ASSETS
    // ----------------------------------------------------
    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: {middlewareMode: true},
            appType: 'spa',
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req: Request, res: Response) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Lakra Khurd Village Data Platform running on http://0.0.0.0:${PORT}`);
    });
}

startServer().catch((err) => {
    console.error('Failed to start server:', err);
});
