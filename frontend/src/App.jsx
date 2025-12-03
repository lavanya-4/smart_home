import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import DevicesPage from './pages/DevicesPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import LoginPage from './pages/LoginPage';
import IncidentsPage from './pages/IncidentsPage';
import HistoryPage from './pages/HistoryPage';
import ContactsPage from './pages/ContactsPage';
import PoliciesPage from './pages/PoliciesPage';
import { removeAuthToken } from './config';

function UnderConstruction({ page }) {
  return (
    <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-white">Page: {page}</h3>
      <p className="text-gray-400">This page is under construction.</p>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/role" replace />;
}

export default function App() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('careapp_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('careapp_user');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('careapp_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    removeAuthToken(); // This clears both token and user from localStorage
  };

  // If not authenticated, show role selection or login
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/role" element={<RoleSelectionPage />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/role" replace />} />
      </Routes>
    );
  }

  // If authenticated, show main app
  return (
    <div className="flex w-full h-screen bg-slate-950 text-gray-200 font-sans overflow-hidden">
      <Layout currentPage={location.pathname} user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/devices" element={<DevicesPage user={user} />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </div>
  );
}
