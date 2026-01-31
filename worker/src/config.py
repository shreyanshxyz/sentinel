from pathlib import Path
from typing import Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  
    )
    
    api_base_url: str = Field(
        default="http://localhost:8000",
        description="Base URL for the Sentinel API backend",
    )
    api_key: str = Field(
        default="worker-secret-key",
        description="API key for authenticating with the backend",
    )
    api_timeout: int = Field(
        default=30,
        description="HTTP request timeout in seconds",
    )
    
    ollama_host: str = Field(
        default="http://localhost:11434",
        description="Ollama server host URL",
    )
    ollama_model: str = Field(
        default="llama3.1:8b",
        description="Model name to use for analysis (must be pulled in Ollama)",
    )
    ollama_timeout: int = Field(
        default=120,
        description="LLM request timeout in seconds",
    )
    ollama_temperature: float = Field(
        default=0.1,
        description="Temperature for LLM generation (0.0 = deterministic, 1.0 = creative)",
    )
    
    analysis_interval: int = Field(
        default=60,
        description="Seconds between analysis runs",
    )
    batch_size: int = Field(
        default=50,
        description="Maximum number of logs to process per batch",
    )
    error_rate_threshold: float = Field(
        default=0.1,
        description="Error rate threshold for anomaly detection (0.1 = 10%)",
    )
    min_confidence: float = Field(
        default=0.7,
        description="Minimum confidence score to accept LLM analysis",
    )
    max_logs_per_analysis: int = Field(
        default=5,
        description="Maximum number of logs to analyze per batch (to avoid overwhelming LLM)",
    )
    
    data_dir: Path = Field(
        default=Path("./data"),
        description="Directory for storing analysis data and logs",
    )
    
    log_level: str = Field(
        default="INFO",
        description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)",
    )
    log_format: str = Field(
        default="json",
        description="Log format (json or console)",
    )
    
    @field_validator("data_dir", mode="before")
    @classmethod
    def ensure_path(cls, v: str | Path) -> Path:
        path = Path(v) if isinstance(v, str) else v
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        v_upper = v.upper()
        if v_upper not in allowed:
            raise ValueError(f"log_level must be one of {allowed}, got {v}")
        return v_upper
    
    @property
    def api_headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
        }
    
    @property
    def ollama_generate_url(self) -> str:
        return f"{self.ollama_host}/api/generate"
    
    def __str__(self) -> str:
        return (
            f"Config(api_base_url={self.api_base_url}, "
            f"ollama_host={self.ollama_host}, "
            f"ollama_model={self.ollama_model}, "
            f"analysis_interval={self.analysis_interval}s, "
            f"batch_size={self.batch_size})"
        )


config = Config()
