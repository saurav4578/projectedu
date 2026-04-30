import React, { useState, useEffect, useRef, useCallback } from 'react';
import { connectSocket } from '../services/socket';
import useAttentionMonitor from '../hooks/useAttentionMonitor';

const ROOM = 'test-room-demo-123';

/* ── helpers ──────────────────────────────────────────────────────────────── */
function Avatar({ name, color = '#6366f1', size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontWeight:700, color:'#fff', fontSize: size*0.38, flexShrink:0,
    }}>
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}

const STATUS_META = {
  focused:        { color:'#22c55e', bg:'#14532d',  border:'#166534', icon:'✅', label:'Focused'        },
  distracted:     { color:'#f59e0b', bg:'#451a03',  border:'#92400e', icon:'👀', label:'Distracted'     },
  away:           { color:'#ef4444', bg:'#450a0a',  border:'#991b1b', icon:'❌', label:'Away'           },
  multiple_faces: { color:'#a855f7', bg:'#2e1065',  border:'#6b21a8', icon:'👥', label:'Multiple Faces' },
  tab_hidden:     { color:'#f97316', bg:'#431407',  border:'#9a3412', icon:'🔇', label:'Tab Hidden'     },
  loading:        { color:'#64748b', bg:'#1e293b',  border:'#334155', icon:'⏳', label:'Loading'        },
  denied:         { color:'#94a3b8', bg:'#1e293b',  border:'#334155', icon:'🚫', label:'Cam Denied'     },
};

/* ── Student face monitoring widget ──────────────────────────────────────── */
function StudentMonitor({ socket, roomId, user }) {
  const [alert, setAlert] = useState(null);

  const handleStatusChange = useCallback((newStatus, d) => {
    socket?.emit('attention-update', { roomId, user, status: newStatus, details: d });
  }, [socket, roomId, user]);

  const {
    videoRef, canvasRef, status, details, attentionScore,
    startMonitor, stopMonitor, isRunning,
  } = useAttentionMonitor({ onStatusChange: handleStatusChange, enabled: true });

  // Receive teacher alerts
  useEffect(() => {
    if (!socket) return;
    socket.on('attention-alert', ({ message }) => {
      setAlert(message);
      setTimeout(() => setAlert(null), 6000);
    });
  }, [socket]);

  const meta = STATUS_META[status] || STATUS_META.loading;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

      {/* Alert banner from teacher */}
      {alert && (
        <div style={{
          background:'#7c2d12', border:'2px solid #ef4444', borderRadius:12,
          padding:'12px 16px', color:'#fca5a5', fontWeight:600, fontSize:13,
          animation:'fadeIn .3s ease', display:'flex', alignItems:'center', gap:8
        }}>
          🔔 Teacher alert: {alert}
          <button onClick={() => setAlert(null)} style={{ marginLeft:'auto', background:'none', border:'none', color:'#fca5a5', cursor:'pointer', fontSize:18 }}>×</button>
        </div>
      )}

      {/* Camera view with canvas overlay */}
      <div style={{ position:'relative', borderRadius:12, overflow:'hidden', background:'#000', border:`2px solid ${meta.border}` }}>
        <video
          ref={videoRef}
          autoPlay muted playsInline
          style={{ width:'100%', display:'block', transform:'scaleX(-1)' /* mirror */ }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position:'absolute', top:0, left:0, width:'100%', height:'100%',
            transform:'scaleX(-1)', pointerEvents:'none',
          }}
        />
        {/* Status badge overlay */}
        <div style={{
          position:'absolute', top:8, left:8,
          background: meta.bg, border:`1px solid ${meta.border}`,
          borderRadius:20, padding:'4px 10px',
          display:'flex', alignItems:'center', gap:5,
        }}>
          <span style={{ fontSize:13 }}>{meta.icon}</span>
          <span style={{ color: meta.color, fontSize:11, fontWeight:700 }}>{meta.label}</span>
        </div>
        {/* Attention score */}
        {isRunning && (
          <div style={{
            position:'absolute', top:8, right:8,
            background:'#0f172a', border:'1px solid #334155',
            borderRadius:20, padding:'4px 10px', color:'#e2e8f0', fontSize:11, fontWeight:700
          }}>
            🎯 {attentionScore}%
          </div>
        )}
        {/* Not running overlay */}
        {!isRunning && (
          <div style={{
            position:'absolute', inset:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            background:'#0f172a', color:'#64748b', gap:8,
          }}>
            <span style={{ fontSize:36 }}>📷</span>
            <p style={{ margin:0, fontSize:13 }}>Camera off</p>
          </div>
        )}
      </div>

      {/* Reason text */}
      {isRunning && details.reason && (
        <p style={{ margin:0, fontSize:11, color:'#94a3b8', textAlign:'center', padding:'0 4px' }}>
          {details.reason}
        </p>
      )}

      {/* Attention score bar */}
      {isRunning && (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ color:'#64748b', fontSize:11 }}>Attention Score</span>
            <span style={{ color: attentionScore >= 70 ? '#22c55e' : attentionScore >= 40 ? '#f59e0b' : '#ef4444', fontSize:11, fontWeight:700 }}>{attentionScore}%</span>
          </div>
          <div style={{ height:6, background:'#1e293b', borderRadius:99, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:99, transition:'width .5s',
              width:`${attentionScore}%`,
              background: attentionScore >= 70 ? '#22c55e' : attentionScore >= 40 ? '#f59e0b' : '#ef4444',
            }} />
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={isRunning ? stopMonitor : startMonitor}
        style={{
          padding:'10px', borderRadius:10, border:'none', cursor:'pointer',
          background: isRunning ? '#7f1d1d' : '#1e3a5f',
          color: isRunning ? '#fca5a5' : '#93c5fd',
          fontWeight:700, fontSize:13, transition:'background .2s',
        }}
      >
        {isRunning ? '🔴 Stop Camera Monitor' : '🎥 Start Attention Monitor'}
      </button>

      {status === 'denied' && (
        <p style={{ color:'#ef4444', fontSize:11, textAlign:'center', margin:0 }}>
          Browser camera permission denied.<br/>
          Chrome: Click 🔒 in address bar → Allow camera
        </p>
      )}
    </div>
  );
}

