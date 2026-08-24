import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { AIAssistantView } from './views/AIAssistantView';
import { VillageMapView } from './components/map/VillageMapView';
import { HousesView } from './views/HousesView';
import { FamiliesView } from './views/FamiliesView';
import { PeopleView } from './views/PeopleView';
import { ResourcesView, ResourceSubTab } from './views/ResourcesView';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Loading Village Analytics Platform...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardView onNavigate={() => {}} onAskAI={() => {}} />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="ai-assistant" element={<AIAssistantView />} />
        <Route path="map" element={<VillageMapView />} />
        <Route path="houses" element={<HousesView />} />
        <Route path="families" element={<FamiliesView />} />
        <Route path="people" element={<PeopleView />} />
        
        {['education', 'employment', 'skills', 'land', 'vehicles', 'facilities'].map((tab) => (
          <Route 
            key={tab} 
            path={tab} 
            element={<ResourcesView initialTab={tab as ResourceSubTab} />} 
          />
        ))}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
