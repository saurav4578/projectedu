import React, { useState, useEffect } from 'react';
import { Users, UserCheck, AlertTriangle, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';

const COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b'];

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, usersRes] = await Promise.all([
          api.get('/users/analytics'),
          api.get('/users?limit=8'),
        ]);
        setAnalytics(analyticsRes.data.analytics);
        setUsers(usersRes.data.users);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const approveUser = async (id) => {
    await api.put(`/users/${id}/approve`);
    setUsers(users.map(u => u._id === id ? { ...u, isApproved: true } : u));
  };
  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await api.delete(`/users/${id}`);
    setUsers(users.filter(u => u._id !== id));
  };

  if (loading) return <LoadingSpinner text="Loading admin dashboard..." />;
  const chartData = [
    { name: 'Students', value: analytics?.totalStudents || 0 },
    { name: 'Faculty', value: analytics?.totalFaculty || 0 },
    { name: 'Admins', value: analytics?.totalAdmin || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Platform overview and management</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={analytics?.totalStudents || 0} icon={Users} color="cyan" />
        <StatCard title="Total Faculty" value={analytics?.totalFaculty || 0} icon={UserCheck} color="purple" />
        <StatCard title="Pending Approval" value={analytics?.pendingApproval || 0} icon={AlertTriangle} color="orange" />
        <StatCard title="Admins" value={analytics?.totalAdmin || 0} icon={BarChart2} color="indigo" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">User Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#e2e8f0' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                {chartData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#e2e8f0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {chartData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />{d.name}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 text-slate-400 font-medium">Name</th>
                <th className="text-left py-2 text-slate-400 font-medium">Email</th>
                <th className="text-left py-2 text-slate-400 font-medium">Role</th>
                <th className="text-left py-2 text-slate-400 font-medium">Status</th>
                <th className="text-left py-2 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {users.map(user => (
                <tr key={user._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 text-white font-medium">{user.name}</td>
                  <td className="py-3 text-slate-400">{user.email}</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-400 capitalize">{user.role}</span></td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${user.isApproved ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {user.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 flex gap-2">
                    {!user.isApproved && <button onClick={() => approveUser(user._id)} className="text-xs bg-green-500/20 text-green-400 hover:bg-green-500/40 px-2 py-1 rounded transition-colors">Approve</button>}
                    <button onClick={() => deleteUser(user._id)} className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40 px-2 py-1 rounded transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
