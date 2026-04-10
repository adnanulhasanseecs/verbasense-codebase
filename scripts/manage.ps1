[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [ValidateSet("start", "stop", "restart", "status")]
  [string]$Command = "status",
  [switch]$InitializeEnv
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$RunDir = Join-Path $RepoRoot ".run"
$BackendPidFile = Join-Path $RunDir "backend.pid"
$FrontendPidFile = Join-Path $RunDir "frontend.pid"
$BackendLog = Join-Path $RunDir "backend.log"
$BackendErrLog = Join-Path $RunDir "backend.err.log"
$FrontendLog = Join-Path $RunDir "frontend.log"
$FrontendErrLog = Join-Path $RunDir "frontend.err.log"

$BackendPort = 8111
$FrontendPort = 3011
$BackendDir = Join-Path $RepoRoot "backend"
$FrontendDir = Join-Path $RepoRoot "frontend"

function Ensure-RunDir {
  if (-not (Test-Path $RunDir)) {
    New-Item -ItemType Directory -Path $RunDir | Out-Null
  }
}

function Read-PidFile([string]$Path) {
  if (-not (Test-Path $Path)) { return $null }
  $raw = Get-Content -Path $Path -Raw -ErrorAction SilentlyContinue
  if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
  $id = 0
  if (-not [int]::TryParse($raw.Trim(), [ref]$id)) { return $null }
  return [int]$id
}

function Write-PidFile([string]$Path, [int]$ProcessId) {
  Set-Content -Path $Path -Value "$ProcessId" -Encoding ascii
}

function Test-PidAlive([int]$ProcessId) {
  if ($ProcessId -le 0) { return $false }
  try {
    Get-Process -Id $ProcessId -ErrorAction Stop | Out-Null
    return $true
  } catch {
    return $false
  }
}

function Stop-FromPidFile([string]$PidFile, [string]$Name) {
  $id = Read-PidFile $PidFile
  if (-not $id) {
    Write-Host "[$Name] no PID file - nothing to stop."
    return
  }
  if (-not (Test-PidAlive $id)) {
    Write-Host "[$Name] PID $id not running - removing stale PID file."
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    return
  }
  try {
    Stop-Process -Id $id -Force -ErrorAction Stop
    Write-Host "[$Name] stopped (PID $id)."
  } catch {
    Write-Warning "[$Name] failed to stop PID ${id}: $_"
  }
  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

function Resolve-Python {
  foreach ($name in @("python", "py")) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Path }
  }
  throw "Python not found on PATH."
}

function Initialize-EnvFiles {
  $be = Join-Path $BackendDir ".env"
  if ((-not (Test-Path $be)) -or $InitializeEnv) {
    @(
      "CORS_ORIGINS=http://localhost:$FrontendPort"
      "MOCK_DELAY=400"
      "MOCK_FAILURE_RATE=0"
    ) | Set-Content -Path $be -Encoding utf8
    Write-Host "Wrote $be"
  }

  $fe = Join-Path $FrontendDir ".env.local"
  if ((-not (Test-Path $fe)) -or $InitializeEnv) {
    "NEXT_PUBLIC_API_URL=http://localhost:$BackendPort" | Set-Content -Path $fe -Encoding utf8
    Write-Host "Wrote $fe"
  }
}

function Start-Backend {
  $existing = Read-PidFile $BackendPidFile
  if ($existing -and (Test-PidAlive $existing)) {
    Write-Warning "Backend already running (PID $existing). Use restart."
    return
  }

  Remove-Item $BackendPidFile -Force -ErrorAction SilentlyContinue
  $py = Resolve-Python
  $env:CORS_ORIGINS = "http://localhost:$FrontendPort"

  $p = Start-Process -FilePath $py `
    -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$BackendPort") `
    -WorkingDirectory $BackendDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $BackendLog `
    -RedirectStandardError $BackendErrLog `
    -PassThru

  Write-PidFile $BackendPidFile $p.Id
  Write-Host "Backend started PID $($p.Id) at http://localhost:$BackendPort"
}

function Start-Frontend {
  $existing = Read-PidFile $FrontendPidFile
  if ($existing -and (Test-PidAlive $existing)) {
    Write-Warning "Frontend already running (PID $existing). Use restart."
    return
  }

  Remove-Item $FrontendPidFile -Force -ErrorAction SilentlyContinue
  $npm = Get-Command "npm.cmd" -ErrorAction SilentlyContinue
  if (-not $npm) { $npm = Get-Command "npm" -ErrorAction SilentlyContinue }
  if (-not $npm) { throw "npm not found on PATH." }

  $env:NEXT_PUBLIC_API_URL = "http://localhost:$BackendPort"

  $p = Start-Process -FilePath $npm.Path `
    -ArgumentList @("run", "dev") `
    -WorkingDirectory $FrontendDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $FrontendLog `
    -RedirectStandardError $FrontendErrLog `
    -PassThru

  Write-PidFile $FrontendPidFile $p.Id
  Write-Host "Frontend started PID $($p.Id) at http://localhost:$FrontendPort"
}

function Show-Status {
  $bid = Read-PidFile $BackendPidFile
  $fid = Read-PidFile $FrontendPidFile
  $btxt = if ($bid -and (Test-PidAlive $bid)) { "RUNNING PID $bid" } else { "stopped" }
  $ftxt = if ($fid -and (Test-PidAlive $fid)) { "RUNNING PID $fid" } else { "stopped" }

  Write-Host ""
  Write-Host "VerbaSense services"
  Write-Host "Backend:  $btxt  http://localhost:$BackendPort"
  Write-Host "Frontend: $ftxt  http://localhost:$FrontendPort"
  Write-Host ""
}

Ensure-RunDir

switch ($Command) {
  "status" { Show-Status }
  "stop" {
    Stop-FromPidFile $FrontendPidFile "frontend"
    Stop-FromPidFile $BackendPidFile "backend"
    Show-Status
  }
  "start" {
    Initialize-EnvFiles
    Start-Backend
    Start-Sleep -Milliseconds 500
    Start-Frontend
    Show-Status
  }
  "restart" {
    Stop-FromPidFile $FrontendPidFile "frontend"
    Stop-FromPidFile $BackendPidFile "backend"
    Start-Sleep -Milliseconds 500
    Initialize-EnvFiles
    Start-Backend
    Start-Sleep -Milliseconds 500
    Start-Frontend
    Show-Status
  }
}

