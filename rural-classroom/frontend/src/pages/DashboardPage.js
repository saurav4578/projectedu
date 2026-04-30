import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import StatsCard from '../components/common/StatsCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444'];

const DashboardPage = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      let endpoint = '/analytics/student';
      if (user.role === 'admin') endpoint = '/analytics/admin';
      else if (user.role === 'expert' || user.role === 'local') endpoint = '/analytics/faculty';

      const res = await api.get(endpoint);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <><Navbar /><LoadingSpinner fullScreen /></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.role === 'admin' ? '🛡️ Admin Dashboard' :
               user.role === 'expert' ? '👨‍🏫 Faculty Dashboard' :
               user.role === 'local' ? '👩‍🏫 Local Faculty Dashboard' :
               '🎓 Student Dashboard'}
            </h1>
            <p className="text-gray-500 mt-1">Welcome back, <strong>{user.name}</strong>!</p>
            {!user.isApproved && user.role !== 'student' && (
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm">
                ⏳ Your account is pending admin approval
              </div>
            )}
          </div>
          <div className="text-sm text-gray-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        {/* Admin Dashboard */}
        {user.role === 'admin' && analytics && (
          <AdminDashboard analytics={analytics} />
        )}

        {/* Faculty Dashboard */}
        {(user.role === 'expert' || user.role === 'local') && analytics && (
          <FacultyDashboard analytics={analytics} userRole={user.role} />
        )}

        {/* Student Dashboard */}
        {user.role === 'student' && analytics && (
          <StudentDashboard analytics={analytics} userId={user._id} />
        )}
      </div>
    </div>
  );
};

