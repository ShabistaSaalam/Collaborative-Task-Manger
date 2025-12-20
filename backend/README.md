# 🚀 Collaborative Task Manager - Backend

A production-ready RESTful API built with Node.js, Express, TypeScript, Prisma, and Socket.io for real-time task collaboration.

## 📋 Table of Contents
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Architecture](#architecture)
- [Testing](#testing)
- [Environment Variables](#environment-variables)

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB
- **ORM**: Prisma
- **Authentication**: JWT (HttpOnly cookies)
- **Real-time**: Socket.io
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **Password Hashing**: bcrypt

---

## ✨ Features

### Core Functionality
✅ **Secure Authentication**
- User registration with password hashing (bcrypt)
- JWT-based session management
- HttpOnly cookies for XSS protection

✅ **Task Management (CRUD)**
- Create, read, update, delete tasks
- Task attributes: title, description, dueDate, priority, status, creator, assignee
- Input validation with Zod DTOs

✅ **Real-time Collaboration**
- Socket.io for instant updates
- Events: `task:created`, `task:updated`, `task:deleted`, `task:assigned`
- Private notifications when tasks are assigned

✅ **Role-based Permissions**
- Task creators can update all fields
- Assignees can only update task status
- Authorization middleware enforces rules

✅ **Advanced Queries**
- Get tasks assigned to user
- Get tasks created by user
- Filter by status and priority
- Sort by due date

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- PostgreSQL or MongoDB installed
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ShabistaSaalam/Collaborative-Task-Manger

cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Start development server
npm run dev
```

The server will start on `http://localhost:4000`

---

## 📡 API Endpoints

### Authentication
```
| Method | Endpoint         | Description       | Auth Required    |
|--------|------------------|-------------------|----------------- |
| POST   | `/auth/register` | Register new user | ❌               |
| POST   | `/auth/login`    | Login user        | ❌               |
| POST   | `/auth/logout`   | Logout user       | ✅               |
```
### User
```
| Method | Endpoint    | Description                    | Auth Required |
|--------|-------------|--------------------------------|---------------|
| GET    | `/user/me`  | Get current user profile       | ✅            |
| PATCH  | `/user/me`  | Update user profile            | ✅            |
| GET    | `/user/all` | Get all users (for assignment) | ✅            |
```
### Tasks
```
| Method | Endpoint          | Description                           | Auth Required |
|--------|-------------------|--------------------------             |---------------|
| GET    | `/tasks`          | Get all tasks                         | ✅            |
| GET    | `/tasks/me`       | Get tasks assigned to me              | ✅            |        
| GET    | `/tasks/created`  | Get tasks created by me               | ✅            |
| GET    | `/tasks/filtered` | Get filtered tasks (status, priority) | ✅            |
| POST   | `/tasks`          | Create new task                       | ✅            |
| PATCH  | `/tasks/:id`      | Update task                           | ✅            |
| DELETE | `/tasks/:id`      | Delete task (creator only)            | ✅            |
```
### Request/Response Examples

#### Register User
```bash
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Create Task
```bash
POST /tasks
Content-Type: application/json
Cookie: token=<jwt>

{
  "title": "Complete project documentation",
  "description": "Write comprehensive README",
  "dueDate": "2025-12-25T10:00:00Z",
  "priority": "High",
  "status": "ToDo",
  "assignedToId": "user-uuid" // optional
}

Response: 201 Created
{
  "task": {
    "id": "task-uuid",
    "title": "Complete project documentation",
    ...
  }
}
```

---

## 🏗️ Architecture

### Directory Structure
```
backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── middlewares/      # Auth, validation
│   ├── routes/           # API routes
│   ├── dtos/             # Zod validation schemas
│   ├── types/            # TypeScript types
│   ├── socket.ts         # Socket.io setup
│   ├── app.ts            # Express app
│   └── server.ts         # Server entry point
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── client.ts         # Prisma client
├── __tests__/            # Jest tests
└── package.json
```

### Design Pattern: 3-Layer Architecture

```
┌─────────────┐
│  Controllers │  ← HTTP requests/responses
└──────┬──────┘
       │
┌──────▼──────┐
│   Services   │  ← Business logic
└──────┬──────┘
       │
┌──────▼──────┐
│   Prisma     │  ← Database access
└─────────────┘
```

**Benefits:**
- Clear separation of concerns
- Easy to test business logic
- Maintainable and scalable

### Key Design Decisions

**1. JWT in HttpOnly Cookies**
- More secure than localStorage (immune to XSS)
- Automatically sent with requests
- `sameSite: strict` prevents CSRF

**2. Zod for Validation**
- Type-safe validation
- Auto-generated TypeScript types
- Clear error messages

**3. Service Layer Pattern**
- Business logic separated from HTTP layer
- Reusable across different controllers
- Easy to unit test

**4. Socket.io for Real-time**
- Industry standard

---

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Test Coverage
- **11 tests** covering critical functionality
- Authentication flow (3 tests)
- Task CRUD operations (4 tests)
- Permission system (4 tests)

### Test Examples
```typescript
// Authentication test
it('should login user and set cookie', async () => {
  const res = await request(app)
    .post('/auth/login')
    .send({ email: 'test@example.com', password: 'password123' });
  
  expect(res.status).toBe(200);
  expect(res.headers['set-cookie']).toBeDefined();
});

// Permission test
it('assignee CANNOT update title', async () => {
  const res = await request(app)
    .patch(`/tasks/${taskId}`)
    .set('Cookie', assigneeCookie)
    .send({ title: 'Hack Attempt' });

  expect(res.status).toBe(403);
});
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/taskmanager"
# Or for MongoDB:
# DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.erc669x.mongodb.net/taskmanager?retryWrites=true&w=majority""

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Node Environment
NODE_ENV="development"

# Server Port
PORT=4000

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5173"
```

---

## 📝 Scripts

```bash
# Development
npm run dev          # Start with hot reload

# Production
npm run build        # Compile TypeScript
npm start            # Run compiled code

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma studio    # Open Prisma Studio GUI

# Testing
npm test             # Run all tests
npm run test:verbose # Run with detailed output
```

---

## 🔒 Security Features

✅ **Password Security**
- bcrypt hashing with salt rounds
- Passwords never stored in plain text

✅ **JWT Security**
- HttpOnly cookies (XSS protection)
- 7-day expiration
- Secure flag in production

✅ **Input Validation**
- Zod schema validation on all endpoints
- Type-safe request handling

✅ **CORS Configuration**
- Whitelist specific origins
- Credentials enabled for cookies

✅ **Authorization**
- Middleware protects all task routes
- Role-based permissions enforced

---

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Kill process on port 4000
npx kill-port 4000
```

**Tests failing**
```bash
# Clear Jest cache
npm run test:clear

# Ensure test database is set up
# Run tests in band: npm test -- --runInBand
```

---

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

---

## 👨‍💻 Author

[Your Name]
- GitHub: Shabistha 

---

## 🙏 Acknowledgments

- Built as part of a full-stack engineering assessment
- Technologies: Node.js, Express, TypeScript, Prisma, Socket.io