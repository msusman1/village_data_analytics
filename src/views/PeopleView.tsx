import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Person, Family, House, Gender, MaritalStatus } from '../types';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';
import {
  User,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Home,
  Users,
  Phone,
  CreditCard,
  Calendar,
  Heart,
  GraduationCap,
  Briefcase,
  Wrench,
  Compass,
  Car,
  ShieldCheck,
} from 'lucide-react';

export const PeopleView: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [ageGroupFilter, setAgeGroupFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<number | null>(null);

  // Form Data
  const [formData, setFormData] = useState<{
    full_name: string;
    family_id: number;
    gender: Gender;
    date_of_birth: string;
    cnic: string;
    phone: string;
    marital_status: MaritalStatus;
    father_id: number | undefined;
    mother_id: number | undefined;
    spouse_id: number | undefined;
  }>({
    full_name: '',
    family_id: 1,
    gender: 'MALE',
    date_of_birth: '2000-01-01',
    cnic: '',
    phone: '',
    marital_status: 'SINGLE',
    father_id: undefined,
    mother_id: undefined,
    spouse_id: undefined,
  });

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadPeople();
  }, [page, search, genderFilter, ageGroupFilter]);

  const loadLookups = async () => {
    try {
      const fRes = await api.getFamilies({ limit: 100 });
      setFamilies(fRes.items);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPeople = async () => {
    try {
      setLoading(true);
      let minAge: number | undefined;
      let maxAge: number | undefined;

      if (ageGroupFilter === 'UNDER_5') {
        maxAge = 4;
      } else if (ageGroupFilter === 'UNDER_10') {
        maxAge = 9;
      } else if (ageGroupFilter === 'UNDER_18') {
        maxAge = 17;
      } else if (ageGroupFilter === 'EXACT_18') {
        minAge = 18;
        maxAge = 18;
      } else if (ageGroupFilter === 'ADULT_18_59') {
        minAge = 18;
        maxAge = 59;
      } else if (ageGroupFilter === 'SENIOR_60_PLUS') {
        minAge = 60;
      }

      const res = await api.getPeople({
        page,
        limit: 10,
        search,
        gender: genderFilter,
        minAge,
        maxAge,
      });
      setPeople(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load people:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPersonId(null);
    setFormData({
      full_name: '',
      family_id: families[0]?.id || 1,
      gender: 'MALE',
      date_of_birth: '2000-01-01',
      cnic: '',
      phone: '',
      marital_status: 'SINGLE',
      father_id: undefined,
      mother_id: undefined,
      spouse_id: undefined,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (p: Person) => {
    setEditingPersonId(p.id);
    setFormData({
      full_name: p.full_name,
      family_id: p.family_id,
      gender: p.gender,
      date_of_birth: p.date_of_birth,
      cnic: p.cnic || '',
      phone: p.phone || '',
      marital_status: p.marital_status || 'SINGLE',
      father_id: p.father_id || undefined,
      mother_id: p.mother_id || undefined,
      spouse_id: p.spouse_id || undefined,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = async (p: Person) => {
    try {
      const full = await api.getPerson(p.id);
      setSelectedPerson(full);
      setIsDetailModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPersonId) {
        await api.updatePerson(editingPersonId, formData);
      } else {
        await api.createPerson(formData);
      }
      setIsFormModalOpen(false);
      loadPeople();
    } catch (err: any) {
      alert(err.message || 'Failed to save person');
    }
  };

  const handleDelete = async () => {
    if (!selectedPerson) return;
    try {
      await api.deletePerson(selectedPerson.id);
      loadPeople();
    } catch (err: any) {
      alert(err.message || 'Failed to delete resident');
    }
  };

  // Helper to compute preview age for form
  const getPreviewAge = (dob: string) => {
    if (!dob) return 0;
    const ref = new Date('2026-08-24');
    const birth = new Date(dob);
    let age = ref.getFullYear() - birth.getFullYear();
    const m = ref.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap flex-1 items-center gap-3 w-full">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, CNIC, or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={ageGroupFilter}
            onChange={(e) => {
              setAgeGroupFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="ALL">All Age Groups</option>
            <option value="UNDER_5">Children Under 5</option>
            <option value="UNDER_10">Children Under 10</option>
            <option value="UNDER_18">Youth & Minors (&lt; 18)</option>
            <option value="EXACT_18">Exactly 18 Years Old</option>
            <option value="ADULT_18_59">Adults (18-59)</option>
            <option value="SENIOR_60_PLUS">Seniors (60+)</option>
          </select>

          <select
            value={genderFilter}
            onChange={(e) => {
              setGenderFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>

        <button
          id="add-person-btn"
          onClick={handleOpenCreate}
          className="w-full lg:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Register Citizen
        </button>
      </div>

      {/* People Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Resident Name</th>
                <th className="px-4 py-3">Calculated Age</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">Date of Birth</th>
                <th className="px-4 py-3">House & Family</th>
                <th className="px-4 py-3">CNIC</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Marital Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Loading resident directory...
                  </td>
                </tr>
              ) : people.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No resident records found.
                  </td>
                </tr>
              ) : (
                people.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{p.full_name}</span>
                        {p.is_guardian && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                            Guardian
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{p.age} yrs</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.gender === 'MALE' ? 'info' : 'secondary'}>
                        {p.gender}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      {p.date_of_birth}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">
                        House #{p.house_number} ({p.family_number})
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">{p.cnic || '-'}</td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      {p.phone || <span className="text-slate-400 font-sans">None</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="neutral">{p.marital_status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(p)}
                        title="View Complete Profile"
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        title="Edit Resident"
                        className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPerson(p);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Delete Resident"
                        className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={10}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Person Detail Profile Modal */}
      {selectedPerson && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={selectedPerson.full_name}
          subtitle={`Age ${selectedPerson.age} • House #${selectedPerson.house_number} (${selectedPerson.family_number})`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Primary Vitals */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Calculated Age</span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">{selectedPerson.age} Years</p>
                <span className="text-[10px] text-slate-400">Ref: 2026-08-24</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Date of Birth</span>
                <p className="text-sm font-bold text-slate-900 mt-1 font-mono">{selectedPerson.date_of_birth}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">CNIC Identity</span>
                <p className="text-xs font-bold text-slate-900 mt-1 font-mono">{selectedPerson.cnic || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Phone</span>
                <p className="text-xs font-bold text-slate-900 mt-1 font-mono">{selectedPerson.phone || 'None'}</p>
              </div>
            </div>

            {/* Lineage and Kinship */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" /> Family & Kinship Lineage
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-500 block">Father:</span>
                  <span className="font-semibold text-slate-900">{selectedPerson.father_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mother:</span>
                  <span className="font-semibold text-slate-900">{selectedPerson.mother_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Spouse:</span>
                  <span className="font-semibold text-slate-900">{selectedPerson.spouse_name || 'None (Single)'}</span>
                </div>
              </div>
            </div>

            {/* Linked Education & Employment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Education */}
              <div className="border border-slate-200 rounded-lg p-3">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" /> Education Qualification
                </h5>
                {selectedPerson.education && selectedPerson.education.length > 0 ? (
                  selectedPerson.education.map((ed) => (
                    <div key={ed.id} className="text-xs">
                      <p className="font-bold text-slate-900">{ed.field_of_study || ed.level}</p>
                      <p className="text-slate-500 text-[11px]">{ed.institute} • Class of {ed.passing_year || 'Ongoing'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No formal education record registered.</p>
                )}
              </div>

              {/* Employment */}
              <div className="border border-slate-200 rounded-lg p-3">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600" /> Employment & Labor
                </h5>
                {selectedPerson.employment && selectedPerson.employment.length > 0 ? (
                  selectedPerson.employment.map((emp) => (
                    <div key={emp.id} className="text-xs">
                      <p className="font-bold text-slate-900">{emp.occupation}</p>
                      <p className="text-slate-500 text-[11px]">
                        Status: {emp.status} • {emp.employer_or_business_name || 'Self-Employed'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Not active in labor registry (student/dependent).</p>
                )}
              </div>
            </div>

            {/* Linked Vehicles & Land */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Land Holdings */}
              <div className="border border-slate-200 rounded-lg p-3">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-600" /> Agricultural Land Holdings
                </h5>
                {selectedPerson.land && selectedPerson.land.length > 0 ? (
                  selectedPerson.land.map((l) => (
                    <div key={l.id} className="text-xs">
                      <p className="font-bold text-slate-900">
                        {l.area_acres} Acres ({l.land_type})
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Parcel #{l.parcel_id} • {l.location_description}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No registered land ownership.</p>
                )}
              </div>

              {/* Vehicles */}
              <div className="border border-slate-200 rounded-lg p-3">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-purple-600" /> Registered Vehicles
                </h5>
                {selectedPerson.vehicles && selectedPerson.vehicles.length > 0 ? (
                  selectedPerson.vehicles.map((v) => (
                    <div key={v.id} className="text-xs">
                      <p className="font-bold text-slate-900">
                        {v.make_model || v.vehicle_type} ({v.registration_number})
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {v.vehicle_type} • Model Year: {v.year || 'N/A'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No vehicles registered.</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Person Create / Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingPersonId ? `Edit Citizen: ${formData.full_name}` : 'Register New Resident'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveForm} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. Muhammad Bilal"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Family Unit</label>
              <select
                value={formData.family_id}
                onChange={(e) => setFormData({ ...formData, family_id: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
              >
                {families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.family_number} (House #{f.house_number})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
                Calculated: {getPreviewAge(formData.date_of_birth)} yrs (as of Aug 24, 2026)
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Marital Status</label>
              <select
                value={formData.marital_status}
                onChange={(e) => setFormData({ ...formData, marital_status: e.target.value as MaritalStatus })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="WIDOWED">Widowed</option>
                <option value="DIVORCED">Divorced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">CNIC (13 digits)</label>
              <input
                type="text"
                value={formData.cnic}
                onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                placeholder="34602-XXXXXXX-X"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+92-300-XXXXXXX"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors"
            >
              {editingPersonId ? 'Update Citizen' : 'Save Resident'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {selectedPerson && (
        <ConfirmDialog
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Delete Citizen Record"
          message={`Are you sure you want to delete the record for ${selectedPerson.full_name}?`}
        />
      )}
    </div>
  );
};
