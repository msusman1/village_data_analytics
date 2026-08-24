import {
  House,
  Family,
  Person,
  EducationData,
  EmploymentData,
  Skill,
  Land,
  Vehicle,
  HouseholdFacilities,
  VillageStats,
  AIQueryResponse,
} from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP Error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    fetchJson<{ success: boolean; user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  logout: () => fetchJson<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
  getMe: () => fetchJson<{ isAuthenticated: boolean; user: any }>('/api/auth/me'),

  // Stats
  getStats: () => fetchJson<VillageStats>('/api/stats'),

  // Houses
  getHouses: (params?: Record<string, any>) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchJson<{ items: House[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/houses${qs ? `?${qs}` : ''}`
    );
  },
  getHouse: (id: number) => fetchJson<House>(`/api/houses/${id}`),
  createHouse: (data: Partial<House>) =>
    fetchJson<House>('/api/houses', { method: 'POST', body: JSON.stringify(data) }),
  updateHouse: (id: number, data: Partial<House>) =>
    fetchJson<House>(`/api/houses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHouse: (id: number) =>
    fetchJson<{ success: boolean }>('/api/houses/${id}', { method: 'DELETE' }),

  // Families
  getFamilies: (params?: Record<string, any>) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchJson<{ items: Family[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/families${qs ? `?${qs}` : ''}`
    );
  },
  getFamily: (id: number) => fetchJson<Family>(`/api/families/${id}`),
  createFamily: (data: Partial<Family>) =>
    fetchJson<Family>('/api/families', { method: 'POST', body: JSON.stringify(data) }),
  updateFamily: (id: number, data: Partial<Family>) =>
    fetchJson<Family>(`/api/families/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFamily: (id: number) =>
    fetchJson<{ success: boolean }>(`/api/families/${id}`, { method: 'DELETE' }),

  // People
  getPeople: (params?: Record<string, any>) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchJson<{ items: Person[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/people${qs ? `?${qs}` : ''}`
    );
  },
  getPerson: (id: number) => fetchJson<Person>(`/api/people/${id}`),
  createPerson: (data: Partial<Person>) =>
    fetchJson<Person>('/api/people', { method: 'POST', body: JSON.stringify(data) }),
  updatePerson: (id: number, data: Partial<Person>) =>
    fetchJson<Person>(`/api/people/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePerson: (id: number) =>
    fetchJson<{ success: boolean }>(`/api/people/${id}`, { method: 'DELETE' }),

  // Education
  getEducation: (params?: Record<string, any>) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchJson<{ items: EducationData[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/education${qs ? `?${qs}` : ''}`
    );
  },
  createEducation: (data: Partial<EducationData>) =>
    fetchJson<EducationData>('/api/education', { method: 'POST', body: JSON.stringify(data) }),
  updateEducation: (id: number, data: Partial<EducationData>) =>
    fetchJson<EducationData>(`/api/education/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEducation: (id: number) =>
    fetchJson<{ success: boolean }>(`/api/education/${id}`, { method: 'DELETE' }),

  // Employment
  getEmployment: (params?: Record<string, any>) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchJson<{ items: EmploymentData[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/employment${qs ? `?${qs}` : ''}`
    );
  },
  createEmployment: (data: Partial<EmploymentData>) =>
    fetchJson<EmploymentData>('/api/employment', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployment: (id: number, data: Partial<EmploymentData>) =>
    fetchJson<EmploymentData>(`/api/employment/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployment: (id: number) =>
    fetchJson<{ success: boolean }>(`/api/employment/${id}`, { method: 'DELETE' }),

  // Skills
  getSkills: (params?: Record<string, any>) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchJson<{ items: Skill[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/skills${qs ? `?${qs}` : ''}`
    );
  },
  createSkill: (data: Partial<Skill>) =>
    fetchJson<Skill>('/api/skills', { method: 'POST', body: JSON.stringify(data) }),
  updateSkill: (id: number, data: Partial<Skill>) =>
    fetchJson<Skill>(`/api/skills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSkill: (id: number) =>
    fetchJson<{ success: boolean }>(`/api/skills/${id}`, { method: 'DELETE' }),

  // Land
  getLand: (params?: Record<string, any>) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchJson<{ items: Land[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/land${qs ? `?${qs}` : ''}`
    );
  },
  createLand: (data: Partial<Land>) =>
    fetchJson<Land>('/api/land', { method: 'POST', body: JSON.stringify(data) }),
  updateLand: (id: number, data: Partial<Land>) =>
    fetchJson<Land>(`/api/land/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLand: (id: number) =>
    fetchJson<{ success: boolean }>(`/api/land/${id}`, { method: 'DELETE' }),

  // Vehicles
  getVehicles: (params?: Record<string, any>) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchJson<{ items: Vehicle[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/vehicles${qs ? `?${qs}` : ''}`
    );
  },
  createVehicle: (data: Partial<Vehicle>) =>
    fetchJson<Vehicle>('/api/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id: number, data: Partial<Vehicle>) =>
    fetchJson<Vehicle>(`/api/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVehicle: (id: number) =>
    fetchJson<{ success: boolean }>(`/api/vehicles/${id}`, { method: 'DELETE' }),

  // Facilities
  getFacilities: (params?: Record<string, any>) => {
    const qs = new URLSearchParams(params as any).toString();
    return fetchJson<{ items: HouseholdFacilities[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/household-facilities${qs ? `?${qs}` : ''}`
    );
  },
  updateFacility: (houseId: number, data: Partial<HouseholdFacilities>) =>
    fetchJson<HouseholdFacilities>(`/api/household-facilities/${houseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Maps
  getMapHouses: () => fetchJson<House[]>('/api/map/houses'),
  getNearbyHouses: (house: string | number, radius?: number) =>
    fetchJson<any[]>(`/api/map/nearby?house=${encodeURIComponent(house)}&radius=${radius || 500}`),

  // AI Assistant
  queryAI: (query: string, history?: { role: string; content: string }[]) =>
    fetchJson<AIQueryResponse>('/api/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query, history }),
    }),
};
