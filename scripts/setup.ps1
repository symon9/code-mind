# CodeMind Environment Setup Script for PowerShell
Write-Host "🚀 Setting up environment configuration files for CodeMind..." -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir

$reactEnv = Join-Path $rootDir "desktop\react\.env"
$reactEnvExample = Join-Path $rootDir "desktop\react\.env.example"
$backendEnv = Join-Path $rootDir "backend\.env"
$backendEnvExample = Join-Path $rootDir "backend\.env.example"

if (-not (Test-Path $reactEnv)) {
    if (Test-Path $reactEnvExample) {
        Copy-Item -Path $reactEnvExample -Destination $reactEnv
        Write-Host "✔ Created desktop/react/.env from .env.example" -ForegroundColor Green
    } else {
        Write-Host "✖ Error: desktop/react/.env.example not found" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ desktop/react/.env already exists, skipping" -ForegroundColor Yellow
}

if (-not (Test-Path $backendEnv)) {
    if (Test-Path $backendEnvExample) {
        Copy-Item -Path $backendEnvExample -Destination $backendEnv
        Write-Host "✔ Created backend/.env from .env.example" -ForegroundColor Green
    } else {
        Write-Host "✖ Error: backend/.env.example not found" -ForegroundColor Red
    }
} else {
    Write-Host "ℹ backend/.env already exists, skipping" -ForegroundColor Yellow
}

Write-Host "`n✨ Environment setup complete!" -ForegroundColor Cyan
