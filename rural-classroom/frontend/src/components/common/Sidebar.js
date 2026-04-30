import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, Video,
  BarChart2, Star, Settings, UserCheck, Upload, Radio
} from 'lucide-react';

const menuByRole = {
  admin: [
    { to: '/dashboard',          label: 'Dashboard',      icon: LayoutDashboard },
    { to: '/dashboard/users',    label: 'Manage Users',   icon: Users },
    { to: '/dashboard/courses',  label: 'Courses',        icon: BookOpen },
    { to: '/dashboard/analytics',label: 'Analytics',      icon: BarChart2 },
    { to: '/dashboard/profile',  label: 'Profile',        icon: Settings },
  ],
  expert: [
    { to: '/dashboard',          label: 'Dashboard',      icon: LayoutDashboard },
    { to: '/dashboard/courses',  label: 'My Courses',     icon: BookOpen },
    { to: '/dashboard/upload',   label: 'Upload Lectures',icon: Upload },
    { to: '/dashboard/live',     label: 'Start Live',     icon: Radio,  live: true },
    { to: '/dashboard/profile',  label: 'Profile',        icon: Settings },
  ],
  local: [
    { to: '/dashboard',          label: 'Dashboard',      icon: LayoutDashboard },
    { to: '/dashboard/attendance',label:'Attendance',      icon: UserCheck },
    { to: '/dashboard/courses',  label: 'Courses',        icon: BookOpen },
    { to: '/dashboard/live',     label: 'Monitor Live',   icon: Radio,  live: true },
    { to: '/dashboard/analytics',label: 'Analytics',      icon: BarChart2 },
    { to: '/dashboard/profile',  label: 'Profile',        icon: Settings },
  ],
  student: [
    { to: '/dashboard',           label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/dashboard/courses',   label: 'Browse Courses',  icon: BookOpen },
    { to: '/dashboard/live',      label: 'Join Live Class', icon: Radio, live: true },
    { to: '/dashboard/recommendations', label: 'AI Recommendations', icon: Star },
    { to: '/dashboard/profile',   label: 'Profile',         icon: Settings },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const menu = menuByRole[user?.role] || [];

  return (
    <aside className="w-60 h-screen fixed left-0 top-16 bg-slate-900 border-r border-slate-700/50 flex flex-col py-4 overflow-y-auto z-40">
      <nav className="flex-1 px-3 space-y-1">
        {menu.map(({ to, label, icon: Icon, live }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {live && <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-slate-700/50">
        <div className="bg-gradient-to-r from-indigo-900/50 to-cyan-900/50 rounded-lg p-3 border border-indigo-500/20">
          <p className="text-xs text-slate-400 mb-1">Logged in as</p>
          <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
          <p className="text-xs text-cyan-400 capitalize">{user?.role}</p>
        </div>
      </div>
    </aside>
  );
}
