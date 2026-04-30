# 🎓 AI-Enhanced Remote Classroom Platform for Rural Colleges

A full-stack production-ready web application connecting expert faculty with rural college students through AI-powered personalization, real-time live classes, and role-based dashboards.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18 (Hooks) + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcryptjs |
| Real-time | Socket.io |
| AI Engine | Rule-based recommendation system |
| Charts | Recharts |
| File Upload | Multer (local) / Cloudinary |
| Email | Nodemailer |

---

## 📁 Project Structure

```
rural-classroom/
├── backend/
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── cloudinary.js       # Cloudinary config
│   ├── models/
│   │   ├── User.js             # User schema + bcrypt
│   │   ├── Course.js           # Course + materials
│   │   ├── Assignment.js       # Assignment + submissions
│   │   ├── Attendance.js       # Attendance tracking
│   │   ├── Performance.js      # Student scores
│   │   └── LiveSession.js      # Live session model
│   ├── controllers/
│   │   ├── authController.js   # Register/Login/JWT
│   │   ├── userController.js   # User CRUD + analytics
│   │   ├── courseController.js # Course management
│   │   ├── assignmentController.js
│   │   ├── attendanceController.js
│   │   ├── recommendationController.js  # AI Engine ⭐
│   │   └── liveSessionController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── courses.js
│   │   ├── assignments.js
│   │   ├── attendance.js
│   │   ├── recommendations.js
│   │   └── liveSessions.js
│   ├── middleware/
│   │   ├── auth.js             # JWT protect + authorize
│   │   └── upload.js           # Multer config
│   ├── uploads/                # Local file storage
│   ├── .env.example
│   ├── package.json
│   └── server.js               # Express + Socket.io
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── common/
    │   │       ├── Navbar.js
    │   │       ├── Sidebar.js      # Role-based navigation
    │   │       ├── StatCard.js
    │   │       ├── Modal.js
    │   │       └── LoadingSpinner.js
    │   ├── pages/
    │   │   ├── Home.js             # Landing page
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Dashboard.js        # Layout + routing
    │   │   ├── Courses.js          # Course browser + enroll
    │   │   ├── Profile.js
    │   │   ├── Recommendations.js  # AI page
    │   │   ├── LiveClass.js        # Socket.io classroom
    │   │   └── dashboard/
    │   │       ├── AdminDashboard.js
    │   │       ├── ExpertDashboard.js
    │   │       ├── LocalDashboard.js
    │   │       └── StudentDashboard.js
    │   ├── context/
    │   │   └── AuthContext.js      # Global auth state
    │   ├── services/
    │   │   ├── api.js              # Axios + JWT interceptor
    │   │   └── socket.js           # Socket.io client
    │   ├── App.js
    │   ├── index.js
    │   └── index.css               # Tailwind + custom styles
    ├── package.json
    └── tailwind.config.js
```

---

## ⚙️ Setup & Run Locally

### Prerequisites
- Node.js >= 16
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone / Extract the Project

```bash
cd rural-classroom
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy env file and configure
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, email credentials
```

### 3. Configure `.env`

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/rural_classroom
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# Email (optional - app works without it)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

CLIENT_URL=http://localhost:3000
```

### 4. Start Backend

```bash
npm run dev  # development (nodemon)
# or
npm start    # production
```

Backend runs at: `http://localhost:5000`

### 5. Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🔐 API Endpoints

### Authentication
```
POST /api/auth/register    — Register new user
POST /api/auth/login       — Login (returns JWT)
GET  /api/auth/me          — Get current user (protected)
```

### Users
```
GET    /api/users                — List all users (admin)
GET    /api/users/analytics      — Platform stats (admin)
GET    /api/users/:id            — User by ID
PUT    /api/users/profile        — Update own profile
PUT    /api/users/:id/approve    — Approve faculty (admin)
DELETE /api/users/:id            — Delete user (admin)
```

### Courses
```
GET    /api/courses              — List courses (paginated, search)
POST   /api/courses              — Create course (expert/admin)
GET    /api/courses/:id          — Course details
PUT    /api/courses/:id          — Update course
DELETE /api/courses/:id          — Delete course
POST   /api/courses/:id/materials — Upload material (multer)
POST   /api/courses/:id/enroll   — Student enroll
```

