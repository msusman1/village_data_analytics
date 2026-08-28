import {Request, Response, Router} from 'express';
import {prisma} from '../db/prisma';

const router = Router();

// ----------------------------------------------------
// HOUSES API
// ----------------------------------------------------

router.get('/houses', async (req: Request, res: Response) => {
    try {
        const {search, house_type, ownership_type, page = 1, limit = 20} = req.query;
        const p = Number(page);
        const l = Number(limit);

        const where: any = {};
        if (search) {
            const searchString = String(search).trim();
            const searchNumber = Number(searchString);
            const isNumeric = Number.isInteger(searchNumber);

            where.OR = [
                // Search string fields
                { parcelId: { contains: searchString } },
                // Search nested owner relation by fullName
                { owner: { fullName: { contains: searchString } } },
            ];
            // Only search houseNumber if input is a valid integer
            if (isNumeric) {
                where.OR.push({ houseNumber: { equals: searchNumber } });
            }
        }
        if (house_type && house_type !== 'ALL') {
            where.houseType = house_type;
        }
        if (ownership_type && ownership_type !== 'ALL') {
            where.ownershipType = ownership_type;
        }

        const [items, total] = await Promise.all([
            prisma.houses.findMany({
                where,
                skip: (p - 1) * l,
                take: l,
                include: {
                    owner: true,
                    _count: {select: {families: true}}
                },
            }),
            prisma.houses.count({where}),
        ]);

        res.json({
            items: items.map((house) => ({
                id: house.id,
                house_number: house.houseNumber,
                parcel_id: house.parcelId || '',
                house_type: house.houseType,
                ownership_type: house.ownershipType,
                owner_id: house.ownerPersonId,
                owner_name: house.owner?.fullName || '',
                latitude: house.latitude == null ? null : Number(house.latitude),
                longitude: house.longitude == null ? null : Number(house.longitude),
                families_count: house._count.families,
                population: 0,
            })),
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
        });
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.get('/houses/:id', async (req: Request, res: Response) => {
    try {
        const item = await prisma.houses.findUnique({
            where: {id: Number(req.params.id)},
            include: {
                facilities: true,
                owner: true,
                families: {
                    include: {
                        people: true,
                        _count: {select: {people: true}},
                    },
                },
            },
        });

        if (!item) return res.status(404).json({error: 'House not found'});

        // Transform to match frontend House type
        const transformed = {
            id: item.id,
            house_number: item.houseNumber,
            parcel_id: item.parcelId || '',
            house_type: item.houseType,
            ownership_type: item.ownershipType,
            owner_id: item.ownerPersonId,
            owner_name: item.owner?.fullName || '',
            latitude: item.latitude == null ? null : Number(item.latitude),
            longitude: item.longitude == null ? null : Number(item.longitude),
            facilities: item.facilities.length > 0 ? {
                id: item.facilities[0].id,
                house_id: item.facilities[0].houseId,
                has_electricity: item.facilities[0].electricityAvailable,
                has_gas: item.facilities[0].gasAvailable,
                has_internet: item.facilities[0].internetAvailable,
                internet_type: item.facilities[0].internetType,
                has_bike: item.facilities[0].bikeAvailable,
                has_car: item.facilities[0].carAvailable,
            } : null,
            families: item.families.map(f => {
                const guardian = f.people.find(p => p.id === f.guardianId);
                return {
                    id: f.id,
                    family_number: String(f.familyNumber),
                    house_id: f.houseId,
                    guardian_id: f.guardianId,
                    guardian_name: guardian?.fullName || '',
                    guardian_phone: guardian?.phone || '',
                    cast: f.cast || '',
                    members_count: f._count.people,
                    members: f.people.map(p => ({
                        id: p.id,
                        family_id: p.familyId,
                        full_name: p.fullName,
                        gender: p.gender,
                        date_of_birth: p.dateOfBirth?.toISOString().split('T')[0] || '',
                        cnic: p.cnic,
                        phone: p.phone,
                        marital_status: p.maritalStatus,
                    })),
                };
            }),
            families_count: item.families.length,
        };

        res.json(transformed);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.post('/houses', async (req: Request, res: Response) => {
    try {
        const {house_number, parcel_id, house_type, ownership_type, owner_id, latitude, longitude} = req.body;
        const item = await prisma.houses.create({
            data: {
                houseNumber: house_number,
                parcelId: parcel_id,
                houseType: house_type,
                ownershipType: ownership_type,
                ownerPersonId: owner_id ? Number(owner_id) : null,
                latitude,
                longitude,
            },
        });
        res.status(201).json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.put('/houses/:id', async (req: Request, res: Response) => {
    try {
        const {house_number, parcel_id, house_type, ownership_type, owner_id, latitude, longitude} = req.body;
        const item = await prisma.houses.update({
            where: {id: Number(req.params.id)},
            data: {
                houseNumber: house_number,
                parcelId: parcel_id,
                houseType: house_type,
                ownershipType: ownership_type,
                ownerPersonId: owner_id !== undefined ? (owner_id ? Number(owner_id) : null) : undefined,
                latitude,
                longitude,
            },
        });
        res.json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.delete('/houses/:id', async (req: Request, res: Response) => {
    try {
        await prisma.houses.delete({
            where: {id: Number(req.params.id)},
        });
        res.json({success: true});
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

// ----------------------------------------------------
// FAMILIES API
// ----------------------------------------------------

router.get('/families', async (req: Request, res: Response) => {
    try {
        const {search, house_id, cast, page = 1, limit = 20} = req.query;
        const p = Number(page);
        const l = Number(limit);

        const where: any = {};
        if (search) {
            const searchStr = String(search);
            where.OR = [
                {familyNumber: {equals: isNaN(Number(searchStr)) ? -1 : Number(searchStr)}},
                {people: {some: {fullName: {contains: searchStr}}}},
                {house: {houseNumber: {contains: searchStr}}},
                {cast: {contains: searchStr}},
            ];
        }
        if (house_id) where.houseId = Number(house_id);
        if (cast) where.cast = String(cast);

        const [items, total] = await Promise.all([
            prisma.families.findMany({
                where,
                skip: (p - 1) * l,
                take: l,
                include: {
                    house: true,
                    people: true,
                    _count: {select: {people: true}},
                },
            }),
            prisma.families.count({where}),
        ]);

        res.json({
            items: items.map((family) => {
                const guardian = family.people.find((person) => person.id === family.guardianId);
                return {
                    id: family.id,
                    family_number: String(family.familyNumber),
                    house_id: family.houseId,
                    house_number: family.house.houseNumber,
                    parcel_id: family.house.parcelId || '',
                    guardian_id: family.guardianId,
                    guardian_name: guardian?.fullName || '',
                    guardian_phone: guardian?.phone || '',
                    cast: family.cast || '',
                    members_count: family._count.people,
                };
            }),
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
        });
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.get('/families/:id', async (req: Request, res: Response) => {
    try {
        const item = await prisma.families.findUnique({
            where: {id: Number(req.params.id)},
            include: {
                house: true,
                people: true,
                _count: {select: {people: true}},
            },
        });
        if (!item) return res.status(404).json({error: 'Family not found'});

        const guardian = item.people.find((person) => person.id === item.guardianId);
        res.json({
            id: item.id,
            family_number: String(item.familyNumber),
            house_id: item.houseId,
            house_number: item.house.houseNumber,
            parcel_id: item.house.parcelId || '',
            guardian_id: item.guardianId,
            guardian_name: guardian?.fullName || '',
            guardian_phone: guardian?.phone || '',
            cast: item.cast || '',
            members_count: item._count.people,
            members: item.people.map(p => ({
                id: p.id,
                family_id: p.familyId,
                full_name: p.fullName,
                gender: p.gender,
                date_of_birth: p.dateOfBirth?.toISOString().split('T')[0] || '',
                cnic: p.cnic,
                phone: p.phone,
                marital_status: p.maritalStatus,
            })),
        });
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.post('/families', async (req: Request, res: Response) => {
    try {
        const {family_number, house_id, guardian_id, cast} = req.body;
        const item = await prisma.families.create({
            data: {
                familyNumber: Number(family_number),
                houseId: Number(house_id),
                guardianId: guardian_id ? Number(guardian_id) : null,
                cast,
            },
        });
        res.status(201).json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.put('/families/:id', async (req: Request, res: Response) => {
    try {
        const {family_number, house_id, guardian_id, cast} = req.body;
        const item = await prisma.families.update({
            where: {id: Number(req.params.id)},
            data: {
                familyNumber: family_number ? Number(family_number) : undefined,
                houseId: house_id ? Number(house_id) : undefined,
                guardianId: guardian_id !== undefined ? (guardian_id ? Number(guardian_id) : null) : undefined,
                cast,
            },
        });
        res.json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.delete('/families/:id', async (req: Request, res: Response) => {
    try {
        await prisma.families.delete({
            where: {id: Number(req.params.id)},
        });
        res.json({success: true});
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

// ----------------------------------------------------
// PEOPLE API
// ----------------------------------------------------

router.get('/people', async (req: Request, res: Response) => {
    try {
        const {search, gender, marital_status, family_id, minAge, maxAge, page = 1, limit = 20} = req.query;
        const p = Number(page);
        const l = Number(limit);

        const where: any = {};
        if (search) {
            where.OR = [
                {fullName: {contains: String(search)}},
                {cnic: {contains: String(search)}},
                {phone: {contains: String(search)}},
            ];
        }
        if (gender) where.gender = String(gender);
        if (marital_status) where.maritalStatus = String(marital_status);
        if (family_id) where.familyId = Number(family_id);

        const today = new Date();
        const yearsAgo = (years: number) => {
            const date = new Date(today);
            date.setFullYear(date.getFullYear() - years);
            return date;
        };
        const parsedMinAge = minAge !== undefined && minAge !== '' && Number.isFinite(Number(minAge))
            ? Number(minAge)
            : undefined;
        const parsedMaxAge = maxAge !== undefined && maxAge !== '' && Number.isFinite(Number(maxAge))
            ? Number(maxAge)
            : undefined;
        if (parsedMinAge !== undefined || parsedMaxAge !== undefined) {
            where.dateOfBirth = {};
            if (parsedMinAge !== undefined) where.dateOfBirth.lte = yearsAgo(parsedMinAge);
            if (parsedMaxAge !== undefined) where.dateOfBirth.gte = yearsAgo(parsedMaxAge + 1);
        }

        const [items, total] = await Promise.all([
            prisma.people.findMany({
                where,
                skip: (p - 1) * l,
                take: l,
                include: {
                    family: {include: {house: true}},
                },
            }),
            prisma.people.count({where}),
        ]);

        const calculateAge = (dateOfBirth: Date | null) => {
            if (!dateOfBirth) return 0;
            let age = today.getFullYear() - dateOfBirth.getFullYear();
            const monthDelta = today.getMonth() - dateOfBirth.getMonth();
            if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dateOfBirth.getDate())) age -= 1;
            return Math.max(0, age);
        };

        res.json({
            items: items.map((person) => ({
                id: person.id,
                family_id: person.familyId,
                full_name: person.fullName,
                gender: person.gender || 'UNKNOWN',
                date_of_birth: person.dateOfBirth ? person.dateOfBirth.toISOString().slice(0, 10) : '',
                cnic: person.cnic || '',
                phone: person.phone || '',
                marital_status: person.maritalStatus || 'SINGLE',
                father_id: person.fatherId,
                mother_id: person.motherId,
                spouse_id: person.spouseId,
                age: calculateAge(person.dateOfBirth),
                family_number: String(person.family.familyNumber),
                house_id: person.family.houseId,
                house_number: person.family.house.houseNumber,
                parcel_id: person.family.house.parcelId || '',
                is_guardian: person.family.guardianId === person.id,
            })),
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
        });
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.get('/people/:id', async (req: Request, res: Response) => {
    try {
        const item = await prisma.people.findUnique({
            where: {id: Number(req.params.id)},
            include: {
                family: {include: {house: true}},
                educationData: true,
                employmentData: true,
                skills: true,
                lands: true,
                vehicles: true,
                father: true,
                mother: true,
                spouse: true,
            },
        });
        if (!item) return res.status(404).json({error: 'Person not found'});

        const today = new Date();
        const calculateAge = (dateOfBirth: Date | null) => {
            if (!dateOfBirth) return 0;
            let age = today.getFullYear() - dateOfBirth.getFullYear();
            const monthDelta = today.getMonth() - dateOfBirth.getMonth();
            if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dateOfBirth.getDate())) age -= 1;
            return Math.max(0, age);
        };

        res.json({
            id: item.id,
            family_id: item.familyId,
            full_name: item.fullName,
            gender: item.gender || 'UNKNOWN',
            date_of_birth: item.dateOfBirth ? item.dateOfBirth.toISOString().slice(0, 10) : '',
            cnic: item.cnic || '',
            phone: item.phone || '',
            marital_status: item.maritalStatus || 'SINGLE',
            father_id: item.fatherId,
            mother_id: item.motherId,
            spouse_id: item.spouseId,
            age: calculateAge(item.dateOfBirth),
            family_number: String(item.family.familyNumber),
            house_id: item.family.houseId,
            house_number: item.family.house.houseNumber,
            parcel_id: item.family.house.parcelId || '',
            father_name: item.father?.fullName || '',
            mother_name: item.mother?.fullName || '',
            spouse_name: item.spouse?.fullName || '',
            education: item.educationData ? [{
                id: item.educationData.id,
                person_id: item.educationData.personId,
                level: item.educationData.highestEducationLevel,
                status: item.educationData.educationStatus,
            }] : [],
            employment: item.employmentData ? [{
                id: item.employmentData.id,
                person_id: item.employmentData.personId,
                status: item.employmentData.employmentStatus,
                occupation: item.employmentData.occupation,
                income: item.employmentData.income,
            }] : [],
            skills: item.skills.map(s => ({
                id: s.id,
                person_id: s.personId,
                skill_name: s.skillName,
                proficiency_level: s.skillLevel,
            })),
            vehicles: item.vehicles.map(v => ({
                id: v.id,
                owner_person_id: v.ownerPersonId,
                vehicle_type: v.vehicleType,
                registration_number: v.registrationNumber,
            })),
            land: item.lands.map(l => ({
                id: l.id,
                owner_person_id: l.ownerPersonId,
                area_acres: Number(l.area),
                land_type: l.landUse,
            })),
        });
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.post('/people', async (req: Request, res: Response) => {
    try {
        const {
            family_id,
            full_name,
            gender,
            date_of_birth,
            cnic,
            phone,
            marital_status,
            father_id,
            mother_id,
            spouse_id
        } = req.body;
        const item = await prisma.people.create({
            data: {
                familyId: Number(family_id),
                fullName: full_name,
                gender,
                dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
                cnic,
                phone,
                maritalStatus: marital_status,
                fatherId: father_id ? Number(father_id) : null,
                motherId: mother_id ? Number(mother_id) : null,
                spouseId: spouse_id ? Number(spouse_id) : null,
            },
        });
        res.status(201).json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.put('/people/:id', async (req: Request, res: Response) => {
    try {
        const {
            family_id,
            full_name,
            gender,
            date_of_birth,
            cnic,
            phone,
            marital_status,
            father_id,
            mother_id,
            spouse_id
        } = req.body;
        const item = await prisma.people.update({
            where: {id: Number(req.params.id)},
            data: {
                familyId: family_id ? Number(family_id) : undefined,
                fullName: full_name,
                gender,
                dateOfBirth: date_of_birth ? new Date(date_of_birth) : undefined,
                cnic,
                phone,
                maritalStatus: marital_status,
                fatherId: father_id !== undefined ? (father_id ? Number(father_id) : null) : undefined,
                motherId: mother_id !== undefined ? (mother_id ? Number(mother_id) : null) : undefined,
                spouseId: spouse_id !== undefined ? (spouse_id ? Number(spouse_id) : null) : undefined,
            },
        });
        res.json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.delete('/people/:id', async (req: Request, res: Response) => {
    try {
        await prisma.people.delete({
            where: {id: Number(req.params.id)},
        });
        res.json({success: true});
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

// ----------------------------------------------------
// EDUCATION API
// ----------------------------------------------------

router.get('/education', async (req: Request, res: Response) => {
    try {
        const {page = 1, limit = 20, search} = req.query;
        const p = Number(page);
        const l = Number(limit);
        const where: any = {};
        if (search) {
            where.OR = [
                {educationStatus: {contains: String(search)}},
                {highestEducationLevel: {equals: String(search)}},
                {person: {fullName: {contains: String(search)}}},
            ];
        }
        const [items, total] = await Promise.all([
            prisma.educationData.findMany({
                where,
                skip: (p - 1) * l,
                take: l,
                include: {person: true},
            }),
            prisma.educationData.count({where}),
        ]);
        res.json({
            items: items.map((item) => ({
                id: item.id,
                person_id: item.personId,
                person_name: item.person.fullName,
                level: item.highestEducationLevel || 'NONE',
                field_of_study: item.educationStatus || '',
                institute: '',
                passing_year: null,
                is_currently_studying: item.isCurrentlyStudying || false,
            })),
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
        });
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.post('/education', async (req: Request, res: Response) => {
    try {
        const item = await prisma.educationData.create({data: req.body});
        res.status(201).json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.put('/education/:id', async (req: Request, res: Response) => {
    try {
        const item = await prisma.educationData.update({
            where: {id: Number(req.params.id)},
            data: req.body,
        });
        res.json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.delete('/education/:id', async (req: Request, res: Response) => {
    try {
        await prisma.educationData.delete({where: {id: Number(req.params.id)}});
        res.json({success: true});
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

// ----------------------------------------------------
// EMPLOYMENT API
// ----------------------------------------------------

router.get('/employment', async (req: Request, res: Response) => {
    try {
        const {page = 1, limit = 20, search} = req.query;
        const p = Number(page);
        const l = Number(limit);
        const where: any = search ? {
            OR: [
                {occupation: {contains: String(search)}},
                {industry: {contains: String(search)}},
                {employmentType: {contains: String(search)}},
                {person: {fullName: {contains: String(search)}}},
            ],
        } : undefined;
        const [items, total] = await Promise.all([
            prisma.employmentData.findMany({
                where,
                skip: (p - 1) * l,
                take: l,
                include: {person: true},
            }),
            prisma.employmentData.count({where}),
        ]);
        res.json({
            items: items.map((item) => ({
                id: item.id,
                person_id: item.personId,
                person_name: item.person.fullName,
                occupation: item.occupation || '',
                status: item.employmentStatus || 'UNEMPLOYED',
                employer_or_business_name: item.industry || item.employmentType || '',
                monthly_income: item.income == null ? null : Number(item.income),
            })),
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
        });
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.post('/employment', async (req: Request, res: Response) => {
    try {
        const item = await prisma.employmentData.create({data: req.body});
        res.status(201).json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.put('/employment/:id', async (req: Request, res: Response) => {
    try {
        const item = await prisma.employmentData.update({
            where: {id: Number(req.params.id)},
            data: req.body,
        });
        res.json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.delete('/employment/:id', async (req: Request, res: Response) => {
    try {
        await prisma.employmentData.delete({where: {id: Number(req.params.id)}});
        res.json({success: true});
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

// ----------------------------------------------------
// SKILLS API
// ----------------------------------------------------

router.get('/skills', async (req: Request, res: Response) => {
    try {
        const {page = 1, limit = 20, search} = req.query;
        const p = Number(page);
        const l = Number(limit);
        const where: any = search ? {
            OR: [
                {skillName: {contains: String(search)}},
                {person: {fullName: {contains: String(search)}}},
            ],
        } : undefined;
        const [items, total] = await Promise.all([
            prisma.skills.findMany({
                where,
                skip: (p - 1) * l,
                take: l,
                include: {person: true},
            }),
            prisma.skills.count({where}),
        ]);
        res.json({
            items: items.map((item) => ({
                id: item.id,
                person_id: item.personId,
                person_name: item.person.fullName,
                skill_name: item.skillName,
                proficiency_level: item.skillLevel || 'BEGINNER',
                years_experience: item.yearsExperience || 0,
            })),
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
        });
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.post('/skills', async (req: Request, res: Response) => {
    try {
        const item = await prisma.skills.create({data: req.body});
        res.status(201).json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.put('/skills/:id', async (req: Request, res: Response) => {
    try {
        const item = await prisma.skills.update({
            where: {id: Number(req.params.id)},
            data: req.body,
        });
        res.json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.delete('/skills/:id', async (req: Request, res: Response) => {
    try {
        await prisma.skills.delete({where: {id: Number(req.params.id)}});
        res.json({success: true});
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

// ----------------------------------------------------
// LAND API
// ----------------------------------------------------

router.get('/land', async (req: Request, res: Response) => {
    try {
        const {page = 1, limit = 20, search} = req.query;
        const p = Number(page);
        const l = Number(limit);
        const where: any = search ? {
            OR: [
                {landUse: {equals: String(search)}},
                {owner: {fullName: {contains: String(search)}}},
            ],
        } : undefined;
        const [items, total] = await Promise.all([
            prisma.land.findMany({
                where,
                skip: (p - 1) * l,
                take: l,
                include: {owner: true},
            }),
            prisma.land.count({where}),
        ]);
        res.json({
            items: items.map((item) => ({
                id: item.id,
                owner_person_id: item.ownerPersonId,
                owner_name: item.owner.fullName,
                parcel_id: '',
                area_acres: Number(item.area),
                land_type: item.landUse,
                location_description: item.areaUnit || '',
            })),
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
        });
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.post('/land', async (req: Request, res: Response) => {
    try {
        const item = await prisma.land.create({data: req.body});
        res.status(201).json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.put('/land/:id', async (req: Request, res: Response) => {
    try {
        const item = await prisma.land.update({
            where: {id: Number(req.params.id)},
            data: req.body,
        });
        res.json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.delete('/land/:id', async (req: Request, res: Response) => {
    try {
        await prisma.land.delete({where: {id: Number(req.params.id)}});
        res.json({success: true});
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

// ----------------------------------------------------
// VEHICLES API
// ----------------------------------------------------

router.get('/vehicles', async (req: Request, res: Response) => {
    try {
        const {page = 1, limit = 20, search} = req.query;
        const p = Number(page);
        const l = Number(limit);
        const where: any = search ? {
            OR: [
                {vehicleType: {equals: String(search)}},
                {registrationNumber: {contains: String(search)}},
                {owner: {fullName: {contains: String(search)}}},
            ],
        } : undefined;
        const [items, total] = await Promise.all([
            prisma.vehicles.findMany({
                where,
                skip: (p - 1) * l,
                take: l,
                include: {owner: true},
            }),
            prisma.vehicles.count({where}),
        ]);
        res.json({
            items: items.map((item) => ({
                id: item.id,
                owner_person_id: item.ownerPersonId,
                owner_name: item.owner?.fullName || 'Unassigned',
                vehicle_type: item.vehicleType,
                make_model: '',
                registration_number: item.registrationNumber || '',
                year: null,
            })),
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
        });
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.post('/vehicles', async (req: Request, res: Response) => {
    try {
        const item = await prisma.vehicles.create({data: req.body});
        res.status(201).json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.put('/vehicles/:id', async (req: Request, res: Response) => {
    try {
        const item = await prisma.vehicles.update({
            where: {id: Number(req.params.id)},
            data: req.body,
        });
        res.json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.delete('/vehicles/:id', async (req: Request, res: Response) => {
    try {
        await prisma.vehicles.delete({where: {id: Number(req.params.id)}});
        res.json({success: true});
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

// ----------------------------------------------------
// HOUSEHOLD FACILITIES API
// ----------------------------------------------------

router.get('/household-facilities', async (req: Request, res: Response) => {
    try {
        const {page = 1, limit = 20} = req.query;
        const p = Number(page);
        const l = Number(limit);
        const [items, total] = await Promise.all([
            prisma.householdFacilities.findMany({
                skip: (p - 1) * l,
                take: l,
                include: {house: true},
            }),
            prisma.householdFacilities.count(),
        ]);
        res.json({
            items: items.map((item) => ({
                id: item.id,
                house_id: item.houseId,
                house_number: item.house.houseNumber,
                has_electricity: item.electricityAvailable || false,
                has_gas: item.gasAvailable || false,
                has_internet: item.internetAvailable || false,
                internet_type: item.internetType || 'NONE',
                has_bike: item.bikeAvailable || false,
                has_car: item.carAvailable || false,
            })),
            total,
            page: p,
            limit: l,
            totalPages: Math.ceil(total / l),
        });
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

router.put('/household-facilities/:houseId', async (req: Request, res: Response) => {
    try {
        const houseId = Number(req.params.houseId);
        // Find if exists
        const existing = await prisma.householdFacilities.findFirst({
            where: {houseId},
        });

        let item;
        if (existing) {
            item = await prisma.householdFacilities.update({
                where: {id: existing.id},
                data: req.body,
            });
        } else {
            item = await prisma.householdFacilities.create({
                data: {...req.body, houseId},
            });
        }
        res.json(item);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }
});

export default router;
