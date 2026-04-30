import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';

const CoursesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subject: '', level: 'beginner' });
  const [creating, setCreating] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (search) params.search = search;
      if (level) params.level = level;
      if (user.role === 'expert') params.facultyId = user._id;

      const res = await api.get('/courses', { params });
      setCourses(res.data.courses);
      setTotalPages(res.data.pages);
    } catch (err) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [page, search, level, user]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleEnroll = async (courseId) => {
    try {
      await api.post(`/courses/${courseId}/enroll`);
      toast.success('Enrolled successfully!');
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/courses', form);
      toast.success('Course created!');
      setShowCreate(false);
      setForm({ title: '', description: '', subject: '', level: 'beginner' });
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const levelColors = { beginner: 'bg-green-100 text-green-700', intermediate: 'bg-yellow-100 text-yellow-700', advanced: 'bg-red-100 text-red-700' };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">📚 Courses</h1>
          {(user.role === 'expert' || user.role === 'admin') && (
            <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
              + New Course
            </button>
          )}
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="card mb-6 border-indigo-200">
            <h2 className="font-semibold text-gray-900 mb-4">Create New Course</h2>
            <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
              <input className="input" placeholder="Course Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <input className="input" placeholder="Subject *" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              <textarea className="input sm:col-span-2" rows={3} placeholder="Course Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <div className="flex gap-3">
                <button type="submit" disabled={creating} className="btn-primary flex-1">{creating ? 'Creating...' : 'Create Course'}</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text" placeholder="🔍 Search courses..."
            className="input max-w-xs" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="input max-w-xs" value={level} onChange={(e) => { setLevel(e.target.value); setPage(1); }}>
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {courses.length === 0 ? (
              <div className="card text-center py-16">
                <span className="text-5xl">📚</span>
                <p className="text-gray-500 mt-4">No courses found</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => {
                  const isEnrolled = course.enrolledStudents?.some((s) => typeof s === 'string' ? s === user._id : s._id === user._id);
                  return (
                    <div key={course._id} className="card hover:shadow-md transition-shadow flex flex-col">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-36 object-cover rounded-lg mb-4" loading="lazy" />
                      ) : (
                        <div className="w-full h-36 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
                          <span className="text-4xl">📖</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`badge ${levelColors[course.level] || 'bg-gray-100 text-gray-600'}`}>{course.level}</span>
                          <span className="text-xs text-gray-400">{course.enrolledStudents?.length || 0} students</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                        <p className="text-gray-500 text-sm mb-2 line-clamp-2">{course.description}</p>
                        <p className="text-xs text-indigo-600 mb-4">📌 {course.subject}</p>
                        <p className="text-xs text-gray-400">by {course.facultyId?.name || 'Faculty'}</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Link to={`/courses/${course._id}`} className="btn-secondary flex-1 text-sm text-center">
                          View
                        </Link>
                        {user.role === 'student' && !isEnrolled && (
                          <button onClick={() => handleEnroll(course._id)} className="btn-primary flex-1 text-sm">
                            Enroll
                          </button>
                        )}
                        {user.role === 'student' && isEnrolled && (
                          <span className="badge bg-green-100 text-green-700 self-center">Enrolled ✓</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
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

export default CoursesPage;
