import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, FileText, Film, Link2, Play, Lock, CheckCircle,
  Star, Clock, ChevronRight, AlertCircle, Loader, ShoppingCart,
  Globe, Award, Video
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/* ── helpers ─────────────────────────────────────────────── */
const fileIcon = (type) => {
  if (type === 'video') return <Film size={16} className="text-purple-400" />;
  if (type === 'pdf')   return <FileText size={16} className="text-red-400" />;
  if (type === 'link')  return <Link2 size={16} className="text-cyan-400" />;
  return <FileText size={16} className="text-blue-400" />;
};

/* ── Razorpay payment handler ────────────────────────────── */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/* ─────────────────────────────────────────────────────────── */
export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [course,     setCourse]     = useState(null);
  const [enrollment, setEnrollment] = useState(null);   // null = not enrolled
  const [loading,    setLoading]    = useState(true);
  const [buying,     setBuying]     = useState(false);
  const [buyError,   setBuyError]   = useState('');
  const [activeTab,  setActiveTab]  = useState('overview'); // overview | curriculum

  /* Fetch course + enrollment status */
  const fetchData = useCallback(async () => {
    try {
      const [courseRes, enrollRes] = await Promise.all([
        api.get(`/courses/${id}`),
        user ? api.get(`/enrollment/check/${id}`) : Promise.resolve({ data: { enrolled: false } }),
      ]);
      setCourse(courseRes.data.course);
      if (enrollRes.data.enrolled) setEnrollment(enrollRes.data.enrollment);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Enroll / Purchase ──────────────────────────────────── */
  const handleEnroll = async () => {
    if (!user) { navigate('/login'); return; }
    setBuying(true); setBuyError('');

    try {
      const isFree = !course.price || course.price === 0;

      if (isFree) {
        // Free enrollment
        await api.post('/enrollment/free', { courseId: id });
        await fetchData();
        return;
      }

      /* ── Paid: Razorpay checkout ─────────────────────── */
      const loaded = await loadRazorpayScript();
      if (!loaded) { setBuyError('Payment gateway failed to load. Try again.'); return; }

      const orderRes = await api.post('/enrollment/create-order', { courseId: id });
      const { order, key, courseName, amount } = orderRes.data;

      const options = {
        key,
        amount,
        currency: 'INR',
        name: 'RuralEdu',
        description: courseName,
        order_id: order.id,
        prefill: { name: user.name, email: user.email },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          try {
            await api.post('/enrollment/verify-payment', {
              courseId: id,
              razorpay_order_id:    response.razorpay_order_id,
              razorpay_payment_id:  response.razorpay_payment_id,
              razorpay_signature:   response.razorpay_signature,
            });
            await fetchData();
          } catch (e) {
            setBuyError('Payment verification failed. Contact support.');
          }
        },
        modal: { ondismiss: () => setBuying(false) },
      };
      new window.Razorpay(options).open();

    } catch (err) {
      setBuyError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setBuying(false);
    }
  };

  /* ── Go to player ───────────────────────────────────────── */
  const goToContent = () => navigate(`/dashboard/learn/${id}`);

  /* ── Loading ────────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader size={32} className="animate-spin text-indigo-400" />
    </div>
  );
  if (!course) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">
      Course not found.
    </div>
  );

  const isFree      = !course.price || course.price === 0;
  const isEnrolled  = !!enrollment;
  const isFaculty   = user?.role === 'expert' || user?.role === 'admin';
  const canAccess   = isEnrolled || isFaculty;
  const totalMats   = course.materials?.length || 0;
  const videoCount  = course.materials?.filter(m => m.type === 'video').length || 0;

  return (
    <div className="min-h-screen pt-16 bg-slate-950">

      {/* ── Hero Banner ────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">

          {/* Left: info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-2">
              {course.tags?.map(t => (
                <span key={t} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">{t}</span>
              ))}
              {course.subject && <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">{course.subject}</span>}
            </div>

            <h1 className="text-3xl font-extrabold text-white leading-tight">{course.title}</h1>
            <p className="text-slate-300 text-base leading-relaxed">{course.description}</p>

            <div className="flex flex-wrap gap-5 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Users size={15} />{course.enrolledStudents?.length || 0} students</span>
              <span className="flex items-center gap-1.5"><FileText size={15} />{totalMats} materials</span>
              <span className="flex items-center gap-1.5"><Video size={15} />{videoCount} video lectures</span>
              <span className="flex items-center gap-1.5"><Globe size={15} />Hindi / English</span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                {course.facultyId?.name?.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-white font-medium">{course.facultyId?.name}</p>
                <p className="text-xs text-slate-400">Expert Faculty</p>
              </div>
            </div>
          </div>

          {/* Right: Purchase card */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl p-6 sticky top-20 space-y-4">
              {/* Preview thumbnail */}
              <div className="h-36 rounded-xl bg-gradient-to-br from-indigo-800/50 to-cyan-800/30 flex items-center justify-center border border-slate-700/40">
                <BookOpen size={48} className="text-indigo-400" />
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">
                  {isFree ? 'Free' : `₹${course.price}`}
                </span>
                {!isFree && <span className="text-slate-500 line-through text-lg">₹{Math.round(course.price * 1.4)}</span>}
              </div>

              {/* CTA */}
              {canAccess ? (
                <button
                  onClick={goToContent}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-base transition-all"
                >
                  <Play size={18} /> Continue Learning
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={buying}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-base transition-all"
                >
                  {buying ? <Loader size={18} className="animate-spin" /> : isFree ? <CheckCircle size={18} /> : <ShoppingCart size={18} />}
                  {buying ? 'Processing…' : isFree ? 'Enroll for Free' : 'Buy Now'}
                </button>
              )}

              {buyError && (
                <p className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle size={13} /> {buyError}
                </p>
              )}

              {isEnrolled && (
                <p className="text-center text-xs text-green-400 flex items-center justify-center gap-1">
                  <CheckCircle size={12} /> You are enrolled
                </p>
              )}

              {/* Includes */}
              <div className="border-t border-slate-700/50 pt-4 space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">This course includes</p>
                {[
                  [Video,       `${videoCount} video lectures`],
                  [FileText,    `${totalMats - videoCount} downloadable notes`],
                  [Award,       'Certificate of completion'],
                  [Clock,       'Lifetime access'],
                ].map(([Icon, text]) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-slate-300">
                    <Icon size={14} className="text-indigo-400 flex-shrink-0" /> {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body Tabs ──────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-1 border-b border-slate-800 mb-6">
          {['overview', 'curriculum'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-3">What you'll learn</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {(course.tags?.length ? course.tags : ['Core concepts', 'Practical examples', 'Assignments', 'Quizzes']).map(item => (
                  <div key={item} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle size={15} className="text-green-400 mt-0.5 flex-shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2">About this course</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{course.description}</p>
            </div>
          </div>
        )}

        {/* Curriculum tab */}
        {activeTab === 'curriculum' && (
          <div className="glass rounded-2xl divide-y divide-slate-700/50">
            <div className="p-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">{totalMats} materials</h2>
              {!canAccess && <span className="text-xs text-slate-400">Enroll to unlock all content</span>}
            </div>
            {course.materials?.length === 0 && (
              <div className="p-8 text-center text-slate-500">No materials added yet.</div>
            )}
            {course.materials?.map((mat, i) => (
              <div
                key={mat._id || i}
                className={`flex items-center gap-3 px-4 py-3.5 ${canAccess ? 'hover:bg-slate-800/40 cursor-pointer' : ''} transition-colors`}
                onClick={() => canAccess && goToContent()}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                  {fileIcon(mat.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{mat.title || `Lesson ${i + 1}`}</p>
                  <p className="text-xs text-slate-500 capitalize">{mat.type || 'material'}</p>
                </div>
                {canAccess
                  ? <ChevronRight size={16} className="text-slate-500 flex-shrink-0" />
                  : <Lock size={14} className="text-slate-600 flex-shrink-0" />
                }
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
