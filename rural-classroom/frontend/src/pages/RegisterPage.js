import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', college: '', department: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill in all required fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const result = await register(form);
      toast.success(result.message || 'Registration successful!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">Create your account</h1>
          <p className="text-gray-500">Join the rural learning revolution</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} className="input" placeholder="Your full name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="input" placeholder="you@college.edu" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} className="input" placeholder="Minimum 6 characters" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role *</label>
              <select name="role" value={form.role} onChange={handleChange} className="input">
                <option value="student">Student</option>
                <option value="local">Local Faculty</option>
                <option value="expert">Expert Faculty (Remote)</option>
              </select>
              {(form.role === 'expert' || form.role === 'local') && (
                <p className="text-xs text-amber-600 mt-1">⚠️ Faculty accounts require admin approval before login.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">College / Institution</label>
              <input type="text" name="college" value={form.college} onChange={handleChange} className="input" placeholder="e.g. Rural College of Engineering" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
              <input type="text" name="department" value={form.department} onChange={handleChange} className="input" placeholder="e.g. Computer Science" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
