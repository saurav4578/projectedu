import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';

const AssignmentsPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ courseId: '', title: '', description: '', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignRes, courseRes] = await Promise.all([
        api.get('/assignments', { params: { limit: 20 } }),
        api.get('/courses', { params: { limit: 50, facultyId: user.role === 'expert' ? user._id : undefined } }),
      ]);
      setAssignments(assignRes.data.assignments);
      setCourses(courseRes.data.courses);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/assignments', form);
      toast.success('Assignment created!');
      setShowCreate(false);
      setForm({ courseId: '', title: '', description: '', dueDate: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (assignmentId) => {
    const text = prompt('Enter your answer or submission notes:');
    if (!text) return;
    try {
      await api.post(`/assignments/${assignmentId}/submit`, { text });
      toast.success('Assignment submitted!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
  };

  const isOverdue = (dueDate) => new Date(dueDate) < new Date();
  const hasSubmitted = (assignment) =>
    assignment.submissions?.some((s) => s.studentId === user._id || s.studentId?._id === user._id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">📝 Assignments</h1>
          {(user.role === 'expert' || user.role === 'local' || user.role === 'admin') && (
            <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">+ Create</button>
          )}
        </div>

        {showCreate && (
          <div className="card mb-6 border-indigo-200 border-2">
            <h2 className="font-semibold mb-4">Create Assignment</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <select className="input" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
                <option value="">Select Course *</option>
                {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
              <input className="input" placeholder="Assignment Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <textarea className="input" rows={3} placeholder="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              <input type="datetime-local" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Creating...' : 'Create'}</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? <LoadingSpinner /> : (
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="card text-center py-16">
                <span className="text-4xl">📝</span>
                <p className="text-gray-400 mt-4">No assignments found</p>
              </div>
            ) : assignments.map((a) => {
              const overdue = isOverdue(a.dueDate);
              const submitted = hasSubmitted(a);
              return (
                <div key={a._id} className="card hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge bg-indigo-100 text-indigo-700">{a.courseId?.subject || a.courseId?.title}</span>
                        {overdue ? (
                          <span className="badge bg-red-100 text-red-600">Overdue</span>
                        ) : (
                          <span className="badge bg-green-100 text-green-600">Active</span>
                        )}
                        {submitted && <span className="badge bg-purple-100 text-purple-700">✓ Submitted</span>}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{a.title}</h3>
                      <p className="text-sm text-gray-500 mb-2">{a.description}</p>
                      <p className="text-xs text-gray-400">
                        Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} •
                        Max: {a.maxScore} pts •
                        {a.submissions?.length || 0} submissions
                      </p>
                    </div>
                    {user.role === 'student' && !submitted && !overdue && (
                      <button onClick={() => handleSubmit(a._id)} className="btn-primary text-sm">
                        Submit
                      </button>
                    )}
                    {(user.role === 'expert' || user.role === 'local') && (
                      <div className="text-sm text-gray-500">
                        {a.submissions?.length || 0} / {a.courseId?.enrolledStudents?.length || '?'} submitted
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentsPage;
