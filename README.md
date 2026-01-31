# Sentinel

> AI-powered log aggregation and anomaly detection platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16+-000000?logo=nextdotjs)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Sentinel is a production-ready log aggregation platform with real-time AI-powered analysis. It ingests logs from multiple sources, detects anomalies using statistical algorithms and LLM-based reasoning, and provides actionable insights through an intuitive web interface.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Viewer      │────▶│   API Gateway   │◄────│  AI Worker      │
│   (Next.js)     │◄────│   (Node.js)     │────▶│   (Python)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                         │
                               ▼                         ▼
                        ┌─────────────┐           ┌─────────────┐
                        │  In-Memory  │           │   Ollama    │
                        │  Log Store  │           │    LLM      │
                        └─────────────┘           └─────────────┘
```

**Three-tier architecture:**

- **API Layer** (`api/`): TypeScript/Express ingestion service with SSE streaming
- **AI Worker** (`worker/`): Python-based analysis engine with anomaly detection and LLM integration
- **Viewer** (`viewer/`): Next.js 16 dashboard with real-time log feeds and AI insights

## Features

### Core Capabilities

- **Real-time Log Ingestion** - HTTP API with structured validation via Zod
- **Live Streaming** - Server-Sent Events (SSE) for sub-second log delivery
- **In-Memory Storage** - High-performance log buffer with configurable retention
- **RESTful API** - Full CRUD operations with pagination and filtering

### AI-Powered Analysis

- **Statistical Anomaly Detection** - Error rate spikes, frequency anomalies, source dominance
- **Pattern Matching** - 20+ regex patterns for authentication, database, network, and memory issues
- **LLM Integration** - Ollama-powered analysis with structured JSON output
- **Smart Prioritization** - Automatically prioritizes errors and critical patterns
- **Contextual Analysis** - Gathers related logs for comprehensive incident understanding

### Frontend Experience

- **Real-time Dashboard** - Live log feed with auto-refresh
- **AI Insights Panel** - Severity scoring, root cause analysis, follow-up actions
- **Advanced Search** - Full-text query with level/source/label filters
- **Log Detail View** - Raw log inspection with metadata and AI analysis
- **Responsive Design** - Tailwind CSS with dark terminal-inspired theme

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+ with pip
- [Ollama](https://ollama.com/) (optional, for AI analysis)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd sentinel

# Install API dependencies
cd api && npm install

# Install Viewer dependencies
cd ../viewer && npm install

# Install Worker dependencies
cd ../worker && pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# API configuration
cd api
cp .env.example .env
# Edit .env with your settings

# Worker configuration
cd ../worker
cp .env.example .env
# Edit .env with your settings
```

### 3. Start Services

```bash
# Terminal 1: Start API
cd api && npm run dev

# Terminal 2: Start Viewer
cd viewer && npm run dev

# Terminal 3: Start AI Worker (optional)
cd worker && python -m src.main
```

The viewer will be available at `http://localhost:3000` and the API at `http://localhost:8000`.

## API Reference

### Log Ingestion

```bash
POST /api/logs
Content-Type: application/json

{
  "message": "Database connection failed",
  "level": "ERROR",
  "source": "payment-service",
  "labels": {
    "environment": "production",
    "region": "us-east-1"
  }
}
```

### Query Logs

```bash
GET /api/logs?level=ERROR&source=payment-service&limit=50
```

### Live Stream

```bash
GET /api/logs/live
Accept: text/event-stream
```

### AI Analysis

```bash
GET /api/logs/:id/analysis          # Get analysis for a log
POST /api/logs/:id/analyze          # Trigger on-demand analysis
GET /api/logs/analysis/critical     # Get critical issues
GET /api/logs/analysis/stats        # Analysis statistics
```

## Configuration

### API Environment Variables

| Variable                    | Default     | Description              |
| --------------------------- | ----------- | ------------------------ |
| `PORT`                      | 8000        | HTTP server port         |
| `NODE_ENV`                  | development | Runtime environment      |
| `MAX_LOGS_IN_MEMORY`        | 10000       | Log retention limit      |
| `SSE_HEARTBEAT_INTERVAL_MS` | 30000       | Keep-alive ping interval |

### Worker Environment Variables

| Variable               | Default                | Description                   |
| ---------------------- | ---------------------- | ----------------------------- |
| `API_BASE_URL`         | http://localhost:8000  | API endpoint                  |
| `OLLAMA_HOST`          | http://localhost:11434 | LLM service URL               |
| `OLLAMA_MODEL`         | llama3.1:8b            | Model for analysis            |
| `ANALYSIS_INTERVAL`    | 60                     | Seconds between analysis runs |
| `BATCH_SIZE`           | 50                     | Logs per batch                |
| `ERROR_RATE_THRESHOLD` | 0.1                    | Anomaly trigger threshold     |

## Project Structure

```
sentinel/
├── api/                    # Node.js/Express API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, logging, errors
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript definitions
│   │   └── validation/     # Zod schemas
│   └── package.json
├── worker/                 # Python AI Worker
│   ├── src/
│   │   ├── services/       # Anomaly detection, LLM, patterns
│   │   ├── models/         # Pydantic data models
│   │   └── utils/          # Logging utilities
│   ├── requirements.txt
│   └── main.py
├── viewer/                 # Next.js Dashboard
│   ├── app/                # App router pages
│   ├── components/         # React components
│   ├── lib/                # Utilities and mock data
│   └── types/              # TypeScript types
└── plans/                  # Architecture documentation
```

## Development

### API Development

```bash
cd api
npm run dev          # Hot reload with tsx
npm run typecheck    # TypeScript validation
npm run build        # Compile to dist/
```

### Worker Development

```bash
cd worker
python -m src.main              # Run worker
LOG_LEVEL=DEBUG python -m src.main  # Verbose logging
```

### Viewer Development

```bash
cd viewer
npm run dev          # Next.js dev server
npm run lint         # ESLint check
npm run build        # Production build
```

## How It Works

### Log Flow

1. **Ingestion** - Logs accepted via REST API with Zod validation
2. **Storage** - In-memory ring buffer with O(1) append
3. **Streaming** - SSE broadcasts to connected viewers
4. **Analysis** - Worker polls pending logs, runs anomaly detection
5. **LLM Processing** - Context-aware prompts sent to Ollama
6. **Insights** - Structured analysis stored back to API

### Anomaly Detection

The worker employs multiple detection strategies:

- **Error Rate Spike** - Triggers when error percentage exceeds threshold
- **Frequency Anomaly** - Detects unusual log volume (2x baseline)
- **Source Dominance** - Flags when single source generates >80% of logs
- **Pattern Matching** - Regex-based detection for known error signatures

### AI Analysis Pipeline

1. Fetch pending logs from API
2. Run statistical anomaly detection
3. Select high-priority logs (errors + anomalies)
4. Build context from related logs
5. Generate structured LLM prompt
6. Parse JSON response with fallback handling
7. Store analysis results

## Tech Stack

| Component   | Technology                           |
| ----------- | ------------------------------------ |
| API         | Node.js 18+, Express 4, TypeScript 5 |
| Validation  | Zod                                  |
| Logging     | Winston                              |
| AI Worker   | Python 3.11+, Pydantic, APScheduler  |
| HTTP Client | httpx                                |
| LLM         | Ollama (local), llama3.1:8b          |
| Viewer      | Next.js 16, React 19, TypeScript     |
| Styling     | Tailwind CSS 4                       |
| UI          | Custom components                    |

## License

MIT License - see [LICENSE](LICENSE) for details.

---

Built for production observability. No fluff, just logs.
