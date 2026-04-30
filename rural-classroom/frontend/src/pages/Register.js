import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

const roles = [
  { value: 'student', label: '🎓 Student', desc: 'Access courses, live classes, assignments' },
  { value: 'expert', label: '👨‍🏫 Expert Faculty', desc: 'Teach remotely, upload materials' },
  { value: 'local', label: '🏫 Local Faculty', desc: 'Manage attendance, local facilitation' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', college: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-cyan-900/10 pointer-events-none" />
      <div className="glass rounded-2xl p-8 w-full max-w-lg relative fade-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Join RuralEdu — Education without barriers</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ravi Kumar"
                required
                className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">College / Institute</label>
              <input
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                placeholder="RKGEC"
                className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@college.edu"
              required
              className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min 6 characters"
              required
              minLength={6}
              className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">I am a...</label>
            <div className="grid grid-cols-1 gap-2">
              {roles.map(({ value, label, desc }) => (
                <label key={value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${form.role === value ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 hover:border-slate-500'}`}>
                  <input type="radio" name="role" value={value} checked={form.role === value} onChange={() => setForm({ ...form, role: value })} className="sr-only" />
                  <span className="text-sm flex-1">{label} — <span className="text-slate-400">{desc}</span></span>
                  {form.role === value && <CheckCircle size={16} className="text-indigo-400 flex-shrink-0" />}
                </label>
              ))}
            </div>
            {(form.role === 'expert' || form.role === 'local') && (
              <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                ⚠️ Faculty accounts require admin approval before access.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-lg font-semibold transition-all"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
