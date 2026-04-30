import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Film, FileText, Link2, ChevronLeft, ChevronRight,
  CheckCircle, Circle, Download, ExternalLink, Loader,
  BookOpen, Play, Menu, X, BarChart2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/* ── Determine embed URL ───────────────────────────────────── */
function getEmbedUrl(url) {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  // Google Drive
  const driveMatch = url.match(/\/file\/d\/([^/]+)/);
  if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  // Direct video file
  if (/\.(mp4|webm)$/i.test(url)) return url;
  return null;
}

function isYouTube(url) {
  return /youtube\.com|youtu\.be/.test(url || '');
}

/* ── Sidebar material item ─────────────────────────────────── */
function SidebarItem({ mat, index, active, completed, onClick }) {
  const icons = { video: Film, pdf: FileText, link: Link2, doc: FileText };
  const Icon = icons[mat.type] || FileText;
  const colors = { video: 'text-purple-400', pdf: 'text-red-400', link: 'text-cyan-400', doc: 'text-blue-400' };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
        active ? 'bg-indigo-600/20 border border-indigo-500/40' : 'hover:bg-slate-800/60 border border-transparent'
      }`}
    >
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
        {completed
          ? <CheckCircle size={18} className="text-green-400" />
          : <Circle size={18} className={active ? 'text-indigo-400' : 'text-slate-600'} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${active ? 'text-white font-medium' : 'text-slate-400'}`}>
          {mat.title || `Lesson ${index + 1}`}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Icon size={11} className={colors[mat.type] || 'text-slate-500'} />
          <span className="text-xs text-slate-600 capitalize">{mat.type}</span>
        </div>
      </div>
    </button>
  );
}

/* ── Video / PDF / Link renderer ───────────────────────────── */
function ContentRenderer({ material, onEnded }) {
  const videoRef = useRef(null);
  const type = material.type;
  const url  = material.url;

  if (!url) return (
    <div className="flex items-center justify-center h-full text-slate-500">
      No content URL provided.
    </div>
  );

  /* video (local file) */
  if (type === 'video' && !isYouTube(url) && !url.includes('drive.google')) {
    const src = url.startsWith('http') ? url : `http://localhost:5000${url}`;
    return (
      <video
        ref={videoRef}
        key={src}
        controls
        onEnded={onEnded}
        className="w-full h-full rounded-xl"
        style={{ background: '#000' }}
      >
        <source src={src} />
        Your browser does not support video.
      </video>
    );
  }

  /* YouTube / Drive embed */
  const embedUrl = getEmbedUrl(url);
  if (embedUrl) {
    return (
      <iframe
        key={embedUrl}
        src={embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded-xl border-0"
        title={material.title}
        onLoad={onEnded}   /* treat load as "viewed" for iframes */
      />
    );
  }

  /* PDF (local or CDN) */
  if (type === 'pdf') {
    const src = url.startsWith('http') ? url : `http://localhost:5000${url}`;
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-900 rounded-xl p-8">
        <FileText size={56} className="text-red-400" />
        <p className="text-white font-medium">{material.title}</p>
        <div className="flex gap-3">
          <a href={src} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <ExternalLink size={15} /> Open PDF
          </a>
          <a href={src} download
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={15} /> Download
          </a>
        </div>
      </div>
    );
  }

  /* External link */
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-900 rounded-xl p-8">
      <Link2 size={48} className="text-cyan-400" />
      <p className="text-white font-medium text-center">{material.title}</p>
      <a href={url} target="_blank" rel="noreferrer"
        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        onClick={onEnded}
      >
        <ExternalLink size={15} /> Open Link
      </a>
    </div>
  );
}

