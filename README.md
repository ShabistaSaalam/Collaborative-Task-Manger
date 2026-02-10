# 🚀 Collaborative Task Manager

A production-grade, real-time task management application with live collaboration features.

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

</div>

---

## 🎯 Overview

A full-stack task management system featuring real-time collaboration, role-based permissions, and a modern React UI. Built with enterprise-grade architecture patterns and comprehensive test coverage.

**Key Features:**
- ⚡ Real-time updates via WebSocket
- 🔐 Secure JWT authentication with HttpOnly cookies
- 🎨 Modern, responsive UI with Tailwind CSS
- 🧪 11 passing integration tests
- 📊 Role-based access control
- 🏗️ Clean 3-layer architecture

---

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- SWR for data fetching
- Socket.io Client
- React Hook Form + Zod

### Backend
- Node.js + Express
- TypeScript
- MongoDB + Prisma ORM
- Socket.io
- Jest + Supertest

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ShabistaSaalam/Collaborative-Task-Manager.git
cd Collaborative-Task-Manager
```

2. **Set up Backend**
```bash
cd backend
npm install
cp .env.example .env  # Add your MongoDB URL and JWT secret
npx prisma generate
npm run dev
```

3. **Set up Frontend** (in new terminal)
```bash
cd frontend
npm install
cp .env.example .env  # Add VITE_API_URL=http://localhost:4000
npm run dev
```

4. **Open your browser**
- Frontend: http://localhost:5173
- Backend: http://localhost:4000

---

## 📚 Documentation

- 📘 [Frontend Documentation](./frontend/README.md)
- 📗 [Backend Documentation](./backend/README.md)

---

## ✨ Features Highlight

### Real-Time Collaboration
- Instant task updates across all connected users
- Live notifications when assigned to tasks
- WebSocket-based communication

### Task Management
- Create, edit, delete tasks
- Filter by status and priority
- Multiple dashboard views
- Due date tracking with overdue indicators

### Security
- HttpOnly cookie authentication
- bcrypt password hashing
- Role-based permissions
- CORS protection

### Code Quality
- TypeScript throughout
- Zod validation on both ends
- Integration tests
- Clean architecture patterns

---

## 🧪 Testing
```bash
cd backend
npm test
```

**Test Results:**
- ✅ 11 tests passing
- ✅ 100% critical path coverage
- ✅ Auth, CRUD, and permissions tested

---

## 📄 License

MIT License

---

## 👨‍💻 Author

**Shabistha**
- GitHub: [@ShabistaSaalam](https://github.com/ShabistaSaalam)

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

Built with passion | 2025

</div>