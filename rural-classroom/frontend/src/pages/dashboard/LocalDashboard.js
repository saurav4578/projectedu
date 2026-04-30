import React, { useState, useEffect } from 'react';
import { UserCheck, Users, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';

export default function LocalDashboard() {
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([{ name: 'Ravi Kumar', id: 'demo1' }, { name: 'Priya Singh', id: 'demo2' }]);
  const [marks, setMarks] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, attRes] = await Promise.all([
          api.get('/courses?limit=10'),
          api.get('/attendance?limit=20'),
        ]);
        setCourses(coursesRes.data.courses || []);
        setAttendance(attRes.data.attendance || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const markAttendance = async (studentId, status) => {
    setMarks(prev => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = async () => {
    if (!selectedCourse) { alert('Please select a course'); return; }
    try {
      for (const [studentId, status] of Object.entries(marks)) {
        await api.post('/attendance', { courseId: selectedCourse, studentId, status, date: new Date().toISOString() });
      }
      alert('Attendance submitted successfully!');
      setMarks({});
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit attendance');
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const todayPresent = attendance.filter(a => a.status === 'present').length;
  const todayAbsent = attendance.filter(a => a.status === 'absent').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Local Faculty Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Manage attendance and class facilitation</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Courses" value={courses.length} icon={BookOpen} color="indigo" />
        <StatCard title="Attendance Records" value={attendance.length} icon={UserCheck} color="green" />
        <StatCard title="Present Today" value={todayPresent} icon={CheckCircle} color="cyan" />
        <StatCard title="Absent Today" value={todayAbsent} icon={XCircle} color="red" />
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Mark Attendance</h3>
        <div className="mb-4">
          <label className="text-sm text-slate-400 mb-1 block">Select Course</label>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="bg-slate-800 border border-slate-600 text-white rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 w-full sm:w-64">
            <option value="">-- Select Course --</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 text-slate-400">Student Name</th>
                <th className="text-center py-2 text-slate-400">Present</th>
                <th className="text-center py-2 text-slate-400">Absent</th>
                <th className="text-center py-2 text-slate-400">Late</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {students.map(student => (
                <tr key={student.id}>
                  <td className="py-3 text-white">{student.name}</td>
                  {['present', 'absent', 'late'].map(status => (
                    <td key={status} className="text-center py-3">
                      <button
                        onClick={() => markAttendance(student.id, status)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${marks[student.id] === status
                          ? status === 'present' ? 'bg-green-500 border-green-500' : status === 'absent' ? 'bg-red-500 border-red-500' : 'bg-yellow-500 border-yellow-500'
                          : 'border-slate-600 hover:border-slate-400'
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={submitAttendance} className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
          Submit Attendance
        </button>
      </div>

      <div className="glass rounded-2xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Attendance Records</h3>
        {attendance.length === 0 ? (
          <p className="text-slate-400 text-sm">No attendance records yet.</p>
        ) : (
          <div className="space-y-2">
            {attendance.slice(0, 10).map(a => (
              <div key={a._id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <span className="text-sm text-white">{a.studentId?.name || 'Student'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  a.status === 'present' ? 'bg-green-500/20 text-green-400' :
                  a.status === 'absent' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>{a.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
