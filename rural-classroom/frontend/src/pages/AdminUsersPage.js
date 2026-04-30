import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../components/common/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';

const roleColors = {
  admin: 'bg-red-100 text-red-700',
  expert: 'bg-blue-100 text-blue-700',
  local: 'bg-green-100 text-green-700',
  student: 'bg-purple-100 text-purple-700',
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ role: '', isApproved: '', search: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page, filter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filter.role) params.role = filter.role;
      if (filter.isApproved !== '') params.isApproved = filter.isApproved;
      if (filter.search) params.search = filter.search;

      const res = await api.get('/users', { params });
      setUsers(res.data.users);
      setTotalPages(res.data.pages);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, approve) => {
    try {
      await api.put(`/users/${userId}/approve`, { approve });
      toast.success(approve ? 'User approved!' : 'User rejected');
      fetchUsers();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleToggle = async (userId) => {
    try {
      await api.put(`/users/${userId}/toggle`);
      toast.success('Status updated');
      fetchUsers();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">👥 Manage Users</h1>

        {/* Filters */}
        <div className="card mb-6 flex flex-wrap gap-3">
          <input
            type="text" placeholder="🔍 Search by name or email..."
            className="input max-w-xs" value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          />
          <select className="input max-w-xs" value={filter.role} onChange={(e) => setFilter({ ...filter, role: e.target.value })}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="expert">Expert Faculty</option>
            <option value="local">Local Faculty</option>
            <option value="student">Student</option>
          </select>
          <select className="input max-w-xs" value={filter.isApproved} onChange={(e) => setFilter({ ...filter, isApproved: e.target.value })}>
            <option value="">All Status</option>
            <option value="true">Approved</option>
            <option value="false">Pending Approval</option>
          </select>
          <button onClick={() => { setFilter({ role: '', isApproved: '', search: '' }); setPage(1); }} className="btn-secondary text-sm">
            Clear Filters
          </button>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">College</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                              {u.avatar ? (
                                <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover" loading="lazy" />
                              ) : (
                                <span className="text-indigo-600 font-bold">{u.name?.[0]}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-900">{u.name}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${roleColors[u.role]}`}>{u.role}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{u.college || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {u.isApproved ? (
                              <span className="badge bg-green-100 text-green-700">✓ Approved</span>
                            ) : (
                              <span className="badge bg-amber-100 text-amber-700">⏳ Pending</span>
                            )}
                            {!u.isActive && <span className="badge bg-gray-100 text-gray-500">Inactive</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {!u.isApproved && (u.role === 'expert' || u.role === 'local') && (
                              <button onClick={() => handleApprove(u._id, true)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors">
                                Approve
                              </button>
                            )}
                            {u.role !== 'admin' && (
                              <>
                                <button onClick={() => handleToggle(u._id)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors">
                                  {u.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button onClick={() => handleDelete(u._id, u.name)} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors">
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.length === 0 && (
                <div className="text-center py-16 text-gray-400">No users found</div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary disabled:opacity-40">← Prev</button>
                <span className="btn-secondary cursor-default">{page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary disabled:opacity-40">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
