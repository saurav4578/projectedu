import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { connectSocket, disconnectSocket } from '../services/socket';
import { Send, Hand, BarChart2, MessageCircle, HelpCircle, Users, Mic, MicOff, Video, VideoOff } from 'lucide-react';

export default function LiveClass() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [polls, setPolls] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [message, setMessage] = useState('');
  const [question, setQuestion] = useState('');
  const [tab, setTab] = useState('chat');
  const [handRaised, setHandRaised] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const chatEndRef = useRef(null);

  const roomId = sessionId || 'demo-room-1';

  useEffect(() => {
    const s = connectSocket();
    setSocket(s);

    s.emit('join-room', { roomId, user: { id: user._id, name: user.name, role: user.role } });

    s.on('room-state', (state) => {
      setMessages(state.chat || []);
      setPolls(state.polls || []);
      setParticipants(state.users || []);
    });
    s.on('new-message', (msg) => setMessages(prev => [...prev, msg]));
    s.on('user-joined', ({ users }) => setParticipants(users));
    s.on('user-left', ({ users }) => setParticipants(users));
    s.on('new-question', (qa) => setQuestions(prev => [...prev, qa]));
    s.on('new-poll', (poll) => setPolls(prev => [...prev, poll]));
    s.on('poll-updated', (updated) => setPolls(prev => prev.map(p => p.id === updated.id ? updated : p)));
    s.on('hand-raised', ({ user: u }) => {
      setMessages(prev => [...prev, { id: Date.now(), text: `✋ ${u.name} raised their hand`, system: true, time: new Date().toISOString() }]);
    });
    s.on('faculty-announcement', ({ message: msg }) => {
      setMessages(prev => [...prev, { id: Date.now(), text: `📢 ${msg}`, system: true, time: new Date().toISOString() }]);
    });

    return () => {
      s.emit('leave-room', { roomId, user: { id: user._id, name: user.name } });
    };
  }, [roomId, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !socket) return;
    socket.emit('chat-message', { roomId, message: message.trim(), user: { id: user._id, name: user.name, role: user.role } });
    setMessage('');
  };

  const askQuestion = () => {
    if (!question.trim() || !socket) return;
    socket.emit('ask-question', { roomId, question: question.trim(), user: { id: user._id, name: user.name } });
    setQuestion('');
  };

  const raiseHand = () => {
    if (!socket) return;
    socket.emit('raise-hand', { roomId, user: { id: user._id, name: user.name } });
    setHandRaised(!handRaised);
    setTimeout(() => setHandRaised(false), 3000);
  };

  const votePoll = (pollId, optionIndex) => {
    if (!socket) return;
    socket.emit('vote-poll', { roomId, pollId, optionIndex, userId: user._id });
  };

  return (
    <div className="flex h-screen bg-slate-950 pt-16">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 bg-slate-900 m-4 rounded-2xl flex items-center justify-center relative border border-slate-700/50">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-white">
              {user.name?.charAt(0)}
            </div>
            <p className="text-white text-xl font-semibold">{user.name}</p>
            <p className="text-slate-400 text-sm capitalize">{user.role}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                Live Session — Room: {roomId}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button onClick={() => setMicOn(!micOn)} className={`p-3 rounded-full transition-all ${micOn ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-600/80 hover:bg-red-600'}`}>
              {micOn ? <Mic size={20} className="text-white" /> : <MicOff size={20} className="text-white" />}
            </button>
            <button onClick={() => setVideoOn(!videoOn)} className={`p-3 rounded-full transition-all ${videoOn ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-600/80 hover:bg-red-600'}`}>
              {videoOn ? <Video size={20} className="text-white" /> : <VideoOff size={20} className="text-white" />}
            </button>
            <button onClick={raiseHand} className={`p-3 rounded-full transition-all ${handRaised ? 'bg-yellow-500' : 'bg-slate-700 hover:bg-slate-600'}`}>
              <Hand size={20} className="text-white" />
            </button>
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-1 text-xs text-slate-400">
            <Users size={14} /> {participants.length} participants
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 h-full border-l border-slate-700/50 bg-slate-900 flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-slate-700/50">
          {[
            { id: 'chat', icon: MessageCircle, label: 'Chat' },
            { id: 'qa', icon: HelpCircle, label: 'Q&A' },
            { id: 'polls', icon: BarChart2, label: 'Polls' },
            { id: 'people', icon: Users, label: 'People' },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${tab === id ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'}`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {tab === 'chat' && (
            <div className="space-y-2">
              {messages.map(msg => (
                <div key={msg.id} className={`${msg.system ? 'text-center' : ''}`}>
                  {msg.system ? (
                    <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">{msg.text}</span>
                  ) : (
                    <div className={`flex gap-2 ${msg.user?.id === user._id ? 'flex-row-reverse' : ''}`}>
                      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {msg.user?.name?.charAt(0)}
                      </div>
                      <div className={`max-w-48 ${msg.user?.id === user._id ? 'items-end' : 'items-start'} flex flex-col`}>
                        <span className="text-xs text-slate-500 mb-0.5">{msg.user?.name}</span>
                        <div className={`px-3 py-2 rounded-xl text-sm ${msg.user?.id === user._id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
          {tab === 'qa' && (
            <div className="space-y-3">
              {questions.map(q => (
                <div key={q.id} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                  <p className="text-sm text-white">{q.question}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-400">by {q.user?.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${q.answered ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {q.answered ? 'Answered' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
              {questions.length === 0 && <p className="text-slate-400 text-sm text-center py-4">No questions yet</p>}
            </div>
          )}
          {tab === 'polls' && (
            <div className="space-y-4">
              {polls.map(poll => {
                const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
                const userVote = poll.votes?.[user._id];
                return (
                  <div key={poll.id} className="bg-slate-800 rounded-xl p-4">
                    <p className="text-sm font-medium text-white mb-3">{poll.question}</p>
                    <div className="space-y-2">
                      {poll.options.map((opt, i) => {
                        const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                        return (
                          <button key={i} onClick={() => userVote === undefined && votePoll(poll.id, i)} className={`w-full text-left relative overflow-hidden rounded-lg border transition-all ${userVote === i ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 hover:border-slate-500'}`}>
                            <div className="absolute inset-y-0 left-0 bg-indigo-500/20 transition-all" style={{ width: `${pct}%` }} />
                            <div className="relative flex items-center justify-between px-3 py-2">
                              <span className="text-sm text-white">{opt.text}</span>
                              <span className="text-xs text-slate-400">{pct}%</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{totalVotes} votes</p>
                  </div>
                );
              })}
              {polls.length === 0 && <p className="text-slate-400 text-sm text-center py-4">No polls yet</p>}
            </div>
          )}
          {tab === 'people' && (
            <div className="space-y-2">
              {participants.map(p => (
                <div key={p.id || p.socketId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                    {p.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-white">{p.name}</p>
                    <span className="text-xs text-slate-400 capitalize">{p.role}</span>
                  </div>
                </div>
              ))}
              {participants.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Only you are here</p>}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-700/50">
          {tab === 'chat' && (
            <div className="flex gap-2">
              <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
              <button onClick={sendMessage} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
                <Send size={16} className="text-white" />
              </button>
            </div>
          )}
          {tab === 'qa' && (
            <div className="flex gap-2">
              <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && askQuestion()} placeholder="Ask a question..." className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
              <button onClick={askQuestion} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">
                <Send size={16} className="text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
