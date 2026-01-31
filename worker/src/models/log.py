from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


class LogLevel(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"
    FATAL = "FATAL"


class LogEntry(BaseModel):
    id: str = Field(..., description="Unique log identifier")
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    level: LogLevel = Field(..., description="Log severity level")
    message: str = Field(..., description="Log message content")
    source: str = Field(..., description="Service/component source")
    labels: dict[str, str] = Field(
        default_factory=dict,
        description="Key-value metadata tags",
    )
    metadata: Optional[dict[str, float]] = Field(
        default=None,
        description="Optional numeric metrics (duration, statusCode, etc.)",
    )
    raw: Optional[str] = Field(
        default=None,
        description="Optional raw log line before parsing",
    )
    
    @field_validator("timestamp")
    @classmethod
    def validate_timestamp(cls, v: str) -> str:
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError(f"Invalid ISO 8601 timestamp: {v}")
        return v
    
    @property
    def is_error(self) -> bool:
        return self.level in (LogLevel.ERROR, LogLevel.FATAL)
    
    @property
    def is_warning(self) -> bool:
        return self.level == LogLevel.WARN
    
    @property
    def severity_score(self) -> int:
        return {
            LogLevel.DEBUG: 0,
            LogLevel.INFO: 1,
            LogLevel.WARN: 2,
            LogLevel.ERROR: 3,
            LogLevel.FATAL: 4,
        }.get(self.level, 0)
    
    def to_analysis_context(self) -> str:
        return (
            f"[{self.timestamp}] {self.level.value} {self.source}: "
            f"{self.message[:200]}" 
        )
    
    def __str__(self) -> str:
        return f"LogEntry(id={self.id}, level={self.level.value}, source={self.source})"
    
    def __hash__(self) -> int:
        return hash(self.id)
    
    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, LogEntry):
            return NotImplemented
        return self.id == other.id