### Assignments
```
GET    /api/assignments          — List assignments
POST   /api/assignments          — Create assignment
POST   /api/assignments/:id/submit — Submit (multer)
POST   /api/assignments/:id/grade  — Grade submission
```

### Attendance
```
POST /api/attendance             — Mark attendance (local/expert/admin)
GET  /api/attendance             — Get records (filterable)
GET  /api/attendance/stats/:studentId/:courseId — Stats
```

### AI Recommendations
```
GET  /api/recommendations/:studentId  — Personalized suggestions
```

### Live Sessions
```
GET    /api/live-sessions        — List sessions
POST   /api/live-sessions        — Create session
PUT    /api/live-sessions/:id/start — Start session
PUT    /api/live-sessions/:id/end   — End session
```

---

## 🧠 AI Recommendation Engine

Located in `backend/controllers/recommendationController.js`

**Rules:**
| Condition | Recommendation |
|-----------|---------------|
| Score < 40% | Beginner materials, remedial sessions |
| Attendance < 60% | Watch recorded lectures, revision |
| Score 40–70% | Practice assignments, intermediate content |
| Score > 70% | Advanced materials, challenge problems |

The engine is ML-ready — you can replace `generateRecommendations()` with a trained model by returning the same `{ type, priority, message, action, icon }` structure.

---

## 🔴 Real-time Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-room` | Client → Server | Join live session room |
| `chat-message` | Client → Server | Send chat message |
| `new-message` | Server → Client | Broadcast message |
| `raise-hand` | Client → Server | Raise hand signal |
| `hand-raised` | Server → Client | Notify all of raised hand |
| `create-poll` | Client → Server | Faculty creates poll |
| `new-poll` | Server → Client | Broadcast poll |
| `vote-poll` | Client → Server | Student votes |
| `poll-updated` | Server → Client | Updated vote counts |
| `ask-question` | Client → Server | Student Q&A |
| `new-question` | Server → Client | Broadcast question |
| `faculty-broadcast` | Client → Server | Announcement |
| `user-joined/left` | Server → Client | Participant updates |

---

## 🎭 User Roles & Access

| Role | Key Features |
|------|-------------|
| **Admin** | Manage all users, approve faculty, view platform analytics |
| **Expert Faculty** | Create courses, upload materials, schedule & run live sessions, grade |
| **Local Faculty** | Mark attendance, monitor engagement, facilitate discussion |
| **Student** | Enroll in courses, join live classes, submit assignments, AI recommendations |

---

## 🌐 Low Bandwidth Optimizations

- React lazy loading (code-splitting per page)
- Paginated API responses (limit + page params)
- Multer file size limits (50MB max)
- Gzip via Express compression
- Image compression recommendations in cloudinary config
- Socket.io websocket transport (no long polling)

---

## 📧 Email Notifications

Configured via Nodemailer in `authController.js`. Sends welcome emails on registration. Extend by calling `sendWelcomeEmail()` pattern for:
- Assignment submission notifications
- Grade published alerts
- Live session reminders

---

## 🛡️ Security Features

- JWT with configurable expiry
- bcrypt password hashing (salt rounds: 12)
- Role-based middleware (`authorize()`)
- Approval workflow for faculty accounts
- Helmet.js security headers
- Rate limiting (100 req/15min)
- CORS configured for frontend URL

---

## 📊 Example API Responses

**Login Success:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64abc123",
    "name": "Ravi Kumar",
    "email": "ravi@college.edu",
    "role": "student",
    "isApproved": true,
    "college": "RKGEC"
  }
}
```

**AI Recommendations:**
```json
{
  "success": true,
  "recommendations": [
    {
      "type": "attendance",
      "priority": "high",
      "message": "Your attendance in Python is 45%. Watch recorded lectures.",
      "action": "Watch Recorded Lectures",
      "icon": "📹"
    }
  ],
  "summary": {
    "avgScore": 58,
    "avgAttendance": 45,
    "totalCourses": 3
  }
}
```

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'Add feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

**Built with ❤️ for Rural India's Education Future**
