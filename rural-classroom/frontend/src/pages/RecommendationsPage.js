import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../services/api';

const priorityConfig = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200', icon: '🚨' },
  high: { label: 'High Priority', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '⚠️' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '📌' },
  low: { label: 'On Track', color: 'bg-green-100 text-green-700 border-green-200', icon: '✅' },
};

const typeIcons = {
  beginner_materials: '📗',
  practice_assignments: '📝',
  advanced_materials: '🚀',
  revision_session: '🔄',
};

const RecommendationsPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await api.get(`/recommendations/${user._id}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <><Navbar /><LoadingSpinner fullScreen /></>;

  const healthConfig = {
    excellent: { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', icon: '🌟' },
    good: { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', icon: '👍' },
    needs_attention: { label: 'Needs Attention', color: 'text-red-600', bg: 'bg-red-50', icon: '⚡' },
  };

  const health = healthConfig[data?.summary?.healthStatus] || healthConfig.good;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="text-3xl">🤖</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Learning Recommendations</h1>
            <p className="text-gray-500">Personalized insights for {data?.student}</p>
          </div>
        </div>

        {/* Summary */}
        {data?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className={`card text-center ${health.bg}`}>
              <div className="text-2xl mb-1">{health.icon}</div>
              <div className={`font-bold ${health.color}`}>{health.label}</div>
              <div className="text-xs text-gray-500">Learning Health</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-indigo-600">{data.summary.totalCourses}</div>
              <div className="text-xs text-gray-500">Courses</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-600">{data.summary.averageScore}%</div>
              <div className="text-xs text-gray-500">Avg. Score</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-blue-600">{data.summary.averageAttendance}%</div>
              <div className="text-xs text-gray-500">Avg. Attendance</div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data?.recommendations?.length === 0 ? (
          <div className="card text-center py-16">
            <span className="text-5xl">🎓</span>
            <h2 className="text-xl font-bold text-gray-900 mt-4">No recommendations yet</h2>
            <p className="text-gray-500 mt-2">{data?.message || 'Enroll in courses to get personalized AI recommendations.'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {data?.recommendations?.map((rec, i) => {
              const priority = priorityConfig[rec.priority] || priorityConfig.low;
              return (
                <div key={i} className={`card border-2 ${priority.color.split(' ').slice(-1)[0]}`}>
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge ${priority.color}`}>{priority.icon} {priority.label}</span>
                        <span className="text-xs text-gray-400">📌 {rec.subject}</span>
                      </div>
                      <h3 className="font-bold text-gray-900">{rec.courseName}</h3>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-bold text-gray-900">{rec.score}/100</div>
                      <div className="text-gray-400 text-xs">Score</div>
                    </div>
                  </div>

                  {/* Score + Attendance bars */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Score</span><span>{rec.score}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className={`h-2 rounded-full transition-all ${rec.score < 40 ? 'bg-red-500' : rec.score < 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${rec.score}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Attendance</span><span>{rec.attendancePercentage}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className={`h-2 rounded-full transition-all ${rec.attendancePercentage < 60 ? 'bg-red-500' : rec.attendancePercentage < 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${rec.attendancePercentage}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {rec.suggestions.map((s, j) => (
                    <div key={j} className="bg-gray-50 rounded-xl p-4 mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{typeIcons[s.type] || '💡'}</span>
                        <h4 className="font-semibold text-gray-900 text-sm">{s.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{s.description}</p>

                      <div className="space-y-1 mb-3">
                        {s.resources?.map((r, k) => (
                          <div key={k} className="flex items-center gap-2 text-xs text-gray-500">
                            <span>•</span>
                            <span className="font-medium">{r.title}</span>
                            <span className="badge bg-gray-200 text-gray-600">{r.type}</span>
                          </div>
                        ))}
                      </div>

                      <div className="bg-indigo-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-indigo-700">
                          <strong>Action:</strong> {s.action}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* AI disclaimer */}
        <div className="mt-8 p-4 bg-gray-100 rounded-xl">
          <p className="text-xs text-gray-500">
            🤖 <strong>About AI Recommendations:</strong> These suggestions are generated based on your score and attendance data using rule-based logic. 
            The system is designed to be ML-ready for future upgrades with machine learning models.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsPage;
