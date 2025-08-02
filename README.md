# 🏋️‍♂️ JCU Gym Management System

A web application for managing gym bookings at James Cook University Singapore.

## Requirements
- **Node.js** - Download from [https://nodejs.org](https://nodejs.org)
- **PostgreSQL (psql)** - Download from [https://www.postgresql.org/download/](https://www.postgresql.org/download/)

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
Run this command to create the database tables:
```bash
node scripts/setup-schema.js
```

### 6. Start Application
Run the setup script again:
**Windows:** Run `./start.ps1`
**Linux/Mac:** Run `./start.sh`

### 7. Access Application
Open browser: http://localhost:3000
