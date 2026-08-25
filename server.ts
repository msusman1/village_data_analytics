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
import {VillageStats} from "@/src/types";

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
    // The router already declares resource paths such as /houses and /families.
    // Mount it at /api so /api/houses reaches router.get('/houses').
    app.use('/api', requireAuth, apiRoutes);

    // ----------------------------------------------------
    // DASHBOARD & STATS API
    // ----------------------------------------------------
    app.get('/api/stats', requireAuth, async (req: Request, res: Response) => {
        res.setHeader(
            'Cache-Control',
            'no-store, no-cache, must-revalidate, proxy-revalidate'
        );
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        try {
            const today = new Date();

            const getDateYearsAgo = (years: number): Date => {
                const date = new Date(today);
                date.setFullYear(today.getFullYear() - years);
                return date;
            };

            const date5YearsAgo = getDateYearsAgo(5);
            const date10YearsAgo = getDateYearsAgo(10);
            const date18YearsAgo = getDateYearsAgo(18);
            const date60YearsAgo = getDateYearsAgo(60);

            const [
                total_population,
                total_houses,
                total_families,
                guardian_groups,
                males,
                females,
                children_under_5,
                children_under_10,
                children_under_18,
                adults,
                seniors_60_plus,
                all_people,
                vehicle_counts,
                family_sizes,
                house_population_data,
                education_counts,
                employment_counts
            ] = await Promise.all([
                // Total population
                prisma.people.count(),

                // Total houses
                prisma.houses.count(),

                // Total families
                prisma.families.count(),

                // Total unique guardians
                prisma.families.groupBy({
                    by: ['guardianId'],
                    where: {
                        guardianId: {
                            not: null
                        }
                    }
                }),

                // Gender counts
                prisma.people.count({
                    where: {
                        gender: 'MALE'
                    }
                }),

                prisma.people.count({
                    where: {
                        gender: 'FEMALE'
                    }
                }),

                // Age-based counts
                prisma.people.count({
                    where: {
                        dateOfBirth: {
                            gte: date5YearsAgo
                        }
                    }
                }),

                prisma.people.count({
                    where: {
                        dateOfBirth: {
                            gte: date10YearsAgo
                        }
                    }
                }),

                prisma.people.count({
                    where: {
                        dateOfBirth: {
                            gte: date18YearsAgo
                        }
                    }
                }),

                prisma.people.count({
                    where: {
                        dateOfBirth: {
                            lt: date18YearsAgo
                        }
                    }
                }),

                prisma.people.count({
                    where: {
                        dateOfBirth: {
                            lte: date60YearsAgo
                        }
                    }
                }),

                // People required for age calculations
                prisma.people.findMany({
                    select: {
                        dateOfBirth: true
                    }
                }),

                // Vehicle distribution
                prisma.vehicles.groupBy({
                    by: ['vehicleType'],
                    _count: {
                        _all: true
                    }
                }),


                // Number of people in each family
                prisma.families.findMany({
                    select: {
                        id: true,
                        _count: {
                            select: {
                                people: true
                            }
                        }
                    }
                }),

                // Population and family count for each house
                prisma.houses.findMany({
                    select: {
                        houseNumber: true,
                        families: {
                            select: {
                                id: true,
                                people: {
                                    select: {
                                        id: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        houseNumber: 'asc'
                    }
                }),

                // Education distribution
                prisma.educationData.groupBy({
                    by: ['highestEducationLevel'],
                    _count: {
                        _all: true
                    }
                }),

                // Employment distribution
                prisma.employmentData.groupBy({
                    by: ['employmentStatus'],
                    _count: {
                        _all: true
                    }
                })
            ]);

            /**
             * Calculate accurate age.
             */
            const calculateAge = (dateOfBirth: Date): number => {
                let age = today.getFullYear() - dateOfBirth.getFullYear();

                const monthDifference =
                    today.getMonth() - dateOfBirth.getMonth();

                const dayDifference =
                    today.getDate() - dateOfBirth.getDate();

                if (
                    monthDifference < 0 ||
                    (monthDifference === 0 && dayDifference < 0)
                ) {
                    age--;
                }

                return age;
            };

            /**
             * Age groups
             */
            const ageGroupsMap: Record<string, number> = {
                '0-5': 0,
                '6-12': 0,
                '13-18': 0,
                '19-35': 0,
                '36-50': 0,
                '51-60': 0,
                '60+': 0
            };

            let totalAge = 0;
            let peopleWithAge = 0;

            for (const person of all_people) {
                if (!person.dateOfBirth) {
                    continue;
                }

                const age = calculateAge(person.dateOfBirth);

                totalAge += age;
                peopleWithAge++;

                if (age <= 5) {
                    ageGroupsMap['0-5']++;
                } else if (age <= 12) {
                    ageGroupsMap['6-12']++;
                } else if (age <= 18) {
                    ageGroupsMap['13-18']++;
                } else if (age <= 35) {
                    ageGroupsMap['19-35']++;
                } else if (age <= 50) {
                    ageGroupsMap['36-50']++;
                } else if (age <= 60) {
                    ageGroupsMap['51-60']++;
                } else {
                    ageGroupsMap['60+']++;
                }
            }

            const age_groups = Object.entries(ageGroupsMap).map(
                ([group, count]) => ({
                    group,
                    count,
                    percentage:
                        total_population > 0
                            ? Math.round((count / total_population) * 100)
                            : 0
                })
            );

            /**
             * Gender distribution
             */
            const gender_distribution = [
                {
                    gender: 'Male',
                    count: males,
                    percentage:
                        total_population > 0
                            ? Math.round((males / total_population) * 100)
                            : 0
                },
                {
                    gender: 'Female',
                    count: females,
                    percentage:
                        total_population > 0
                            ? Math.round((females / total_population) * 100)
                            : 0
                }
            ];

            /**
             * Family size distribution.
             *
             * Ranges:
             * 1 member
             * 2-4 members
             * 5-7 members
             * 8-10 members
             * 11+ members
             */
            const familySizeRanges: Record<string, number> = {
                '1': 0,
                '2-4': 0,
                '5-7': 0,
                '8-10': 0,
                '11+': 0
            };

            for (const family of family_sizes) {
                const size = family._count.people;

                if (size === 1) {
                    familySizeRanges['1']++;
                } else if (size >= 2 && size <= 4) {
                    familySizeRanges['2-4']++;
                } else if (size >= 5 && size <= 7) {
                    familySizeRanges['5-7']++;
                } else if (size >= 8 && size <= 10) {
                    familySizeRanges['8-10']++;
                } else if (size >= 11) {
                    familySizeRanges['11+']++;
                }
            }

            const family_size_distribution = Object.entries(
                familySizeRanges
            ).map(([range, count]) => ({
                range,
                count
            }));

            /**
             * Houses with multiple families
             */
            const houses_with_multiple_families = house_population_data.filter(
                house => house.families.length > 1
            ).length;

            /**
             * Population by house
             */
            const population_by_house = house_population_data.map(house => {
                const population = house.families.reduce(
                    (total, family) => total + family.people.length,
                    0
                );

                return {
                    house_number: house.houseNumber,
                    population,
                    families_count: house.families.length
                };
            });

            /**
             * Vehicle distribution
             */
            const vehicle_distribution = vehicle_counts.map(vehicle => ({
                type: vehicle.vehicleType,
                count: vehicle._count._all
            }));

            /**
             * Education distribution
             */
            const education_distribution = education_counts.map(item => ({
                level: item.highestEducationLevel ?? 'UNKNOWN',
                count: item._count._all
            }));

            /**
             * Employment distribution
             */
            const employment_distribution = employment_counts.map(item => ({
                status: item.employmentStatus ?? 'UNKNOWN',
                count: item._count._all
            }));

            /**
             * Household facility statistics.
             *
             * Using total houses as denominator gives the percentage
             * of all houses in the village that have the facility.
             */
            const [
                facilities_with_electricity,
                facilities_with_gas,
                facilities_with_internet,
                facilities_with_bike,
                facilities_with_car
            ] = await Promise.all([
                prisma.householdFacilities.count({
                    where: {electricityAvailable: true}
                }),
                prisma.householdFacilities.count({
                    where: {gasAvailable: true}
                }),
                prisma.householdFacilities.count({
                    where: {internetAvailable: true}
                }),
                prisma.householdFacilities.count({
                    where: {bikeAvailable: true}
                }),
                prisma.householdFacilities.count({
                    where: {carAvailable: true}
                })
            ]);

            const facility_stats = {
                electricity_percentage:
                    total_houses > 0
                        ? Math.round((facilities_with_electricity / total_houses) * 100)
                        : 0,

                gas_percentage:
                    total_houses > 0
                        ? Math.round((facilities_with_gas / total_houses) * 100)
                        : 0,

                internet_percentage:
                    total_houses > 0
                        ? Math.round((facilities_with_internet / total_houses) * 100)
                        : 0,

                bike_ownership_percentage:
                    total_houses > 0
                        ? Math.round((facilities_with_bike / total_houses) * 100)
                        : 0,

                car_ownership_percentage:
                    total_houses > 0
                        ? Math.round((facilities_with_car / total_houses) * 100)
                        : 0
            };

            /**
             * Final response.
             *
             * Explicitly typed to ensure every VillageStats field
             * is returned.
             */
            const stats: VillageStats = {
                total_population,
                total_houses,
                total_families,
                total_guardians: guardian_groups.length,

                children_under_5,
                children_under_10,
                children_under_18,
                adults,
                seniors_60_plus,

                average_age:
                    peopleWithAge > 0
                        ? Number((totalAge / peopleWithAge).toFixed(1))
                        : 0,

                average_family_size:
                    total_families > 0
                        ? Number(
                            (total_population / total_families).toFixed(1)
                        )
                        : 0,

                houses_with_multiple_families,

                age_groups,

                gender_distribution,

                family_size_distribution,

                population_by_house,

                education_distribution,

                employment_distribution,

                facility_stats,

                vehicle_distribution
            };

            res.json(stats);
        } catch (error: any) {
            console.error('Stats API error:', error);

            res.status(500).json({
                error: error?.message ?? 'Failed to retrieve village statistics'
            });
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
                    parcelId: true,
                    latitude: true,
                    longitude: true,
                    houseType: true,
                    ownershipType: true,
                    _count: {select: {families: true}},
                },
            });
            res.json(houses.map((house) => ({
                id: house.id,
                house_number: house.houseNumber,
                parcel_id: house.parcelId || '',
                latitude: Number(house.latitude),
                longitude: Number(house.longitude),
                house_type: house.houseType,
                ownership_type: house.ownershipType,
                families_count: house._count.families,
                population: 0,
            })).filter((house) => Number.isFinite(house.latitude) && Number.isFinite(house.longitude)));
        } catch (error: any) {
            res.status(500).json({error: error.message});
        }
    });

    app.get('/api/map/nearby', requireAuth, async (req: Request, res: Response) => {
        try {
            const houseNumber = String(req.query.house || '');
            const radius = Math.max(0, Number(req.query.radius || 500));
            const houses = await prisma.houses.findMany({
                select: {
                    id: true,
                    houseNumber: true,
                    parcelId: true,
                    latitude: true,
                    longitude: true,
                    houseType: true,
                    ownershipType: true,
                    _count: {select: {families: true}},
                },
            });
            const target = houses.find((house) => house.houseNumber === houseNumber);
            if (!target || target.latitude == null || target.longitude == null) {
                res.json([]);
                return;
            }

            const toRadians = (value: number) => (value * Math.PI) / 180;
            const targetLatitude = Number(target.latitude);
            const targetLongitude = Number(target.longitude);
            const nearby = houses.map((house) => {
                const latitude = Number(house.latitude);
                const longitude = Number(house.longitude);
                const dLatitude = toRadians(latitude - targetLatitude);
                const dLongitude = toRadians(longitude - targetLongitude);
                const a = Math.sin(dLatitude / 2) ** 2
                    + Math.cos(toRadians(targetLatitude)) * Math.cos(toRadians(latitude))
                    * Math.sin(dLongitude / 2) ** 2;
                const distance = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return {
                    id: house.id,
                    house_number: house.houseNumber,
                    parcel_id: house.parcelId || '',
                    latitude,
                    longitude,
                    house_type: house.houseType,
                    ownership_type: house.ownershipType,
                    families_count: house._count.families,
                    population: 0,
                    distance_meters: Math.round(distance),
                };
            }).filter((house) => Number.isFinite(house.distance_meters) && house.distance_meters <= radius)
                .sort((a, b) => a.distance_meters - b.distance_meters);

            res.json(nearby);
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


            res.json({"data": 333});
        } catch (error) {
            console.error('AI Query handler error:', error);
            res.status(500).json({
                answer: "I couldn't retrieve the requested village data. Please try again.",
                visualizations: [],
            });
        }
    });

    // Never let an unmatched API request fall through to the SPA HTML shell.
    app.use('/api', (_req: Request, res: Response) => {
        res.status(404).json({error: 'API route not found'});
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
