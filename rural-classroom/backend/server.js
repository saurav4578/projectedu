require('dotenv').config();
const express   = require('express');
const http      = require('http');
const { Server }= require('socket.io');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const connectDB = require('./config/db');

// Attendance auto-tracking functions
const { autoMarkJoin, autoMarkLeave, finalizeSession } = require('./controllers/attendanceController');

connectDB();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:3000', methods: ['GET','POST'] },
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 200 }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',            require('./routes/auth'));
app.use('/api/users',           require('./routes/users'));
app.use('/api/courses',         require('./routes/courses'));
app.use('/api/assignments',     require('./routes/assignments'));
app.use('/api/attendance',      require('./routes/attendance'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/enrollment',      require('./routes/enrollment'));
app.use('/api/live-sessions',   require('./routes/liveSessions'));

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ─── Socket.io ───────────────────────────────────────────────────────────────
// rooms[roomId] = {
//   sessionId, courseId,
//   users: [{ id, name, role, socketId, joinedAt }],
//   chat:[], polls:[], attention:{},
//   startedAt
// }
const rooms = {};

function ensureRoom(roomId) {
  if (!rooms[roomId]) rooms[roomId] = {
    sessionId: null, courseId: null,
    users: [], chat: [], polls: [], attention: {},
    startedAt: new Date(),
  };
  return rooms[roomId];
}

// Format seconds → "4m 32s"
function fmtDuration(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s/60)}m ${s%60}s`;
}

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // ── Join room ──────────────────────────────────────────────────────────────
  // user = { id, name, role, mongoId? }
  // meta = { sessionId?, courseId? }  ← faculty passes these when starting live
  socket.on('join-room', ({ roomId, user, meta = {} }) => {
    socket.join(roomId);
    const room = ensureRoom(roomId);

    // Store session/course ids if provided
    if (meta.sessionId) room.sessionId = meta.sessionId;
    if (meta.courseId)  room.courseId  = meta.courseId;

    // Remove old entry if reconnecting
    room.users = room.users.filter(u => u.id !== user.id);

    const joinedAt = new Date();
    const userEntry = { ...user, socketId: socket.id, joinedAt: joinedAt.toISOString() };
    room.users.push(userEntry);

    // ── AUTO ATTENDANCE: mark join if student & session exists ────────────
    if (user.role === 'student' && room.sessionId && room.courseId && user.mongoId) {
      autoMarkJoin({
        sessionId: room.sessionId,
        studentId: user.mongoId,
        courseId:  room.courseId,
      }).then(att => {
        // Tell teacher updated attendance list
        const attUpdate = buildAttendanceSnapshot(room);
        io.to(roomId).emit('attendance-update', attUpdate);
      });
    }

    socket.to(roomId).emit('user-joined', { user: userEntry, users: room.users });
    socket.emit('room-state', { ...room, attendanceSnapshot: buildAttendanceSnapshot(room) });
  });

  // ── Chat ───────────────────────────────────────────────────────────────────
  socket.on('chat-message', ({ roomId, message, user }) => {
    const msg = { id: Date.now(), text: message, user, time: new Date().toISOString() };
    ensureRoom(roomId).chat.push(msg);
    io.to(roomId).emit('new-message', msg);
  });

  // ── Hand raise ─────────────────────────────────────────────────────────────
  socket.on('raise-hand', ({ roomId, user }) => {
    io.to(roomId).emit('hand-raised', { user, time: new Date().toISOString() });
  });

  // ── Polls ──────────────────────────────────────────────────────────────────
  socket.on('create-poll', ({ roomId, question, options }) => {
    const poll = { id: Date.now(), question, options: options.map(o => ({ text: o, votes: 0 })), votes: {} };
    ensureRoom(roomId).polls.push(poll);
    io.to(roomId).emit('new-poll', poll);
  });

  socket.on('vote-poll', ({ roomId, pollId, optionIndex, userId }) => {
    const room = rooms[roomId];
    if (!room) return;
    const poll = room.polls.find(p => p.id === pollId);
    if (!poll || poll.votes[userId] !== undefined) return;
    poll.votes[userId] = optionIndex;
    poll.options[optionIndex].votes++;
    io.to(roomId).emit('poll-updated', poll);
  });

  // ── Q&A ────────────────────────────────────────────────────────────────────
  socket.on('ask-question', ({ roomId, question, user }) => {
    const qa = { id: Date.now(), question, user, answered: false, time: new Date().toISOString() };
    io.to(roomId).emit('new-question', qa);
  });

  socket.on('answer-question', ({ roomId, id, answer }) => {
    io.to(roomId).emit('question-answered', { id, answer });
  });

  // ── Announcements ──────────────────────────────────────────────────────────
  socket.on('faculty-broadcast', ({ roomId, message }) => {
    io.to(roomId).emit('faculty-announcement', { message, time: new Date().toISOString() });
  });

  // ── Attention / Distraction Tracking ──────────────────────────────────────
  socket.on('attention-update', ({ roomId, user, status, details }) => {
    const room = ensureRoom(roomId);
    const payload = { userId: user.id, userName: user.name, status, details, time: new Date().toISOString() };
    room.attention[user.id] = payload;
    socket.to(roomId).emit('student-attention', payload);
  });

  socket.on('get-attention-state', ({ roomId }) => {
    socket.emit('attention-state', rooms[roomId]?.attention || {});
  });

  socket.on('teacher-alert', ({ roomId, targetUserId, message }) => {
    const target = rooms[roomId]?.users.find(u => u.id === targetUserId);
    if (target) io.to(target.socketId).emit('attention-alert', { message, time: new Date().toISOString() });
  });

  // ── ATTENDANCE: teacher requests current snapshot ──────────────────────────
  socket.on('get-attendance', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    socket.emit('attendance-snapshot', buildAttendanceSnapshot(room));
  });

  // ── Faculty ends session → finalize all attendance ─────────────────────────
  socket.on('end-session', async ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.sessionId) {
      await finalizeSession(room.sessionId);
      // Mark all still-in-room students as left
      for (const u of room.users) {
        if (u.role === 'student' && u.mongoId && room.sessionId) {
          await autoMarkLeave({ sessionId: room.sessionId, studentId: u.mongoId });
        }
      }
    }
    io.to(roomId).emit('session-ended', { time: new Date().toISOString() });
    delete rooms[roomId];
  });

  // ── Leave room ─────────────────────────────────────────────────────────────
  socket.on('leave-room', ({ roomId, user }) => {
    handleLeave(socket, roomId, user);
  });

  socket.on('disconnect', () => {
    // Find which rooms this socket was in
    Object.keys(rooms).forEach(roomId => {
      const room = rooms[roomId];
      if (!room) return;
      const user = room.users.find(u => u.socketId === socket.id);
      if (user) handleLeave(socket, roomId, user);
    });
    console.log(`🔌 Disconnected: ${socket.id}`);
  });
});

// ── Handle student leaving room ────────────────────────────────────────────
async function handleLeave(socket, roomId, user) {
  const room = rooms[roomId];
  if (!room) return;

  // Auto-mark leave for students
  if (user?.role === 'student' && user.mongoId && room.sessionId) {
    await autoMarkLeave({ sessionId: room.sessionId, studentId: user.mongoId });
  }

  room.users = room.users.filter(u => u.id !== user?.id);
  delete room.attention?.[user?.id];
  socket.leave(roomId);
  socket.to(roomId).emit('user-left', { user, users: room.users });

  // Send updated attendance to teacher
  const attUpdate = buildAttendanceSnapshot(room);
  socket.to(roomId).emit('attendance-update', attUpdate);
}

// ── Build real-time attendance snapshot from in-memory room ───────────────
function buildAttendanceSnapshot(room) {
  const now = Date.now();
  return room.users
    .filter(u => u.role === 'student')
    .map(u => {
      const joined = u.joinedAt ? new Date(u.joinedAt) : null;
      const durationMs = joined ? now - joined.getTime() : 0;
      return {
        id:          u.id,
        mongoId:     u.mongoId,
        name:        u.name,
        joinedAt:    u.joinedAt,
        durationMs,
        durationFmt: fmtDuration(durationMs),
        status:      'present', // currently online = present
      };
    });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
