import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Building, Shield, Save } from 'lucide-react';
import api from '../services/api';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', college: user?.college || '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/users/profile', form);
      setUser(res.data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const roleColors = { admin: 'bg-red-500/20 text-red-400', expert: 'bg-purple-500/20 text-purple-400', local: 'bg-green-500/20 text-green-400', student: 'bg-cyan-500/20 text-cyan-400' };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account information</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700/50">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${roleColors[user?.role]}`}>{user?.role}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${user?.isApproved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {user?.isApproved ? '✓ Approved' : 'Pending Approval'}
              </span>
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 mb-4 text-green-400 text-sm">
            ✓ Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <User size={14} /> Full Name
            </label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white outline-none transition-colors" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <Mail size={14} /> Email Address
            </label>
            <input value={user?.email} disabled className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <Building size={14} /> College / Institute
            </label>
            <input value={form.college} onChange={e => setForm({...form, college: e.target.value})} placeholder="Your institution name" className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <Shield size={14} /> Role
            </label>
            <input value={user?.role} disabled className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-500 cursor-not-allowed capitalize" />
          </div>
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Account Details</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Member Since</span>
            <span className="text-white">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Account Status</span>
            <span className="text-green-400">Active</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Enrolled Courses</span>
            <span className="text-white">{user?.enrolledCourses?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
