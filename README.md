# UMMS - Unified Manufacturing Management System

A comprehensive manufacturing management system with inventory tracking, production workflows, sales & billing, and analytics.

## 🏗️ Project Structure

```
umms/
├── backend/          # Node.js + Express + TypeScript + Prisma backend
├── frontend/         # React + Vite + TypeScript frontend
└── package.json      # Root package.json for running both services
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: >= 18.17 (LTS) or >= 20.x
- **PostgreSQL**: Database server
- **npm**: >= 9

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd umms
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies (concurrently)
   npm install

   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**

   **Backend** (`backend/.env`):
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/umms_db"
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key
   ```
   Copy from `backend/.env.example` and update with your values.

   **Frontend** (`frontend/.env`):
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   VITE_MAINTENANCE_MODE=false
   ```
   Copy from `frontend/.env.example` and update if needed.

4. **Set up the database**
   ```bash
   cd backend
   npm run db:generate
   npm run db:push
   # Or for production: npm run db:migrate
   ```

5. **Run the application**
   ```bash
   # From the root directory
   npm run dev          # Run both frontend and backend
   npm run dev:watch    # Run with auto-reload for backend
   ```

   Or run separately:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## 📚 Documentation

- **Backend API**: See `backend/README.md` and API documentation files
- **Frontend Setup**: See `frontend/README.md`

## 🛠️ Available Scripts

### Root Level
- `npm run dev` - Run both frontend and backend
- `npm run dev:watch` - Run with auto-reload
- `npm run build` - Build both projects
- `npm run start` - Run in production mode

### Backend
- `npm run dev` - Start development server
- `npm run dev:watch` - Start with auto-restart
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Create database migrations
- `npm run db:studio` - Open Prisma Studio

### Frontend
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔒 Security Notes

- Never commit `.env` files
- Use strong `JWT_SECRET` in production
- Keep database credentials secure
- Review `.gitignore` to ensure sensitive files are excluded

## 📝 License

[Add your license here]

