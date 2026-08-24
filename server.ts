import express, { Request, Response } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { villageDb } from './server/db/database.js';
import {
  authenticateAdmin,
  validateSessionToken,
  logoutSessionToken,
  requireAuth,
  AUTH_COOKIE_NAME,
} from './server/auth/auth.service.js';
import { processNaturalLanguageQuery } from './server/ai/gemini.service.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // ----------------------------------------------------
  // AUTHENTICATION ROUTES
  // ----------------------------------------------------
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const authResult = authenticateAdmin(email, password);
    if (!authResult.success) {
      res.status(401).json({ error: authResult.message || 'Authentication failed' });
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

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    logoutSessionToken(token);
    res.clearCookie(AUTH_COOKIE_NAME);
    res.json({ success: true, message: 'Logged out successfully' });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const token = req.cookies?.[AUTH_COOKIE_NAME] || req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const session = validateSessionToken(token);
    if (!session) {
      res.json({ isAuthenticated: false, user: null });
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
  // DASHBOARD & STATS API
  // ----------------------------------------------------
  app.get('/api/stats', requireAuth, (req: Request, res: Response) => {
    const stats = villageDb.getVillageStats();
    res.json(stats);
  });

  // ----------------------------------------------------
  // HOUSES API
  // ----------------------------------------------------
  app.get('/api/houses', requireAuth, (req: Request, res: Response) => {
    const { search, house_type, ownership_type, page, limit, sortField, sortDir } = req.query;
    const result = villageDb.getHouses({
      search: search as string,
      house_type: house_type as string,
      ownership_type: ownership_type as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      sortField: sortField as string,
      sortDir: sortDir as 'asc' | 'desc',
    });
    res.json(result);
  });

  app.get('/api/houses/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const house = villageDb.getHouseById(id);
    if (!house) {
      res.status(404).json({ error: `House #${id} not found` });
      return;
    }
    res.json(house);
  });

  app.post('/api/houses', requireAuth, (req: Request, res: Response) => {
    const { house_number, parcel_id, house_type, ownership_type, latitude, longitude } = req.body;
    if (!house_number || !parcel_id) {
      res.status(400).json({ error: 'House number and Parcel ID are required' });
      return;
    }
    const created = villageDb.createHouse({
      house_number,
      parcel_id,
      house_type: house_type || 'PUCCA',
      ownership_type: ownership_type || 'OWNED',
      latitude: Number(latitude) || 32.4945,
      longitude: Number(longitude) || 74.5228,
    });
    res.status(201).json(created);
  });

  app.put('/api/houses/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const updated = villageDb.updateHouse(id, req.body);
    if (!updated) {
      res.status(404).json({ error: `House #${id} not found` });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/houses/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = villageDb.deleteHouse(id);
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }
    res.json({ success: true, message: `House #${id} deleted successfully` });
  });

  // ----------------------------------------------------
  // FAMILIES API
  // ----------------------------------------------------
  app.get('/api/families', requireAuth, (req: Request, res: Response) => {
    const { search, house_id, cast, page, limit, sortField, sortDir } = req.query;
    const result = villageDb.getFamilies({
      search: search as string,
      house_id: house_id ? Number(house_id) : undefined,
      cast: cast as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      sortField: sortField as string,
      sortDir: sortDir as 'asc' | 'desc',
    });
    res.json(result);
  });

  app.get('/api/families/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const family = villageDb.getFamilyById(id);
    if (!family) {
      res.status(404).json({ error: `Family #${id} not found` });
      return;
    }
    res.json(family);
  });

  app.post('/api/families', requireAuth, (req: Request, res: Response) => {
    const { family_number, house_id, guardian_id, cast } = req.body;
    if (!family_number || !house_id) {
      res.status(400).json({ error: 'Family number and House ID are required' });
      return;
    }
    const created = villageDb.createFamily({
      family_number,
      house_id: Number(house_id),
      guardian_id: guardian_id ? Number(guardian_id) : null,
      cast: cast || 'General',
    });
    res.status(201).json(created);
  });

  app.put('/api/families/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const updated = villageDb.updateFamily(id, req.body);
    if (!updated) {
      res.status(404).json({ error: `Family #${id} not found` });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/families/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = villageDb.deleteFamily(id);
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }
    res.json({ success: true, message: `Family #${id} deleted successfully` });
  });

  // ----------------------------------------------------
  // PEOPLE API
  // ----------------------------------------------------
  app.get('/api/people', requireAuth, (req: Request, res: Response) => {
    const { search, gender, marital_status, minAge, maxAge, house_id, family_id, page, limit, sortField, sortDir } = req.query;
    const result = villageDb.getPeople({
      search: search as string,
      gender: gender as string,
      marital_status: marital_status as string,
      minAge: minAge !== undefined ? Number(minAge) : undefined,
      maxAge: maxAge !== undefined ? Number(maxAge) : undefined,
      house_id: house_id ? Number(house_id) : undefined,
      family_id: family_id ? Number(family_id) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      sortField: sortField as string,
      sortDir: sortDir as 'asc' | 'desc',
    });
    res.json(result);
  });

  app.get('/api/people/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const person = villageDb.getPersonById(id);
    if (!person) {
      res.status(404).json({ error: `Person #${id} not found` });
      return;
    }
    res.json(person);
  });

  app.post('/api/people', requireAuth, (req: Request, res: Response) => {
    const { full_name, family_id, gender, date_of_birth, cnic, phone, marital_status, father_id, mother_id, spouse_id } = req.body;
    if (!full_name || !family_id) {
      res.status(400).json({ error: 'Full name and Family ID are required' });
      return;
    }
    const created = villageDb.createPerson({
      full_name,
      family_id: Number(family_id),
      gender: gender || 'MALE',
      date_of_birth: date_of_birth || '2000-01-01',
      cnic: cnic || '',
      phone: phone || '',
      marital_status: marital_status || 'SINGLE',
      father_id: father_id ? Number(father_id) : null,
      mother_id: mother_id ? Number(mother_id) : null,
      spouse_id: spouse_id ? Number(spouse_id) : null,
    });
    res.status(201).json(created);
  });

  app.put('/api/people/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const updated = villageDb.updatePerson(id, req.body);
    if (!updated) {
      res.status(404).json({ error: `Person #${id} not found` });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/people/:id', requireAuth, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = villageDb.deletePerson(id);
    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }
    res.json({ success: true, message: `Person #${id} deleted successfully` });
  });

  // ----------------------------------------------------
  // SECONDARY RESOURCE APIS (Education, Employment, Skills, Land, Vehicles, Facilities)
  // ----------------------------------------------------
  app.get('/api/education', requireAuth, (req: Request, res: Response) => {
    const { search, page, limit } = req.query;
    res.json(villageDb.getEducation({ search: search as string, page: Number(page), limit: Number(limit) }));
  });

  app.post('/api/education', requireAuth, (req: Request, res: Response) => {
    res.status(201).json(villageDb.createEducation(req.body));
  });

  app.put('/api/education/:id', requireAuth, (req: Request, res: Response) => {
    const updated = villageDb.updateEducation(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  });

  app.delete('/api/education/:id', requireAuth, (req: Request, res: Response) => {
    villageDb.deleteEducation(Number(req.params.id));
    res.json({ success: true });
  });

  app.get('/api/employment', requireAuth, (req: Request, res: Response) => {
    const { search, page, limit } = req.query;
    res.json(villageDb.getEmployment({ search: search as string, page: Number(page), limit: Number(limit) }));
  });

  app.post('/api/employment', requireAuth, (req: Request, res: Response) => {
    res.status(201).json(villageDb.createEmployment(req.body));
  });

  app.put('/api/employment/:id', requireAuth, (req: Request, res: Response) => {
    const updated = villageDb.updateEmployment(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  });

  app.delete('/api/employment/:id', requireAuth, (req: Request, res: Response) => {
    villageDb.deleteEmployment(Number(req.params.id));
    res.json({ success: true });
  });

  app.get('/api/skills', requireAuth, (req: Request, res: Response) => {
    const { search, page, limit } = req.query;
    res.json(villageDb.getSkills({ search: search as string, page: Number(page), limit: Number(limit) }));
  });

  app.post('/api/skills', requireAuth, (req: Request, res: Response) => {
    res.status(201).json(villageDb.createSkill(req.body));
  });

  app.put('/api/skills/:id', requireAuth, (req: Request, res: Response) => {
    const updated = villageDb.updateSkill(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  });

  app.delete('/api/skills/:id', requireAuth, (req: Request, res: Response) => {
    villageDb.deleteSkill(Number(req.params.id));
    res.json({ success: true });
  });

  app.get('/api/land', requireAuth, (req: Request, res: Response) => {
    const { search, page, limit } = req.query;
    res.json(villageDb.getLand({ search: search as string, page: Number(page), limit: Number(limit) }));
  });

  app.post('/api/land', requireAuth, (req: Request, res: Response) => {
    res.status(201).json(villageDb.createLand(req.body));
  });

  app.put('/api/land/:id', requireAuth, (req: Request, res: Response) => {
    const updated = villageDb.updateLand(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  });

  app.delete('/api/land/:id', requireAuth, (req: Request, res: Response) => {
    villageDb.deleteLand(Number(req.params.id));
    res.json({ success: true });
  });

  app.get('/api/vehicles', requireAuth, (req: Request, res: Response) => {
    const { search, page, limit } = req.query;
    res.json(villageDb.getVehicles({ search: search as string, page: Number(page), limit: Number(limit) }));
  });

  app.post('/api/vehicles', requireAuth, (req: Request, res: Response) => {
    res.status(201).json(villageDb.createVehicle(req.body));
  });

  app.put('/api/vehicles/:id', requireAuth, (req: Request, res: Response) => {
    const updated = villageDb.updateVehicle(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  });

  app.delete('/api/vehicles/:id', requireAuth, (req: Request, res: Response) => {
    villageDb.deleteVehicle(Number(req.params.id));
    res.json({ success: true });
  });

  app.get('/api/household-facilities', requireAuth, (req: Request, res: Response) => {
    const { page, limit } = req.query;
    res.json(villageDb.getFacilities({ page: Number(page), limit: Number(limit) }));
  });

  app.put('/api/household-facilities/:houseId', requireAuth, (req: Request, res: Response) => {
    const houseId = Number(req.params.houseId);
    const updated = villageDb.updateFacility(houseId, req.body);
    res.json(updated);
  });

  // ----------------------------------------------------
  // MAP API
  // ----------------------------------------------------
  app.get('/api/map/houses', requireAuth, (req: Request, res: Response) => {
    const houses = villageDb.getHousesForMap();
    res.json(houses);
  });

  app.get('/api/map/nearby', requireAuth, (req: Request, res: Response) => {
    const { house, radius } = req.query;
    if (!house) {
      return res.status(400).json({ error: 'House identifier required' });
    }
    const nearby = villageDb.findHousesNear(house as string, radius ? Number(radius) : 500);
    res.json(nearby);
  });

  // ----------------------------------------------------
  // AI ASSISTANT NATURAL LANGUAGE ANALYTICS API
  // ----------------------------------------------------
  app.post('/api/ai/query', requireAuth, async (req: Request, res: Response) => {
    try {
      const { query, history } = req.body;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Valid natural language query string required' });
        return;
      }

      const result = await processNaturalLanguageQuery(query, history || []);
      res.json(result);
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
      server: { middlewareMode: true },
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
