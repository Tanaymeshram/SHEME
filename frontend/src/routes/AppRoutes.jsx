import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import Rooms from '../pages/Rooms';
import EnergyMonitoring from '../pages/EnergyMonitoring';
import Reports from '../pages/Reports';
import AIInsights from '../pages/AIInsights';
import Alerts from '../pages/Alerts';
import Equipment from '../pages/Equipment';
import Settings from '../pages/Settings';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Loader from '../components/Loader';

// Route gate guarding authenticated pages
function PrivateRoute({ children }) {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader text="Authenticating user session..." />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

// Public route preventing logged-in operators from re-accessing login page
function PublicRoute({ children }) {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader text="Synchronizing session data..." />
      </div>
    );
  }

  return !user ? children : <Navigate to="/" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />

      {/* Private Command Center Pages */}
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="energy" element={<EnergyMonitoring />} />
        <Route path="reports" element={<Reports />} />
        <Route path="ai-insights" element={<AIInsights />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="settings" element={<Settings />} />
        
        {/* Sub-route wildcards within Layout */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
