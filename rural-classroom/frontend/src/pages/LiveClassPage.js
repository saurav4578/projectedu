import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/common/Navbar';

const LiveClassPage = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const { socket, joinRoom, sendMessage, askQuestion, createPoll, votePoll } = useSocket();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [polls, setPolls] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [questionInput, setQuestionInput] = useState('');
  const [pollForm, setPollForm] = useState({ question: '', options: ['', ''] });
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (socket) {
      joinRoom(sessionId);

      socket.on('chat-message', (msg) => setMessages((prev) => [...prev, msg]));
      socket.on('user-joined', ({ participants: p }) => setParticipants(p));
      socket.on('user-left', ({ participants: p }) => setParticipants(p));
      socket.on('new-question', (q) => setQuestions((prev) => [...prev, q]));
      socket.on('question-answered', ({ questionId, answer }) => {
        setQuestions((prev) => prev.map((q) => q.id === questionId ? { ...q, answer, answered: true } : q));
      });
      socket.on('poll-created', (poll) => setPolls((prev) => [...prev, poll]));
      socket.on('poll-updated', ({ pollId, option, userId }) => {
        setPolls((prev) => prev.map((p) => {
          if (p.id !== pollId) return p;
          const votes = { ...p.votes, [userId]: option };
          return { ...p, votes };
        }));
      });

      return () => {
        socket.off('chat-message');
        socket.off('user-joined');
        socket.off('user-left');
        socket.off('new-question');
        socket.off('question-answered');
        socket.off('poll-created');
        socket.off('poll-updated');
      };
    }
  }, [socket, sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(sessionId, chatInput.trim());
    setChatInput('');
  };

  const handleAskQuestion = (e) => {
    e.preventDefault();
    if (!questionInput.trim()) return;
    askQuestion(sessionId, questionInput.trim());
    setQuestionInput('');
  };

  const handleAnswerQuestion = (questionId, answer) => {
    if (socket) socket.emit('answer-question', { roomId: sessionId, questionId, answer, user });
  };

  const handleCreatePoll = (e) => {
    e.preventDefault();
    if (!pollForm.question || pollForm.options.some((o) => !o.trim())) return;
    createPoll(sessionId, pollForm);
    setPollForm({ question: '', options: ['', ''] });
  };

  const isFaculty = user.role === 'expert' || user.role === 'local' || user.role === 'admin';

  const countVotes = (poll, option) =>
    Object.values(poll.votes || {}).filter((v) => v === option).length;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full live-badge"></span>
            <span className="text-white font-semibold">LIVE CLASS</span>
          </div>
          <span className="text-gray-400 text-sm">{sessionId.slice(0, 20)}...</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">👥 {participants.length} participants</span>
          <button onClick={() => navigate(-1)} className="bg-red-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-red-700">
            Leave
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 bg-black flex items-center justify-center">
          <div className="text-center text-gray-500">
            <span className="text-6xl">🎥</span>
            <p className="mt-4 text-lg">Video Stream Area</p>
            <p className="text-sm mt-2 text-gray-600">Integrate with WebRTC / Jitsi / Zoom SDK</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 flex flex-col border-l border-gray-700">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            {['chat', 'qa', 'polls'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-xs font-medium uppercase tracking-wide transition-colors ${
                  activeTab === tab ? 'text-white border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab === 'chat' ? '💬 Chat' : tab === 'qa' ? '❓ Q&A' : '📊 Polls'}
              </button>
            ))}
          </div>

          {/* Chat */}
          {activeTab === 'chat' && (
            <div className="flex flex-col flex-1">
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && (
                  <p className="text-gray-500 text-sm text-center mt-8">No messages yet. Say hi! 👋</p>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.user?._id === user._id ? 'flex-row-reverse' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-xs text-white">
                      {msg.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className={`max-w-52 ${msg.user?._id === user._id ? 'items-end' : 'items-start'} flex flex-col`}>
                      <span className="text-xs text-gray-500 mb-1">{msg.user?.name}</span>
                      <div className={`px-3 py-2 rounded-xl text-sm ${
                        msg.user?._id === user._id ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-700 flex gap-2">
                <input
                  value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Type a message..."
                />
                <button type="submit" className="bg-indigo-600 text-white rounded-lg px-3 py-2 hover:bg-indigo-700">➤</button>
              </form>
            </div>
          )}

          {/* Q&A */}
          {activeTab === 'qa' && (
            <div className="flex flex-col flex-1">
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {questions.length === 0 && (
                  <p className="text-gray-500 text-sm text-center mt-8">No questions yet</p>
                )}
                {questions.map((q) => (
                  <div key={q.id} className="bg-gray-700 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">{q.user?.name}</p>
                    <p className="text-white text-sm">{q.question}</p>
                    {q.answered && (
                      <div className="mt-2 bg-green-900 bg-opacity-40 rounded-lg p-2">
                        <p className="text-xs text-green-400">✅ {q.answer}</p>
                      </div>
                    )}
                    {isFaculty && !q.answered && (
                      <button
                        onClick={() => {
                          const ans = prompt('Answer this question:');
                          if (ans) handleAnswerQuestion(q.id, ans);
                        }}
                        className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        Answer →
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {user.role === 'student' && (
                <form onSubmit={handleAskQuestion} className="p-3 border-t border-gray-700 flex gap-2">
                  <input
                    value={questionInput} onChange={(e) => setQuestionInput(e.target.value)}
                    className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                    placeholder="Ask a question..."
                  />
                  <button type="submit" className="bg-indigo-600 text-white rounded-lg px-3 py-2 hover:bg-indigo-700">✋</button>
                </form>
              )}
            </div>
          )}

          {/* Polls */}
          {activeTab === 'polls' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {isFaculty && (
                <form onSubmit={handleCreatePoll} className="bg-gray-700 rounded-xl p-3 space-y-2">
                  <p className="text-white text-sm font-medium">Create Poll</p>
                  <input
                    className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                    placeholder="Poll question"
                    value={pollForm.question}
                    onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })}
                  />
                  {pollForm.options.map((opt, i) => (
                    <input
                      key={i}
                      className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const opts = [...pollForm.options];
                        opts[i] = e.target.value;
                        setPollForm({ ...pollForm, options: opts });
                      }}
                    />
                  ))}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ''] })} className="text-xs text-indigo-400">+ Add Option</button>
                    <button type="submit" className="ml-auto bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg">Launch Poll</button>
                  </div>
                </form>
              )}
              {polls.map((poll) => {
                const totalVotes = Object.keys(poll.votes || {}).length;
                const userVote = poll.votes?.[user._id];
                return (
                  <div key={poll.id} className="bg-gray-700 rounded-xl p-3 space-y-2">
                    <p className="text-white text-sm font-medium">{poll.question}</p>
                    {poll.options.map((opt, i) => {
                      const count = countVotes(poll, opt);
                      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                      return (
                        <button
                          key={i} disabled={!!userVote}
                          onClick={() => votePoll(sessionId, poll.id, opt)}
                          className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors relative overflow-hidden ${
                            userVote === opt ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                          }`}
                        >
                          <div className="absolute inset-y-0 left-0 bg-white bg-opacity-10 rounded-lg transition-all" style={{ width: `${pct}%` }}></div>
                          <span className="relative">{opt}</span>
                          <span className="relative float-right text-xs">{pct}%</span>
                        </button>
                      );
                    })}
                    <p className="text-xs text-gray-400">{totalVotes} votes</p>
                  </div>
                );
              })}
              {polls.length === 0 && !isFaculty && (
                <p className="text-gray-500 text-sm text-center mt-8">No polls yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveClassPage;
