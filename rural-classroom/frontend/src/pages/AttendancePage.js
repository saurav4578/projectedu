import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';

const AttendancePage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) fetchStudents();
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const params = {};
      if (user.role === 'expert' || user.role === 'local') params.facultyId = user._id;
      const res = await api.get('/courses', { params: { ...params, limit: 50 } });
      setCourses(res.data.courses);
    } catch (err) {
      toast.error('Failed to load courses');
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/courses/${selectedCourse}`);
      const studentList = res.data.course.enrolledStudents || [];
      setStudents(studentList);
      // Pre-fill attendance as absent
      const init = {};
      studentList.forEach((s) => { init[s._id] = 'absent'; });
      setAttendance(init);

      // Fetch existing records for this date
      const attRes = await api.get('/attendance', { params: { courseId: selectedCourse, startDate: date, endDate: date } });
      const existing = {};
      attRes.data.records.forEach((r) => {
        existing[r.studentId?._id || r.studentId] = r.status;
      });
      setAttendance((prev) => ({ ...prev, ...existing }));
      setRecords(attRes.data.records);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCourse || students.length === 0) return;
    setSubmitting(true);
    try {
      const studentsData = students.map((s) => ({
        studentId: s._id,
        status: attendance[s._id] || 'absent',
      }));
      await api.post('/attendance/bulk', {
        courseId: selectedCourse,
        date,
        students: studentsData,
      });
      toast.success('Attendance saved successfully!');
    } catch (err) {
      toast.error('Failed to save attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAll = (status) => {
    const updated = {};
    students.forEach((s) => { updated[s._id] = status; });
    setAttendance(updated);
  };

  const summary = {
    present: Object.values(attendance).filter((s) => s === 'present').length,
    absent: Object.values(attendance).filter((s) => s === 'absent').length,
    late: Object.values(attendance).filter((s) => s === 'late').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">✅ Mark Attendance</h1>

        {/* Controls */}
        <div className="card mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Course</label>
            <select className="input" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="">Select a course...</option>
              {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        {selectedCourse && (
          <>
            {/* Summary */}
            {students.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card text-center bg-green-50">
                  <div className="text-2xl font-bold text-green-600">{summary.present}</div>
                  <div className="text-sm text-gray-500">Present</div>
                </div>
                <div className="card text-center bg-red-50">
                  <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
                  <div className="text-sm text-gray-500">Absent</div>
                </div>
                <div className="card text-center bg-yellow-50">
                  <div className="text-2xl font-bold text-yellow-600">{summary.late}</div>
                  <div className="text-sm text-gray-500">Late</div>
                </div>
              </div>
            )}

            {/* Quick actions */}
            {students.length > 0 && (
              <div className="flex gap-3 mb-4">
                <button onClick={() => toggleAll('present')} className="text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200">All Present</button>
                <button onClick={() => toggleAll('absent')} className="text-sm bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200">All Absent</button>
              </div>
            )}

            {loading ? <LoadingSpinner /> : (
              <div className="space-y-3">
                {students.length === 0 ? (
                  <div className="card text-center py-12">
                    <span className="text-4xl">👥</span>
                    <p className="text-gray-400 mt-3">No students enrolled in this course</p>
                  </div>
                ) : students.map((student) => {
                  const status = attendance[student._id] || 'absent';
                  return (
                    <div key={student._id} className="card flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-bold">{student.name?.[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{student.name}</p>
                          <p className="text-xs text-gray-400">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {['present', 'late', 'absent'].map((s) => (
                          <button
                            key={s}
                            onClick={() => setAttendance({ ...attendance, [student._id]: s })}
                            className={`text-xs px-3 py-1.5 rounded-lg transition-colors capitalize ${
                              status === s
                                ? s === 'present' ? 'bg-green-600 text-white' : s === 'late' ? 'bg-yellow-500 text-white' : 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {students.length > 0 && (
              <div className="mt-6 flex justify-end">
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : '💾 Save Attendance'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