// ---- Admin Dashboard ----
const AdminDashboard = ({ analytics }) => {
  const { stats, recentUsers, monthlyRegistrations } = analytics;

  const scoreData = [
    { name: 'Below 40', value: 25 },
    { name: '40–70', value: 45 },
    { name: 'Above 70', value: 30 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Students" value={stats.totalStudents} icon="🎓" color="indigo" />
        <StatsCard title="Expert Faculty" value={stats.totalExpert} icon="👨‍🏫" color="blue" />
        <StatsCard title="Total Courses" value={stats.totalCourses} icon="📚" color="green" />
        <StatsCard title="Pending Approvals" value={stats.pendingApprovals} icon="⏳" color="yellow" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly registrations chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly Registrations</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyRegistrations.length ? monthlyRegistrations : [
              { _id: { month: 1 }, count: 12 }, { _id: { month: 2 }, count: 25 },
              { _id: { month: 3 }, count: 18 }, { _id: { month: 4 }, count: 32 },
              { _id: { month: 5 }, count: 28 }, { _id: { month: 6 }, count: 40 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="_id.month" tickFormatter={(v) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][v-1] || v} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Score distribution */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Score Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={scoreData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label>
                {scoreData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent users + quick actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Recent Users</h2>
            <Link to="/admin/users" className="text-indigo-600 text-sm hover:underline">View All →</Link>
          </div>
          <div className="space-y-3">
            {(recentUsers || []).map((u) => (
              <div key={u._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-sm">{u.name?.[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="badge bg-gray-100 text-gray-600">{u.role}</span>
              </div>
            ))}
            {(!recentUsers || recentUsers.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-4">No users yet</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/admin/users" className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
              <span className="text-xl">👥</span>
              <div>
                <p className="text-sm font-medium">Manage Users</p>
                <p className="text-xs text-gray-400">{stats.pendingApprovals} pending</p>
              </div>
            </Link>
            <Link to="/courses" className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
              <span className="text-xl">📚</span>
              <div>
                <p className="text-sm font-medium">All Courses</p>
                <p className="text-xs text-gray-400">{stats.totalCourses} active</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Faculty Dashboard ----
const FacultyDashboard = ({ analytics, userRole }) => {
  const { stats, courses } = analytics;

  const scoreDistData = [
    { name: 'Below 40', count: stats?.scoreDistribution?.below40 || 0, fill: '#EF4444' },
    { name: '40–70', count: stats?.scoreDistribution?.between40_70 || 0, fill: '#F59E0B' },
    { name: 'Above 70', count: stats?.scoreDistribution?.above70 || 0, fill: '#10B981' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="My Courses" value={stats?.totalCourses || 0} icon="📚" color="indigo" />
        <StatsCard title="Total Students" value={stats?.totalStudents || 0} icon="🎓" color="green" />
        <StatsCard title="Assignments" value={stats?.totalAssignments || 0} icon="📝" color="blue" />
        <StatsCard title="Avg. Score" value={`${stats?.averageScore || 0}%`} icon="📊" color="yellow" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Score Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreDistData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {scoreDistData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">My Courses</h2>
            <Link to="/courses" className="text-indigo-600 text-sm">View All →</Link>
          </div>
          <div className="space-y-3">
            {(courses || []).slice(0, 4).map((c) => (
              <Link to={`/courses/${c._id}`} key={c._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-indigo-50 transition-colors">
                <p className="text-sm font-medium">{c.title}</p>
                <span className="badge bg-indigo-100 text-indigo-600">{c.students} students</span>
              </Link>
            ))}
            {(!courses || courses.length === 0) && (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">No courses yet</p>
                <Link to="/courses" className="btn-primary text-sm mt-3 inline-block">Create Course</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/courses" className="card hover:shadow-md transition-shadow text-center cursor-pointer">
          <span className="text-3xl">➕</span>
          <p className="font-medium text-sm mt-2">New Course</p>
        </Link>
        <Link to="/assignments" className="card hover:shadow-md transition-shadow text-center cursor-pointer">
          <span className="text-3xl">📝</span>
          <p className="font-medium text-sm mt-2">Assignments</p>
        </Link>
        {userRole === 'local' && (
          <Link to="/attendance" className="card hover:shadow-md transition-shadow text-center cursor-pointer">
            <span className="text-3xl">✅</span>
            <p className="font-medium text-sm mt-2">Attendance</p>
          </Link>
        )}
      </div>
    </div>
  );
};

// ---- Student Dashboard ----
const StudentDashboard = ({ analytics, userId }) => {
  const { stats, performances } = analytics;

  const perfData = (performances || []).map((p) => ({
    course: p.courseId?.title?.slice(0, 12) || 'Course',
    score: p.score || 0,
    attendance: p.attendancePercentage || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Enrolled Courses" value={stats?.enrolledCourses || 0} icon="📚" color="indigo" />
        <StatsCard title="Assignments Done" value={stats?.submittedAssignments || 0} icon="✅" color="green" />
        <StatsCard title="Avg. Score" value={`${stats?.averageScore || 0}%`} icon="🏆" color="yellow" />
        <StatsCard title="Avg. Attendance" value={`${stats?.averageAttendance || 0}%`} icon="📅" color="blue" />
      </div>

      {perfData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Scores by Course</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={perfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="course" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Attendance by Course</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={perfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="course" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="attendance" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/courses" className="card hover:shadow-md transition-shadow text-center">
          <span className="text-3xl">📚</span>
          <p className="font-medium text-sm mt-2">Browse Courses</p>
        </Link>
        <Link to="/assignments" className="card hover:shadow-md transition-shadow text-center">
          <span className="text-3xl">📝</span>
          <p className="font-medium text-sm mt-2">Assignments</p>
        </Link>
        <Link to="/recommendations" className="card hover:shadow-md transition-shadow text-center">
          <span className="text-3xl">🤖</span>
          <p className="font-medium text-sm mt-2">AI Insights</p>
        </Link>
        <Link to="/profile" className="card hover:shadow-md transition-shadow text-center">
          <span className="text-3xl">👤</span>
          <p className="font-medium text-sm mt-2">My Profile</p>
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
