import React from 'react';
import {
  LayoutDashboard,
  Bot,
  Home,
  Users,
  User,
  GraduationCap,
  Briefcase,
  Wrench,
  Compass,
  Car,
  MapPin,
  LogOut,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router-dom';

export type ActiveTab =
  | 'dashboard'
  | 'ai-assistant'
  | 'houses'
  | 'families'
  | 'people'
  | 'education'
  | 'employment'
  | 'skills'
  | 'land'
  | 'vehicles'
  | 'facilities'
  | 'map';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onToggle,
}) => {
  const { logout, user } = useAuth();

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    {
      id: 'ai-assistant' as ActiveTab,
      label: 'AI Analyst',
      icon: Bot,
      badge: 'Gemini 3.7',
      isSpecial: true,
    },
    { id: 'map' as ActiveTab, label: 'Village GIS Map', icon: MapPin, badge: null },
    { id: 'houses' as ActiveTab, label: 'Houses', icon: Home, badge: null },
    { id: 'families' as ActiveTab, label: 'Families', icon: Users, badge: null },
    { id: 'people' as ActiveTab, label: 'People / Residents', icon: User, badge: null },
    { id: 'education' as ActiveTab, label: 'Education Records', icon: GraduationCap, badge: null },
    { id: 'employment' as ActiveTab, label: 'Employment & Labor', icon: Briefcase, badge: null },
    { id: 'skills' as ActiveTab, label: 'Skills & Trades', icon: Wrench, badge: null },
    { id: 'land' as ActiveTab, label: 'Land Ownership', icon: Compass, badge: null },
    { id: 'vehicles' as ActiveTab, label: 'Vehicles Registry', icon: Car, badge: null },
    { id: 'facilities' as ActiveTab, label: 'Household Utilities', icon: Building2, badge: null },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Village Branding */}
        <div className="flex items-center space-x-3 px-6 py-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/30 text-white font-bold text-lg">
            LK
          </div>
          <div>
            <h1 className="font-semibold text-sm text-white tracking-tight leading-tight">
              AI-LK
            </h1>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3" /> Data in-sights
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Platform Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const path = item.id === 'dashboard' ? '/' : `/${item.id}`;
            return (
              <NavLink
                key={item.id}
                id={`nav-tab-${item.id}`}
                to={path}
                onClick={() => {
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={({ isActive }) => `w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? item.isSpecial
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-semibold'
                      : 'bg-slate-800 text-white shadow-xs font-semibold'
                    : item.isSpecial
                    ? 'text-emerald-300 hover:bg-emerald-950/40 hover:text-emerald-200'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive
                            ? 'text-white'
                            : item.isSpecial
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-tight ${
                          isActive
                            ? 'bg-emerald-800 text-emerald-100'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Current user & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-800/40">
            <div className="min-w-0 flex-1 mr-2">
              <p className="text-xs font-medium text-slate-200 truncate">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@village.org'}</p>
            </div>
            <button
              id="sidebar-logout-btn"
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
