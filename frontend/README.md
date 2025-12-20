# 🎨 Collaborative Task Manager - Frontend

A modern, responsive React application built with TypeScript, Tailwind CSS, and real-time collaboration features using Socket.io.

## 📋 Table of Contents
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Key Components](#key-components)
- [State Management](#state-management)
- [Environment Variables](#environment-variables)

---

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Data Fetching**: SWR (with automatic caching & revalidation)
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **State Management**: Zustand
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Notifications**: Sonner (toast notifications)

---

## ✨ Features

### User Experience
✅ **Modern, Responsive UI**
- Mobile-first design
- Tailwind CSS with custom design tokens
- Smooth animations and transitions
- Skeleton loading states

✅ **Real-time Collaboration**
- Instant task updates across all connected users
- Live notifications when assigned to tasks
- Socket.io with automatic reconnection

✅ **Smart Data Management**
- SWR for automatic caching and revalidation
- Optimistic UI updates
- Background data synchronization
- Error boundaries with retry mechanisms

✅ **Powerful Task Management**
- Create, edit, delete tasks
- Filter by status and priority
- Sort by due date
- Multiple dashboard views:
  - All Tasks
  - Assigned to Me
  - Created by Me
  - Overdue Tasks

✅ **Form Validation**
- React Hook Form with Zod schemas
- Real-time validation feedback
- Type-safe form handling

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- Backend API running (see backend README)

### Installation
```bash
# Clone the repository
git clone https://github.com/ShabistaSaalam/Collaborative-Task-Manger.git
cd Collaborative-Task-Manger/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your backend API URL

# Start development server
npm run dev
```

The app will start on `http://localhost:5173`

---

## 📁 Project Structure
```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── TaskCard.tsx
│   │   ├── TaskForm.tsx
│   │   ├── TaskFilters.tsx
│   │   ├── TaskSkeleton.tsx
│   │   ├── UserMenu.tsx
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Dashboard.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useTasks.ts    # SWR data fetching
│   │   └── useAuth.ts
│   ├── lib/                # Utilities
│   │   ├── api.ts         # Axios instance & API calls
│   │   ├── socket.ts      # Socket.io client
│   │   └── utils.ts
│   ├── store/              # Zustand stores
│   │   └── authStore.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/
├── .env
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🧩 Key Components

### Pages

**Login.tsx** - User authentication
```typescript
// Features:
- Email/password form
- Form validation with Zod
- Redirects to dashboard on success
- Error handling with toast notifications
```

**Register.tsx** - User registration
```typescript
// Features:
- Name, email, password fields
- Validation (min lengths, email format)
- Auto-login after registration
```

**Dashboard.tsx** - Main application interface
```typescript
// Features:
- 4 tabbed views (All, Assigned, Created, Overdue)
- Task filtering and sorting
- Real-time updates via Socket.io
- Create/Edit/Delete task modals
```

### Components

**TaskCard.tsx** - Individual task display
```typescript
// Features:
- Priority & status badges
- Due date with overdue indicator
- Edit/Delete actions
- Creator & assignee info
- Responsive card layout
```

**TaskForm.tsx** - Task creation/editing
```typescript
// Features:
- React Hook Form + Zod validation
- Date/time picker
- Priority & status dropdowns
- User assignment field
- Loading states
```

**TaskFilters.tsx** - Filter controls
```typescript
// Features:
- Status filter dropdown
- Priority filter dropdown
- Due date sort toggle
- Responsive filter bar
```

---

## 📊 State Management

### Global State (Zustand)
```typescript
// authStore.ts
- user: User | null
- isAuthenticated: boolean
- setUser()
- logout()
```

### Server State (SWR)
```typescript
// useTasks.ts hooks
- useTasks()           → All tasks
- useAssignedTasks()   → Tasks assigned to me
- useCreatedTasks()    → Tasks I created
- useOverdueTasks()    → Overdue tasks
- useFilteredTasks()   → Client-side filtering
```

**Why SWR?**
- Automatic caching and deduplication
- Revalidation on focus
- Polling and real-time updates
- Error retry with exponential backoff
- Optimistic UI updates

---

## 🔌 Real-time Integration

### Socket.io Events

**Client Listens:**
```typescript
socket.on('task:created', () => {
  mutate('/tasks');  // Refresh task list
});

socket.on('task:updated', (task) => {
  mutate('/tasks');
});

socket.on('task:deleted', ({ taskId }) => {
  mutate('/tasks');
});

socket.on('task:assigned', (task) => {
  toast.info(`New task assigned: ${task.title}`);
  mutate('/tasks/me');
});
```

**Connection Management:**
```typescript
// Automatically connects on login
initializeSocket();

// Reconnects on disconnect
socket.io.reconnection = true;

// Disconnects on logout
disconnectSocket();
```

---

## 🎨 Styling & Theming

### Tailwind CSS Configuration
```javascript
// Custom colors, spacing, animations
theme: {
  extend: {
    colors: {
      primary: { /* ... */ },
      destructive: { /* ... */ },
      // Full color system
    }
  }
}
```

### Design System
- **Typography**: Inter font family
- **Colors**: Consistent palette with dark mode support
- **Spacing**: 4px base unit
- **Shadows**: Layered elevation system
- **Animations**: Smooth transitions

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:
```env
# Backend API URL
VITE_API_URL=http://localhost:4000

# WebSocket URL
VITE_WS_URL=ws://localhost:4000
```

**Production:**
```env
VITE_API_URL=https://your-backend.onrender.com
VITE_WS_URL=wss://your-backend.onrender.com
```

---

## 📝 Scripts
```bash
# Development
npm run dev          # Start dev server (port 5173)

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Linting & Formatting
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

---

## 🎯 Key Features Deep Dive

### 1. Task Filtering
```typescript
// Client-side filtering with useMemo
const filteredTasks = useMemo(() => {
  return tasks
    .filter(t => statusFilter === 'all' || t.status === statusFilter)
    .filter(t => priorityFilter === 'all' || t.priority === priorityFilter)
    .sort((a, b) => 
      sortOrder === 'asc' 
        ? new Date(a.dueDate) - new Date(b.dueDate)
        : new Date(b.dueDate) - new Date(a.dueDate)
    );
}, [tasks, statusFilter, priorityFilter, sortOrder]);
```

### 2. Optimistic Updates
```typescript
// Immediate UI feedback while saving
await mutate(
  '/tasks',
  async (currentTasks) => {
    const updatedTask = await taskApi.update(id, data);
    return currentTasks.map(t => 
      t.id === id ? updatedTask : t
    );
  },
  { optimisticData: currentTasks }
);
```

### 3. Error Handling
```typescript
// Axios interceptor for global error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Auto-logout on auth failure
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations
- Stacked layouts on small screens
- Collapsible filters

---

## 🐛 Troubleshooting

### Common Issues

**API Connection Failed**
```bash
# Check VITE_API_URL in .env
# Ensure backend is running
# Check CORS settings in backend
```

**WebSocket Not Connecting**
```bash
# Verify VITE_WS_URL protocol (ws:// or wss://)
# Check backend Socket.io setup
# Look for CORS/credentials issues
```

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite node_modules/.vite
```

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

**Environment Variables in Vercel:**
- Go to Project Settings → Environment Variables
- Add `VITE_API_URL` and `VITE_WS_URL`

### Build Configuration
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

---

## 🎨 UI Components Library

Uses **shadcn/ui** - Copy-paste component library built on:
- Radix UI primitives (accessible)
- Tailwind CSS (styled)
- Class Variance Authority (variants)

**Components Used:**
- Button, Input, Textarea, Label
- Dialog, Select, Tabs
- Card, Badge
- Skeleton

---

## 📄 License

MIT License

---

## 👨‍💻 Author

**Shabista Saalam**
- GitHub: [@ShabistaSaalam](https://github.com/ShabistaSaalam)
- Repository: [Collaborative-Task-Manger](https://github.com/ShabistaSaalam/Collaborative-Task-Manger)

---

## 🙏 Credits

- UI Components: [shadcn/ui](https://ui.shadcn.com/)
- Icons: [Lucide React](https://lucide.dev/)
- Styling: [Tailwind CSS](https://tailwindcss.com/)