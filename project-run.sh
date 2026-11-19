#!/usr/bin/env bash
# Start Sentinel for local development in this terminal.
# Ctrl+C stops every process this script started.
#
#   ./project-run.sh            start and follow logs
#   ./project-run.sh stop
#   ./project-run.sh status
#   ./project-run.sh logs       follow logs without taking ownership
#   ./project-run.sh restart

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$ROOT/.run"
PID_DIR="$RUN_DIR/pids"
LOG_DIR="$RUN_DIR/logs"

SERVICES=(api viewer worker-api worker seeder)
API_PORT="8000"
PORTS=(3000 8000 8080)

DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="sentinel"
DB_USER="sentinel"
DB_PASSWORD="sentinel_password"

RED=$'\033[31m'
GREEN=$'\033[32m'
YELLOW=$'\033[33m'
CYAN=$'\033[36m'
MAGENTA=$'\033[35m'
DIM=$'\033[2m'
RESET=$'\033[0m'

info() { printf '%s==>%s %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '%s!! %s%s\n' "$YELLOW" "$*" "$RESET" >&2; }
error() { printf '%serror:%s %s\n' "$RED" "$RESET" "$*" >&2; }

usage() {
  cat <<EOF
Usage: $(basename "$0") [start|stop|status|logs|restart]

  start     Start API, viewer, worker HTTP API, and worker scheduler.
            Seed sample logs, then post more every minute.
            Follow their logs in this terminal. Ctrl+C stops all of them
            and frees localhost:3000, :8000, and :8080.
  stop      Stop processes started by this script and free those ports.
  status    Show whether those processes are still running.
  logs      Follow logs without stopping services on Ctrl+C.
  restart   Stop, then start.

Postgres is not started or stopped. TimescaleDB is not installed.
EOF
}

ensure_dirs() {
  mkdir -p "$PID_DIR" "$LOG_DIR"
}

env_get() {
  local file="$1" key="$2" default="$3" line
  line="$(grep -E "^${key}=" "$file" 2>/dev/null | tail -n 1 || true)"
  if [[ -z "$line" ]]; then
    printf '%s' "$default"
  else
    printf '%s' "${line#*=}"
  fi
}

ensure_env_files() {
  if [[ ! -f "$ROOT/api/.env" ]]; then
    cp "$ROOT/api/.env.example" "$ROOT/api/.env"
    info "Created api/.env from api/.env.example"
  fi
  if [[ ! -f "$ROOT/worker/.env" ]]; then
    cp "$ROOT/worker/.env.example" "$ROOT/worker/.env"
    info "Created worker/.env from worker/.env.example"
  fi
  if ! grep -q '^GROQ_API_KEY=' "$ROOT/worker/.env"; then
    printf '\nGROQ_API_KEY=\nUSE_GROQ=true\nGROQ_MODEL=openai/gpt-oss-20b\n' >>"$ROOT/worker/.env"
  fi
  if [[ -z "$(env_get "$ROOT/worker/.env" GROQ_API_KEY "")" ]]; then
    warn "GROQ_API_KEY is empty in worker/.env. The dashboard will start; AI analysis will fail until you add a key."
  fi

  DB_HOST="$(env_get "$ROOT/api/.env" DATABASE_HOST "$DB_HOST")"
  DB_PORT="$(env_get "$ROOT/api/.env" DATABASE_PORT "$DB_PORT")"
  DB_NAME="$(env_get "$ROOT/api/.env" DATABASE_NAME "$DB_NAME")"
  DB_USER="$(env_get "$ROOT/api/.env" DATABASE_USER "$DB_USER")"
  DB_PASSWORD="$(env_get "$ROOT/api/.env" DATABASE_PASSWORD "$DB_PASSWORD")"
  API_PORT="$(env_get "$ROOT/api/.env" PORT "$API_PORT")"
}

psql_sentinel() {
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -v ON_ERROR_STOP=1 \
    "$@"
}

print_db_setup() {
  cat >&2 <<EOF

Postgres is reachable, but database "$DB_NAME" as user "$DB_USER" is not ready.
Creating the role needs a superuser. Run:

  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';"
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
  sudo -u postgres psql -d ${DB_NAME} -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
  PGPASSWORD='${DB_PASSWORD}' psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} \\
    -f ${ROOT}/api/src/db/migrations/0001_initial.sql

Then run $(basename "$0") again. This script does not apply the TimescaleDB migration.
EOF
}

