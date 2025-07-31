# JCU Gym Management System Starter
$Host.UI.RawUI.WindowTitle = "JCU Gym Management System"

Write-Host "Starting JCU Gym Management System..."
Write-Host "================================================"

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js version: $nodeVersion"
} catch {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "[OK] npm version: $npmVersion"
} catch {
    Write-Host "[ERROR] npm is not installed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Create .env.local if it doesn't exist
if (-not (Test-Path ".env.local")) {
    Write-Host "[INFO] Creating .env.local file..." -ForegroundColor Yellow
    @"
DATABASE_URL=postgres://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require
JWT_SECRET=jcu-gym-management-jwt-secret-change-in-production
"@ | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "[OK] Created .env.local file" -ForegroundColor Green
    Write-Host "[INFO] Please update DATABASE_URL in .env.local with your Neon credentials" -ForegroundColor Yellow
    Write-Host "[INFO] After updating DATABASE_URL, run: node scripts\setup-schema.js" -ForegroundColor Cyan
}

# Start the server
Write-Host "`n[INFO] Starting development server..." -ForegroundColor Yellow
Write-Host "[INFO] Server will be available at: http://localhost:3000`n"

Write-Host "Login Credentials:`n"

Write-Host "Press Ctrl+C to stop the server"
Write-Host "================================================`n"

# Run the development server
npm run dev

# Check if server failed to start
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Failed to start server" -ForegroundColor Red
    Write-Host "Try these solutions:"
    Write-Host "1. Make sure port 3000 is not in use"
    Write-Host "2. Try running: npm run dev -- --port 3001"
    Write-Host "3. Check for error messages above"
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "Press Enter to exit" 