/* ── Main Player ───────────────────────────────────────────── */
export default function CoursePlayer() {
  const { courseId } = useParams();
  const { user }     = useNavigate ? useNavigate() && React.useContext(React.createContext()) : {};
  const authCtx      = React.useContext(React.createContext());
  const navigate     = useNavigate();

  const { user: authUser } = React.useContext(
    // eslint-disable-next-line react-hooks/rules-of-hooks
    (() => { const { useAuth: ua } = require('../context/AuthContext'); return ua; })()
  );

  const [course,       setCourse]       = useState(null);
  const [enrollment,   setEnrollment]   = useState(null);
  const [activeIndex,  setActiveIndex]  = useState(0);
  const [completed,    setCompleted]    = useState(new Set());
  const [loading,      setLoading]      = useState(true);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, enrollRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/enrollment/check/${courseId}`),
        ]);
        const c = courseRes.data.course;
        const e = enrollRes.data.enrollment;

        // Access guard
        if (!enrollRes.data.enrolled && authUser?.role === 'student') {
          navigate(`/course/${courseId}`);
          return;
        }

        setCourse(c);
        setEnrollment(e);
        if (e?.completedMaterials) setCompleted(new Set(e.completedMaterials));
      } catch (err) {
        navigate('/dashboard/courses');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, navigate, authUser]);

  const materials   = course?.materials || [];
  const current     = materials[activeIndex];
  const pct         = materials.length > 0 ? Math.round((completed.size / materials.length) * 100) : 0;

  /* Mark material as complete */
  const markComplete = useCallback(async () => {
    if (!current?._id || completed.has(current._id)) return;
    try {
      await api.post('/enrollment/mark-complete', { courseId, materialId: current._id });
      setCompleted(prev => new Set([...prev, current._id]));
    } catch (err) { /* non-critical */ }
  }, [current, completed, courseId]);

  const goTo = (idx) => {
    if (idx < 0 || idx >= materials.length) return;
    setActiveIndex(idx);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader size={32} className="animate-spin text-indigo-400" />
    </div>
  );

  if (!course) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col pt-16">

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-3 flex-shrink-0">
        <Link to="/dashboard/courses" className="text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{course.title}</p>
        </div>
        {/* Progress */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <BarChart2 size={14} />
          <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span>{pct}%</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-2"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Player */}
          <div className="flex-1 p-4" style={{ minHeight: 0 }}>
            {current ? (
              <div className="h-full" style={{ minHeight: '360px' }}>
                <ContentRenderer material={current} onEnded={markComplete} />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <BookOpen size={48} className="mx-auto mb-3 text-slate-700" />
                  <p>No materials in this course yet.</p>
                </div>
              </div>
            )}
          </div>

          {/* Info bar */}
          {current && (
            <div className="px-4 pb-4 space-y-3 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{current.title || `Lesson ${activeIndex + 1}`}</h2>
                  <p className="text-sm text-slate-400 capitalize">{current.type} · Lesson {activeIndex + 1} of {materials.length}</p>
                </div>
                <button
                  onClick={markComplete}
                  disabled={completed.has(current._id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    completed.has(current._id)
                      ? 'bg-green-500/20 text-green-400 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  <CheckCircle size={15} />
                  {completed.has(current._id) ? 'Completed' : 'Mark Complete'}
                </button>
              </div>

              {/* Prev / Next */}
              <div className="flex gap-2">
                <button
                  onClick={() => goTo(activeIndex - 1)}
                  disabled={activeIndex === 0}
                  className="flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white rounded-lg text-sm transition-colors"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <button
                  onClick={() => { markComplete(); goTo(activeIndex + 1); }}
                  disabled={activeIndex === materials.length - 1}
                  className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-lg text-sm transition-colors"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: curriculum */}
        {sidebarOpen && (
          <aside className="w-72 border-l border-slate-800 bg-slate-900 overflow-y-auto flex-shrink-0">
            <div className="p-3 border-b border-slate-800">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Course Content</p>
              <p className="text-xs text-slate-500 mt-0.5">{completed.size}/{materials.length} completed</p>
            </div>
            <div className="p-2 space-y-0.5">
              {materials.map((mat, i) => (
                <SidebarItem
                  key={mat._id || i}
                  mat={mat}
                  index={i}
                  active={i === activeIndex}
                  completed={completed.has(mat._id)}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
              {materials.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-6">No materials yet</p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
