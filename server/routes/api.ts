import { Request, Response, Router } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

// ----------------------------------------------------
// HOUSES API
// ----------------------------------------------------

router.get('/houses', async (req: Request, res: Response) => {
  try {
    const { search, house_type, ownership_type, page = 1, limit = 20 } = req.query;
    const p = Number(page);
    const l = Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { houseNumber: { contains: String(search) } },
        { parcelId: { contains: String(search) } },
      ];
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
        include: { _count: { select: { families: true } } },
      }),
      prisma.houses.count({ where }),
    ]);

    res.json({
      items,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/houses/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.houses.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        facilities: true,
        families: {
          include: {
            _count: { select: { people: true } },
          },
        },
      },
    });
    if (!item) return res.status(404).json({ error: 'House not found' });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/houses', async (req: Request, res: Response) => {
  try {
    const item = await prisma.houses.create({
      data: req.body,
    });
    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/houses/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.houses.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/houses/:id', async (req: Request, res: Response) => {
  try {
    await prisma.houses.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// FAMILIES API
// ----------------------------------------------------

router.get('/families', async (req: Request, res: Response) => {
  try {
    const { search, house_id, cast, page = 1, limit = 20 } = req.query;
    const p = Number(page);
    const l = Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { cast: { contains: String(search) } },
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
          _count: { select: { people: true } },
        },
      }),
      prisma.families.count({ where }),
    ]);

    res.json({
      items,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/families/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.families.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        house: true,
        people: true,
      },
    });
    if (!item) return res.status(404).json({ error: 'Family not found' });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/families', async (req: Request, res: Response) => {
  try {
    const item = await prisma.families.create({
      data: req.body,
    });
    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/families/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.families.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/families/:id', async (req: Request, res: Response) => {
  try {
    await prisma.families.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// PEOPLE API
// ----------------------------------------------------

router.get('/people', async (req: Request, res: Response) => {
  try {
    const { search, gender, marital_status, family_id, page = 1, limit = 20 } = req.query;
    const p = Number(page);
    const l = Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: String(search) } },
        { cnic: { contains: String(search) } },
        { phone: { contains: String(search) } },
      ];
    }
    if (gender) where.gender = String(gender);
    if (marital_status) where.maritalStatus = String(marital_status);
    if (family_id) where.familyId = Number(family_id);

    const [items, total] = await Promise.all([
      prisma.people.findMany({
        where,
        skip: (p - 1) * l,
        take: l,
        include: {
          family: { include: { house: true } },
        },
      }),
      prisma.people.count({ where }),
    ]);

    res.json({
      items,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/people/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.people.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        family: { include: { house: true } },
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
    if (!item) return res.status(404).json({ error: 'Person not found' });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/people', async (req: Request, res: Response) => {
  try {
    const item = await prisma.people.create({
      data: req.body,
    });
    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/people/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.people.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/people/:id', async (req: Request, res: Response) => {
  try {
    await prisma.people.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// EDUCATION API
// ----------------------------------------------------

router.get('/education', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const p = Number(page);
    const l = Number(limit);
    const [items, total] = await Promise.all([
      prisma.educationData.findMany({
        skip: (p - 1) * l,
        take: l,
        include: { person: true },
      }),
      prisma.educationData.count(),
    ]);
    res.json({ items, total, page: p, limit: l });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/education', async (req: Request, res: Response) => {
  try {
    const item = await prisma.educationData.create({ data: req.body });
    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/education/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.educationData.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/education/:id', async (req: Request, res: Response) => {
  try {
    await prisma.educationData.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// EMPLOYMENT API
// ----------------------------------------------------

router.get('/employment', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const p = Number(page);
    const l = Number(limit);
    const [items, total] = await Promise.all([
      prisma.employmentData.findMany({
        skip: (p - 1) * l,
        take: l,
        include: { person: true },
      }),
      prisma.employmentData.count(),
    ]);
    res.json({ items, total, page: p, limit: l });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/employment', async (req: Request, res: Response) => {
  try {
    const item = await prisma.employmentData.create({ data: req.body });
    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/employment/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.employmentData.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/employment/:id', async (req: Request, res: Response) => {
  try {
    await prisma.employmentData.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// SKILLS API
// ----------------------------------------------------

router.get('/skills', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const p = Number(page);
    const l = Number(limit);
    const [items, total] = await Promise.all([
      prisma.skills.findMany({
        skip: (p - 1) * l,
        take: l,
        include: { person: true },
      }),
      prisma.skills.count(),
    ]);
    res.json({ items, total, page: p, limit: l });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/skills', async (req: Request, res: Response) => {
  try {
    const item = await prisma.skills.create({ data: req.body });
    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/skills/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.skills.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/skills/:id', async (req: Request, res: Response) => {
  try {
    await prisma.skills.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// LAND API
// ----------------------------------------------------

router.get('/land', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const p = Number(page);
    const l = Number(limit);
    const [items, total] = await Promise.all([
      prisma.land.findMany({
        skip: (p - 1) * l,
        take: l,
        include: { owner: true },
      }),
      prisma.land.count(),
    ]);
    res.json({ items, total, page: p, limit: l });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/land', async (req: Request, res: Response) => {
  try {
    const item = await prisma.land.create({ data: req.body });
    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/land/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.land.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/land/:id', async (req: Request, res: Response) => {
  try {
    await prisma.land.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// VEHICLES API
// ----------------------------------------------------

router.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const p = Number(page);
    const l = Number(limit);
    const [items, total] = await Promise.all([
      prisma.vehicles.findMany({
        skip: (p - 1) * l,
        take: l,
        include: { owner: true },
      }),
      prisma.vehicles.count(),
    ]);
    res.json({ items, total, page: p, limit: l });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/vehicles', async (req: Request, res: Response) => {
  try {
    const item = await prisma.vehicles.create({ data: req.body });
    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.vehicles.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    await prisma.vehicles.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// HOUSEHOLD FACILITIES API
// ----------------------------------------------------

router.get('/household-facilities', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const p = Number(page);
    const l = Number(limit);
    const [items, total] = await Promise.all([
      prisma.householdFacilities.findMany({
        skip: (p - 1) * l,
        take: l,
        include: { house: true },
      }),
      prisma.householdFacilities.count(),
    ]);
    res.json({ items, total, page: p, limit: l });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/household-facilities/:houseId', async (req: Request, res: Response) => {
  try {
    const houseId = Number(req.params.houseId);
    // Find if exists
    const existing = await prisma.householdFacilities.findFirst({
      where: { houseId },
    });

    let item;
    if (existing) {
      item = await prisma.householdFacilities.update({
        where: { id: existing.id },
        data: req.body,
      });
    } else {
      item = await prisma.householdFacilities.create({
        data: { ...req.body, houseId },
      });
    }
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
