import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';

const features = [
  { icon: '🎓', title: 'Live Classes', desc: 'Real-time interactive sessions with expert faculty from anywhere.' },
  { icon: '🤖', title: 'AI Recommendations', desc: 'Personalized learning paths based on your performance and attendance.' },
  { icon: '📚', title: 'Course Materials', desc: 'Download PDFs, watch recorded lectures, and access notes anytime.' },
  { icon: '📊', title: 'Analytics Dashboard', desc: 'Track progress, grades, and attendance with visual charts.' },
  { icon: '💬', title: 'Real-time Chat & Q&A', desc: 'Ask questions and get answers live during class sessions.' },
  { icon: '📡', title: 'Low Bandwidth Optimized', desc: 'Designed for rural areas with limited internet connectivity.' },
];

const roles = [
  { title: 'Admin', icon: '🛡️', color: 'bg-red-50 border-red-200', desc: 'Manage users, approve faculty, and view platform-wide analytics.' },
  { title: 'Expert Faculty', icon: '👨‍🏫', color: 'bg-blue-50 border-blue-200', desc: 'Schedule live classes, upload materials, create assignments.' },
  { title: 'Local Faculty', icon: '👩‍🏫', color: 'bg-green-50 border-green-200', desc: 'Mark attendance, monitor engagement, facilitate discussion.' },
  { title: 'Student', icon: '👨‍🎓', color: 'bg-purple-50 border-purple-200', desc: 'Join classes, submit assignments, get AI-powered study tips.' },
];

const HomePage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-indigo-700 text-indigo-200 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            🌾 Built for Rural India
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
            AI-Enhanced Remote Classroom Platform for Rural Colleges
          </h1>
          <p className="text-indigo-200 text-lg max-w-2xl mx-auto mb-10">
            Connecting expert faculty with rural students through live classes, AI-powered recommendations, and smart analytics — optimized for low bandwidth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-indigo-700 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors">
              Get Started Free
            </Link>
            <Link to="/login" className="border border-indigo-400 text-white font-semibold px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '4 Roles', label: 'User Types' },
            { value: 'Real-time', label: 'Live Classes' },
            { value: 'AI-Powered', label: 'Recommendations' },
            { value: 'Low-Band', label: 'Optimized' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-indigo-600">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Everything You Need</h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            A complete learning ecosystem built specifically for the challenges faced by rural educational institutions.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card hover:shadow-md transition-shadow">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="font-semibold text-gray-900 mt-3 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Built for Every Role</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((r) => (
              <div key={r.title} className={`rounded-xl border-2 p-6 ${r.color}`}>
                <span className="text-4xl">{r.icon}</span>
                <h3 className="font-bold text-gray-900 mt-3 mb-2">{r.title}</h3>
                <p className="text-gray-600 text-sm">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-indigo-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Transform Rural Education?</h2>
        <p className="text-indigo-200 mb-8 max-w-md mx-auto">
          Join thousands of students and faculty already using our platform.
        </p>
        <Link to="/register" className="bg-white text-indigo-700 font-semibold px-10 py-3 rounded-xl hover:bg-indigo-50 transition-colors inline-block">
          Start Learning Today
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>© 2024 Rural Classroom Platform. Built with ❤️ for India's rural students.</p>
      </footer>
    </div>
  );
};

export default HomePage;
