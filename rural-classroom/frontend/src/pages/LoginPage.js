import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Admin', email: 'admin@rural.edu', password: 'Admin@123' },
    { role: 'Expert Faculty', email: 'expert@rural.edu', password: 'Expert@123' },
    { role: 'Student', email: 'student@rural.edu', password: 'Student@123' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">RC</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Rural Classroom</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">Welcome back</h1>
          <p className="text-gray-500">Sign in to your account to continue</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                className="input" placeholder="you@college.edu" autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password" name="password" value={form.password} onChange={handleChange}
                className="input" placeholder="••••••••" autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Signing In...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:underline">Register here</Link>
          </p>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 card">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Demo Accounts</p>
          <div className="space-y-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.role}
                onClick={() => setForm({ email: acc.email, password: acc.password })}
                className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <span className="text-xs font-medium text-indigo-600">{acc.role}</span>
                <span className="text-xs text-gray-500 ml-2">{acc.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
