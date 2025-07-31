# 🏋️‍♂️ JCU Gym Management System

A web application for managing gym bookings at James Cook University Singapore.

## Requirements
- **Node.js** - Download from [https://nodejs.org](https://nodejs.org)
- **PostgreSQL (psql)** - Optional, for manual schema setup. Download from [https://www.postgresql.org/download/](https://www.postgresql.org/download/)

## Quick Setup

### 1. Install Node.js
Download and install Node.js from [https://nodejs.org](https://nodejs.org)

### 2. Setup Database
- Sign up at [https://neon.tech](https://neon.tech) (free)
- Create new project
- Copy the database URL

### 3. Run Setup Script First
**Windows:** Run `./start.ps1`
**Linux/Mac:** Run `./start.sh`

This will create the `.env.local` file for you.

### 4. Configure Environment
- Open the `.env.local` file (created after step 3)
- Put your database URL in `DATABASE_URL=` line

### 5. Setup Database Schema
You have two options to create the database tables:

**Option A: Using Node.js Script (Recommended)**
```bash
node scripts/setup-schema.js
```

**Option B: Using psql (if you have PostgreSQL installed)**
```bash
psql "your_copied_neon_database_url" -f neon-schema.sql
```

The Node.js script will:
- ✅ Test your database connection
- ✅ Create all required tables
- ✅ Set up indexes and functions
- ✅ Display confirmation of created tables

### 6. Start Application
Run the setup script again:
**Windows:** Run `./start.ps1`
**Linux/Mac:** Run `./start.sh`

### 7. Access Application
Open browser: http://localhost:3000

## Login Accounts
- **Admin:** admin@my.jcu.edu.au / admin123
- **Student:** demo@my.jcu.edu.au / demo123 