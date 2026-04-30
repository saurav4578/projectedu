import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Star, TrendingUp, BarChart2, Clock } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import api from '../services/api';

export default function Recommendations() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/recommendations/${user._id}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user._id]);

  if (loading) return <LoadingSpinner text="Analyzing your performance..." />;

  const priorityBadge = { high: 'bg-red-500/20 text-red-400 border-red-500/30', medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', low: 'bg-green-500/20 text-green-400 border-green-500/30' };

  const radarData = [
    { subject: 'Score', value: data?.summary?.avgScore || 0 },
    { subject: 'Attendance', value: data?.summary?.avgAttendance || 0 },
    { subject: 'Assignments', value: 65 },
    { subject: 'Participation', value: 70 },
    { subject: 'Engagement', value: 75 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Star className="text-yellow-400" size={24} /> AI Recommendations
        </h1>
        <p className="text-slate-400 text-sm mt-1">Personalized learning path based on your performance</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 text-center">
          <p className="text-4xl font-bold gradient-text">{data?.summary?.avgScore || 0}%</p>
          <p className="text-slate-400 text-sm mt-1">Average Score</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <p className="text-4xl font-bold gradient-text">{data?.summary?.avgAttendance || 0}%</p>
          <p className="text-slate-400 text-sm mt-1">Attendance</p>
        </div>
        <div className="glass rounded-2xl p-5 text-center">
          <p className="text-4xl font-bold gradient-text">{data?.summary?.totalCourses || 0}</p>
          <p className="text-slate-400 text-sm mt-1">Courses</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Overview</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Recommendations List */}
        <div className="glass rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Your Learning Plan</h3>
          <div className="space-y-3 overflow-y-auto max-h-72">
            {data?.recommendations?.map((rec, i) => (
              <div key={i} className={`p-3 rounded-xl border ${priorityBadge[rec.priority]}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{rec.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-300">{rec.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${priorityBadge[rec.priority]}`}>{rec.priority} priority</span>
                      <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">{rec.action} →</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
