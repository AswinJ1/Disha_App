# Disha App

A comprehensive task management and productivity tracking application designed for individuals and counselors. Built with Next.js, Material-UI, and Prisma.

## 📋 Overview

Disha App is a mentorship and productivity platform that connects individuals with counselors. It provides tools for task management, time tracking, progress analytics, and AI-powered assistance.

## ✨ Features

### For Individuals
- **Kanban Board** - Drag-and-drop task management with TODO, In Progress, and Done columns
- **Timer Tracking** - Track actual time spent on tasks with persistent timers that survive page navigation
- **Tasks Table View** - Read-only table view for reviewing tasks with pagination
- **Analytics Dashboard** - Visual insights into productivity, completion rates, and time efficiency
- **AI Assistant** - Get personalized productivity tips and task suggestions
- **Leaderboard** - Compare progress with peers under the same counselor
- **Streak Tracking** - Track daily task completion streaks

### For Counselors
- **Dashboard** - Overview of all assigned individuals and their progress
- **Individual Monitoring** - Detailed view of each individual's tasks, activity, and performance
- **Feedback System** - Send encouraging feedback to individuals
- **Leaderboard** - View rankings of all assigned individuals
- **AI Assistant** - Get counseling tips and insights about individuals
- **Reports** - Generate progress reports for individuals

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, Material-UI (MUI) v5
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **AI**: Google Gemini API
- **Charts**: Recharts
- **Notifications**: React Hot Toast

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google Gemini API key (for AI features)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/disha-app.git
   cd disha-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/disha_app"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"

   # Google Gemini AI
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── tasks/              # Task CRUD operations
│   │   ├── ai/                 # AI chat endpoint
│   │   ├── counselor/          # Counselor-specific APIs
│   │   ├── individual/         # Individual-specific APIs
│   │   └── chat-history/       # Chat session management
│   ├── individual/             # Individual user pages
│   │   ├── page.tsx            # Kanban board
│   │   ├── tasks/              # Tasks table view
│   │   ├── analytics/          # Analytics dashboard
│   │   ├── ai-assistant/       # AI chat interface
│   │   └── leaderboard/        # Peer rankings
│   ├── counselor/              # Counselor pages
│   │   ├── page.tsx            # Dashboard
│   │   ├── individual/[id]/    # Individual detail view
│   │   ├── leaderboard/        # Rankings
│   │   └── ai-assistant/       # AI chat interface
│   └── login/                  # Authentication
├── components/                 # Reusable components
├── lib/                        # Utility functions
│   ├── prisma.ts               # Prisma client
│   └── ai.ts                   # AI helpers
└── theme/                      # MUI theme configuration
```

## 🔑 Key Features Explained

### Timer Persistence
The timer uses database-backed persistence:
- Start timestamp is stored in `startedAt` field
- Elapsed time = `currentTime - startedAt + previousActualMinutes`
- Timer survives page navigation and browser refresh
- Time is accumulated (not reset) on restart

### Leaderboard Scoring
Individuals are ranked based on a composite score:
- **Completed Tasks (40%)** - More completed = higher score
- **Time Efficiency (35%)** - Actual time ≤ Estimated time = better
- **Pending Tasks (25%)** - Fewer pending = higher score

### Task Status Flow
```
TODO → IN_PROGRESS → DONE
```

## 🎨 UI Design Principles

- Sharp edges (no rounded corners) for a modern, professional look
- Blue primary color for icons and accents
- Consistent sidebar navigation across all pages
- Responsive design for mobile and desktop

## 📝 API Endpoints

### Tasks
- `GET /api/tasks?date=YYYY-MM-DD` - Fetch tasks for a date
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks` - Update a task
- `DELETE /api/tasks?id=taskId` - Delete a task

### Counselor
- `GET /api/counselor/individuals` - Get assigned individuals
- `GET /api/counselor/leaderboard` - Get leaderboard data
- `GET /api/counselor/individual/[id]/tasks` - Get individual's tasks

### Individual
- `GET /api/individual/leaderboard` - Get peer leaderboard

### AI
- `POST /api/ai/chat` - Send message to AI assistant

## 🔒 Authentication

The app uses NextAuth.js with role-based access:
- **Individual** - Can access individual dashboard, tasks, analytics
- **Counselor** - Can access counselor dashboard, monitor individuals

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker
```bash
docker build -t disha-app .
docker run -p 3000:3000 disha-app
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Abhijith J** - Initial work

## 🙏 Acknowledgments

- Material-UI for the component library
- Next.js team for the amazing framework
- Google Gemini for AI capabilities
