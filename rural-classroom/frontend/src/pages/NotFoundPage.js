import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="text-8xl mb-6">🏫</div>
      <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Page Not Found</h2>
      <p className="text-gray-500 mb-8 max-w-md">The page you're looking for doesn't exist or has been moved.</p>
      <div className="flex gap-4 justify-center">
        <Link to="/" className="btn-secondary">🏠 Go Home</Link>
        <Link to="/dashboard" className="btn-primary">📊 Dashboard</Link>
      </div>
    </div>
  </div>
);

export default NotFoundPage;
