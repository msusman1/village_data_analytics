import React, {useState, useEffect} from 'react';
import {api} from '../lib/api';
import {Family, House, Person} from '../types';
import {Badge} from '../components/ui/Badge';
import {Modal} from '../components/ui/Modal';
import {ConfirmDialog} from '../components/ui/ConfirmDialog';
import {Pagination} from '../components/ui/Pagination';
import {
    Users,
    Plus,
    Search,
    Edit2,
    Trash2,
    Eye,
    Home,
    UserCheck,
    Phone,
    Shield,
} from 'lucide-react';

export const FamiliesView: React.FC = () => {
    const [families, setFamilies] = useState<Family[]>([]);
    const [houses, setHouses] = useState<House[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [castFilter, setCastFilter] = useState('');
    const [loading, setLoading] = useState(true);

    // Modals
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingFamilyId, setEditingFamilyId] = useState<number | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        family_number: '',
        house_id: 1,
        guardian_id: undefined as number | undefined,
        cast: 'Malhi',
    });

    useEffect(() => {
        loadFamilies();
    }, [page, search, castFilter]);

    useEffect(() => {
        loadLookups();
    }, []);

    const loadLookups = async () => {
        try {
            const [hData, pData] = await Promise.all([
                api.getHouses({limit: 100}),
                api.getPeople({limit: 300}),
            ]);
            setHouses(hData.items);
            setPeople(pData.items);
        } catch (e) {
            console.error(e);
        }
    };

    const loadFamilies = async () => {
        try {
            setLoading(true);
            const res = await api.getFamilies({
                page,
                limit: 10,
                search,
                cast: castFilter,
            });
            setFamilies(res.items);
            setTotal(res.total);
            setTotalPages(res.totalPages);
        } catch (err) {
            console.error('Failed to load families:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingFamilyId(null);
        setFormData({
            family_number: `FAM-${total + 1}`,
            house_id: houses[0]?.id || 1,
            guardian_id: undefined,
            cast: 'Malhi',
        });
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (f: Family) => {
        setEditingFamilyId(f.id);
        setFormData({
            family_number: f.family_number,
            house_id: f.house_id,
            guardian_id: f.guardian_id || undefined,
            cast: f.cast || 'Malhi',
        });
        setIsFormModalOpen(true);
    };

    const handleOpenDetail = async (f: Family) => {
        try {
            const full = await api.getFamily(f.id);
            setSelectedFamily(full);
            setIsDetailModalOpen(true);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveForm = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingFamilyId) {
                await api.updateFamily(editingFamilyId, formData);
            } else {
                await api.createFamily(formData);
            }
            setIsFormModalOpen(false);
            loadFamilies();
        } catch (err: any) {
            alert(err.message || 'Failed to save family unit');
        }
    };

    const handleDelete = async () => {
        if (!selectedFamily) return;
        try {
            await api.deleteFamily(selectedFamily.id);
            loadFamilies();
        } catch (err: any) {
            alert(err.message || 'Failed to delete family');
        }
    };

    return (
        <div className="space-y-4">
            {/* Top Filter and Actions */}
            <div
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                        <input
                            type="text"
                            placeholder="Search family #, guardian, house # or cast..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <select
                        value={castFilter}
                        onChange={(e) => {
                            setCastFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                        <option value="">All Casts & Lineages</option>

                        <option value="Mahr">Mahr</option>
                        <option value="Qurashi">Qurashi</option>
                        <option value="Maitla">Maitla</option>
                        <option value="Rahmani">Rahmani</option>
                        <option value="Faqeer">Faqeer</option>
                        <option value="Jutt">Jutt</option>
                        <option value="Mahli">Mahli</option>
                        <option value="Mulwany">Mulwany</option>
                        <option value="Luhar">Luhar</option>
                        <option value="Ansari">Ansari</option>
                    </select>
                </div>

                <button
                    id="add-family-btn"
                    onClick={handleOpenCreate}
                    className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                    <Plus className="w-4 h-4"/> Register Family Unit
                </button>
            </div>

            {/* Families Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">Family #</th>
                            <th className="px-4 py-3">Assigned House</th>
                            <th className="px-4 py-3">Guardian / Household Head</th>
                            <th className="px-4 py-3">Contact Phone</th>
                            <th className="px-4 py-3">Cast / Clan</th>
                            <th className="px-4 py-3">Headcount</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                    Loading families directory...
                                </td>
                            </tr>
                        ) : families.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                    No family units found.
                                </td>
                            </tr>
                        ) : (
                            families.map((f) => (
                                <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-emerald-600"/>
                                        <span>{f.family_number}</span>
                                    </td>
                                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-slate-800 font-medium">
                        <Home className="w-3.5 h-3.5 text-slate-400"/> House #{f.house_number}
                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <UserCheck className="w-3.5 h-3.5 text-emerald-600"/>
                                            <span
                                                className="font-semibold text-slate-900">{f.guardian_name || 'Unassigned'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-[11px]">
                                        {f.guardian_phone ? (
                                            <span className="text-slate-700">{f.guardian_phone}</span>
                                        ) : (
                                            <span className="text-rose-500 font-sans font-medium">No Phone</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="secondary">{f.cast || 'General'}</Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-bold text-slate-900">{f.members_count}</span> members
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-1">
                                        <button
                                            onClick={() => handleOpenDetail(f)}
                                            title="View Roster"
                                            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                        >
                                            <Eye className="w-4 h-4"/>
                                        </button>
                                        <button
                                            onClick={() => handleOpenEdit(f)}
                                            title="Edit Family"
                                            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4"/>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedFamily(f);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            title="Delete Family"
                                            className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4"/>
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

            {/* Family Roster Detail Modal */}
            {selectedFamily && (
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title={`Family Unit #${selectedFamily.family_number}`}
                    subtitle={`Guardian: ${selectedFamily.guardian_name || 'N/A'} • House #${selectedFamily.house_number}`}
                    maxWidth="2xl"
                >
                    <div className="space-y-6">
                        {/* Header info cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[11px] text-slate-500 uppercase font-semibold">Members</span>
                                <p className="text-lg font-bold text-slate-900 mt-0.5">
                                    {selectedFamily.members_count} Individuals
                                </p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[11px] text-slate-500 uppercase font-semibold">Guardian</span>
                                <p className="text-xs font-bold text-slate-900 mt-1 truncate">
                                    {selectedFamily.guardian_name || 'Unassigned'}
                                </p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span
                                    className="text-[11px] text-slate-500 uppercase font-semibold">House Location</span>
                                <p className="text-sm font-bold text-slate-900 mt-1">
                                    House #{selectedFamily.house_number}
                                </p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[11px] text-slate-500 uppercase font-semibold">Cast / Clan</span>
                                <p className="text-sm font-bold text-slate-900 mt-1">
                                    {selectedFamily.cast || 'General'}
                                </p>
                            </div>
                        </div>

                        {/* Members Roster Table */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-emerald-600"/> Registered Family Members
                                ({selectedFamily.members?.length || 0})
                            </h4>
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-xs text-slate-600">
                                    <thead
                                        className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-3 py-2">Full Name</th>
                                        <th className="px-3 py-2">Calculated Age</th>
                                        <th className="px-3 py-2">Gender</th>
                                        <th className="px-3 py-2">Date of Birth</th>
                                        <th className="px-3 py-2">CNIC</th>
                                        <th className="px-3 py-2">Status</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                    {selectedFamily.members?.map((m) => (
                                        <tr key={m.id} className="hover:bg-slate-50/80">
                                            <td className="px-3 py-2 font-semibold text-slate-900">
                                                {m.full_name}
                                                {m.is_guardian && (
                                                    <span
                                                        className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                              Head
                            </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 font-bold text-slate-800">{m.age} yrs</td>
                                            <td className="px-3 py-2 capitalize">{m.gender.toLowerCase()}</td>
                                            <td className="px-3 py-2 font-mono text-[11px]">{m.date_of_birth}</td>
                                            <td className="px-3 py-2 font-mono text-[11px]">{m.cnic}</td>
                                            <td className="px-3 py-2">
                                                <Badge variant="neutral">{m.marital_status}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Family Create / Edit Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingFamilyId ? `Edit Family #${formData.family_number}` : 'Register Family Unit'}
                maxWidth="md"
            >
                <form onSubmit={handleSaveForm} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Family Number</label>
                            <input
                                type="text"
                                required
                                value={formData.family_number}
                                onChange={(e) => setFormData({...formData, family_number: e.target.value})}
                                placeholder="e.g. FAM-43"
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Cast / Clan</label>
                            <input
                                type="text"
                                required
                                value={formData.cast}
                                onChange={(e) => setFormData({...formData, cast: e.target.value})}
                                placeholder="e.g. Malhi"
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned House</label>
                        <select
                            value={formData.house_id}
                            onChange={(e) => setFormData({...formData, house_id: Number(e.target.value)})}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                        >
                            {houses.map((h) => (
                                <option key={h.id} value={h.id}>
                                    House #{h.house_number} (Parcel ID: {h.parcel_id})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Guardian / Household Head (Optional)
                        </label>
                        <select
                            value={formData.guardian_id || ''}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    guardian_id: e.target.value ? Number(e.target.value) : undefined,
                                })
                            }
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                        >
                            <option value="">-- Select Resident as Guardian --</option>
                            {people.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.full_name} (Age {p.age} • House #{p.house_number})
                                </option>
                            ))}
                        </select>
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
                            {editingFamilyId ? 'Update Family' : 'Register Family'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            {selectedFamily && (
                <ConfirmDialog
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDelete}
                    title="Delete Family Unit"
                    message={`Are you sure you want to delete Family #${selectedFamily.family_number}?`}
                />
            )}
        </div>
    );
};
