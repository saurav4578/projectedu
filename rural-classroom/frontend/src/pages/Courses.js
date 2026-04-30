import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, FileText, Play, Search, Filter } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/courses?page=${page}&limit=9${search ? `&search=${search}` : ''}`);
      setCourses(res.data.courses || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, [page, search]);

  const enroll = async (courseId) => {
    try {
      await api.post(`/courses/${courseId}/enroll`);
      alert('Enrolled successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error enrolling');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Courses</h1>
          <p className="text-slate-400 text-sm mt-1">{total} courses available</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search courses..."
            className="bg-slate-800 border border-slate-600 focus:border-indigo-500 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 outline-none w-64"
          />
        </div>
      </div>

      {loading ? <LoadingSpinner text="Loading courses..." /> : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map(course => (
              <div key={course._id} className="glass rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all group">
                <div className="h-32 bg-gradient-to-br from-indigo-900/60 to-cyan-900/40 flex items-center justify-center">
                  <BookOpen size={40} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">{course.title}</h3>
                  <p className="text-slate-400 text-xs mb-3 line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1"><Users size={12} /> {course.enrolledStudents?.length || 0}</span>
                    <span className="flex items-center gap-1"><FileText size={12} /> {course.materials?.length || 0} materials</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">by {course.facultyId?.name || 'Faculty'}</span>
                    {user?.role === 'student' && (
                      <button onClick={() => enroll(course._id)} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        <Play size={10} /> Enroll
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {courses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen size={48} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No courses found</p>
            </div>
          )}

          {total > 9 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-slate-800 text-sm text-white rounded-lg disabled:opacity-40">Previous</button>
              <span className="px-4 py-2 text-sm text-slate-400">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={courses.length < 9} className="px-4 py-2 bg-slate-800 text-sm text-white rounded-lg disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
