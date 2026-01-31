
from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator

from models.log import LogEntry, LogLevel


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FollowUpType(str, Enum):
    INVESTIGATION = "investigation"
    FIX = "fix"
    MONITOR = "monitor"
    DOCUMENTATION = "documentation"


class FollowUpAction(BaseModel):
    id: str = Field(..., description="Unique action identifier")
    title: str = Field(..., description="Short action title")
    description: str = Field(..., description="Detailed action description")
    priority: Severity = Field(..., description="Action priority level")
    type: FollowUpType = Field(..., description="Type of action")
    
    @classmethod
    def create(
        cls,
        title: str,
        description: str,
        priority: Severity,
        type: FollowUpType,
    ) -> "FollowUpAction":
        return cls(
            id=f"fu-{uuid4().hex[:8]}",
            title=title,
            description=description,
            priority=priority,
            type=type,
        )


class AnomalyType(str, Enum):
    ERROR_SPIKE = "error_spike"
    FREQUENCY_SPIKE = "frequency_spike"
    SOURCE_DOMINANCE = "source_dominance"
    RARE_PATTERN = "rare_pattern"
    TIME_ANOMALY = "time_anomaly"


class AnomalyResult(BaseModel):    
    type: AnomalyType = Field(..., description="Type of anomaly detected")
    score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Anomaly score from 0.0 (normal) to 1.0 (severe)",
    )
    description: str = Field(..., description="Human-readable description")
    affected_logs: list[str] = Field(
        default_factory=list,
        description="List of log IDs affected by this anomaly",
    )
    
    @field_validator("score")
    @classmethod
    def clamp_score(cls, v: float) -> float:
        return max(0.0, min(1.0, v))


class AIAnalysis(BaseModel):

    id: str = Field(..., description="Unique analysis identifier")
    log_id: str = Field(..., description="ID of the analyzed log")
    summary: str = Field(..., description="Brief summary of what happened")
    root_cause: str = Field(..., description="Identified root cause or 'Unknown'")
    severity: Severity = Field(..., description="Severity assessment")
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score from 0.0 to 1.0",
    )
    patterns: list[str] = Field(
        default_factory=list,
        description="Detected patterns (e.g., 'auth_failure', 'db_timeout')",
    )
    related_logs: list[str] = Field(
        default_factory=list,
        description="IDs of related/similar logs",
    )
    follow_ups: list[FollowUpAction] = Field(
        default_factory=list,
        description="Recommended follow-up actions",
    )
    anomaly_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Anomaly detection score",
    )
    created_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z",
        description="ISO 8601 timestamp when analysis was created",
    )
    model_version: str = Field(
        default="llama3.1:8b",
        description="LLM model version used for analysis",
    )
    
    @field_validator("confidence", "anomaly_score")
    @classmethod
    def clamp_scores(cls, v: float) -> float:
        return max(0.0, min(1.0, v))
    
    @classmethod
    def create(
        cls,
        log_id: str,
        summary: str,
        root_cause: str,
        severity: Severity,
        confidence: float,
        patterns: list[str] | None = None,
        related_logs: list[str] | None = None,
        follow_ups: list[FollowUpAction] | None = None,
        anomaly_score: float = 0.0,
        model_version: str = "llama3.1:8b",
    ) -> "AIAnalysis":
        return cls(
            id=f"analysis-{uuid4().hex[:12]}",
            log_id=log_id,
            summary=summary,
            root_cause=root_cause,
            severity=severity,
            confidence=confidence,
            patterns=patterns or [],
            related_logs=related_logs or [],
            follow_ups=follow_ups or [],
            anomaly_score=anomaly_score,
            model_version=model_version,
        )
    
    @property
    def is_high_confidence(self) -> bool:
        return self.confidence >= 0.7
    
    @property
    def is_critical(self) -> bool:
        return self.severity == Severity.CRITICAL
    
    def to_api_response(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "logId": self.log_id,
            "summary": self.summary,
            "rootCause": self.root_cause,
            "severity": self.severity.value,
            "confidence": round(self.confidence * 100),  
            "patterns": self.patterns,
            "relatedLogs": self.related_logs,
            "followUps": [
                {
                    "id": fu.id,
                    "title": fu.title,
                    "description": fu.description,
                    "priority": fu.priority.value,
                    "type": fu.type.value,
                }
                for fu in self.follow_ups
            ],
            "anomalyScore": self.anomaly_score,
            "createdAt": self.created_at,
            "modelVersion": self.model_version,
        }
    
    def __str__(self) -> str:
        return (
            f"AIAnalysis(id={self.id}, log_id={self.log_id}, "
            f"severity={self.severity.value}, confidence={self.confidence:.2f})"
        )
