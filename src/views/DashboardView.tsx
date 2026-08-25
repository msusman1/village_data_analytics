import React, {useEffect, useState} from 'react';
import {api} from '../lib/api';
import {VillageStats} from '../types';
import {
    Activity,
    ArrowUpRight,
    Baby,
    Bot,
    HeartHandshake,
    Home,
    Layers,
    Shield,
    TrendingUp,
    UserCheck,
    Users,
} from 'lucide-react';
import {Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,} from 'recharts';
import {ActiveTab} from '../components/layout/Sidebar';
import {useNavigate} from 'react-router-dom';

const CHART_COLORS = ['#059669', '#0284c7', '#d97706', '#dc2626', '#7c3aed', '#0d9488', '#ea580c', '#64748b'];

interface DashboardViewProps {
  onNavigate?: (tab: ActiveTab) => void;
  onAskAI?: (query: string) => void;
}

// The stats endpoint may temporarily return only the scalar counters while
// aggregate queries are being populated. Keep chart data renderable in that
// case instead of allowing an undefined array to crash the whole app.
const normalizeStats = (data: Partial<VillageStats>): VillageStats => ({
  total_population: data.total_population ?? 0,
  total_houses: data.total_houses ?? 0,
  total_families: data.total_families ?? 0,
  total_guardians: data.total_guardians ?? 0,
  children_under_5: data.children_under_5 ?? 0,
  children_under_10: data.children_under_10 ?? 0,
  children_under_18: data.children_under_18 ?? 0,
  adults: data.adults ?? 0,
  seniors_60_plus: data.seniors_60_plus ?? 0,
  average_age: data.average_age ?? 0,
  average_family_size: data.average_family_size ?? 0,
  houses_with_multiple_families: data.houses_with_multiple_families ?? 0,
  age_groups: data.age_groups?.length
    ? data.age_groups
    : [
        { group: '0-5', count: 0, percentage: 0 },
        { group: '6-12', count: 0, percentage: 0 },
        { group: '13-18', count: 0, percentage: 0 },
        { group: '19-35', count: 0, percentage: 0 },
        { group: '36-50', count: 0, percentage: 0 },
        { group: '51-60', count: 0, percentage: 0 },
        { group: '60+', count: 0, percentage: 0 },
      ],
  gender_distribution: data.gender_distribution?.length
    ? data.gender_distribution
    : [
        { gender: 'Male', count: 0, percentage: 0 },
        { gender: 'Female', count: 0, percentage: 0 }
      ],
  family_size_distribution: data.family_size_distribution?.length
    ? data.family_size_distribution
    : [{ range: 'No data', count: 0 }],
  population_by_house: data.population_by_house ?? [],
  education_distribution: data.education_distribution ?? [],
  employment_distribution: data.employment_distribution ?? [],
  facility_stats: data.facility_stats ?? {
    electricity_percentage: 0,
    gas_percentage: 0,
    internet_percentage: 0,
    bike_ownership_percentage: 0,
    car_ownership_percentage: 0,
  },
  vehicle_distribution: data.vehicle_distribution?.length
    ? data.vehicle_distribution
    : [{ type: 'No data', count: 0 }],
});

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onAskAI }) => {
  const [stats, setStats] = useState<VillageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleNavigate = (tab: ActiveTab) => {
    if (onNavigate) {
      onNavigate(tab);
    }
    navigate(tab === 'dashboard' ? '/' : `/${tab}`);
  };

  const handleAskAI = (query: string) => {
    if (onAskAI) {
      onAskAI(query);
    }
    navigate('/ai-assistant', { state: { initialQuery: query } });
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(normalizeStats(data));
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-xl" />
          <div className="h-80 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500">
        <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-slate-900">No Statistics Available</h3>
        <p className="text-sm">We couldn't load the village demographic data at this time.</p>
        <button 
          onClick={() => loadStats()}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold"
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Population',
      value: stats.total_population,
      subValue: 'Registered Residents',
      icon: Users,
      color: 'emerald',
      onClick: () => handleNavigate('people'),
    },
    {
      title: 'Total Houses',
      value: stats.total_houses,
      subValue: `${stats.total_families} Family Units`,
      icon: Home,
      color: 'blue',
      onClick: () => handleNavigate('houses'),
    },
    {
      title: 'Family Units',
      value: stats.total_families,
      subValue: `Avg ${stats.average_family_size} members/family`,
      icon: Layers,
      color: 'teal',
      onClick: () => handleNavigate('families'),
    },
    {
      title: 'Guardians / Heads',
      value: stats.total_guardians,
      subValue: 'Household Patriarchs/Matriarchs',
      icon: UserCheck,
      color: 'amber',
      onClick: () => handleNavigate('families'),
    },
    {
      title: 'Children (< 5 yrs)',
      value: stats.children_under_5,
      subValue: `${((stats.children_under_5 / stats.total_population) * 100).toFixed(1)}% of village`,
      icon: Baby,
      color: 'sky',
      onClick: () => handleAskAI('How many children are under 5?'),
    },
    {
      title: 'Children (< 10 yrs)',
      value: stats.children_under_10,
      subValue: `${((stats.children_under_10 / stats.total_population) * 100).toFixed(1)}% of village`,
      icon: Baby,
      color: 'indigo',
      onClick: () => handleAskAI('How many children are under 10?'),
    },
    {
      title: 'Youth & Minors (< 18)',
      value: stats.children_under_18,
      subValue: `${((stats.children_under_18 / stats.total_population) * 100).toFixed(1)}% of village`,
      icon: Activity,
      color: 'purple',
      onClick: () => handleAskAI('What percentage of the village is under 18?'),
    },
    {
      title: 'Adults (18+ yrs)',
      value: stats.adults,
      subValue: `${((stats.adults / stats.total_population) * 100).toFixed(1)}% of village`,
      icon: Shield,
      color: 'emerald',
      onClick: () => handleAskAI('How many adults in the village?'),
    },
    {
      title: 'Senior Citizens (60+)',
      value: stats.seniors_60_plus,
      subValue: `${((stats.seniors_60_plus / stats.total_population) * 100).toFixed(1)}% elderly cohort`,
      icon: HeartHandshake,
      color: 'rose',
      onClick: () => handleAskAI('How many senior citizens are in the village?'),
    },
    {
      title: 'Average Village Age',
      value: `${stats.average_age} yrs`,
      subValue: 'Computed as of Aug 24, 2026',
      icon: TrendingUp,
      color: 'blue',
      onClick: () => handleAskAI('What is the average age?'),
    },
    {
      title: 'Average Family Size',
      value: `${stats.average_family_size}`,
      subValue: 'Members per household',
      icon: Users,
      color: 'teal',
      onClick: () => handleAskAI('What is the average family size?'),
    },
  ];

  const genderData = stats.gender_distribution.filter(d => d.gender !== 'No data');
  const hasGenderData = genderData.length > 0 && genderData.some(d => d.count > 0);

  return (
    <div className="space-y-6">
      {/* AI Intelligence Spotlight Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-2">
              <Bot className="w-3.5 h-3.5" /> Powered by Gemini 3.7 & Relational Demographics
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              Instant Natural Language Analytics for Lakra Khurd
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Ask queries such as &ldquo;Who is the oldest person?&rdquo;, &ldquo;Which family is the largest?&rdquo;,
              or &ldquo;Show houses within 500 meters of House 20&rdquo;.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAskAI('Who is the oldest person?')}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              Oldest Person
            </button>
            <button
              onClick={() => handleAskAI('Which family is the largest?')}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              Largest Family
            </button>
            <button
              onClick={() => handleAskAI('Show houses near house 20.')}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              Houses Near #20
            </button>
            <button
              onClick={() => handleNavigate('ai-assistant')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-xs transition-colors flex items-center gap-1"
            >
              Open AI Analyst <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 11 Primary KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Demographic Telemetry & Vital Metrics
          </h3>
          <span className="text-xs text-slate-500">Click any card to explore</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          {kpiCards.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                onClick={kpi.onClick}
                className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 truncate uppercase tracking-tight">
                    {kpi.title}
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-50 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {kpi.value}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{kpi.subValue}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Core Charts Row 1: Population by Age Group & Gender Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Group Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Population by Age Group</h4>
              <p className="text-xs text-slate-500">Demographic cohort breakdown across 214 residents</p>
            </div>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Mean: {stats.average_age} yrs
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.age_groups} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                <XAxis
                  dataKey="group"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]}>
                  {stats.age_groups.map((_, i) => (
                    <Cell key={`age-cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Gender Distribution</h4>
              <p className="text-xs text-slate-500">Male vs. Female population split</p>
            </div>
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              Total: {stats.total_population}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.gender_distribution}
                  dataKey="count"
                  nameKey="gender"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#0284c7" />
                  <Cell fill="#ec4899" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Core Charts Row 2: Family Size Distribution & House Construction Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Family Size Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Family Size Distribution</h4>
              <p className="text-xs text-slate-500">Number of family units categorized by member headcount</p>
            </div>
            <span className="text-xs font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
              Avg: {stats.average_family_size} Members
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.family_size_distribution} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Vehicle Ownership Categories</h4>
              <p className="text-xs text-slate-500">Tractors, motorcycles, cars, and agricultural machinery</p>
            </div>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              {stats.vehicle_distribution?.reduce((a, b) => a + b.count, 0) || 0} Registered
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.vehicle_distribution}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.vehicle_distribution?.map((_, i) => (
                    <Cell key={`veh-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