try_create_database() {
  if ! sudo -n -u postgres psql -c "SELECT 1" >/dev/null 2>&1; then
    return 1
  fi
  info "Creating Postgres role and database with passwordless sudo"
  sudo -n -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}')\\gexec
SQL
  sudo -n -u postgres psql -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
}

ensure_postgres() {
  if ! command -v psql >/dev/null || ! command -v pg_isready >/dev/null; then
    error "psql and pg_isready are required. Install PostgreSQL client tools."
    exit 1
  fi
  if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; then
    error "Postgres is not accepting connections on ${DB_HOST}:${DB_PORT}."
    error "Start Postgres yourself, then run this script again. It will not start the system service."
    exit 1
  fi

  if ! psql_sentinel -c "SELECT 1" >/dev/null 2>&1; then
    try_create_database || true
  fi
  if ! psql_sentinel -c "SELECT 1" >/dev/null 2>&1; then
    print_db_setup
    exit 1
  fi

  local logs_table
  logs_table="$(psql_sentinel -tAc "SELECT to_regclass('public.logs')")"
  if [[ -z "$logs_table" ]]; then
    info "Applying api/src/db/migrations/0001_initial.sql"
    if ! psql_sentinel -f "$ROOT/api/src/db/migrations/0001_initial.sql"; then
      error "Schema migration failed. If this is the pg_trgm extension, run:"
      error "  sudo -u postgres psql -d ${DB_NAME} -c \"CREATE EXTENSION IF NOT EXISTS pg_trgm;\""
      error "  PGPASSWORD='${DB_PASSWORD}' psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -f ${ROOT}/api/src/db/migrations/0001_initial.sql"
      exit 1
    fi
  fi
}

ensure_node() {
  if ! command -v npm >/dev/null || ! command -v node >/dev/null; then
    error "Node.js 18+ and npm are required."
    exit 1
  fi
  if [[ ! -d "$ROOT/node_modules" || ! -d "$ROOT/api/node_modules" || ! -d "$ROOT/viewer/node_modules" ]]; then
    info "Installing Node dependencies"
    (cd "$ROOT" && npm install)
  fi
}

pick_python() {
  local candidate
  for candidate in python3.12 python3.11 python3.13 python3; do
    if command -v "$candidate" >/dev/null 2>&1; then
      command -v "$candidate"
      return 0
    fi
  done
  return 1
}

ensure_venv() {
  local py venv="$ROOT/worker/venv"
  if [[ -x "$venv/bin/python" ]]; then
    return 0
  fi
  py="$(pick_python)" || {
    error "Python 3.11+ is required for the worker."
    exit 1
  }
  info "Creating worker virtualenv with $py"
  "$py" -m venv "$venv"
  "$venv/bin/pip" install -r "$ROOT/worker/requirements.txt"
}

pidfile() { printf '%s/%s.pid' "$PID_DIR" "$1"; }
logfile() { printf '%s/%s.log' "$LOG_DIR" "$1"; }

is_running() {
  local name="$1" pidfile pid
  pidfile="$(pidfile "$name")"
  [[ -f "$pidfile" ]] || return 1
  pid="$(cat "$pidfile")"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

any_running() {
  local name
  for name in "${SERVICES[@]}"; do
    if is_running "$name"; then
      return 0
    fi
  done
  return 1
}

process_belongs_to_us() {
  local pid="$1" cmd cwd
  cmd="$(ps -p "$pid" -o args= 2>/dev/null || true)"
  cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null || true)"
  [[ "$cmd" == *"$ROOT"* || "$cwd" == "$ROOT"* ]]
}

kill_group() {
  local pid="$1" sig="$2" pgid
  [[ -n "$pid" ]] || return 0
  pgid="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ' || true)"
  # Never signal our own group, or PID 1.
  if [[ -n "$pgid" && "$pgid" != "1" && "$pgid" != "$(ps -o pgid= -p $$ | tr -d ' ')" ]]; then
    kill "-$sig" -- "-$pgid" 2>/dev/null || true
  fi
  kill "-$sig" "$pid" 2>/dev/null || true
}

