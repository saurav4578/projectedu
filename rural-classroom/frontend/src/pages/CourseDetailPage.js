import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';

const CourseDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadForm, setUploadForm] = useState({ title: '', file: null });

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data.course);
    } catch (err) {
      toast.error('Course not found');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) return toast.error('Select a file');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title || uploadForm.file.name);
      await api.post(`/courses/${id}/materials`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Material uploaded!');
      setUploadForm({ title: '', file: null });
      fetchCourse();
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const startLive = async () => {
    try {
      const res = await api.post(`/courses/${id}/live`);
      navigate(`/live/${res.data.sessionId}`);
    } catch (err) {
      toast.error('Could not start session');
    }
  };

  if (loading) return <><Navbar /><LoadingSpinner fullScreen /></>;
  if (!course) return null;

  const isFaculty = user._id === course.facultyId?._id || user.role === 'admin';
  const typeIcons = { pdf: '📄', video: '🎬', image: '🖼️', doc: '📝', link: '🔗' };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'materials', label: `Materials (${course.materials?.length || 0})` },
    { id: 'students', label: `Students (${course.enrolledStudents?.length || 0})` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge bg-indigo-100 text-indigo-700">{course.level}</span>
                <span className="badge bg-gray-100 text-gray-600">📌 {course.subject}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-500">{course.description}</p>
              <p className="text-sm text-gray-400 mt-3">👨‍🏫 by {course.facultyId?.name} | 🏫 {course.college || 'All Colleges'}</p>
            </div>
            {isFaculty && (
              <button onClick={startLive} className="btn-primary flex items-center gap-2">
                <span className="live-badge w-2 h-2 bg-white rounded-full inline-block"></span>
                Start Live Class
              </button>
            )}
            {course.liveSessionId && user.role === 'student' && (
              <button onClick={() => navigate(`/live/${course.liveSessionId}`)} className="btn-primary bg-red-600 hover:bg-red-700">
                🔴 Join Live Class
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="card text-center">
              <div className="text-2xl font-bold text-indigo-600">{course.enrolledStudents?.length || 0}</div>
              <div className="text-sm text-gray-500">Students</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-600">{course.materials?.length || 0}</div>
              <div className="text-sm text-gray-500">Materials</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-blue-600">{course.schedule?.duration || 60}</div>
              <div className="text-sm text-gray-500">Min/Session</div>
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-4">
            {isFaculty && (
              <div className="card border-dashed border-2 border-indigo-200">
                <h3 className="font-medium text-gray-900 mb-3">Upload Material</h3>
                <form onSubmit={handleUpload} className="flex flex-wrap gap-3 items-end">
                  <input
                    className="input max-w-xs" placeholder="Material title (optional)"
                    value={uploadForm.title} onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  />
                  <input
                    type="file" className="text-sm"
                    accept=".pdf,.mp4,.webm,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx"
                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                  />
                  <button type="submit" disabled={uploading} className="btn-primary text-sm">
                    {uploading ? 'Uploading...' : '⬆️ Upload'}
                  </button>
                </form>
              </div>
            )}

            {(course.materials || []).length === 0 ? (
              <div className="card text-center py-12">
                <span className="text-4xl">📂</span>
                <p className="text-gray-400 mt-3">No materials yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {course.materials.map((m, i) => (
                  <div key={i} className="card flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{typeIcons[m.type] || '📄'}</span>
                      <div>
                        <p className="font-medium text-sm">{m.title}</p>
                        <p className="text-xs text-gray-400 capitalize">{m.type} • {m.size ? `${(m.size / 1024 / 1024).toFixed(1)} MB` : ''}</p>
                      </div>
                    </div>
                    <a href={m.url} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && isFaculty && (
          <div className="space-y-3">
            {(course.enrolledStudents || []).map((student) => (
              <div key={student._id} className="card flex items-center gap-4">
                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                  {student.avatar ? (
                    <img src={student.avatar} alt={student.name} className="w-9 h-9 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-indigo-600 font-bold">{student.name?.[0]}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{student.name}</p>
                  <p className="text-xs text-gray-400">{student.email}</p>
                </div>
              </div>
            ))}
            {(!course.enrolledStudents || course.enrolledStudents.length === 0) && (
              <div className="card text-center py-10">
                <p className="text-gray-400">No students enrolled yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailPage;
