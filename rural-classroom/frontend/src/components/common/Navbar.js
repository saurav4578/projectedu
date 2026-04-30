import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Menu, X, LogOut, User, Bell } from 'lucide-react';

const roleColors = { admin: 'bg-red-500', expert: 'bg-purple-500', local: 'bg-green-500', student: 'bg-cyan-500' };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">RuralEdu</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-slate-700 transition-colors relative">
                <Bell size={18} className="text-slate-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full"></span>
              </button>
              <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-white leading-none">{user.name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${roleColors[user.role]} text-white`}>{user.role}</span>
                </div>
              </Link>
              <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Login</Link>
              <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
