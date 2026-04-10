#!/usr/bin/env bash
# VerbaSense — start/stop/restart/status for backend (8011) + frontend (3011)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUN="$ROOT/.run"
BACKEND_PID="$RUN/backend.pid"
FRONTEND_PID="$RUN/frontend.pid"
BACKEND_LOG="$RUN/backend.log"
FRONTEND_LOG="$RUN/frontend.log"
BACKEND_PORT="${BACKEND_PORT:-8011}"
FRONTEND_PORT="${FRONTEND_PORT:-3011}"

mkdir -p "$RUN"

read_pid() {
  local f="$1"
  [[ -f "$f" ]] || return 1
  tr -d ' \n' <"$f"
}

alive() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

stop_pidfile() {
  local name="$1" file="$2"
  local pid
  pid="$(read_pid "$file" 2>/dev/null || true)"
  if [[ -z "${pid:-}" ]]; then
    echo "[$name] no PID file — nothing to stop."
    return 0
  fi
  if alive "$pid"; then
    kill "$pid" 2>/dev/null || true
    echo "[$name] stopped (PID $pid)."
  else
    echo "[$name] stale PID — removing."
  fi
  rm -f "$file"
}

init_env() {
  local be="$ROOT/backend/.env"
  local fe="$ROOT/frontend/.env.local"
  if [[ ! -f "$be" ]] || [[ "${INIT_ENV:-}" == "1" ]]; then
    cat >"$be" <<EOF
CORS_ORIGINS=http://localhost:$FRONTEND_PORT
MOCK_DELAY=400
MOCK_FAILURE_RATE=0
EOF
    echo "Wrote $be"
  fi
  if [[ ! -f "$fe" ]] || [[ "${INIT_ENV:-}" == "1" ]]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT" >"$fe"
    echo "Wrote $fe"
  fi
}

start_backend() {
  local pid
  pid="$(read_pid "$BACKEND_PID" 2>/dev/null || true)"
  if [[ -n "${pid:-}" ]] && alive "$pid"; then
    echo "Backend already running (PID $pid). Use: $0 restart" >&2
    return 0
  fi
  rm -f "$BACKEND_PID"
  cd "$ROOT/backend"
  export CORS_ORIGINS="http://localhost:$FRONTEND_PORT"
  nohup python -m uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" \
    >"$BACKEND_LOG" 2>&1 &
  echo $! >"$BACKEND_PID"
  echo "Backend started PID $(cat "$BACKEND_PID") — http://localhost:$BACKEND_PORT"
}

start_frontend() {
  local pid
  pid="$(read_pid "$FRONTEND_PID" 2>/dev/null || true)"
  if [[ -n "${pid:-}" ]] && alive "$pid"; then
    echo "Frontend already running (PID $pid). Use: $0 restart" >&2
    return 0
  fi
  rm -f "$FRONTEND_PID"
  cd "$ROOT/frontend"
  export NEXT_PUBLIC_API_URL="http://localhost:$BACKEND_PORT"
  nohup npx next dev -p "$FRONTEND_PORT" \
    >"$FRONTEND_LOG" 2>&1 &
  echo $! >"$FRONTEND_PID"
  echo "Frontend started PID $(cat "$FRONTEND_PID") — http://localhost:$FRONTEND_PORT"
}

status() {
  local bp fp
  bp="$(read_pid "$BACKEND_PID" 2>/dev/null || true)"
  fp="$(read_pid "$FRONTEND_PID" 2>/dev/null || true)"
  echo ""
  echo "VerbaSense — API $BACKEND_PORT  |  UI $FRONTEND_PORT"
  if [[ -n "${bp:-}" ]] && alive "$bp"; then
    echo "Backend:  RUNNING PID $bp  http://localhost:$BACKEND_PORT"
  else
    echo "Backend:  stopped  http://localhost:$BACKEND_PORT"
  fi
  if [[ -n "${fp:-}" ]] && alive "$fp"; then
    echo "Frontend: RUNNING PID $fp  http://localhost:$FRONTEND_PORT"
  else
    echo "Frontend: stopped  http://localhost:$FRONTEND_PORT"
  fi
  echo ""
}

cmd="${1:-status}"
case "$cmd" in
  status) status ;;
  stop)
    stop_pidfile "frontend" "$FRONTEND_PID"
    stop_pidfile "backend" "$BACKEND_PID"
    status
    ;;
  start)
    init_env
    start_backend
    sleep 0.5
    start_frontend
    status
    ;;
  restart)
    stop_pidfile "frontend" "$FRONTEND_PID"
    stop_pidfile "backend" "$BACKEND_PID"
    sleep 0.5
    init_env
    start_backend
    sleep 0.5
    start_frontend
    status
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}" >&2
    exit 1
    ;;
esac
