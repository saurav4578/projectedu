import React, { useState, useEffect } from 'react';
import { BookOpen, ClipboardList, Video, Star, Clock, Play, Radio, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments,      setEnrollments]      = useState([]);
  const [assignments,      setAssignments]      = useState([]);
  const [recommendations,  setRecommendations]  = useState([]);
  const [liveSessions,     setLiveSessions]     = useState([]);
  const [loading,          setLoading]          = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [enrRes, assRes, recsRes, liveRes] = await Promise.all([
          api.get('/enrollment/my'),
          api.get('/assignments?limit=3'),
          api.get(`/recommendations/${user._id}`),
          api.get('/live-sessions?status=live&limit=5'),
        ]);
        setEnrollments(enrRes.data.enrollments || []);
        setAssignments(assRes.data.assignments || []);
        setRecommendations(recsRes.data.recommendations || []);
        setLiveSessions(liveRes.data.sessions || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [user._id]);

  if (loading) return <LoadingSpinner text="Loading your dashboard…" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hello, {user.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-400 text-sm mt-1">{user.college || 'Welcome back!'}</p>
        </div>
        <p className="text-slate-500 text-xs hidden sm:block">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Enrolled Courses"  value={enrollments.length}       icon={BookOpen}      color="cyan" />
        <StatCard title="Live Now"          value={liveSessions.length}      icon={Radio}         color="red" />
        <StatCard title="Assignments"       value={assignments.length}       icon={ClipboardList} color="orange" />
        <StatCard title="AI Suggestions"    value={recommendations.length}   icon={Star}          color="indigo" />
      </div>

      {/* Live sessions to join */}
      {liveSessions.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse" />
            <h3 className="font-semibold text-white">Live Classes Happening Now!</h3>
          </div>
          <div className="space-y-2">
            {liveSessions.map(s => (
              <div key={s._id} className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-white">{s.title}</p>
                  <p className="text-xs text-slate-400">by {s.facultyId?.name} · {s.courseId?.title}</p>
                </div>
                <Link to={`/dashboard/live/${s._id}`}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                  <Radio size={12} /> Join Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My enrolled courses */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">My Courses</h3>
          <Link to="/dashboard/courses" className="text-sm text-indigo-400 hover:text-indigo-300">Browse more →</Link>
        </div>
        {enrollments.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">You haven't enrolled in any courses yet.</p>
            <Link to="/dashboard/courses" className="inline-flex items-center gap-1 mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">
              <Play size={14} /> Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {enrollments.map(({ courseId: course, completedMaterials, enrolledAt }) => {
              if (!course) return null;
              const total = course.materials?.length || 0;
              const done  = completedMaterials?.length || 0;
              const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <div key={course._id} className="bg-slate-800/60 border border-slate-700/50 hover:border-indigo-500/30 rounded-xl p-4 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-white leading-snug">{course.title}</h4>
                    <span className="text-xs text-slate-500 flex-shrink-0">by {course.facultyId?.name}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{done}/{total} completed</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <Link to={`/dashboard/learn/${course._id}`}
                    className="flex items-center justify-center gap-1.5 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-medium transition-colors">
                    <Play size={12} /> {pct > 0 ? 'Continue' : 'Start Learning'}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star size={18} className="text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
            <Link to="/dashboard/recommendations" className="ml-auto text-xs text-indigo-400">View all →</Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {recommendations.slice(0, 4).map((rec, i) => (
              <div key={i} className={`p-3 rounded-xl border text-sm ${
                rec.priority === 'high'   ? 'border-red-500/30 bg-red-500/5' :
                rec.priority === 'medium' ? 'border-yellow-500/30 bg-yellow-500/5' :
                                            'border-green-500/30 bg-green-500/5'
              }`}>
                <div className="flex gap-2">
                  <span className="text-xl">{rec.icon}</span>
                  <p className="text-slate-300 text-xs leading-relaxed">{rec.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignments */}
      {assignments.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Upcoming Assignments</h3>
          <div className="space-y-2">
            {assignments.map(a => (
              <div key={a._id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div>
                  <p className="text-sm text-white font-medium">{a.title}</p>
                  <p className="text-xs text-slate-400">{a.courseId?.title}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-orange-400">
                  <Clock size={12} />
                  {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'Open'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
