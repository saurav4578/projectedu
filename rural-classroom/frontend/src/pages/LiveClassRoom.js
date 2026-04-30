import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Send, Hand, BarChart2, MessageCircle, HelpCircle, Users,
  Mic, MicOff, Video, VideoOff, Phone, Plus, X,
  ChevronRight, Loader, Radio, Clock, Copy, Check,
  CheckCircle, AlertCircle, XCircle, ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { connectSocket } from '../services/socket';
import api from '../services/api';

/* ── helpers ──────────────────────────────────────────────────────────────── */
function fmtTime(s) {
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function PollOption({ opt, total, voted, onClick }) {
  const pct = total > 0 ? Math.round((opt.votes/total)*100) : 0;
  return (
    <button onClick={onClick} disabled={voted}
      className={`w-full text-left relative overflow-hidden rounded-xl border transition-all ${voted ? 'border-indigo-500/60 cursor-default' : 'border-slate-600 hover:border-slate-500'}`}>
      <div className="absolute inset-y-0 left-0 bg-indigo-500/25 transition-all duration-500" style={{ width:`${pct}%` }} />
      <div className="relative flex items-center justify-between px-3 py-2.5">
        <span className="text-sm text-white">{opt.text}</span>
        <span className="text-xs text-slate-400 font-mono">{pct}%</span>
      </div>
    </button>
  );
}

/* ── Real-time attendance row ─────────────────────────────────────────────── */
function AttendanceRow({ entry, onAlert }) {
  const mins = Math.floor((entry.durationMs || 0) / 60000);
  const secs = Math.floor(((entry.durationMs || 0) % 60000) / 1000);
  return (
    <div className="flex items-center gap-2 py-2 border-b border-slate-700/30 last:border-0">
      <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
        {entry.name?.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{entry.name}</p>
        <p className="text-xs text-slate-500">Joined {entry.joinedAt ? new Date(entry.joinedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '—'}</p>
      </div>
      {/* Live timer */}
      <div className="flex items-center gap-1 text-xs font-mono text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-2 py-1 flex-shrink-0">
        <Clock size={11} />
        {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────────── */
export default function LiveClassRoom() {
  const { sessionId } = useParams();
  const { user }      = useAuth();
  const navigate      = useNavigate();

  const [session,       setSession]       = useState(null);
  const [loadingJoin,   setLoadingJoin]   = useState(true);
  const [socket,        setSocket]        = useState(null);

  const [tab,       setTab]       = useState('chat');
  const [messages,  setMessages]  = useState([]);
  const [questions, setQuestions] = useState([]);
  const [polls,     setPolls]     = useState([]);
  const [people,    setPeople]    = useState([]);

  /* Attendance real-time */
  const [liveAttendance, setLiveAttendance] = useState([]); // [{id, name, joinedAt, durationMs}]
  const attendanceTimerRef = useRef(null);

  const [chatInput,   setChatInput]   = useState('');
  const [qaInput,     setQaInput]     = useState('');
  const [handRaised,  setHandRaised]  = useState(false);
  const [showPollForm,setShowPollForm]= useState(false);
  const [pollQ,       setPollQ]       = useState('');
  const [pollOpts,    setPollOpts]    = useState(['','']);
  const [broadcastMsg,setBroadcastMsg]= useState('');
  const [micOn,       setMicOn]       = useState(false);
  const [camOn,       setCamOn]       = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [elapsed,     setElapsed]     = useState(0);

  const chatEndRef = useRef(null);
  const isFaculty  = user?.role === 'expert' || user?.role === 'admin' || user?.role === 'local';
  const roomId     = sessionId || 'demo-live-room';

  /* fetch session */
  useEffect(() => {
    const load = async () => {
      try {
        if (sessionId) {
          const res = await api.get('/live-sessions?limit=50');
          setSession(res.data.sessions?.find(s => s._id === sessionId) || null);
        }
      } catch(e) {}
      finally { setLoadingJoin(false); }
    };
    load();
  }, [sessionId]);

  /* timer */
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e+1), 1000);
    return () => clearInterval(t);
  }, []);

  /* Tick liveAttendance durationMs every second */
  useEffect(() => {
    attendanceTimerRef.current = setInterval(() => {
      setLiveAttendance(prev => prev.map(e => ({
        ...e,
        durationMs: e.joinedAt ? Date.now() - new Date(e.joinedAt).getTime() : e.durationMs,
      })));
    }, 1000);
    return () => clearInterval(attendanceTimerRef.current);
  }, []);

  /* socket setup */
  useEffect(() => {
    const s = connectSocket();
    setSocket(s);

    const meta = {
      sessionId: sessionId || null,
      courseId:  session?.courseId?._id || session?.courseId || null,
    };

    s.emit('join-room', {
      roomId,
      user: { id: user._id, name: user.name, role: user.role, mongoId: user._id },
      meta,
    });

    s.on('room-state', ({ chat, polls: p, users, attendanceSnapshot }) => {
      setMessages(chat || []);
      setPolls(p || []);
      setPeople(users || []);
      if (attendanceSnapshot) setLiveAttendance(attendanceSnapshot);
    });

    s.on('new-message',  msg  => setMessages(prev => [...prev, msg]));
    s.on('user-joined',  ({ users }) => setPeople(users));
    s.on('user-left',    ({ users }) => setPeople(users));
    s.on('new-question', qa   => setQuestions(prev => [...prev, qa]));
    s.on('new-poll',     poll => setPolls(prev => [...prev, poll]));
    s.on('poll-updated', u    => setPolls(prev => prev.map(p => p.id===u.id ? u : p)));
    s.on('hand-raised',  ({user:u}) => setMessages(prev => [...prev,{id:Date.now(),system:true,text:`✋ ${u.name} ne haath uthaya!`}]));
    s.on('faculty-announcement', ({message:m}) => setMessages(prev => [...prev,{id:Date.now(),system:true,text:`📢 ${m}`}]));
    s.on('question-answered', ({id,answer}) => setQuestions(prev => prev.map(q => q.id===id?{...q,answered:true,answer}:q)));

    /* Attendance updates from server */
    s.on('attendance-update', (snapshot) => setLiveAttendance(snapshot));

    /* Teacher gets alert if student leaves */
    s.on('session-ended', () => navigate('/dashboard'));

    /* Request initial attendance snapshot */
    if (isFaculty) s.emit('get-attendance', { roomId });

    return () => {
      s.emit('leave-room', { roomId, user: { id: user._id, name: user.name } });
    };
  }, [roomId, user, sessionId, isFaculty, navigate, session]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  /* actions */
  const sendChat  = () => { if(!chatInput.trim()||!socket) return; socket.emit('chat-message',{roomId,message:chatInput.trim(),user:{id:user._id,name:user.name,role:user.role}}); setChatInput(''); };
  const sendQA    = () => { if(!qaInput.trim()||!socket) return; socket.emit('ask-question',{roomId,question:qaInput.trim(),user:{id:user._id,name:user.name}}); setQaInput(''); };
  const raiseHand = () => { socket?.emit('raise-hand',{roomId,user:{id:user._id,name:user.name}}); setHandRaised(true); setTimeout(()=>setHandRaised(false),3000); };
  const broadcast = () => { if(!broadcastMsg.trim()) return; socket?.emit('faculty-broadcast',{roomId,message:broadcastMsg.trim()}); setBroadcastMsg(''); };
  const submitPoll= () => { const opts=pollOpts.filter(o=>o.trim()); if(!pollQ.trim()||opts.length<2) return; socket?.emit('create-poll',{roomId,question:pollQ,options:opts}); setPollQ(''); setPollOpts(['','']); setShowPollForm(false); };
  const votePoll  = (pollId,idx) => socket?.emit('vote-poll',{roomId,pollId,optionIndex:idx,userId:user._id});
  const answerQ   = (q) => { const a=prompt(`Answer: "${q.question}"`); if(!a) return; socket?.emit('answer-question',{roomId,id:q.id,answer:a}); setQuestions(prev=>prev.map(x=>x.id===q.id?{...x,answered:true,answer:a}:x)); };
  const copyLink  = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const endSession = async () => {
    if (!isFaculty) return;
    if (!window.confirm('End this live session? Attendance will be finalized.')) return;
    socket?.emit('end-session', { roomId });
    if (sessionId) await api.put(`/live-sessions/${sessionId}/end`);
    navigate('/dashboard');
  };

  if (loadingJoin) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader size={32} className="animate-spin text-indigo-400" />
    </div>
  );

  const pendingQs   = questions.filter(q=>!q.answered).length;
  /* Tabs — teacher has attendance tab, student doesn't */
  const TABS = isFaculty
    ? [
        { key:'chat',       icon:MessageCircle, label:'Chat' },
        { key:'qa',         icon:HelpCircle,    label:'Q&A',       badge: pendingQs },
        { key:'polls',      icon:BarChart2,     label:'Polls' },
        { key:'attendance', icon:ClipboardList, label:'Attendance', badge: liveAttendance.length },
        { key:'people',     icon:Users,         label:'People',    badge: people.length },
      ]
    : [
        { key:'chat',  icon:MessageCircle, label:'Chat' },
        { key:'qa',    icon:HelpCircle,    label:'Q&A',   badge: pendingQs },
        { key:'polls', icon:BarChart2,     label:'Polls' },
        { key:'people',icon:Users,         label:'People',badge: people.length },
      ];

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden pt-16">

      {/* Top bar */}
      <div className="h-12 flex-shrink-0 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-3">
        <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 rounded-full px-3 py-1">
          <Radio size={12} className="text-red-400 animate-pulse" />
          <span className="text-xs font-bold text-red-400">LIVE</span>
        </div>
        <span className="text-sm text-white font-medium truncate flex-1">
          {session?.title || session?.courseId?.title || 'Live Class'}
        </span>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Clock size={13} /> {fmtTime(elapsed)}
        </span>
        {/* Attendance count badge */}
        {isFaculty && (
          <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1">
            <Users size={12} className="text-green-400" />
            <span className="text-xs text-green-400 font-bold">{liveAttendance.length} present</span>
          </div>
        )}
        <button onClick={copyLink} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors">
          {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Share'}
        </button>
        {isFaculty && (
          <button onClick={endSession} className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs transition-colors">
            <Phone size={13} /> End Session
          </button>
        )}
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">

        {/* Stage */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 bg-slate-950 m-3 rounded-2xl relative border border-slate-800/80 overflow-hidden" style={{ minHeight:0 }}>
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white mx-auto">
                  {user.name?.charAt(0)}
                </div>
                <p className="text-white text-lg font-semibold">{user.name}</p>
                <p className="text-slate-400 text-sm capitalize">{user.role}</p>
                <div className="flex items-center justify-center gap-2 text-xs text-green-400 bg-green-500/10 rounded-full px-4 py-1.5 border border-green-500/20 mx-auto w-fit">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Connected · {people.length} in room
                </div>
              </div>
            </div>
            {isFaculty && (
              <div className="absolute bottom-16 left-3 right-3 flex gap-2">
                <input value={broadcastMsg} onChange={e=>setBroadcastMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&broadcast()} placeholder="📢 Announcement to all students…" className="flex-1 bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none backdrop-blur-sm" />
                <button onClick={broadcast} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-3 py-2 rounded-xl text-sm font-bold transition-colors">📢</button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="h-14 flex-shrink-0 flex items-center justify-center gap-3 pb-2">
            <button onClick={()=>setMicOn(!micOn)} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${micOn?'bg-slate-700':'bg-red-600/80'}`}>
              {micOn ? <Mic size={18} className="text-white" /> : <MicOff size={18} className="text-white" />}
            </button>
            <button onClick={()=>setCamOn(!camOn)} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${camOn?'bg-slate-700':'bg-red-600/80'}`}>
              {camOn ? <Video size={18} className="text-white" /> : <VideoOff size={18} className="text-white" />}
            </button>
            {!isFaculty && (
              <button onClick={raiseHand} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${handRaised?'bg-yellow-500':'bg-slate-700 hover:bg-slate-600'}`}>
                <Hand size={18} className="text-white" />
              </button>
            )}
            {isFaculty && (
              <button onClick={()=>setShowPollForm(true)} className="w-11 h-11 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-all">
                <BarChart2 size={18} className="text-white" />
              </button>
            )}
            <button onClick={() => navigate('/dashboard')} className="w-11 h-11 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-all">
              <Phone size={18} className="text-white rotate-135" />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 border-l border-slate-800 bg-slate-900 flex flex-col">

          {/* Tabs */}
          <div className="flex border-b border-slate-800 flex-shrink-0 overflow-x-auto">
            {TABS.map(({ key, icon: Icon, label, badge }) => (
              <button key={key} onClick={()=>setTab(key)}
                className={`relative flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors min-w-0 ${tab===key?'text-indigo-400 border-b-2 border-indigo-500':'text-slate-500 hover:text-slate-300'}`}>
                <Icon size={15} />
                <span className="truncate">{label}</span>
                {badge > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold px-0.5">{badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">

            {/* CHAT */}
            {tab==='chat' && (
              <div className="p-3 space-y-2">
                {messages.length===0 && <p className="text-slate-500 text-xs text-center pt-6">No messages yet 👋</p>}
                {messages.map((msg,i) => {
                  if (msg.system) return (
                    <div key={i} className="flex justify-center my-1">
                      <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700">{msg.text}</span>
                    </div>
                  );
                  const mine = msg.user?.id === user._id;
                  return (
                    <div key={i} className={`flex gap-2 ${mine?'flex-row-reverse':''}`}>
                      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-1">
                        {msg.user?.name?.charAt(0)}
                      </div>
                      <div className={`max-w-[75%] flex flex-col gap-0.5 ${mine?'items-end':''}`}>
                        <span className="text-[10px] text-slate-500">{msg.user?.name}</span>
                        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${mine?'bg-indigo-600 text-white':'bg-slate-800 text-slate-200'}`}>{msg.text}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Q&A */}
            {tab==='qa' && (
              <div className="p-3 space-y-3">
                {questions.length===0 && <p className="text-slate-500 text-xs text-center pt-6">No questions yet.</p>}
                {questions.map(q => (
                  <div key={q.id} className={`p-3 rounded-xl border ${q.answered?'border-green-500/30 bg-green-500/5':'border-slate-700 bg-slate-800/50'}`}>
                    <p className="text-sm text-white leading-snug">{q.question}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500">{q.user?.name}</span>
                      {q.answered ? <span className="text-xs text-green-400">✓ Answered</span>
                        : isFaculty ? <button onClick={()=>answerQ(q)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">Answer <ChevronRight size={11} /></button>
                        : <span className="text-xs text-yellow-400">Pending</span>
                      }
                    </div>
                    {q.answer && <p className="text-xs text-green-300 mt-1.5 border-t border-green-800/40 pt-1.5">💬 {q.answer}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* POLLS */}
            {tab==='polls' && (
              <div className="p-3 space-y-4">
                {polls.length===0 && <p className="text-slate-500 text-xs text-center pt-6">{isFaculty?'Click poll button to create.':'No polls yet.'}</p>}
                {polls.map(poll => {
                  const total   = poll.options.reduce((s,o)=>s+o.votes,0);
                  const myVote  = poll.votes?.[user._id];
                  return (
                    <div key={poll.id} className="bg-slate-800 rounded-2xl p-4 space-y-2">
                      <p className="text-sm font-medium text-white">{poll.question}</p>
                      {poll.options.map((opt,i) => (
                        <PollOption key={i} opt={opt} total={total} voted={myVote!==undefined} onClick={()=>myVote===undefined&&votePoll(poll.id,i)} />
                      ))}
                      <p className="text-xs text-slate-500">{total} vote{total!==1?'s':''}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ATTENDANCE — teacher only */}
            {tab==='attendance' && isFaculty && (
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Attendance</div>
                  {sessionId && (
                    <Link to={`/dashboard/attendance/session/${sessionId}`} className="text-xs text-indigo-400 hover:text-indigo-300">Full Report →</Link>
                  )}
                </div>

                {/* Summary bar */}
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Students present</span>
                    <span className="text-lg font-extrabold text-green-400">{liveAttendance.length}</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle size={11} /> Present: {liveAttendance.length}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Users size={11} /> Total enrolled: {people.filter(p=>p.role==='student').length + liveAttendance.length}
                    </span>
                  </div>
                </div>

                {/* Student rows with live timer */}
                {liveAttendance.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-6">No students joined yet.</p>
                ) : (
                  <div className="space-y-0">
                    {liveAttendance.map((entry, i) => (
                      <AttendanceRow key={entry.id || i} entry={entry} />
                    ))}
                  </div>
                )}

                {/* People in room but not tracked */}
                {people.filter(p => p.role === 'student' && !liveAttendance.find(a => a.id === p.id)).map(p => (
                  <div key={p.id} className="flex items-center gap-2 py-2 border-b border-slate-700/20 last:border-0 opacity-40">
                    <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {p.name?.charAt(0)}
                    </div>
                    <p className="text-sm text-slate-400">{p.name}</p>
                    <span className="ml-auto text-xs text-slate-500">Joining…</span>
                  </div>
                ))}

                <p className="text-xs text-slate-600 text-center pt-2">
                  Attendance auto-saves when students leave or session ends
                </p>
              </div>
            )}

            {/* PEOPLE */}
            {tab==='people' && (
              <div className="p-3 space-y-1.5">
                {people.length===0 && <p className="text-slate-500 text-xs text-center pt-6">Only you here.</p>}
                {people.map(p => (
                  <div key={p.socketId||p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {p.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{p.role}</p>
                    </div>
                    {(p.role==='expert'||p.role==='admin') && (
                      <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">Host</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-2.5 border-t border-slate-800 flex-shrink-0">
            {tab==='chat' && (
              <div className="flex gap-2">
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Message everyone…" className="flex-1 bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />
                <button onClick={sendChat} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"><Send size={16} className="text-white" /></button>
              </div>
            )}
            {tab==='qa' && (
              <div className="flex gap-2">
                <input value={qaInput} onChange={e=>setQaInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendQA()} placeholder="Ask a question…" className="flex-1 bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none" />
                <button onClick={sendQA} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"><Send size={16} className="text-white" /></button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Poll modal */}
      {showPollForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Create Poll</h3>
              <button onClick={()=>setShowPollForm(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <input value={pollQ} onChange={e=>setPollQ(e.target.value)} placeholder="Poll question…" className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 outline-none" />
            {pollOpts.map((opt,i) => (
              <div key={i} className="flex gap-2">
                <input value={opt} onChange={e=>{const n=[...pollOpts];n[i]=e.target.value;setPollOpts(n);}} placeholder={`Option ${i+1}`} className="flex-1 bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2 text-white placeholder-slate-500 outline-none text-sm" />
                {pollOpts.length>2 && <button onClick={()=>setPollOpts(pollOpts.filter((_,j)=>j!==i))} className="text-slate-500 hover:text-red-400"><X size={16} /></button>}
              </div>
            ))}
            {pollOpts.length<5 && <button onClick={()=>setPollOpts([...pollOpts,''])} className="text-indigo-400 text-sm flex items-center gap-1 hover:text-indigo-300"><Plus size={14} /> Add option</button>}
            <button onClick={submitPoll} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold transition-colors">Launch Poll</button>
          </div>
        </div>
      )}
    </div>
  );
}