stop_one() {
  local name="$1" file pid i
  file="$(pidfile "$name")"
  [[ -f "$file" ]] || return 0
  pid="$(cat "$file" 2>/dev/null || true)"
  rm -f "$file"
  if [[ -z "$pid" ]] || ! kill -0 "$pid" 2>/dev/null; then
    return 0
  fi
  info "Stopping $name (pid $pid)"
  kill_group "$pid" TERM
  for i in 1 2 3 4 5 6 7 8 9 10; do
    kill -0 "$pid" 2>/dev/null || return 0
    sleep 0.2
  done
  kill_group "$pid" KILL
}

free_our_ports() {
  local port pid pass ports=("${PORTS[@]}" "$API_PORT")
  for pass in TERM KILL; do
    for port in "${ports[@]}"; do
      while read -r pid; do
        [[ -n "$pid" ]] || continue
        if process_belongs_to_us "$pid"; then
          info "Freeing localhost:${port} (pid ${pid}, ${pass})"
          kill_group "$pid" "$pass"
        fi
      done < <(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
    done
    [[ "$pass" == "TERM" ]] && sleep 0.4
  done
}

stop_all() {
  local name
  for name in seeder worker worker-api viewer api; do
    stop_one "$name"
  done
  free_our_ports
}

start_service() {
  local name="$1" dir="$2"
  shift 2
  if is_running "$name"; then
    warn "$name is already running (pid $(cat "$(pidfile "$name")"))"
    return 0
  fi
  : >"$(logfile "$name")"
  # set -m gives this job its own process group, so Ctrl+C does not hit it
  # and stop can kill npm/tsx/python children with the group.
  (
    cd "$dir"
    exec "$@"
  ) </dev/null >>"$(logfile "$name")" 2>&1 &
  echo $! >"$(pidfile "$name")"
  info "Started $name (pid $!)"
}

wait_for_api() {
  local i
  info "Waiting for API health at http://localhost:8000/api/health"
  for i in $(seq 1 60); do
    if curl -sf "http://localhost:8000/api/health" >/dev/null 2>&1; then
      info "API is healthy"
      return 0
    fi
    if ! is_running api; then
      error "API exited before it became healthy. Last log lines:"
      tail -n 40 "$(logfile api)" >&2 || true
      return 1
    fi
    sleep 0.5
  done
  error "API did not become healthy within 30s. Last log lines:"
  tail -n 40 "$(logfile api)" >&2 || true
  return 1
}

post_log() {
  local level="$1" source="$2" message="$3" code
  code="$(
    curl -sS -o /dev/null -w '%{http_code}' --max-time 10 \
      -X POST "http://127.0.0.1:${API_PORT}/api/logs" \
      -H 'Content-Type: application/json' \
      -d "{\"level\":\"${level}\",\"source\":\"${source}\",\"message\":\"${message}\",\"labels\":{\"environment\":\"development\",\"generator\":\"project-run\"}}"
  )" || code="000"
  if [[ "$code" != "201" ]]; then
    echo "failed to post ${level} ${source} (HTTP ${code})" >&2
    return 1
  fi
  echo "posted ${level} ${source}: ${message}"
}

seed_initial_logs() {
  local failed=0
  info "Seeding sample logs"
  post_log INFO auth-service "User login successful for user_id=42" || failed=1
  post_log INFO payment-service "Payment captured for order ord-1008" || failed=1
  post_log DEBUG api-gateway "Health check passed in 12ms" || failed=1
  post_log WARN inventory-service "Stock below threshold for sku-1042 (remaining=3)" || failed=1
  post_log WARN notifications-service "Email provider rate limit exceeded" || failed=1
  post_log ERROR payment-service "Database connection failed: connection refused" || failed=1
  post_log ERROR auth-service "Authentication failed: invalid credentials for admin" || failed=1
  post_log ERROR checkout-service "Connection timeout calling payment-service" || failed=1
  post_log FATAL worker-service "Out of memory while processing job batch" || failed=1
  return "$failed"
}

seed_tick_logs() {
  local stamp
  stamp="$(date -Iseconds)"
  post_log INFO shipping-service "Shipment created at ${stamp}"
  post_log WARN checkout-service "Slow checkout response at ${stamp}"
  post_log ERROR payment-service "Database connection failed at ${stamp}"
}

