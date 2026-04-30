import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import api from '../services/api';

const roleColors = {
  admin: 'bg-red-100 text-red-700',
  expert: 'bg-blue-100 text-blue-700',
  local: 'bg-green-100 text-green-700',
  student: 'bg-purple-100 text-purple-700',
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    college: user?.college || '',
    department: user?.department || '',
  });
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(user?.avatar || '');
  const [activeTab, setActiveTab] = useState('profile');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (avatar) formData.append('avatar', avatar);

      const res = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">👤 My Profile</h1>

        {/* Profile card */}
        <div className="card mb-6 flex flex-wrap items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-indigo-100 flex items-center justify-center overflow-hidden">
              {preview ? (
                <img src={preview} alt="Avatar" className="w-24 h-24 object-cover" />
              ) : (
                <span className="text-4xl font-bold text-indigo-600">{user?.name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors">
              <span className="text-white text-xs">📷</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge ${roleColors[user?.role]}`}>{user?.role}</span>
              {user?.isApproved ? (
                <span className="badge bg-green-100 text-green-700">✓ Verified</span>
              ) : (
                <span className="badge bg-amber-100 text-amber-700">⏳ Pending</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {['profile', 'security'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {tab === 'profile' ? '📋 Profile' : '🔒 Security'}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div className="card">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input name="name" className="input" value={form.name} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input name="phone" className="input" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                <textarea name="bio" className="input" rows={3} value={form.bio} onChange={handleChange} placeholder="Tell us about yourself..." />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">College / Institution</label>
                  <input name="college" className="input" value={form.college} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                  <input name="department" className="input" value={form.department} onChange={handleChange} />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Role</span>
                <span className={`badge ${roleColors[user?.role]}`}>{user?.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Account Status</span>
                <span>{user?.isApproved ? '✅ Approved' : '⏳ Pending'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Joined</span>
                <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-amber-50 rounded-xl">
              <p className="text-sm text-amber-700">🔒 To change your password, please contact your administrator or use the forgot password feature.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
