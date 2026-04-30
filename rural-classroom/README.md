
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



### Live Sessions
```
GET    /api/live-sessions        — List sessions
POST   /api/live-sessions        — Create session
PUT    /api/live-sessions/:id/start — Start session
PUT    /api/live-sessions/:id/end   — End session
```



---

## 🔴 Real-time Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-room` | Client → Server | Join live session room |
|

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

