import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Wifi, Brain, Users, Video, Shield, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI-Powered Recommendations', desc: 'Smart engine analyzes your scores and attendance to suggest personalized learning paths.' },
  { icon: Video, title: 'Live Interactive Classes', desc: 'Real-time sessions with polls, Q&A, and chat powered by Socket.io.' },
  { icon: Wifi, title: 'Low Bandwidth Optimized', desc: 'Lazy loading, compression, and streaming designed for rural internet conditions.' },
  { icon: Users, title: 'Multi-Role Platform', desc: 'Admin, Expert Faculty, Local Faculty, and Students — each with tailored dashboards.' },
  { icon: Shield, title: 'Secure & Role-Based', desc: 'JWT authentication with bcrypt, role-based access control, and protected routes.' },
  { icon: BookOpen, title: 'Rich Course Materials', desc: 'Upload PDFs, videos, assignments. Students download, submit, and track progress.' },
];

const stats = [
  { value: '50K+', label: 'Rural Students Served' },
  { value: '200+', label: 'Expert Faculty' },
  { value: '1,500+', label: 'Courses Available' },
  { value: '98%', label: 'Uptime Guaranteed' },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-cyan-900/20 pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-60 right-1/4 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-indigo-900/40 border border-indigo-500/30 rounded-full px-4 py-2 text-sm text-indigo-300 mb-6 fade-up">
            <Brain size={14} /> AI-Enhanced Learning for Rural India
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold leading-tight mb-6 fade-up" style={{ animationDelay: '0.1s' }}>
            <span className="gradient-text">Bridging</span> the<br />
            Educational Divide
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 fade-up" style={{ animationDelay: '0.2s' }}>
            A full-stack AI-enhanced remote classroom platform connecting expert faculty with rural college students — live, interactive, and optimized for low bandwidth.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center fade-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/register" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all glow hover:scale-105">
              Start Learning Free <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all border border-slate-600">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-slate-700/50">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-4xl font-extrabold gradient-text">{value}</p>
              <p className="text-slate-400 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-slate-400 max-w-xl mx-auto">A complete ecosystem for remote education, from live classes to AI-driven personalization.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass rounded-2xl p-6 hover:border-indigo-500/40 transition-all group">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600/40 transition-colors">
                  <Icon size={24} className="text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20 px-4 bg-slate-900/50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Built for Everyone</h2>
          <p className="text-slate-400 mb-12">Role-based access ensures every user gets exactly what they need.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { role: 'Admin', color: 'red', perks: ['Manage users', 'View analytics', 'Approve faculty', 'Manage courses'] },
              { role: 'Expert Faculty', color: 'purple', perks: ['Schedule live classes', 'Upload materials', 'Create assignments', 'Grade students'] },
              { role: 'Local Faculty', color: 'green', perks: ['Mark attendance', 'Monitor engagement', 'View analytics', 'Facilitate Q&A'] },
              { role: 'Student', color: 'cyan', perks: ['Join live classes', 'Submit assignments', 'AI recommendations', 'Download notes'] },
            ].map(({ role, color, perks }) => (
              <div key={role} className="glass rounded-2xl p-5 text-left">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 bg-${color}-500/20 text-${color}-400`}>{role}</span>
                <ul className="space-y-2">
                  {perks.map(p => (
                    <li key={p} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle size={14} className="text-green-400 flex-shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass rounded-3xl p-10 border-indigo-500/20">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Education?</h2>
            <p className="text-slate-400 mb-8">Join thousands of students and faculty on the platform built for rural India's future.</p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold transition-all glow">
              Get Started Today <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-700/50 py-8 text-center text-slate-500 text-sm">
        © 2024 RuralEdu Platform — AI-Enhanced Remote Classroom for Rural Colleges
      </footer>
    </div>
  );
}
