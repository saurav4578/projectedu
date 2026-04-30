import React, { useState, useEffect } from 'react';
import { BookOpen, Video, Users, Plus, Radio, ExternalLink, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';

export default function ExpertDashboard() {
  const navigate = useNavigate();
  const [courses,  setCourses]  = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [showCourseModal,  setShowCourseModal]  = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [courseForm,  setCourseForm]  = useState({ title: '', description: '', subject: '', price: 0 });
  const [sessionForm, setSessionForm] = useState({ courseId: '', title: '', scheduledAt: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cr, sr] = await Promise.all([
          api.get('/courses?limit=6'),
          api.get('/live-sessions?limit=10'),
        ]);
        setCourses(cr.data.courses || []);
        setSessions(sr.data.sessions || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const createCourse = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await api.post('/courses', courseForm);
      setCourses([res.data.course, ...courses]);
      setShowCourseModal(false);
      setCourseForm({ title: '', description: '', subject: '', price: 0 });
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const createSession = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await api.post('/live-sessions', sessionForm);
      const newSession = res.data.session;
      setSessions([newSession, ...sessions]);
      setShowSessionModal(false);
      setSessionForm({ courseId: '', title: '', scheduledAt: '' });
      // Start it immediately
      await api.put(`/live-sessions/${newSession._id}/start`);
      navigate(`/dashboard/live/${newSession._id}`);
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const startExisting = async (sessionId) => {
    await api.put(`/live-sessions/${sessionId}/start`);
    navigate(`/dashboard/live/${sessionId}`);
  };

  if (loading) return <LoadingSpinner text="Loading dashboard…" />;

  const liveNow = sessions.filter(s => s.status === 'live');
  const scheduled = sessions.filter(s => s.status === 'scheduled');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Expert Faculty Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage courses, live sessions and lectures</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSessionModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Radio size={15} /> Go Live
          </button>
          <button onClick={() => setShowCourseModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={15} /> New Course
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Courses"    value={courses.length}            icon={BookOpen} color="indigo" />
        <StatCard title="Live Now"      value={liveNow.length}            icon={Radio}    color="red" />
        <StatCard title="Scheduled"     value={scheduled.length}          icon={Clock}    color="cyan" />
        <StatCard title="Total Sessions"value={sessions.length}           icon={Video}    color="purple" />
      </div>

      {/* Live sessions */}
      {liveNow.length > 0 && (
        <div className="glass rounded-2xl p-5 border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse" />
            <h3 className="font-semibold text-white">Currently Live</h3>
          </div>
          <div className="space-y-2">
            {liveNow.map(s => (
              <div key={s._id} className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div>
                  <p className="text-sm text-white font-medium">{s.title}</p>
                  <p className="text-xs text-slate-400">{s.courseId?.title}</p>
                </div>
                <Link to={`/dashboard/live/${s._id}`}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                  <ExternalLink size={12} /> Rejoin
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Courses */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">My Courses</h3>
            <Link to="/dashboard/courses" className="text-xs text-indigo-400">View all →</Link>
          </div>
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={36} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No courses yet.</p>
              <button onClick={() => setShowCourseModal(true)} className="mt-2 text-indigo-400 text-sm hover:underline">Create one →</button>
            </div>
          ) : courses.map(c => (
            <div key={c._id} className="flex items-center justify-between py-2.5 border-b border-slate-700/40 last:border-0">
              <div>
                <p className="text-sm text-white font-medium">{c.title}</p>
                <p className="text-xs text-slate-400">{c.enrolledStudents?.length || 0} students · {c.materials?.length || 0} materials</p>
              </div>
              <Link to={`/dashboard/upload`} className="text-xs text-indigo-400 hover:underline">Upload →</Link>
            </div>
          ))}
        </div>

        {/* Sessions */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Sessions</h3>
            <button onClick={() => setShowSessionModal(true)} className="text-xs text-indigo-400">+ Schedule</button>
          </div>
          {sessions.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No sessions yet. Go Live!</p>
          ) : sessions.slice(0, 6).map(s => (
            <div key={s._id} className="flex items-center justify-between py-2.5 border-b border-slate-700/40 last:border-0">
              <div>
                <p className="text-sm text-white font-medium">{s.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    s.status === 'live' ? 'bg-red-500/20 text-red-400' :
                    s.status === 'scheduled' ? 'bg-cyan-500/20 text-cyan-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>{s.status === 'live' ? '🔴 LIVE' : s.status}</span>
                  {s.scheduledAt && <span className="text-xs text-slate-500">{new Date(s.scheduledAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                </div>
              </div>
              {s.status === 'scheduled' && (
                <button onClick={() => startExisting(s._id)} className="text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg transition-colors">Start</button>
              )}
              {s.status === 'live' && (
                <Link to={`/dashboard/live/${s._id}`} className="text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg transition-colors">Rejoin</Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Course Modal */}
      <Modal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} title="Create New Course">
        <form onSubmit={createCourse} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Course Title *</label>
            <input value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} required placeholder="e.g. Introduction to Python" className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Subject</label>
              <input value={courseForm.subject} onChange={e => setCourseForm({...courseForm, subject: e.target.value})} placeholder="Computer Science" className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none" />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Price (₹) — 0 = Free</label>
              <input type="number" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: Number(e.target.value)})} min={0} className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white outline-none" />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Description *</label>
            <textarea value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} required rows={3} className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none resize-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowCourseModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{submitting ? 'Creating…' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Schedule / Start Live Session Modal */}
      <Modal isOpen={showSessionModal} onClose={() => setShowSessionModal(false)} title="Start Live Session">
        <form onSubmit={createSession} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Session Title *</label>
            <input value={sessionForm.title} onChange={e => setSessionForm({...sessionForm, title: e.target.value})} required placeholder="e.g. Week 3 — Functions in Python" className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 outline-none" />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Course</label>
            <select value={sessionForm.courseId} onChange={e => setSessionForm({...sessionForm, courseId: e.target.value})} required className="w-full bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-white outline-none">
              <option value="">-- Select course --</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
          <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-xl p-3 text-sm text-slate-300">
            💡 Clicking <strong>Start Live</strong> will create the session and immediately take you to the live room. Share the link with students to join.
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowSessionModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
            <button type="submit" disabled={submitting} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              <Radio size={14} /> {submitting ? 'Starting…' : 'Start Live Now'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
