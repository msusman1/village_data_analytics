import React, {useEffect, useState} from 'react';
import {api} from '../lib/api';
import {House, HouseType, OwnershipType, Person} from '../types';
import {Badge} from '../components/ui/Badge';
import {Modal} from '../components/ui/Modal';
import {ConfirmDialog} from '../components/ui/ConfirmDialog';
import {Pagination} from '../components/ui/Pagination';
import {Building2, Droplets, Edit2, Eye, Flame, Home, Plus, Search, Sun, Trash2, Users, Zap,} from 'lucide-react';

export const HousesView: React.FC = () => {
    const [houses, setHouses] = useState<House[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [houseTypeFilter, setHouseTypeFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [owners, setOwners] = useState<Person[]>([]);

    // Modals state
    const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingHouseId, setEditingHouseId] = useState<number | null>(null);

    // Form state
    const [formData, setFormData] = useState<{
        house_number: string;
        parcel_id: string;
        house_type: HouseType;
        ownership_type: OwnershipType;
        latitude: number;
        longitude: number;
        owner_id: number | null;
    }>({
        house_number: '',
        parcel_id: '',
        house_type: 'PUCCA',
        ownership_type: 'OWNED',
        latitude: 32.4945,
        longitude: 74.5228,
        owner_id: null,
    });

    useEffect(() => {
        loadHouses();
    }, [page, search, houseTypeFilter]);

    useEffect(() => {
        api.getPeople({ limit: 1000 }).then((res) => setOwners(res.items)).catch((err) =>
            console.error('Failed to load house owners:', err)
        );
    }, []);

    const loadHouses = async () => {
        try {
            setLoading(true);
            const res = await api.getHouses({
                page,
                limit: 10,
                search,
                house_type: houseTypeFilter,
            });
            setHouses(res.items);
            setTotal(res.total);
            setTotalPages(res.totalPages);
        } catch (err) {
            console.error('Failed to load houses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingHouseId(null);
        setFormData({
            house_number: '',
            parcel_id: '',
            house_type: 'PUCCA',
            ownership_type: 'OWNED',
            latitude: 32.4945,
            longitude: 74.5228,
            owner_id: null,
        });
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (h: House) => {
        setEditingHouseId(h.id);
        setFormData({
            house_number: h.house_number,
            parcel_id: h.parcel_id,
            house_type: h.house_type,
            ownership_type: h.ownership_type,
            latitude: h.latitude,
            longitude: h.longitude,
            owner_id: h.owner_id,
        });
        setIsFormModalOpen(true);
    };

    const handleOpenDetail = async (h: House) => {
        try {
            const full = await api.getHouse(h.id);
            setSelectedHouse(full);
            setIsDetailModalOpen(true);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveForm = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingHouseId) {
                await api.updateHouse(editingHouseId, formData);
            } else {
                await api.createHouse(formData);
            }
            setIsFormModalOpen(false);
            loadHouses();
        } catch (err: any) {
            alert(err.message || 'Failed to save house');
        }
    };

    const handleDelete = async () => {
        if (!selectedHouse) return;
        try {
            await api.deleteHouse(selectedHouse.id);
            loadHouses();
        } catch (err: any) {
            alert(err.message || 'Failed to delete house');
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
                            placeholder="Search house # or parcel..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <select
                        value={houseTypeFilter}
                        onChange={(e) => {
                            setHouseTypeFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                        <option value="">All House Types</option>
                        <option value="PUCCA">Pucca (Brick & Concrete)</option>
                        <option value="SEMI_PUCCA">Semi-Pucca</option>
                        <option value="KACHA">Kacha (Mud & Straw)</option>
                    </select>
                </div>

                <button
                    id="add-house-btn"
                    onClick={handleOpenCreate}
                    className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                    <Plus className="w-4 h-4"/> Add New House
                </button>
            </div>

            {/* Houses Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3">House #</th>
                            <th className="px-4 py-3">Parcel ID</th>
                            <th className="px-4 py-3">Construction Type</th>
                            <th className="px-4 py-3">Ownership</th>
                            <th className="px-4 py-3">Owner</th>
                            <th className="px-4 py-3">Families</th>
                            <th className="px-4 py-3">GPS Coordinates</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                                    Loading houses database...
                                </td>
                            </tr>
                        ) : houses.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                                    No houses match your search criteria.
                                </td>
                            </tr>
                        ) : (
                            houses.map((h) => (
                                <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-1.5">
                                        <Home className="w-3.5 h-3.5 text-emerald-600"/>
                                        <span>House #{h.house_number}</span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-slate-700">{h.parcel_id}</td>
                                    <td className="px-4 py-3">
                                        <Badge
                                            variant={
                                                h.house_type === 'PUCCA'
                                                    ? 'success'
                                                    : h.house_type === 'SEMI_PUCCA'
                                                        ? 'warning'
                                                        : 'neutral'
                                            }
                                        >
                                            {h.house_type}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="capitalize">{h.ownership_type.toLowerCase()}</span>
                                    </td>
                                    <td className="px-4 py-3">{h.owner_name || 'Unassigned'}</td>
                                    <td className="px-4 py-3">
                                        <span className="font-semibold text-slate-900">{h.families_count}</span>{' '}
                                        unit{h.families_count === 1 ? '' : 's'}
                                    </td>

                                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                                        {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-1">
                                        <button
                                            onClick={() => handleOpenDetail(h)}
                                            title="View Details"
                                            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                        >
                                            <Eye className="w-4 h-4"/>
                                        </button>
                                        <button
                                            onClick={() => handleOpenEdit(h)}
                                            title="Edit House"
                                            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4"/>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedHouse(h);
                                                setIsDeleteModalOpen(true);
                                            }}
                                            title="Delete House"
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

            {/* House Detail Modal */}
            {selectedHouse && (
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title={`House #${selectedHouse.house_number} Comprehensive Profile`}
                    subtitle={`Parcel ID: ${selectedHouse.parcel_id} • Lakra Khurd Demographic Record`}
                    maxWidth="2xl"
                >
                    <div className="space-y-6">
                        {/* Quick Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[11px] text-slate-500 uppercase font-semibold">Families</span>
                                <p className="text-lg font-bold text-slate-900 mt-0.5">
                                    {selectedHouse.families_count || 1} Units
                                </p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[11px] text-slate-500 uppercase font-semibold">Owner</span>
                                <p className="text-sm font-bold text-slate-900 mt-1">
                                    {selectedHouse.owner_name || 'Unassigned'}
                                </p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[11px] text-slate-500 uppercase font-semibold">Structure</span>
                                <p className="text-sm font-bold text-slate-900 mt-1">
                                    {selectedHouse.house_type}
                                </p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[11px] text-slate-500 uppercase font-semibold">Tenure</span>
                                <p className="text-sm font-bold text-slate-900 mt-1">
                                    {selectedHouse.ownership_type}
                                </p>
                            </div>
                        </div>

                        {/* Resident Families Roster */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-emerald-600"/> Resident Family Units
                                ({selectedHouse.families?.length || 0})
                            </h4>
                            <div
                                className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                                {selectedHouse.families?.map((f) => (
                                    <div key={f.id} className="p-3 bg-white flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">
                                                Family #{f.family_number} (Guardian: {f.guardian_name || 'N/A'})
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                Cast: {f.cast} • Phone: {f.guardian_phone || 'None'}
                                            </p>
                                        </div>
                                        <Badge variant="primary">{f.members_count} members</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Household Facilities & Utilities */}
                        {selectedHouse.facilities && (
                            <div>
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-emerald-600"/> Household Amenities & Utilities
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    <div
                                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center gap-2">
                                        <Zap
                                            className={`w-4 h-4 ${selectedHouse.facilities.has_electricity ? 'text-amber-500' : 'text-slate-300'}`}/>
                                        <span>Electricity: {selectedHouse.facilities.has_electricity ? 'Connected' : 'No'}</span>
                                    </div>
                                    <div
                                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center gap-2">
                                        <Flame
                                            className={`w-4 h-4 ${selectedHouse.facilities.has_gas ? 'text-rose-500' : 'text-slate-300'}`}/>
                                        <span>Gas: {selectedHouse.facilities.has_gas ? 'Piped Gas' : 'Cylinders'}</span>
                                    </div>
                                    <div
                                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center gap-2">
                                        <Sun
                                            className={`w-4 h-4 ${selectedHouse.facilities.has_internet ? 'text-blue-600' : 'text-slate-300'}`}/>
                                        <span>Internet: {selectedHouse.facilities.has_internet ? selectedHouse.facilities.internet_type : 'None'}</span>
                                    </div>
                                    <div
                                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center gap-2">
                                        <Droplets
                                            className={`w-4 h-4 ${selectedHouse.facilities.has_bike || selectedHouse.facilities.has_car ? 'text-emerald-600' : 'text-slate-300'}`}/>
                                        <span>Transport: {selectedHouse.facilities.has_car ? 'Car & Bike' : selectedHouse.facilities.has_bike ? 'Bike' : 'None'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* House Create / Edit Form Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingHouseId ? `Edit House #${formData.house_number}` : 'Register New House'}
                maxWidth="md"
            >
                <form onSubmit={handleSaveForm} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">House Number</label>
                            <input
                                type="text"
                                required
                                value={formData.house_number}
                                onChange={(e) => setFormData({...formData, house_number: e.target.value})}
                                placeholder="e.g. 36"
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Parcel ID</label>
                            <input
                                type="text"
                                required
                                value={formData.parcel_id}
                                onChange={(e) => setFormData({...formData, parcel_id: e.target.value})}
                                placeholder="e.g. 60136"
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">House Owner</label>
                        <select
                            value={formData.owner_id ?? ''}
                            onChange={(e) => setFormData({...formData, owner_id: e.target.value ? Number(e.target.value) : null})}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                        >
                            <option value="">Unassigned</option>
                            {owners.map((person) => (
                                <option key={person.id} value={person.id}>{person.full_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">House Type</label>
                            <select
                                value={formData.house_type}
                                onChange={(e) => setFormData({...formData, house_type: e.target.value as any})}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                            >
                                <option value="PUCCA">Pucca (Brick/Concrete)</option>
                                <option value="SEMI_PUCCA">Semi-Pucca</option>
                                <option value="KACHA">Kacha (Mud/Straw)</option>
                                <option value="APARTMENT">Apartment</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Ownership</label>
                            <select
                                value={formData.ownership_type}
                                onChange={(e) => setFormData({...formData, ownership_type: e.target.value as any})}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                            >
                                <option value="OWNED">Owned</option>
                                <option value="RENTED">Rented</option>
                                <option value="SHARED">Shared</option>
                                <option value="GOVERNMENT">Government</option>
                                <option value="UNKNOWN">Unknown</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                required
                                value={formData.latitude}
                                onChange={(e) => setFormData({...formData, latitude: Number(e.target.value)})}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                required
                                value={formData.longitude}
                                onChange={(e) => setFormData({...formData, longitude: Number(e.target.value)})}
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
                            {editingHouseId ? 'Update House' : 'Create House'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            {selectedHouse && (
                <ConfirmDialog
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDelete}
                    title="Delete House Record"
                    message={`Are you sure you want to delete House #${selectedHouse.house_number}? This operation will only succeed if no family units are currently assigned.`}
                />
            )}
        </div>
    );
};
