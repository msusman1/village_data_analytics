import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import {
  GraduationCap,
  Briefcase,
  Wrench,
  Compass,
  Car,
  Building2,
  Plus,
  Search,
  Zap,
  Droplets,
  Flame,
  Sun,
  Edit2,
  Trash2,
} from 'lucide-react';

export type ResourceSubTab =
  | 'education'
  | 'employment'
  | 'skills'
  | 'land'
  | 'vehicles'
  | 'facilities';

interface ResourcesViewProps {
  initialTab?: ResourceSubTab;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({ initialTab = 'education' }) => {
  const [activeTab, setActiveTab] = useState<ResourceSubTab>(initialTab);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    loadResourceData();
  }, [activeTab, page, search]);

  const loadResourceData = async () => {
    try {
      setLoading(true);
      let res: any;
      if (activeTab === 'education') {
        res = await api.getEducation({ page, limit: 10, search });
      } else if (activeTab === 'employment') {
        res = await api.getEmployment({ page, limit: 10, search });
      } else if (activeTab === 'skills') {
        res = await api.getSkills({ page, limit: 10, search });
      } else if (activeTab === 'land') {
        res = await api.getLand({ page, limit: 10, search });
      } else if (activeTab === 'vehicles') {
        res = await api.getVehicles({ page, limit: 10, search });
      } else if (activeTab === 'facilities') {
        res = await api.getFacilities({ page, limit: 10 });
      }

      if (res) {
        setItems(res.items || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Resource load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'education' as ResourceSubTab, label: 'Education', icon: GraduationCap },
    { id: 'employment' as ResourceSubTab, label: 'Employment & Labor', icon: Briefcase },
    { id: 'skills' as ResourceSubTab, label: 'Vocational Skills', icon: Wrench },
    { id: 'land' as ResourceSubTab, label: 'Land Holdings', icon: Compass },
    { id: 'vehicles' as ResourceSubTab, label: 'Vehicles Registry', icon: Car },
    { id: 'facilities' as ResourceSubTab, label: 'Household Utilities', icon: Building2 },
  ];

  return (
    <div className="space-y-4">
      {/* Sub tabs navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setPage(1);
                setSearch('');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Header */}
      {activeTab !== 'facilities' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}

      {/* Main Table for each resource */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {/* EDUCATION TABLE */}
          {activeTab === 'education' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Resident</th>
                  <th className="px-4 py-3">Education Level</th>
                  <th className="px-4 py-3">Field / Discipline</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Graduation Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{it.person_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="primary">{it.level}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{it.field_of_study || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{it.institute}</td>
                    <td className="px-4 py-3 font-mono">{it.passing_year || 'Ongoing'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* EMPLOYMENT TABLE */}
          {activeTab === 'employment' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Resident Worker</th>
                  <th className="px-4 py-3">Occupation</th>
                  <th className="px-4 py-3">Labor Status</th>
                  <th className="px-4 py-3">Employer / Enterprise</th>
                  <th className="px-4 py-3">Monthly Income</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{it.person_name}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{it.occupation}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{it.status}</Badge>
                    </td>
                    <td className="px-4 py-3">{it.employer_or_business_name || 'Self-Employed'}</td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-800">
                      PKR {Number(it.monthly_income || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* SKILLS TABLE */}
          {activeTab === 'skills' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Resident</th>
                  <th className="px-4 py-3">Trade / Vocational Skill</th>
                  <th className="px-4 py-3">Proficiency Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{it.person_name}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{it.skill_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="primary">{it.proficiency_level}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* LAND TABLE */}
          {activeTab === 'land' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Landowner</th>
                  <th className="px-4 py-3">Parcel ID</th>
                  <th className="px-4 py-3">Area (Acres)</th>
                  <th className="px-4 py-3">Land Category</th>
                  <th className="px-4 py-3">Location & Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{it.owner_name}</td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-800">
                      Parcel #{it.parcel_id}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {it.area_acres} Acres
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{it.land_type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{it.location_description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* VEHICLES TABLE */}
          {activeTab === 'vehicles' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Vehicle Owner</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Make & Model</th>
                  <th className="px-4 py-3">Registration #</th>
                  <th className="px-4 py-3">Model Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{it.owner_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={it.vehicle_type === 'TRACTOR' ? 'warning' : 'secondary'}>
                        {it.vehicle_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{it.make_model}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      {it.registration_number}
                    </td>
                    <td className="px-4 py-3 font-mono">{it.year || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* FACILITIES TABLE */}
          {activeTab === 'facilities' && (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">House #</th>
                  <th className="px-4 py-3">Electricity Grid</th>
                  <th className="px-4 py-3">Natural Gas</th>
                  <th className="px-4 py-3">Broadband / Internet</th>
                  <th className="px-4 py-3">Bike Registered</th>
                  <th className="px-4 py-3">Car Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      House #{it.house_number}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        <Zap className={`w-3.5 h-3.5 ${it.has_electricity ? 'text-amber-500' : 'text-slate-300'}`} />
                        {it.has_electricity ? 'Active Grid' : 'No Connection'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        <Flame className={`w-3.5 h-3.5 ${it.has_gas ? 'text-rose-500' : 'text-slate-400'}`} />
                        {it.has_gas ? 'Piped Gas' : 'Cylinders'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        <Sun className={`w-3.5 h-3.5 ${it.has_internet ? 'text-blue-600' : 'text-slate-300'}`} />
                        {it.has_internet ? it.internet_type : 'None'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={it.has_bike ? 'success' : 'neutral'}>
                        {it.has_bike ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={it.has_car ? 'success' : 'neutral'}>
                        {it.has_car ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={10}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </div>
  );
};