start_seeder() {
  seed_initial_logs || warn "Some sample logs failed to post. Is the API up?"
  if is_running seeder; then
    return 0
  fi
  : >"$(logfile seeder)"
  info "Posting 3 more logs every minute"
  set -m
  (
    while true; do
      sleep 60
      seed_tick_logs || true
    done
  ) </dev/null >>"$(logfile seeder)" 2>&1 &
  echo $! >"$(pidfile seeder)"
  set +m
}

start_all() {
  set -m
  start_service api "$ROOT/api" npm run dev
  if ! wait_for_api; then
    stop_all
    exit 1
  fi
  start_service viewer "$ROOT/viewer" npm run dev
  start_service worker-api "$ROOT/worker" "$ROOT/worker/venv/bin/python" src/api_server.py
  start_service worker "$ROOT/worker" "$ROOT/worker/venv/bin/python" src/main.py
  set +m
  start_seeder
}

follow_logs() {
  local files=() name
  for name in "${SERVICES[@]}"; do
    touch "$(logfile "$name")"
    files+=("$(logfile "$name")")
  done
  tail -n 40 -v -F "${files[@]}" | awk -v reset="$RESET" -v dim="$DIM" \
    -v cyan="$CYAN" -v green="$GREEN" -v yellow="$YELLOW" -v magenta="$MAGENTA" '
    BEGIN {
      color["api"] = cyan
      color["viewer"] = green
      color["worker-api"] = yellow
      color["worker"] = magenta
      color["seeder"] = dim
    }
    /^==> / {
      name = $2
      sub(/.*\//, "", name)
      sub(/\.log$/, "", name)
      next
    }
    {
      c = (name in color) ? color[name] : ""
      printf "%s[%s]%s %s\n", c, name, reset, $0
      fflush()
    }
  '
}

cleaned=0
cleanup() {
  if [[ "$cleaned" -eq 1 ]]; then
    return
  fi
  cleaned=1
  # A second Ctrl+C must not abort shutdown before the listeners die.
  trap '' INT TERM
  trap - EXIT
  printf '\n'
  info "Stopping Sentinel and freeing localhost:3000, :8000, :8080..."
  stop_all
  info "Stopped."
}

cmd_start() {
  ensure_dirs
  ensure_env_files
  ensure_postgres
  ensure_node
  ensure_venv
  if any_running; then
    error "Sentinel is already running. Use '$(basename "$0") status', 'logs', or 'stop'."
    exit 1
  fi
  trap cleanup INT TERM EXIT
  start_all
  printf '\n'
  info "Viewer  http://localhost:3000"
  info "API     http://127.0.0.1:${API_PORT}"
  info "Worker  http://localhost:8080"
  info "Sample logs were posted. Three more are posted every minute."
  info "Ctrl+C stops every process this script started."
  printf '%s\n' "${DIM}logs: $LOG_DIR${RESET}"
  printf '\n'
  follow_logs
}

cmd_stop() {
  ensure_dirs
  stop_all
  info "Stopped."
}

cmd_status() {
  ensure_dirs
  local name pid state
  for name in "${SERVICES[@]}"; do
    if is_running "$name"; then
      pid="$(cat "$(pidfile "$name")")"
      state="${GREEN}running${RESET}"
    else
      pid="-"
      state="${DIM}stopped${RESET}"
    fi
    printf '  %-12s %b  pid %s\n' "$name" "$state" "$pid"
  done
}

cmd_logs() {
  ensure_dirs
  if ! any_running; then
    warn "No Sentinel processes are running. Start them with $(basename "$0")"
  fi
  info "Following logs. Ctrl+C detaches and leaves services running."
  follow_logs
}

cmd_restart() {
  ensure_dirs
  stop_all
  cmd_start
}

main() {
  local cmd="${1:-start}"
  case "$cmd" in
    start) cmd_start ;;
    stop) cmd_stop ;;
    status) cmd_status ;;
    logs) cmd_logs ;;
    restart) cmd_restart ;;
    -h|--help|help) usage ;;
    *)
      error "Unknown command: $cmd"
      usage
      exit 1
      ;;
  esac
}

main "$@"
