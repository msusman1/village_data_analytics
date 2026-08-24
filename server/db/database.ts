import {
  House,
  HouseholdFacilities,
  Family,
  Person,
  EducationData,
  EmploymentData,
  Skill,
  Land,
  Vehicle,
  VillageStats,
} from '../../src/types/index.js';
import {
  INITIAL_HOUSES,
  INITIAL_FACILITIES,
  INITIAL_FAMILIES,
  INITIAL_PEOPLE,
  INITIAL_EDUCATION,
  INITIAL_EMPLOYMENT,
  INITIAL_SKILLS,
  INITIAL_LAND,
  INITIAL_VEHICLES,
} from './seedData.js';

export const CURRENT_REFERENCE_DATE = '2026-08-24';

export function calculateAge(dobStr: string, refDateStr: string = CURRENT_REFERENCE_DATE): number {
  if (!dobStr) return 0;
  const dob = new Date(dobStr);
  const ref = new Date(refDateStr);
  if (isNaN(dob.getTime())) return 0;

  let age = ref.getFullYear() - dob.getFullYear();
  const monthDiff = ref.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

class VillageDatabase {
  private houses: House[] = [];
  private facilities: HouseholdFacilities[] = [];
  private families: Family[] = [];
  private people: Person[] = [];
  private education: EducationData[] = [];
  private employment: EmploymentData[] = [];
  private skills: Skill[] = [];
  private land: Land[] = [];
  private vehicles: Vehicle[] = [];

  constructor() {
    this.resetToSeedData();
  }

  public resetToSeedData() {
    this.houses = JSON.parse(JSON.stringify(INITIAL_HOUSES));
    this.facilities = JSON.parse(JSON.stringify(INITIAL_FACILITIES));
    this.families = JSON.parse(JSON.stringify(INITIAL_FAMILIES));
    this.people = JSON.parse(JSON.stringify(INITIAL_PEOPLE));
    this.education = JSON.parse(JSON.stringify(INITIAL_EDUCATION));
    this.employment = JSON.parse(JSON.stringify(INITIAL_EMPLOYMENT));
    this.skills = JSON.parse(JSON.stringify(INITIAL_SKILLS));
    this.land = JSON.parse(JSON.stringify(INITIAL_LAND));
    this.vehicles = JSON.parse(JSON.stringify(INITIAL_VEHICLES));
  }

  // ==========================================
  // HOUSES
  // ==========================================
  public getHouses(params?: {
    search?: string;
    house_type?: string;
    ownership_type?: string;
    page?: number;
    limit?: number;
    sortField?: string;
    sortDir?: 'asc' | 'desc';
  }) {
    let result = this.houses.map((h) => this.enrichHouse(h));

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (h) =>
          h.house_number.toLowerCase().includes(q) ||
          h.parcel_id.toLowerCase().includes(q) ||
          h.house_type.toLowerCase().includes(q)
      );
    }

    if (params?.house_type && params.house_type !== 'ALL') {
      result = result.filter((h) => h.house_type === params.house_type);
    }

    if (params?.ownership_type && params.ownership_type !== 'ALL') {
      result = result.filter((h) => h.ownership_type === params.ownership_type);
    }

    if (params?.sortField) {
      const field = params.sortField as keyof House;
      const dir = params.sortDir === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        const valA = a[field] ?? '';
        const valB = b[field] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * dir;
        }
        return String(valA).localeCompare(String(valB)) * dir;
      });
    } else {
      result.sort((a, b) => Number(a.house_number) - Number(b.house_number));
    }

    const total = result.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;
    const items = result.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public getHouseById(id: number): House | null {
    const house = this.houses.find((h) => h.id === id);
    if (!house) return null;
    return this.enrichHouse(house, true);
  }

  public getHouseByNumber(houseNumber: string): House | null {
    const cleanNum = houseNumber.replace(/^#/, '').trim();
    const house = this.houses.find(
      (h) => h.house_number.toLowerCase() === cleanNum.toLowerCase()
    );
    if (!house) return null;
    return this.enrichHouse(house, true);
  }

  public createHouse(data: Omit<House, 'id'>): House {
    const nextId = this.houses.length > 0 ? Math.max(...this.houses.map((h) => h.id)) + 1 : 1;
    const newHouse: House = {
      ...data,
      id: nextId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.houses.push(newHouse);
    return this.enrichHouse(newHouse);
  }

  public updateHouse(id: number, data: Partial<House>): House | null {
    const index = this.houses.findIndex((h) => h.id === id);
    if (index === -1) return null;
    this.houses[index] = {
      ...this.houses[index],
      ...data,
      id,
      updated_at: new Date().toISOString(),
    };
    return this.enrichHouse(this.houses[index]);
  }

  public deleteHouse(id: number): { success: boolean; message?: string } {
    const families = this.families.filter((f) => f.house_id === id);
    if (families.length > 0) {
      return {
        success: false,
        message: `Cannot delete house #${id} because it contains ${families.length} families. Remove or reassign families first.`,
      };
    }
    this.houses = this.houses.filter((h) => h.id !== id);
    this.facilities = this.facilities.filter((f) => f.house_id !== id);
    return { success: true };
  }

  private enrichHouse(house: House, includeDetails = false): House {
    const families = this.families.filter((f) => f.house_id === house.id);
    const familyIds = new Set(families.map((f) => f.id));
    const people = this.people.filter((p) => familyIds.has(p.family_id));
    const facilities = this.facilities.find((fac) => fac.house_id === house.id) || null;

    const enriched: House = {
      ...house,
      families_count: families.length,
      population: people.length,
      facilities,
    };

    if (includeDetails) {
      enriched.families = families.map((f) => this.enrichFamily(f, true));
    }

    return enriched;
  }

  // ==========================================
  // FAMILIES
  // ==========================================
  public getFamilies(params?: {
    search?: string;
    house_id?: number;
    cast?: string;
    page?: number;
    limit?: number;
    sortField?: string;
    sortDir?: 'asc' | 'desc';
  }) {
    let result = this.families.map((f) => this.enrichFamily(f));

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.family_number.toLowerCase().includes(q) ||
          f.cast.toLowerCase().includes(q) ||
          (f.guardian_name && f.guardian_name.toLowerCase().includes(q)) ||
          (f.house_number && f.house_number.toLowerCase().includes(q))
      );
    }

    if (params?.house_id) {
      result = result.filter((f) => f.house_id === params.house_id);
    }

    if (params?.cast && params.cast !== 'ALL') {
      result = result.filter((f) => f.cast.toLowerCase() === params.cast?.toLowerCase());
    }

    if (params?.sortField) {
      const field = params.sortField as keyof Family;
      const dir = params.sortDir === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        const valA = a[field] ?? '';
        const valB = b[field] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * dir;
        }
        return String(valA).localeCompare(String(valB)) * dir;
      });
    }

    const total = result.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;
    const items = result.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public getFamilyById(id: number): Family | null {
    const family = this.families.find((f) => f.id === id);
    if (!family) return null;
    return this.enrichFamily(family, true);
  }

  public getFamilyByNumber(familyNum: string): Family | null {
    const cleanNum = familyNum.replace(/^#/, '').trim();
    const family = this.families.find(
      (f) =>
        f.family_number.toLowerCase() === cleanNum.toLowerCase() ||
        f.family_number.toLowerCase() === `fam-${cleanNum.toLowerCase().padStart(2, '0')}`
    );
    if (!family) return null;
    return this.enrichFamily(family, true);
  }

  public createFamily(data: Omit<Family, 'id'>): Family {
    const nextId = this.families.length > 0 ? Math.max(...this.families.map((f) => f.id)) + 1 : 1;
    const newFamily: Family = {
      ...data,
      id: nextId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.families.push(newFamily);
    return this.enrichFamily(newFamily);
  }

  public updateFamily(id: number, data: Partial<Family>): Family | null {
    const index = this.families.findIndex((f) => f.id === id);
    if (index === -1) return null;
    this.families[index] = {
      ...this.families[index],
      ...data,
      id,
      updated_at: new Date().toISOString(),
    };
    return this.enrichFamily(this.families[index]);
  }

  public deleteFamily(id: number): { success: boolean; message?: string } {
    const members = this.people.filter((p) => p.family_id === id);
    if (members.length > 0) {
      return {
        success: false,
        message: `Cannot delete family #${id} because it contains ${members.length} members. Remove or reassign members first.`,
      };
    }
    this.families = this.families.filter((f) => f.id !== id);
    return { success: true };
  }

  private enrichFamily(family: Family, includeMembers = false): Family {
    const house = this.houses.find((h) => h.id === family.house_id);
    const guardian = family.guardian_id
      ? this.people.find((p) => p.id === family.guardian_id)
      : null;
    const members = this.people.filter((p) => p.family_id === family.id);

    const enriched: Family = {
      ...family,
      house_number: house ? house.house_number : undefined,
      parcel_id: house ? house.parcel_id : undefined,
      guardian_name: guardian ? guardian.full_name : undefined,
      guardian_phone: guardian ? guardian.phone : undefined,
      guardian: guardian ? this.enrichPerson(guardian) : null,
      members_count: members.length,
    };

    if (includeMembers) {
      enriched.members = members.map((p) => this.enrichPerson(p));
    }

    return enriched;
  }

  // ==========================================
  // PEOPLE
  // ==========================================
  public getPeople(params?: {
    search?: string;
    gender?: string;
    marital_status?: string;
    minAge?: number;
    maxAge?: number;
    house_id?: number;
    family_id?: number;
    hasPhone?: boolean;
    hasDob?: boolean;
    page?: number;
    limit?: number;
    sortField?: string;
    sortDir?: 'asc' | 'desc';
  }) {
    let result = this.people.map((p) => this.enrichPerson(p));

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          p.cnic.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q) ||
          (p.house_number && p.house_number.toLowerCase().includes(q)) ||
          (p.family_number && p.family_number.toLowerCase().includes(q))
      );
    }

    if (params?.gender && params.gender !== 'ALL') {
      result = result.filter((p) => p.gender === params.gender);
    }

    if (params?.marital_status && params.marital_status !== 'ALL') {
      result = result.filter((p) => p.marital_status === params.marital_status);
    }

    if (params?.family_id) {
      result = result.filter((p) => p.family_id === params.family_id);
    }

    if (params?.house_id) {
      result = result.filter((p) => p.house_id === params.house_id);
    }

    if (params?.minAge !== undefined) {
      result = result.filter((p) => (p.age ?? 0) >= params.minAge!);
    }

    if (params?.maxAge !== undefined) {
      result = result.filter((p) => (p.age ?? 0) <= params.maxAge!);
    }

    if (params?.hasPhone !== undefined) {
      result = result.filter((p) => (params.hasPhone ? Boolean(p.phone) : !p.phone));
    }

    if (params?.hasDob !== undefined) {
      result = result.filter((p) => (params.hasDob ? Boolean(p.date_of_birth) : !p.date_of_birth));
    }

    if (params?.sortField) {
      const field = params.sortField as keyof Person;
      const dir = params.sortDir === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        const valA = a[field] ?? '';
        const valB = b[field] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * dir;
        }
        return String(valA).localeCompare(String(valB)) * dir;
      });
    } else {
      result.sort((a, b) => a.id - b.id);
    }

    const total = result.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;
    const items = result.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  public getPersonById(id: number): Person | null {
    const person = this.people.find((p) => p.id === id);
    if (!person) return null;
    return this.enrichPerson(person, true);
  }

  public findPeopleByName(nameQuery: string): Person[] {
    const clean = nameQuery.toLowerCase().replace(/^(mr\.|mrs\.|ms\.|choudhary|rana|sheikh)\s*/i, '').trim();
    const tokens = clean.split(/\s+/).filter((t) => t.length > 2);

    return this.people
      .filter((p) => {
        const fullName = p.full_name.toLowerCase();
        if (fullName.includes(clean)) return true;
        if (tokens.length > 0 && tokens.every((tok) => fullName.includes(tok))) return true;
        return false;
      })
      .map((p) => this.enrichPerson(p, true));
  }

  public createPerson(data: Omit<Person, 'id'>): Person {
    const nextId = this.people.length > 0 ? Math.max(...this.people.map((p) => p.id)) + 1 : 1;
    const newPerson: Person = {
      ...data,
      id: nextId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.people.push(newPerson);
    return this.enrichPerson(newPerson);
  }

  public updatePerson(id: number, data: Partial<Person>): Person | null {
    const index = this.people.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.people[index] = {
      ...this.people[index],
      ...data,
      id,
      updated_at: new Date().toISOString(),
    };
    return this.enrichPerson(this.people[index]);
  }

  public deletePerson(id: number): { success: boolean; message?: string } {
    // Check if guardian
    const guardianOf = this.families.filter((f) => f.guardian_id === id);
    if (guardianOf.length > 0) {
      return {
        success: false,
        message: `Cannot delete person #${id} because they are registered as the Guardian for ${guardianOf.length} family. Reassign family guardian first.`,
      };
    }
    this.people = this.people.filter((p) => p.id !== id);
    this.education = this.education.filter((e) => e.person_id !== id);
    this.employment = this.employment.filter((e) => e.person_id !== id);
    this.skills = this.skills.filter((s) => s.person_id !== id);
    this.land = this.land.filter((l) => l.owner_person_id !== id);
    this.vehicles = this.vehicles.filter((v) => v.owner_person_id !== id);
    return { success: true };
  }

  private enrichPerson(person: Person, includeRelations = false): Person {
    const age = calculateAge(person.date_of_birth);
    const family = this.families.find((f) => f.id === person.family_id);
    const house = family ? this.houses.find((h) => h.id === family.house_id) : null;
    const is_guardian = this.families.some((f) => f.guardian_id === person.id);

    const father = person.father_id ? this.people.find((p) => p.id === person.father_id) : null;
    const mother = person.mother_id ? this.people.find((p) => p.id === person.mother_id) : null;
    const spouse = person.spouse_id ? this.people.find((p) => p.id === person.spouse_id) : null;

    const enriched: Person = {
      ...person,
      age,
      family_number: family ? family.family_number : undefined,
      house_id: house ? house.id : undefined,
      house_number: house ? house.house_number : undefined,
      parcel_id: house ? house.parcel_id : undefined,
      father_name: father ? father.full_name : undefined,
      mother_name: mother ? mother.full_name : undefined,
      spouse_name: spouse ? spouse.full_name : undefined,
      is_guardian,
    };

    if (includeRelations) {
      enriched.education = this.education.filter((e) => e.person_id === person.id);
      enriched.employment = this.employment.filter((e) => e.person_id === person.id);
      enriched.skills = this.skills.filter((s) => s.person_id === person.id);
      enriched.vehicles = this.vehicles.filter((v) => v.owner_person_id === person.id);
      enriched.land = this.land.filter((l) => l.owner_person_id === person.id);
    }

    return enriched;
  }

  // ==========================================
  // EDUCATION
  // ==========================================
  public getEducation(params?: { search?: string; page?: number; limit?: number }) {
    let result = this.education.map((e) => {
      const person = this.people.find((p) => p.id === e.person_id);
      return {
        ...e,
        person_name: person ? person.full_name : 'Unknown',
      };
    });

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.institute.toLowerCase().includes(q) ||
          e.field_of_study.toLowerCase().includes(q) ||
          e.level.toLowerCase().includes(q) ||
          (e.person_name && e.person_name.toLowerCase().includes(q))
      );
    }

    const total = result.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const items = result.slice((page - 1) * limit, page * limit);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public createEducation(data: Omit<EducationData, 'id'>): EducationData {
    const nextId = this.education.length > 0 ? Math.max(...this.education.map((e) => e.id)) + 1 : 1;
    const item: EducationData = {
      ...data,
      id: nextId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.education.push(item);
    return item;
  }

  public updateEducation(id: number, data: Partial<EducationData>): EducationData | null {
    const index = this.education.findIndex((e) => e.id === id);
    if (index === -1) return null;
    this.education[index] = { ...this.education[index], ...data, id, updated_at: new Date().toISOString() };
    return this.education[index];
  }

  public deleteEducation(id: number): boolean {
    const initial = this.education.length;
    this.education = this.education.filter((e) => e.id !== id);
    return this.education.length < initial;
  }

  // ==========================================
  // EMPLOYMENT
  // ==========================================
  public getEmployment(params?: { search?: string; page?: number; limit?: number }) {
    let result = this.employment.map((e) => {
      const person = this.people.find((p) => p.id === e.person_id);
      return {
        ...e,
        person_name: person ? person.full_name : 'Unknown',
      };
    });

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.occupation.toLowerCase().includes(q) ||
          e.employer_or_business_name.toLowerCase().includes(q) ||
          e.status.toLowerCase().includes(q) ||
          (e.person_name && e.person_name.toLowerCase().includes(q))
      );
    }

    const total = result.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const items = result.slice((page - 1) * limit, page * limit);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public createEmployment(data: Omit<EmploymentData, 'id'>): EmploymentData {
    const nextId = this.employment.length > 0 ? Math.max(...this.employment.map((e) => e.id)) + 1 : 1;
    const item: EmploymentData = {
      ...data,
      id: nextId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.employment.push(item);
    return item;
  }

  public updateEmployment(id: number, data: Partial<EmploymentData>): EmploymentData | null {
    const index = this.employment.findIndex((e) => e.id === id);
    if (index === -1) return null;
    this.employment[index] = { ...this.employment[index], ...data, id, updated_at: new Date().toISOString() };
    return this.employment[index];
  }

  public deleteEmployment(id: number): boolean {
    const initial = this.employment.length;
    this.employment = this.employment.filter((e) => e.id !== id);
    return this.employment.length < initial;
  }

  // ==========================================
  // SKILLS
  // ==========================================
  public getSkills(params?: { search?: string; page?: number; limit?: number }) {
    let result = this.skills.map((s) => {
      const person = this.people.find((p) => p.id === s.person_id);
      return {
        ...s,
        person_name: person ? person.full_name : 'Unknown',
      };
    });

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.skill_name.toLowerCase().includes(q) ||
          s.proficiency_level.toLowerCase().includes(q) ||
          (s.person_name && s.person_name.toLowerCase().includes(q))
      );
    }

    const total = result.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const items = result.slice((page - 1) * limit, page * limit);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public createSkill(data: Omit<Skill, 'id'>): Skill {
    const nextId = this.skills.length > 0 ? Math.max(...this.skills.map((s) => s.id)) + 1 : 1;
    const item: Skill = {
      ...data,
      id: nextId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.skills.push(item);
    return item;
  }

  public updateSkill(id: number, data: Partial<Skill>): Skill | null {
    const index = this.skills.findIndex((s) => s.id === id);
    if (index === -1) return null;
    this.skills[index] = { ...this.skills[index], ...data, id, updated_at: new Date().toISOString() };
    return this.skills[index];
  }

  public deleteSkill(id: number): boolean {
    const initial = this.skills.length;
    this.skills = this.skills.filter((s) => s.id !== id);
    return this.skills.length < initial;
  }

  // ==========================================
  // LAND
  // ==========================================
  public getLand(params?: { search?: string; page?: number; limit?: number }) {
    let result = this.land.map((l) => {
      const person = this.people.find((p) => p.id === l.owner_person_id);
      return {
        ...l,
        owner_name: person ? person.full_name : 'Unknown',
      };
    });

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.parcel_id.toLowerCase().includes(q) ||
          l.land_type.toLowerCase().includes(q) ||
          l.location_description.toLowerCase().includes(q) ||
          (l.owner_name && l.owner_name.toLowerCase().includes(q))
      );
    }

    const total = result.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const items = result.slice((page - 1) * limit, page * limit);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public createLand(data: Omit<Land, 'id'>): Land {
    const nextId = this.land.length > 0 ? Math.max(...this.land.map((l) => l.id)) + 1 : 1;
    const item: Land = {
      ...data,
      id: nextId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.land.push(item);
    return item;
  }

  public updateLand(id: number, data: Partial<Land>): Land | null {
    const index = this.land.findIndex((l) => l.id === id);
    if (index === -1) return null;
    this.land[index] = { ...this.land[index], ...data, id, updated_at: new Date().toISOString() };
    return this.land[index];
  }

  public deleteLand(id: number): boolean {
    const initial = this.land.length;
    this.land = this.land.filter((l) => l.id !== id);
    return this.land.length < initial;
  }

  // ==========================================
  // VEHICLES
  // ==========================================
  public getVehicles(params?: { search?: string; page?: number; limit?: number }) {
    let result = this.vehicles.map((v) => {
      const person = this.people.find((p) => p.id === v.owner_person_id);
      return {
        ...v,
        owner_name: person ? person.full_name : 'Unknown',
      };
    });

    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (v) =>
          v.make_model.toLowerCase().includes(q) ||
          v.registration_number.toLowerCase().includes(q) ||
          v.vehicle_type.toLowerCase().includes(q) ||
          (v.owner_name && v.owner_name.toLowerCase().includes(q))
      );
    }

    const total = result.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const items = result.slice((page - 1) * limit, page * limit);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public createVehicle(data: Omit<Vehicle, 'id'>): Vehicle {
    const nextId = this.vehicles.length > 0 ? Math.max(...this.vehicles.map((v) => v.id)) + 1 : 1;
    const item: Vehicle = {
      ...data,
      id: nextId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.vehicles.push(item);
    return item;
  }

  public updateVehicle(id: number, data: Partial<Vehicle>): Vehicle | null {
    const index = this.vehicles.findIndex((v) => v.id === id);
    if (index === -1) return null;
    this.vehicles[index] = { ...this.vehicles[index], ...data, id, updated_at: new Date().toISOString() };
    return this.vehicles[index];
  }

  public deleteVehicle(id: number): boolean {
    const initial = this.vehicles.length;
    this.vehicles = this.vehicles.filter((v) => v.id !== id);
    return this.vehicles.length < initial;
  }

  // ==========================================
  // HOUSEHOLD FACILITIES
  // ==========================================
  public getFacilities(params?: { page?: number; limit?: number }) {
    const result = this.facilities.map((fac) => {
      const house = this.houses.find((h) => h.id === fac.house_id);
      return {
        ...fac,
        house_number: house ? house.house_number : 'Unknown',
      };
    });
    const total = result.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const items = result.slice((page - 1) * limit, page * limit);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public updateFacility(houseId: number, data: Partial<HouseholdFacilities>): HouseholdFacilities {
    const index = this.facilities.findIndex((f) => f.house_id === houseId);
    if (index === -1) {
      const nextId = this.facilities.length > 0 ? Math.max(...this.facilities.map((f) => f.id)) + 1 : 1;
      const newFac: HouseholdFacilities = {
        id: nextId,
        house_id: houseId,
        has_electricity: data.has_electricity ?? true,
        has_gas: data.has_gas ?? false,
        has_internet: data.has_internet ?? false,
        internet_type: data.internet_type ?? 'NONE',
        has_bike: data.has_bike ?? false,
        has_car: data.has_car ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.facilities.push(newFac);
      return newFac;
    }
    this.facilities[index] = {
      ...this.facilities[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.facilities[index];
  }

  // ==========================================
  // DASHBOARD & ANALYTICS
  // ==========================================
  public getVillageStats(): VillageStats {
    const people = this.people.map((p) => this.enrichPerson(p));
    const total_population = people.length;
    const total_houses = this.houses.length;
    const total_families = this.families.length;

    const guardianIds = new Set(
      this.families.map((f) => f.guardian_id).filter((g): g is number => g !== null)
    );
    const total_guardians = guardianIds.size;

    let children_under_5 = 0;
    let children_under_10 = 0;
    let children_under_18 = 0;
    let adults = 0;
    let seniors_60_plus = 0;
    let totalAge = 0;

    const ageGroupCounts = {
      '0–4': 0,
      '5–9': 0,
      '10–17': 0,
      '18–29': 0,
      '30–44': 0,
      '45–59': 0,
      '60+': 0,
    };

    const genderCounts: Record<string, number> = {
      MALE: 0,
      FEMALE: 0,
      OTHER: 0,
      UNKNOWN: 0,
    };

    for (const p of people) {
      const age = p.age ?? 0;
      totalAge += age;

      if (age < 5) children_under_5++;
      if (age < 10) children_under_10++;
      if (age < 18) children_under_18++;
      if (age >= 18) adults++;
      if (age >= 60) seniors_60_plus++;

      if (age <= 4) ageGroupCounts['0–4']++;
      else if (age <= 9) ageGroupCounts['5–9']++;
      else if (age <= 17) ageGroupCounts['10–17']++;
      else if (age <= 29) ageGroupCounts['18–29']++;
      else if (age <= 44) ageGroupCounts['30–44']++;
      else if (age <= 59) ageGroupCounts['45–59']++;
      else ageGroupCounts['60+']++;

      genderCounts[p.gender] = (genderCounts[p.gender] || 0) + 1;
    }

    const average_age = total_population > 0 ? Number((totalAge / total_population).toFixed(1)) : 0;
    const average_family_size =
      total_families > 0 ? Number((total_population / total_families).toFixed(1)) : 0;

    // Houses with multiple families
    const familiesPerHouse = new Map<number, number>();
    for (const f of this.families) {
      familiesPerHouse.set(f.house_id, (familiesPerHouse.get(f.house_id) || 0) + 1);
    }
    let houses_with_multiple_families = 0;
    for (const count of familiesPerHouse.values()) {
      if (count > 1) houses_with_multiple_families++;
    }

    // Age groups with percentages
    const age_groups = Object.entries(ageGroupCounts).map(([group, count]) => ({
      group,
      count,
      percentage: total_population > 0 ? Number(((count / total_population) * 100).toFixed(1)) : 0,
    }));

    // Gender distribution
    const gender_distribution = Object.entries(genderCounts)
      .filter(([_, count]) => count > 0)
      .map(([gender, count]) => ({
        gender,
        count,
        percentage: total_population > 0 ? Number(((count / total_population) * 100).toFixed(1)) : 0,
      }));

    // Family size distribution
    const familySizeBuckets = {
      '1–3 members': 0,
      '4–5 members': 0,
      '6–8 members': 0,
      '9–12 members': 0,
      '13+ members': 0,
    };
    for (const f of this.families) {
      const count = this.people.filter((p) => p.family_id === f.id).length;
      if (count <= 3) familySizeBuckets['1–3 members']++;
      else if (count <= 5) familySizeBuckets['4–5 members']++;
      else if (count <= 8) familySizeBuckets['6–8 members']++;
      else if (count <= 12) familySizeBuckets['9–12 members']++;
      else familySizeBuckets['13+ members']++;
    }
    const family_size_distribution = Object.entries(familySizeBuckets).map(([range, count]) => ({
      range,
      count,
    }));

    // Population by house
    const population_by_house = this.houses
      .map((h) => {
        const enriched = this.enrichHouse(h);
        return {
          house_number: `House ${h.house_number}`,
          population: enriched.population ?? 0,
          families_count: enriched.families_count ?? 0,
        };
      })
      .sort((a, b) => b.population - a.population);

    // Education distribution
    const eduCounts: Record<string, number> = {};
    for (const e of this.education) {
      eduCounts[e.level] = (eduCounts[e.level] || 0) + 1;
    }
    const education_distribution = Object.entries(eduCounts).map(([level, count]) => ({
      level,
      count,
    }));

    // Employment distribution
    const empCounts: Record<string, number> = {};
    for (const e of this.employment) {
      empCounts[e.status] = (empCounts[e.status] || 0) + 1;
    }
    const employment_distribution = Object.entries(empCounts).map(([status, count]) => ({
      status,
      count,
    }));

    // Facility statistics
    const totalFacilities = this.facilities.length || 1;
    let elec = 0;
    let gas = 0;
    let internet = 0;
    let bike = 0;
    let car = 0;
    for (const f of this.facilities) {
      if (f.has_electricity) elec++;
      if (f.has_gas) gas++;
      if (f.has_internet) internet++;
      if (f.has_bike) bike++;
      if (f.has_car) car++;
    }
    const facility_stats = {
      electricity_percentage: Number(((elec / totalFacilities) * 100).toFixed(1)),
      gas_percentage: Number(((gas / totalFacilities) * 100).toFixed(1)),
      internet_percentage: Number(((internet / totalFacilities) * 100).toFixed(1)),
      bike_ownership_percentage: Number(((bike / totalFacilities) * 100).toFixed(1)),
      car_ownership_percentage: Number(((car / totalFacilities) * 100).toFixed(1)),
    };

    // Vehicle distribution
    const vehCounts: Record<string, number> = {};
    for (const v of this.vehicles) {
      vehCounts[v.vehicle_type] = (vehCounts[v.vehicle_type] || 0) + 1;
    }
    const vehicle_distribution = Object.entries(vehCounts).map(([type, count]) => ({
      type,
      count,
    }));

    return {
      total_population,
      total_houses,
      total_families,
      total_guardians,
      children_under_5,
      children_under_10,
      children_under_18,
      adults,
      seniors_60_plus,
      average_age,
      average_family_size,
      houses_with_multiple_families,
      age_groups,
      gender_distribution,
      family_size_distribution,
      population_by_house,
      education_distribution,
      employment_distribution,
      facility_stats,
      vehicle_distribution,
    };
  }

  // ==========================================
  // GEOSPATIAL & MAPS
  // ==========================================
  public getHousesForMap() {
    return this.houses.map((h) => {
      const enriched = this.enrichHouse(h, true);
      return {
        id: h.id,
        house_number: h.house_number,
        parcel_id: h.parcel_id,
        house_type: h.house_type,
        ownership_type: h.ownership_type,
        latitude: h.latitude,
        longitude: h.longitude,
        population: enriched.population,
        families_count: enriched.families_count,
        facilities: enriched.facilities,
        families: enriched.families,
      };
    });
  }

  public findHousesNear(houseIdOrNumber: string | number, radiusMeters = 500) {
    let targetHouse: House | null = null;
    if (typeof houseIdOrNumber === 'number') {
      targetHouse = this.houses.find((h) => h.id === houseIdOrNumber) || null;
    } else {
      const clean = houseIdOrNumber.replace(/^house\s*#?/i, '').trim();
      targetHouse = this.houses.find((h) => h.house_number === clean || String(h.id) === clean) || null;
    }

    if (!targetHouse) return [];

    return this.houses
      .map((h) => {
        const distance = haversineDistanceMeters(
          targetHouse!.latitude,
          targetHouse!.longitude,
          h.latitude,
          h.longitude
        );
        const enriched = this.enrichHouse(h);
        return {
          id: h.id,
          house_number: h.house_number,
          parcel_id: h.parcel_id,
          distance_meters: distance,
          latitude: h.latitude,
          longitude: h.longitude,
          families_count: enriched.families_count ?? 0,
          population: enriched.population ?? 0,
          isTarget: h.id === targetHouse!.id,
        };
      })
      .filter((h) => h.distance_meters <= radiusMeters)
      .sort((a, b) => a.distance_meters - b.distance_meters);
  }

  // Expose raw access for query engine
  public getRawData() {
    return {
      houses: this.houses.map((h) => this.enrichHouse(h)),
      families: this.families.map((f) => this.enrichFamily(f)),
      people: this.people.map((p) => this.enrichPerson(p, true)),
      education: this.education,
      employment: this.employment,
      skills: this.skills,
      land: this.land,
      vehicles: this.vehicles,
      facilities: this.facilities,
    };
  }
}

export const villageDb = new VillageDatabase();
