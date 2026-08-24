import React from 'react';
import { Menu, Bot, Calendar, Sparkles, Bell } from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface HeaderProps {
  activeTab: ActiveTab;
  onToggleSidebar: () => void;
  onOpenAI: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onToggleSidebar,
  onOpenAI,
}) => {
  const titles: Record<ActiveTab, { title: string; desc: string }> = {
    dashboard: {
      title: 'Village Demographics Dashboard',
      desc: 'Live statistical telemetry, age cohorts, and administrative metrics for Lakra Khurd',
    },
    'ai-assistant': {
      title: 'AI Natural Language Analyst',
      desc: 'Ask free-form questions about residents, family structures, age groups, and geospatial clusters',
    },
    map: {
      title: 'Village GIS Spatial Map',
      desc: 'Geolocated parcels, compound structures, and radial distance analysis',
    },
    houses: {
      title: 'House & Compound Registry',
      desc: 'Manage house structures, parcel numbers, coordinates, and household facilities',
    },
    families: {
      title: 'Family Units & Lineage',
      desc: 'Registered family units, household guardians, cast records, and member rosters',
    },
    people: {
      title: 'Citizen & Resident Directory',
      desc: 'Individual records with auto-calculated ages from DOB as of August 24, 2026',
    },
    education: {
      title: 'Educational Attainment',
      desc: 'Literacy rates, schooling qualifications, institutions, and completion years',
    },
    employment: {
      title: 'Employment & Labor Force',
      desc: 'Occupations, agriculture vs. overseas labor, employers, and income statistics',
    },
    skills: {
      title: 'Vocational Skills & Trades',
      desc: 'Artisans, electrical, mechanics, tailoring, and technical proficiencies',
    },
    land: {
      title: 'Agricultural & Land Holdings',
      desc: 'Khasra numbers, kanal/marla acreage, irrigation methods, and crops',
    },
    vehicles: {
      title: 'Vehicle & Machinery Registry',
      desc: 'Tractors, motorcycles, cars, and agricultural machinery ownership',
    },
    facilities: {
      title: 'Utilities & Household Amenities',
      desc: 'Electricity, clean water supply, gas cylinders, sanitation, and solar arrays',
    },
  };

  const current = titles[activeTab] || { title: 'Village Management', desc: '' };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between transition-all">
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
        <button
          id="toggle-sidebar-btn"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">
              {current.title}
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              <Calendar className="w-3 h-3 text-slate-400" /> Ref: Aug 24, 2026
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate hidden md:block mt-0.5">
            {current.desc}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick Launch AI */}
        {activeTab !== 'ai-assistant' && (
          <button
            id="header-ai-ask-btn"
            onClick={onOpenAI}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold shadow-xs shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Bot className="w-4 h-4 text-emerald-100" />
            <span className="hidden sm:inline">Ask AI Analyst</span>
            <Sparkles className="w-3 h-3 text-emerald-200 hidden sm:inline" />
          </button>
        )}
      </div>
    </header>
  );
};
