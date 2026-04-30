import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users, Clock, CheckCircle, AlertCircle, XCircle,
  Download, ChevronLeft, BarChart2, Calendar, Loader
} from 'lucide-react';
import api from '../services/api';

/* ── Status helpers ────────────────────────────────────────────────────────── */
const STATUS = {
  present: { color:'#22c55e', bg:'#14532d', border:'#166534', icon: CheckCircle, label:'Present' },
  late:    { color:'#f59e0b', bg:'#451a03', border:'#92400e', icon: AlertCircle, label:'Late'    },
  absent:  { color:'#ef4444', bg:'#450a0a', border:'#991b1b', icon: XCircle,     label:'Absent'  },
};

/* ── Duration bar ──────────────────────────────────────────────────────────── */
function DurationBar({ pct, status }) {
  const color = STATUS[status]?.color || '#64748b';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

/* ── Stat card ─────────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, value, label, color, bg }) {
  return (
    <div className="glass rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-white leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ── Export CSV ────────────────────────────────────────────────────────────── */
function exportCSV(records, sessionTitle) {
  const header = ['Name', 'Email', 'Status', 'Joined At', 'Left At', 'Duration (mins)', 'Attendance %'];
  const rows = records.map(r => [
    r.studentId?.name || '—',
    r.studentId?.email || '—',
    r.status,
    r.joinedAt ? new Date(r.joinedAt).toLocaleString() : '—',
    r.leftAt   ? new Date(r.leftAt).toLocaleString()   : '—',
    r.durationMins || 0,
    r.attendancePct || 0,
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `attendance_${sessionTitle?.replace(/\s+/g,'_') || 'session'}.csv`;
  a.click();
}

/* ── Main page ─────────────────────────────────────────────────────────────── */
export default function AttendanceReport() {
  const { sessionId } = useParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all'); // all | present | late | absent

  useEffect(() => {
    api.get(`/attendance/session/${sessionId}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader size={32} className="animate-spin text-indigo-400" />
    </div>
  );
  if (!data) return <div className="text-slate-400 text-center pt-20">Report not found.</div>;

  const { session, records, stats } = data;
  const filtered = filter === 'all' ? records : records.filter(r => r.status === filter);

  const sessionDur = session?.startedAt && session?.endedAt
    ? Math.round((new Date(session.endedAt) - new Date(session.startedAt)) / 60000)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/dashboard" className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-2 transition-colors">
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-white">{session?.title || 'Attendance Report'}</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {session?.startedAt ? new Date(session.startedAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }) : '—'}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> Session duration: {sessionDur} min
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} /> {session?.courseId?.title}
            </span>
          </div>
        </div>
        <button
          onClick={() => exportCSV(records, session?.title)}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        value={stats.total}              label="Total Students"   color="#94a3b8" bg="#1e293b" />
        <StatCard icon={CheckCircle}  value={stats.present}            label="Present"          color="#22c55e" bg="#14532d" />
        <StatCard icon={AlertCircle}  value={stats.late}               label="Late"             color="#f59e0b" bg="#451a03" />
        <StatCard icon={XCircle}      value={stats.absent}             label="Absent"           color="#ef4444" bg="#450a0a" />
      </div>

      {/* Averages */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Avg Time in Class', value: `${stats.avgDurationMins} min` },
          { label: 'Avg Attendance %',  value: `${stats.avgAttendancePct}%`   },
          { label: 'Attendance Rate',   value: `${stats.total ? Math.round(((stats.present+stats.late)/stats.total)*100) : 0}%` },
        ].map(({ label, value }) => (
          <div key={label} className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-white">{value}</p>
            <p className="text-sm text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Donut-style attendance visual */}
      <div className="glass rounded-2xl p-5">
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <BarChart2 size={18} className="text-indigo-400" /> Attendance Breakdown
        </h3>
        <div className="flex items-center gap-6 flex-wrap">
          {[
            { key:'present', label:'Present', count:stats.present },
            { key:'late',    label:'Late',    count:stats.late    },
            { key:'absent',  label:'Absent',  count:stats.absent  },
          ].map(({ key, label, count }) => {
            const meta = STATUS[key];
            const pct  = stats.total ? Math.round((count/stats.total)*100) : 0;
            return (
              <div key={key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: meta.color }} />
                <span className="text-sm text-slate-300">{label}</span>
                <span className="text-sm font-bold" style={{ color: meta.color }}>{count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
        {/* Bar */}
        <div className="h-4 rounded-full overflow-hidden flex mt-3">
          {[
            { key:'present', count:stats.present },
            { key:'late',    count:stats.late    },
            { key:'absent',  count:stats.absent  },
          ].map(({ key, count }) => {
            const pct = stats.total ? (count/stats.total)*100 : 0;
            return pct > 0 ? (
              <div key={key} style={{ width:`${pct}%`, background: STATUS[key].color, transition:'width .5s' }} />
            ) : null;
          })}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all','present','late','absent'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {f} {f==='all' ? `(${records.length})` : `(${records.filter(r=>r.status===f).length})`}
          </button>
        ))}
      </div>

      {/* Student rows */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 bg-slate-800/30">
          <div className="col-span-3">Student</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Joined At</div>
          <div className="col-span-2">Left At</div>
          <div className="col-span-1 text-center">Time</div>
          <div className="col-span-2">Attendance %</div>
        </div>

        {filtered.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-10">No records found.</p>
        )}

        {filtered.map((r, i) => {
          const meta  = STATUS[r.status] || STATUS.absent;
          const Icon  = meta.icon;
          return (
            <div
              key={r._id || i}
              className="grid grid-cols-12 px-4 py-3 items-center border-b border-slate-700/30 last:border-0 hover:bg-slate-800/30 transition-colors"
            >
              {/* Name + email */}
              <div className="col-span-3 flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {r.studentId?.name?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{r.studentId?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{r.studentId?.college}</p>
                </div>
              </div>

              {/* Status badge */}
              <div className="col-span-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}
                >
                  <Icon size={12} /> {meta.label}
                </span>
              </div>

              {/* Joined */}
              <div className="col-span-2 text-xs text-slate-400">
                {r.joinedAt ? new Date(r.joinedAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : '—'}
              </div>

              {/* Left */}
              <div className="col-span-2 text-xs text-slate-400">
                {r.leftAt ? new Date(r.leftAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' }) : r.status === 'present' ? <span className="text-green-400">Still in class</span> : '—'}
              </div>

              {/* Duration */}
              <div className="col-span-1 text-center text-xs font-mono text-slate-300">
                {r.durationMins || 0}m
              </div>

              {/* Attendance % bar */}
              <div className="col-span-2">
                <DurationBar pct={r.attendancePct || 0} status={r.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
