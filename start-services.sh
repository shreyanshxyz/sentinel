#!/bin/bash


RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' 

PID_DIR="/tmp/sentinel-pids"

mkdir -p "$PID_DIR"

cleanup() {
    echo -e "${YELLOW}Cleaning up all sentinel processes...${NC}"
    for pidfile in "$PID_DIR"/*.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile")
            if kill -0 "$pid" 2>/dev/null; then
                kill -TERM "$pid" 2>/dev/null
                echo -e "${GREEN}Killed process $pid${NC}"
            fi
            rm -f "$pidfile"
        fi
    done
    exit 0
}

trap cleanup SIGINT SIGTERM

case "$1" in
    start)
        echo -e "${GREEN}Starting Sentinel services...${NC}"

        echo -e "${YELLOW}Starting API server on port 8000...${NC}"
        cd /home/shreyanshxyz/Dev/sentinel/api && npm run dev &
        echo $! > "$PID_DIR/api.pid"
        sleep 3

        echo -e "${YELLOW}Starting Worker HTTP API on port 8080...${NC}"
        cd /home/shreyanshxyz/Dev/sentinel/worker && source venv/bin/activate && python src/api_server.py &
        echo $! > "$PID_DIR/worker-api.pid"
        sleep 2

        echo -e "${YELLOW}Starting Worker Scheduler...${NC}"
        cd /home/shreyanshxyz/Dev/sentinel/worker && source venv/bin/activate && python src/main.py &
        echo $! > "$PID_DIR/worker-scheduler.pid"
        sleep 2

        echo -e "${YELLOW}Starting Viewer on port 3000...${NC}"
        cd /home/shreyanshxyz/Dev/sentinel/viewer && npm run dev &
        echo $! > "$PID_DIR/viewer.pid"
        sleep 5

        echo -e "${GREEN}All services started!${NC}"
        echo "PIDs saved to $PID_DIR/"
        echo ""
        echo "Services:"
        echo "  API:         http://localhost:8000"
        echo "  Worker API:  http://localhost:8080"
        echo "  Viewer:      http://localhost:3000"
        ;;
    
    stop)
        cleanup
        echo -e "${GREEN}All services stopped.${NC}"
        ;;
    
    status)
        echo -e "${GREEN}Sentinel Services Status:${NC}"
        for pidfile in "$PID_DIR"/*.pid; do
            if [ -f "$pidfile" ]; then
                name=$(basename "$pidfile" .pid)
                pid=$(cat "$pidfile")
                if kill -0 "$pid" 2>/dev/null; then
                    echo -e "  ${GREEN}$name: PID $pid (running)${NC}"
                else
                    echo -e "  ${RED}$name: PID $pid (not running)${NC}"
                fi
            else
                echo -e "  ${YELLOW}$name: not started${NC}"
            fi
        done
        ;;
    
    *)
        echo "Usage: $0 {start|stop|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all services"
        echo "  stop    - Stop all services"
        echo "  status  - Show service status"
        exit 1
        ;;
esac
