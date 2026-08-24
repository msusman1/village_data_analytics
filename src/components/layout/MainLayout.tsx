import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, ActiveTab } from './Sidebar';
import { Header } from './Header';
import { FloatingAI } from './FloatingAI';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [floatingAIOpen, setFloatingAIOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Map path to ActiveTab
  const getActiveTab = (): ActiveTab => {
    const path = location.pathname.substring(1);
    if (!path || path === '') return 'dashboard';
    
    // Handle resource sub-tabs
    const resourceTabs = ['education', 'employment', 'skills', 'land', 'vehicles', 'facilities'];
    if (resourceTabs.includes(path)) return path as ActiveTab;
    
    return path as ActiveTab;
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex font-sans antialiased">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={() => {}} // Now handled by navigation
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        <Header
          activeTab={activeTab}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenAI={() => setFloatingAIOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {activeTab !== 'ai-assistant' && (
        <FloatingAI
          isOpen={floatingAIOpen}
          onClose={() => setFloatingAIOpen(false)}
          onOpen={() => setFloatingAIOpen(true)}
          onExpandToFull={(query) => {
             setFloatingAIOpen(false);
             navigate('/ai-assistant', { state: { initialQuery: query } });
          }}
        />
      )}
    </div>
  );
};
