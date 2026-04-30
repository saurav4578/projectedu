import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Courses from './Courses';
import Profile from './Profile';
import Recommendations from './Recommendations';
import UploadLecture from './UploadLecture';
import CourseDetail from './CourseDetail';
import CoursePlayer from './CoursePlayer';
import LiveClassRoom from './LiveClassRoom';
import AttendanceReport from './AttendanceReport';

const AdminDashboard   = lazy(() => import('./dashboard/AdminDashboard'));
const ExpertDashboard  = lazy(() => import('./dashboard/ExpertDashboard'));
const LocalDashboard   = lazy(() => import('./dashboard/LocalDashboard'));
const StudentDashboard = lazy(() => import('./dashboard/StudentDashboard'));

const RoleDashboard = ({ role }) => {
  switch(role) {
    case 'admin':   return <AdminDashboard />;
    case 'expert':  return <ExpertDashboard />;
    case 'local':   return <LocalDashboard />;
    case 'student': return <StudentDashboard />;
    default:        return <Navigate to="/" />;
  }
};

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen pt-16">
      <Sidebar />
      <main className="flex-1 ml-60 p-6 overflow-auto">
        <Suspense fallback={<LoadingSpinner text="Loading…" />}>
          <Routes>
            <Route index                               element={<RoleDashboard role={user.role} />} />
            <Route path="courses"                     element={<Courses />} />
            <Route path="course/:id"                  element={<CourseDetail />} />
            <Route path="learn/:courseId"             element={<CoursePlayer />} />
            <Route path="upload"                      element={<UploadLecture />} />
            <Route path="profile"                     element={<Profile />} />
            <Route path="recommendations"             element={<Recommendations />} />
            <Route path="live"                        element={<LiveClassRoom />} />
            <Route path="live/:sessionId"             element={<LiveClassRoom />} />
            <Route path="attendance/session/:sessionId" element={<AttendanceReport />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