/* ── Teacher monitoring dashboard ─────────────────────────────────────────── */
function TeacherMonitorDashboard({ socket, roomId, people }) {
  const [attentionMap, setAttentionMap] = useState({});  // { userId: payload }
  const [alertMsg,     setAlertMsg]     = useState('');

  useEffect(() => {
    if (!socket) return;
    // Request current snapshot
    socket.emit('get-attention-state', { roomId });

    socket.on('attention-state', (state) => setAttentionMap(state));
    socket.on('student-attention', (payload) => {
      setAttentionMap(prev => ({ ...prev, [payload.userId]: payload }));
    });
  }, [socket, roomId]);

  const sendAlert = (targetUserId, studentName) => {
    const msg = alertMsg.trim() || `${studentName}, please focus on the class! 🙏`;
    socket?.emit('teacher-alert', { roomId, targetUserId, message: msg });
    setAlertMsg('');
  };

  // Compute class stats
  const attentionList  = Object.values(attentionMap);
  const focused        = attentionList.filter(a => a.status === 'focused').length;
  const distracted     = attentionList.filter(a => a.status === 'distracted').length;
  const away           = attentionList.filter(a => ['away','tab_hidden'].includes(a.status)).length;
  const multiface      = attentionList.filter(a => a.status === 'multiple_faces').length;
  const total          = attentionList.length;
  const classScore     = total > 0 ? Math.round((focused / total) * 100) : 0;

  const statusOrder = { multiple_faces:0, away:1, tab_hidden:2, distracted:3, focused:4, loading:5, denied:5 };
  const sorted = [...attentionList].sort((a,b) => (statusOrder[a.status]??9) - (statusOrder[b.status]??9));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

      {/* Class attention score */}
      <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:12, padding:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ color:'#e2e8f0', fontWeight:700, fontSize:14 }}>🎯 Class Attention</span>
          <span style={{ color: classScore>=70?'#22c55e':classScore>=40?'#f59e0b':'#ef4444', fontWeight:800, fontSize:20 }}>{classScore}%</span>
        </div>
        <div style={{ height:8, background:'#0f172a', borderRadius:99, overflow:'hidden', marginBottom:10 }}>
          <div style={{
            height:'100%', borderRadius:99, transition:'width .6s',
            width:`${classScore}%`,
            background: classScore>=70?'#22c55e':classScore>=40?'#f59e0b':'#ef4444',
          }} />
        </div>
        {/* Stats row */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {[
            { icon:'✅', count:focused,    label:'Focused',    color:'#22c55e' },
            { icon:'👀', count:distracted, label:'Distracted', color:'#f59e0b' },
            { icon:'❌', count:away,       label:'Away',       color:'#ef4444' },
            { icon:'👥', count:multiface,  label:'Multi-face', color:'#a855f7' },
          ].map(({ icon, count, label, color }) => (
            <div key={label} style={{ flex:1, minWidth:60, background:'#0f172a', borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
              <p style={{ margin:0, fontSize:14 }}>{icon}</p>
              <p style={{ margin:0, color, fontWeight:800, fontSize:16 }}>{count}</p>
              <p style={{ margin:0, color:'#64748b', fontSize:9 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alert input */}
      <div style={{ display:'flex', gap:6 }}>
        <input
          value={alertMsg}
          onChange={e => setAlertMsg(e.target.value)}
          placeholder="Custom alert message (optional)…"
          style={{ flex:1, padding:'8px 12px', borderRadius:10, border:'1px solid #334155', background:'#0f172a', color:'#fff', fontSize:12, outline:'none' }}
        />
      </div>

      {/* Per-student rows */}
      <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:360, overflowY:'auto' }}>
        {sorted.length === 0 && (
          <p style={{ color:'#475569', fontSize:12, textAlign:'center', padding:16 }}>
            Waiting for students to turn on their cameras…
          </p>
        )}
        {sorted.map(a => {
          const meta = STATUS_META[a.status] || STATUS_META.loading;
          const isAlert = a.status !== 'focused' && a.status !== 'loading' && a.status !== 'denied';
          return (
            <div key={a.userId} style={{
              background: meta.bg, border:`1px solid ${meta.border}`,
              borderRadius:12, padding:'10px 12px',
              display:'flex', alignItems:'center', gap:10,
            }}>
              <Avatar name={a.userName} size={32} color={isAlert ? '#dc2626' : '#4f46e5'} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                  <span style={{ color:'#e2e8f0', fontSize:13, fontWeight:600 }}>{a.userName}</span>
                  <span style={{ fontSize:12 }}>{meta.icon}</span>
                  <span style={{ color:meta.color, fontSize:11, fontWeight:700 }}>{meta.label}</span>
                </div>
                <p style={{ margin:0, color:'#94a3b8', fontSize:11, lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {a.details?.reason || '—'}
                </p>
              </div>
              {/* Alert button for distracted students */}
              {isAlert && (
                <button onClick={() => sendAlert(a.userId, a.userName)} style={{
                  flexShrink:0, background:'#7c2d12', border:'1px solid #ef4444',
                  borderRadius:8, color:'#fca5a5', fontSize:11, fontWeight:700,
                  padding:'5px 10px', cursor:'pointer', whiteSpace:'nowrap',
                }}>
                  🔔 Alert
                </button>
              )}
              {/* Time */}
              <span style={{ color:'#475569', fontSize:10, flexShrink:0 }}>
                {a.time ? new Date(a.time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' }) : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* People without attention data */}
      {people.filter(p => p.role !== 'teacher' && !attentionMap[p.id]).map(p => (
        <div key={p.id} style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:12, padding:'10px 12px', display:'flex', alignItems:'center', gap:10, opacity:.6 }}>
          <Avatar name={p.name} size={32} />
          <span style={{ color:'#94a3b8', fontSize:13 }}>{p.name}</span>
          <span style={{ color:'#475569', fontSize:11, marginLeft:'auto' }}>Camera off</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main LiveTest page ────────────────────────────────────────────────── */
export default function LiveTest() {
  const [role,    setRole]    = useState(null);
  const [name,    setName]    = useState('');
  const [joined,  setJoined]  = useState(false);
  const [socket,  setSocket]  = useState(null);
  const [people,  setPeople]  = useState([]);
  const [messages,setMessages]= useState([]);
  const [questions,setQuestions]=useState([]);
  const [polls,   setPolls]   = useState([]);
  const [tab,     setTab]     = useState('chat');
  const [chatInput,setChatInput]=useState('');
  const [qaInput, setQaInput] = useState('');
  const [announce,setAnnounce]= useState('');
  const [pollQ,   setPollQ]   = useState('');
  const [pollOpts,setPollOpts] = useState(['','']);
  const [showPoll,setShowPoll] = useState(false);
  const [handRaised,setHandRaised] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const chatEnd = useRef(null);
  const userId  = useRef(`user_${Math.random().toString(36).slice(2,8)}`);
  const isTeacher = role === 'teacher';

  // Timer
  useEffect(() => {
    if (!joined) return;
    const t = setInterval(() => setElapsed(e => e+1), 1000);
    return () => clearInterval(t);
  }, [joined]);
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // Join room
  const handleJoin = () => {
    if (!name.trim() || !role) return;
    const s = connectSocket();
    setSocket(s);
    const me = { id: userId.current, name: name.trim(), role };
    s.emit('join-room', { roomId: ROOM, user: me });

    s.on('room-state',           ({ chat, polls:p, users }) => { setMessages(chat||[]); setPolls(p||[]); setPeople(users||[]); });
    s.on('new-message',          msg    => setMessages(prev => [...prev, msg]));
    s.on('user-joined',          ({ users }) => setPeople(users));
    s.on('user-left',            ({ users }) => setPeople(users));
    s.on('new-question',         qa     => setQuestions(prev => [...prev, qa]));
    s.on('new-poll',             poll   => setPolls(prev => [...prev, poll]));
    s.on('poll-updated',         u      => setPolls(prev => prev.map(p => p.id===u.id ? u : p)));
    s.on('hand-raised',          ({ user:u }) => setMessages(prev => [...prev, { id:Date.now(), system:true, text:`✋ ${u.name} ne haath uthaya!` }]));
    s.on('faculty-announcement', ({ message:m }) => setMessages(prev => [...prev, { id:Date.now(), system:true, text:`📢 ${m}` }]));
    s.on('question-answered',    ({ id, answer }) => setQuestions(prev => prev.map(q => q.id===id ? {...q, answered:true, answer} : q)));
    setJoined(true);
  };

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const sendChat = () => { if (!chatInput.trim()||!socket) return; socket.emit('chat-message',{roomId:ROOM, message:chatInput.trim(), user:{id:userId.current, name, role}}); setChatInput(''); };
  const sendQA   = () => { if (!qaInput.trim()||!socket) return; socket.emit('ask-question',{roomId:ROOM, question:qaInput.trim(), user:{id:userId.current, name, role}}); setQaInput(''); };
  const raiseHand= () => { socket?.emit('raise-hand',{roomId:ROOM, user:{id:userId.current, name, role}}); setHandRaised(true); setTimeout(()=>setHandRaised(false),3000); };
  const broadcast= () => { if (!announce.trim()) return; socket?.emit('faculty-broadcast',{roomId:ROOM, message:announce.trim()}); setAnnounce(''); };
  const launchPoll=() => { const opts=pollOpts.filter(o=>o.trim()); if (!pollQ.trim()||opts.length<2) return; socket?.emit('create-poll',{roomId:ROOM, question:pollQ, options:opts}); setPollQ(''); setPollOpts(['','']); setShowPoll(false); };
  const vote     = (pollId,idx) => socket?.emit('vote-poll',{roomId:ROOM, pollId, optionIndex:idx, userId:userId.current});
  const answerQ  = (q) => { const a=prompt(`Answer: "${q.question}"`); if (!a) return; socket?.emit('answer-question',{roomId:ROOM, id:q.id, answer:a}); setQuestions(prev=>prev.map(x=>x.id===q.id?{...x,answered:true,answer:a}:x)); };

  /* ── Join screen ──────────────────────────────────────────────────────── */
  if (!joined) return (
    <div style={{ minHeight:'100vh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Sora,sans-serif', padding:16 }}>
      <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:20, padding:36, width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:44, marginBottom:8 }}>🎓</div>
          <h2 style={{ color:'#fff', margin:0, fontSize:22, fontWeight:800 }}>Live Class — Face Monitor Demo</h2>
          <p style={{ color:'#94a3b8', fontSize:13, marginTop:8 }}>
            Do tabs mein kholo — ek Teacher, ek Student<br/>
            Student tab mein AI face detection chalega
          </p>
        </div>
        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          {[{r:'teacher',emoji:'👨‍🏫',label:'Teacher'},{r:'student',emoji:'🎓',label:'Student'}].map(({r,emoji,label}) => (
            <button key={r} onClick={()=>setRole(r)} style={{ flex:1, padding:'14px 8px', borderRadius:12, border:`2px solid ${role===r?'#6366f1':'#334155'}`, background:role===r?'#6366f1':'transparent', color:'#fff', cursor:'pointer', fontSize:15, fontWeight:700, transition:'all .2s' }}>
              {emoji} {label}
            </button>
          ))}
        </div>
        <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleJoin()} placeholder="Apna naam likho…" style={{ width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid #334155', background:'#0f172a', color:'#fff', fontSize:14, outline:'none', boxSizing:'border-box', marginBottom:14 }} />
        <button onClick={handleJoin} disabled={!name.trim()||!role} style={{ width:'100%', padding:14, borderRadius:12, background:name.trim()&&role?'#6366f1':'#334155', color:'#fff', border:'none', cursor:name.trim()&&role?'pointer':'default', fontSize:15, fontWeight:800, transition:'background .2s' }}>🚀 Join</button>
        <div style={{ marginTop:18, padding:14, background:'#0f172a', borderRadius:12, border:'1px solid #1e293b' }}>
          <p style={{ color:'#94a3b8', fontSize:12, margin:0, lineHeight:1.7 }}>
            <strong style={{ color:'#e2e8f0' }}>Teacher tab:</strong> Har student ka real-time attention score, distraction alerts<br/>
            <strong style={{ color:'#e2e8f0' }}>Student tab:</strong> Camera on karo → AI face detect karega → Teacher ko live status jayega
          </p>
        </div>
      </div>
    </div>
  );

  /* ── Live room ────────────────────────────────────────────────────────── */
  const pendingQs = questions.filter(q=>!q.answered).length;

  return (
    <div style={{ height:'100vh', background:'#0f172a', display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:'Sora,sans-serif' }}>

      {/* Top bar */}
      <div style={{ height:50, flexShrink:0, background:'#1e293b', borderBottom:'1px solid #334155', display:'flex', alignItems:'center', padding:'0 14px', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, background:'#450a0a', border:'1px solid #ef444450', borderRadius:20, padding:'3px 10px' }}>
          <div style={{ width:7, height:7, background:'#ef4444', borderRadius:'50%' }} />
          <span style={{ color:'#ef4444', fontSize:11, fontWeight:800 }}>LIVE</span>
        </div>
        <span style={{ color:'#fff', fontWeight:700, flex:1, fontSize:14 }}>Live Class Demo</span>
        <span style={{ color:'#64748b', fontSize:12 }}>⏱ {fmt(elapsed)}</span>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'#0f172a', border:'1px solid #334155', borderRadius:20, padding:'4px 10px' }}>
          <Avatar name={name} size={18} color={isTeacher?'#7c3aed':'#0891b2'} />
          <span style={{ color:'#e2e8f0', fontSize:12 }}>{name}</span>
          <span style={{ color:'#64748b', fontSize:10 }}>({role})</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* ── Left panel ────────────────────────────────────────────────── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', padding:10, gap:8, overflow:'hidden' }}>

          {/* Stage */}
          <div style={{ flex:1, borderRadius:14, background:'linear-gradient(135deg,#1e293b,#0f172a)', border:'1px solid #334155', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', minHeight:0 }}>
            <div style={{ textAlign:'center' }}>
              <Avatar name={name} size={64} color={isTeacher?'#7c3aed':'#0891b2'} />
              <p style={{ color:'#fff', fontWeight:700, marginTop:10, fontSize:16 }}>{name}</p>
              <p style={{ color:'#94a3b8', fontSize:12, marginTop:4, textTransform:'capitalize' }}>{role}</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center', marginTop:10 }}>
                {people.map(p => (
                  <div key={p.id||p.socketId} style={{ display:'flex', alignItems:'center', gap:5, background:'#1e293b', borderRadius:20, padding:'3px 8px', border:'1px solid #334155' }}>
                    <Avatar name={p.name} size={16} color={p.role==='teacher'?'#7c3aed':'#0891b2'} />
                    <span style={{ color:'#e2e8f0', fontSize:11 }}>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Teacher broadcast bar */}
            {isTeacher && (
              <div style={{ position:'absolute', bottom:10, left:10, right:10, display:'flex', gap:6 }}>
                <input value={announce} onChange={e=>setAnnounce(e.target.value)} onKeyDown={e=>e.key==='Enter'&&broadcast()} placeholder="📢 Sabko announcement…" style={{ flex:1, padding:'9px 12px', borderRadius:10, border:'1px solid #334155', background:'#0f172a', color:'#fff', fontSize:12, outline:'none' }} />
                <button onClick={broadcast} style={{ background:'#eab308', border:'none', borderRadius:10, padding:'9px 14px', color:'#000', fontWeight:800, cursor:'pointer' }}>📢</button>
              </div>
            )}
          </div>

          {/* ── Attention panel (role-specific) ─────────────────────────── */}
          <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:14, padding:14, overflowY:'auto', maxHeight:380 }}>
            <p style={{ color:'#94a3b8', fontSize:11, textTransform:'uppercase', letterSpacing:1, margin:'0 0 10px', fontWeight:700 }}>
              {isTeacher ? '🎯 Student Attention Monitor' : '📷 Your Attention Monitor'}
            </p>
            {isTeacher
              ? <TeacherMonitorDashboard socket={socket} roomId={ROOM} people={people.filter(p=>p.role!=='teacher')} />
              : <StudentMonitor socket={socket} roomId={ROOM} user={{ id:userId.current, name, role }} />
            }
          </div>

          {/* Controls */}
          <div style={{ display:'flex', justifyContent:'center', gap:8, flexShrink:0 }}>
            {!isTeacher && <button onClick={raiseHand} title="Haath uthao" style={{ width:42, height:42, borderRadius:'50%', border:'none', cursor:'pointer', background:handRaised?'#eab308':'#334155', fontSize:18 }}>✋</button>}
            {isTeacher && <button onClick={()=>setShowPoll(true)} style={{ height:42, padding:'0 14px', borderRadius:21, border:'none', cursor:'pointer', background:'#334155', color:'#fff', fontSize:13, fontWeight:600 }}>📊 Poll</button>}
            <button onClick={()=>window.location.reload()} title="Leave" style={{ width:42, height:42, borderRadius:'50%', border:'none', cursor:'pointer', background:'#dc2626', fontSize:18 }}>📞</button>
          </div>
        </div>

        {/* ── Right sidebar ──────────────────────────────────────────────── */}
        <div style={{ width:300, borderLeft:'1px solid #334155', background:'#1e293b', display:'flex', flexDirection:'column', flexShrink:0 }}>
          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid #334155', flexShrink:0 }}>
            {[{k:'chat',l:'💬 Chat'},{k:'qa',l:`❓ Q&A${pendingQs>0?` (${pendingQs})`:''}`},{k:'polls',l:'📊 Polls'}].map(({k,l})=>(
              <button key={k} onClick={()=>setTab(k)} style={{ flex:1, padding:'10px 4px', border:'none', cursor:'pointer', background:tab===k?'#0f172a':'transparent', color:tab===k?'#818cf8':'#64748b', fontSize:11, fontWeight:tab===k?700:400, borderBottom:tab===k?'2px solid #6366f1':'2px solid transparent' }}>{l}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex:1, overflowY:'auto', padding:10 }}>

            {/* CHAT */}
            {tab==='chat' && <>
              {messages.length===0 && <p style={{ color:'#475569', fontSize:12, textAlign:'center', marginTop:20 }}>Koi message nahi abhi…</p>}
              {messages.map((msg,i) => {
                if (msg.system) return (
                  <div key={i} style={{ textAlign:'center', margin:'8px 0' }}>
                    <span style={{ background:'#1e293b', color:'#94a3b8', fontSize:11, padding:'3px 10px', borderRadius:20, border:'1px solid #334155' }}>{msg.text}</span>
                  </div>
                );
                const mine = msg.user?.id===userId.current;
                return (
                  <div key={i} style={{ display:'flex', gap:6, marginBottom:8, flexDirection:mine?'row-reverse':'row' }}>
                    <Avatar name={msg.user?.name} size={24} color={msg.user?.role==='teacher'?'#7c3aed':'#0891b2'} />
                    <div style={{ maxWidth:'75%' }}>
                      <p style={{ color:'#475569', fontSize:10, margin:'0 0 2px', textAlign:mine?'right':'left' }}>{msg.user?.name}</p>
                      <div style={{ padding:'7px 11px', borderRadius:mine?'10px 3px 10px 10px':'3px 10px 10px 10px', background:mine?'#4f46e5':'#334155', color:'#fff', fontSize:12 }}>{msg.text}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEnd} />
            </>}

            {/* Q&A */}
            {tab==='qa' && <>
              {questions.length===0 && <p style={{ color:'#475569', fontSize:12, textAlign:'center', marginTop:20 }}>Koi sawaal nahi…</p>}
              {questions.map((q,i)=>(
                <div key={i} style={{ background:q.answered?'#052e16':'#1c1917', border:`1px solid ${q.answered?'#166534':'#44403c'}`, borderRadius:10, padding:10, marginBottom:8 }}>
                  <p style={{ color:'#fff', fontSize:12, margin:'0 0 5px' }}>{q.question}</p>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'#94a3b8', fontSize:10 }}>— {q.user?.name}</span>
                    {q.answered ? <span style={{ color:'#4ade80', fontSize:10 }}>✓ Answered</span>
                      : isTeacher ? <button onClick={()=>answerQ(q)} style={{ background:'#4f46e5', color:'#fff', border:'none', borderRadius:6, padding:'3px 8px', fontSize:10, cursor:'pointer' }}>Answer</button>
                      : <span style={{ color:'#fbbf24', fontSize:10 }}>Pending</span>
                    }
                  </div>
                  {q.answer && <p style={{ color:'#86efac', fontSize:11, marginTop:6, borderTop:'1px solid #166534', paddingTop:6 }}>💬 {q.answer}</p>}
                </div>
              ))}
            </>}

            {/* POLLS */}
            {tab==='polls' && <>
              {polls.length===0 && <p style={{ color:'#475569', fontSize:12, textAlign:'center', marginTop:20 }}>{isTeacher?'Poll button dabao.':'Teacher ka poll nahi aaya abhi.'}</p>}
              {polls.map((poll,pi)=>{
                const total=poll.options.reduce((s,o)=>s+o.votes,0);
                const myVote=poll.votes?.[userId.current];
                return (
                  <div key={pi} style={{ background:'#0f172a', border:'1px solid #334155', borderRadius:10, padding:12, marginBottom:10 }}>
                    <p style={{ color:'#fff', fontWeight:600, fontSize:12, marginBottom:8 }}>{poll.question}</p>
                    {poll.options.map((opt,oi)=>{
                      const pct=total>0?Math.round((opt.votes/total)*100):0;
                      return (
                        <button key={oi} onClick={()=>myVote===undefined&&vote(poll.id,oi)} style={{ width:'100%', marginBottom:5, position:'relative', overflow:'hidden', borderRadius:8, border:`2px solid ${myVote===oi?'#6366f1':'#334155'}`, background:'transparent', cursor:myVote!==undefined?'default':'pointer', textAlign:'left', padding:0 }}>
                          <div style={{ position:'absolute', inset:'0 auto 0 0', width:`${pct}%`, background:'#6366f120', transition:'width .5s' }} />
                          <div style={{ position:'relative', display:'flex', justifyContent:'space-between', padding:'7px 10px' }}>
                            <span style={{ color:'#e2e8f0', fontSize:12 }}>{opt.text}</span>
                            <span style={{ color:'#64748b', fontSize:11 }}>{pct}%</span>
                          </div>
                        </button>
                      );
                    })}
                    <p style={{ color:'#475569', fontSize:10, marginTop:4 }}>{total} votes</p>
                  </div>
                );
              })}
            </>}
          </div>

          {/* Input */}
          <div style={{ padding:8, borderTop:'1px solid #334155', flexShrink:0 }}>
            {tab==='chat' && (
              <div style={{ display:'flex', gap:6 }}>
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Message…" style={{ flex:1, padding:'9px 12px', borderRadius:10, border:'1px solid #334155', background:'#0f172a', color:'#fff', fontSize:12, outline:'none' }} />
                <button onClick={sendChat} style={{ background:'#6366f1', border:'none', borderRadius:10, width:38, color:'#fff', cursor:'pointer', fontSize:16 }}>➤</button>
              </div>
            )}
            {tab==='qa' && !isTeacher && (
              <div style={{ display:'flex', gap:6 }}>
                <input value={qaInput} onChange={e=>setQaInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendQA()} placeholder="Sawaal…" style={{ flex:1, padding:'9px 12px', borderRadius:10, border:'1px solid #334155', background:'#0f172a', color:'#fff', fontSize:12, outline:'none' }} />
                <button onClick={sendQA} style={{ background:'#6366f1', border:'none', borderRadius:10, width:38, color:'#fff', cursor:'pointer', fontSize:16 }}>➤</button>
              </div>
            )}
            {tab==='polls' && isTeacher && <button onClick={()=>setShowPoll(true)} style={{ width:'100%', padding:9, background:'#4f46e5', border:'none', borderRadius:10, color:'#fff', cursor:'pointer', fontSize:12, fontWeight:700 }}>+ New Poll</button>}
          </div>
        </div>
      </div>

      {/* Poll modal */}
      {showPoll && (
        <div style={{ position:'fixed', inset:0, background:'#000a', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99, padding:16 }}>
          <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:18, padding:22, width:'100%', maxWidth:380 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
              <h3 style={{ color:'#fff', margin:0, fontSize:15, fontWeight:800 }}>📊 Poll Banao</h3>
              <button onClick={()=>setShowPoll(false)} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:20 }}>×</button>
            </div>
            <input value={pollQ} onChange={e=>setPollQ(e.target.value)} placeholder="Sawaal…" style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:'1px solid #334155', background:'#0f172a', color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box', marginBottom:10 }} />
            {pollOpts.map((o,i)=>(
              <input key={i} value={o} onChange={e=>{const n=[...pollOpts];n[i]=e.target.value;setPollOpts(n);}} placeholder={`Option ${i+1}`} style={{ width:'100%', padding:'9px 14px', borderRadius:10, border:'1px solid #334155', background:'#0f172a', color:'#fff', fontSize:12, outline:'none', boxSizing:'border-box', marginBottom:8 }} />
            ))}
            {pollOpts.length<4 && <button onClick={()=>setPollOpts([...pollOpts,''])} style={{ color:'#818cf8', background:'none', border:'none', cursor:'pointer', fontSize:12, marginBottom:10 }}>+ Option add</button>}
            <button onClick={launchPoll} style={{ width:'100%', padding:12, background:'#6366f1', border:'none', borderRadius:10, color:'#fff', cursor:'pointer', fontSize:14, fontWeight:800 }}>🚀 Launch</button>
          </div>
        </div>
      )}
    </div>
  );
}
