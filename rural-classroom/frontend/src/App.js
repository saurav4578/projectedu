import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';

const Home        = lazy(() => import('./pages/Home'));
const Login       = lazy(() => import('./pages/Login'));
const Register    = lazy(() => import('./pages/Register'));
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const LiveTest    = lazy(() => import('./pages/LiveTest'));  // ← no login

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Authenticating…" />;
  return user ? children : <Navigate to="/login" />;
};
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Loading…" />;
  return !user ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-h-screen pt-16 flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/login"         element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register"      element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/live-test"     element={<LiveTest />} />  {/* ← no auth needed */}
          <Route path="/dashboard/*"   element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="*"              element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
