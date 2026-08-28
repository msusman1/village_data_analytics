export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'WIDOWED' | 'DIVORCED';
export type HouseType = 'PUCCA' | 'KACHA' | 'SEMI_PUCCA' | 'APARTMENT' | 'OTHER';
export type OwnershipType = 'OWNED' | 'RENTED' | 'SHARED' | 'GOVERNMENT' | 'UNKNOWN';
export type InternetType = 'FIBER' | 'DSL' | 'WIRELESS' | '4G' | 'NONE';
export type EducationLevel =
    | 'NONE'
    | 'PRIMARY'
    | 'MIDDLE'
    | 'MATRIC'
    | 'INTERMEDIATE'
    | 'BACHELORS'
    | 'MASTERS'
    | 'PHD'
    | 'RELIGIOUS_EDUCATION'
    | 'OTHER';
export type EmploymentStatus =
    | 'EMPLOYED'
    | 'UNEMPLOYED'
    | 'SELF_EMPLOYED'
    | 'STUDENT'
    | 'RETIRED'
    | 'HOMEMAKER'
    | 'FARMER'
    | 'BUSINESS';
export type SkillProficiency = 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT' | 'PROFESSIONAL';
export type VehicleType = 'MOTORCYCLE' | 'CAR' | 'TRACTOR' | 'RICKSHAW' | 'TRUCK' | 'OTHER';
export type LandType = 'AGRICULTURAL' | 'RESIDENTIAL' | 'COMMERCIAL';

export interface House {
    id: number;
    house_number: string;
    parcel_id: string;
    house_type: HouseType;
    ownership_type: OwnershipType;
    latitude: number;
    longitude: number;
    created_at?: string;
    updated_at?: string;
    // Computed / joined fields
    families_count?: number;
    population?: number;
    families?: Family[];
    facilities?: HouseholdFacilities | null;
}

export interface HouseholdFacilities {
    id: number;
    house_id: number;
    has_electricity: boolean;
    has_gas: boolean;
    has_internet: boolean;
    internet_type: InternetType;
    has_bike: boolean;
    has_car: boolean;
    created_at?: string;
    updated_at?: string;
    // Joined
    house_number?: string;
}

export interface Family {
    id: number;
    family_number: string;
    house_id: number;
    guardian_id: number | null;
    cast: string;
    created_at?: string;
    updated_at?: string;
    // Computed / joined fields
    house_number?: string;
    parcel_id?: string;
    guardian_name?: string;
    guardian_phone?: string;
    guardian?: Person | null;
    members_count?: number;
    members?: Person[];
}

export interface Person {
    id: number;
    family_id: number;
    full_name: string;
    gender: Gender;
    date_of_birth: string; // YYYY-MM-DD
    cnic: string;
    phone: string;
    marital_status: MaritalStatus;
    father_id: number | null;
    mother_id: number | null;
    spouse_id: number | null;
    created_at?: string;
    updated_at?: string;
    // Computed / joined fields
    age?: number;
    family_number?: string;
    house_id?: number;
    house_number?: string;
    parcel_id?: string;
    father_name?: string;
    mother_name?: string;
    spouse_name?: string;
    is_guardian?: boolean;
    education?: EducationData[];
    employment?: EmploymentData[];
    skills?: Skill[];
    vehicles?: Vehicle[];
    land?: Land[];
}

export interface EducationData {
    id: number;
    person_id: number;
    level: EducationLevel;
    institute: string;
    passing_year: number | null;
    field_of_study: string;
    created_at?: string;
    updated_at?: string;
    // Joined
    person_name?: string;
}

export interface EmploymentData {
    id: number;
    person_id: number;
    status: EmploymentStatus;
    occupation: string;
    employer_or_business_name: string;
    monthly_income: number | null;
    created_at?: string;
    updated_at?: string;
    // Joined
    person_name?: string;
}

export interface Skill {
    id: number;
    person_id: number;
    skill_name: string;
    proficiency_level: SkillProficiency;
    created_at?: string;
    updated_at?: string;
    // Joined
    person_name?: string;
}

export interface Land {
    id: number;
    owner_person_id: number;
    parcel_id: string;
    area_acres: number;
    land_type: LandType;
    location_description: string;
    created_at?: string;
    updated_at?: string;
    // Joined
    owner_name?: string;
}

export interface Vehicle {
    id: number;
    owner_person_id: number;
    vehicle_type: VehicleType;
    make_model: string;
    registration_number: string;
    year: number | null;
    created_at?: string;
    updated_at?: string;
    // Joined
    owner_name?: string;
}

export interface VillageStats {
    total_population: number;
    total_houses: number;
    total_families: number;
    total_guardians: number;
    children_under_5: number;
    children_under_10: number;
    children_under_18: number;
    adults: number;
    seniors_60_plus: number;
    average_age: number;
    average_family_size: number;
    houses_with_multiple_families: number;
    age_groups: {
        group: string;
        count: number;
        percentage: number;
    }[];
    gender_distribution: {
        gender: string;
        count: number;
        percentage: number;
    }[];
    family_size_distribution: {
        range: string;
        count: number;
    }[];
    population_by_house: {
        house_number: string;
        population: number;
        families_count: number;
    }[];
    education_distribution: {
        level: string;
        count: number;
    }[];
    employment_distribution: {
        status: string;
        count: number;
    }[];
    facility_stats: {
        electricity_percentage: number;
        gas_percentage: number;
        internet_percentage: number;
        bike_ownership_percentage: number;
        car_ownership_percentage: number;
    };
    vehicle_distribution: {
        type: string;
        count: number;
    }[];
}
