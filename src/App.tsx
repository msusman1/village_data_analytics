import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { FloatingAI } from './components/layout/FloatingAI';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { AIAssistantView } from './views/AIAssistantView';
import { VillageMapView } from './components/map/VillageMapView';
import { HousesView } from './views/HousesView';
import { FamiliesView } from './views/FamiliesView';
import { PeopleView } from './views/PeopleView';
import { ResourcesView, ResourceSubTab } from './views/ResourcesView';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [floatingAIOpen, setFloatingAIOpen] = useState<boolean>(false);
  const [aiAssistantInitialQuery, setAiAssistantInitialQuery] = useState<string | undefined>();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Loading Lakra Khurd Demographic Database...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleAskAI = (query: string) => {
    setAiAssistantInitialQuery(query);
    setActiveTab('ai-assistant');
  };

  const handleExpandFloatingAI = (query?: string) => {
    if (query) setAiAssistantInitialQuery(query);
    setActiveTab('ai-assistant');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex font-sans antialiased">
      {/* Collapsible Administrative Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        <Header
          activeTab={activeTab}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenAI={() => setFloatingAIOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => setActiveTab(tab)}
              onAskAI={handleAskAI}
            />
          )}

          {activeTab === 'ai-assistant' && (
            <AIAssistantView
              initialQuery={aiAssistantInitialQuery}
              onClearInitialQuery={() => setAiAssistantInitialQuery(undefined)}
            />
          )}

          {activeTab === 'map' && <VillageMapView />}

          {activeTab === 'houses' && <HousesView />}

          {activeTab === 'families' && <FamiliesView />}

          {activeTab === 'people' && <PeopleView />}

          {(activeTab === 'education' ||
            activeTab === 'employment' ||
            activeTab === 'skills' ||
            activeTab === 'land' ||
            activeTab === 'vehicles' ||
            activeTab === 'facilities') && (
            <ResourcesView initialTab={activeTab as ResourceSubTab} />
          )}
        </main>
      </div>

      {/* Floating AI Drawer Widget (Available across non-AI screens) */}
      {activeTab !== 'ai-assistant' && (
        <FloatingAI
          isOpen={floatingAIOpen}
          onClose={() => setFloatingAIOpen(false)}
          onOpen={() => setFloatingAIOpen(true)}
          onExpandToFull={handleExpandFloatingAI}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
