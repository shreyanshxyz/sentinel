import asyncio
import json
import re
from typing import AsyncGenerator

from config import config
from models.analysis import AIAnalysis, Severity
from models.log import LogEntry
from services.api_client import APIClient
from services.anomaly_detector import AnomalyDetector
from services.llm_service import LLMService
from services.pattern_matcher import PatternMatcher
from utils.logger import logger


app = None
try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import StreamingResponse

    app = FastAPI(title="Sentinel Worker API")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:8000",
            "https://sentinel-one-beta.vercel.app",
            "https://sentinel-tb6f.onrender.com",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    logger.warning("FastAPI not installed. Install with: pip install fastapi uvicorn")


api_client = APIClient()
llm_service = LLMService()
detector = AnomalyDetector()
matcher = PatternMatcher()


@app.get("/health")
async def health_check():
    if not app:
        return {"error": "FastAPI not available"}

    return {
        "status": "healthy",
        "service": "sentinel-worker-api",
        "port": config.worker_http_port,
        "model": config.groq_model,
        "provider": "groq" if config.use_groq else "ollama"
    }


@app.post("/process-now")
async def process_now(data: dict):
    if not app:
        return {"error": "FastAPI not available"}, 500

    try:
        log_id = data.get("logId")
        if not log_id:
            return {"error": "logId is required"}, 400

        log = await api_client.get_log(log_id)
        if not log:
            return {"error": f"Log {log_id} not found"}, 404

        recent_logs = await api_client.get_recent_logs(limit=20)

        return StreamingResponse(
            stream_response(log, recent_logs),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )

    except Exception as e:
        logger.error(f"process-now failed for log", error=str(e))
        return {"error": str(e)}, 500


def parse_llm_response(response: str) -> dict:
    try:
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
    except json.JSONDecodeError:
        pass
    return {}


async def stream_response(
    log: LogEntry,
    all_logs: list[LogEntry]
) -> AsyncGenerator[str, None]:

    try:
        yield format_sse_event({"type": "start", "logId": log.id})

        anomalies = detector.detect([log] + all_logs[:20])
        patterns = matcher.match(log)

        full_response = ""
        async for chunk in llm_service.analyze_stream(log, all_logs):
            logger.debug(f"LLM chunk received", chunk_preview=chunk[:100] if chunk else "")
            full_response += chunk
            yield format_sse_event({
                "type": "chunk",
                "content": chunk,
                "done": False
            })

        logger.info(f"LLM analysis complete", log_id=log.id, response_length=len(full_response))

        parsed = parse_llm_response(full_response)

        summary = parsed.get("summary", "Analysis completed")
        root_cause = parsed.get("root_cause", "Unknown - analysis complete")
        severity_str = parsed.get("severity", "low").lower()
        confidence = float(parsed.get("confidence", 0.7))
        llm_patterns = parsed.get("patterns", [])
        recommendations = parsed.get("recommendations", [])

        try:
            severity = Severity(severity_str)
        except ValueError:
            severity = determine_severity(log, full_response, anomalies)

        follow_ups = []
        for rec in recommendations[:3]:
            try:
                priority_str = rec.get("priority", "low").lower()
                try:
                    priority = Severity(priority_str)
                except ValueError:
                    priority = Severity.LOW
                follow_ups.append({
                    "id": f"followup-{len(follow_ups)}",
                    "title": rec.get("title", "Follow-up action"),
                    "description": rec.get("description", ""),
                    "priority": priority.value,
                    "type": rec.get("type", "investigation"),
                    "status": "pending",
                    "createdAt": log.timestamp
                })
            except Exception:
                continue

        all_patterns = list(set(patterns + llm_patterns))

        yield format_sse_event({
            "type": "analysis",
            "analysis": {
                "summary": summary,
                "rootCause": root_cause,
                "severity": severity.value,
                "confidence": confidence,
                "patterns": all_patterns,
                "relatedLogs": [],
                "followUps": follow_ups,
                "anomalyScore": max([a.score for a in anomalies] or [0]),
                "modelVersion": config.groq_model,
                "status": "completed"
            },
            "done": True
        })

    except Exception as e:
        logger.error(f"Streaming analysis failed for log {log.id}", error=str(e))
        yield format_sse_event({
            "type": "error",
            "error": str(e),
            "done": True
        })


def format_sse_event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def extract_root_cause(summary: str) -> str:
    if "connection" in summary.lower() and "failed" in summary.lower():
        return "Connection failure or network issue"
    elif "timeout" in summary.lower():
        return "Operation timeout"
    elif "memory" in summary.lower():
        return "Memory-related issue"
    elif "database" in summary.lower() and "error" in summary.lower():
        return "Database error"
    return "Unknown - analysis complete"


def determine_severity(log: LogEntry, summary: str, anomalies: list) -> Severity:

    if log.level.value in ["ERROR", "FATAL"]:
        return Severity.HIGH if anomalies else Severity.MEDIUM
    elif log.level.value == "WARN":
        return Severity.MEDIUM if anomalies else Severity.LOW
    return Severity.LOW


def start_server():
    if not app:
        logger.error("Cannot start server - FastAPI not available")
        return

    try:
        import uvicorn
    except ImportError:
        logger.error("uvicorn not installed. Install with: pip install uvicorn")
        return

    logger.info(f"Starting Worker HTTP API on port {config.worker_http_port}")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=config.worker_http_port,
        log_level="info"
    )


if __name__ == "__main__":
    start_server()
