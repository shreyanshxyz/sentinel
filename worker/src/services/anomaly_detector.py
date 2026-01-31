

from collections import Counter
from datetime import datetime
from typing import Optional

from config import config
from models.analysis import AnomalyResult, AnomalyType
from models.log import LogEntry, LogLevel


class AnomalyDetector:
    def __init__(
        self,
        error_threshold: Optional[float] = None,
        baseline_rate: int = 100,
        dominance_threshold: float = 0.8,
    ):
        self.error_threshold = error_threshold or config.error_rate_threshold
        self.baseline_rate = baseline_rate
        self.dominance_threshold = dominance_threshold

    def detect(self, logs: list[LogEntry]) -> list[AnomalyResult]:
        if not logs:
            return []

        anomalies: list[AnomalyResult] = []

        # Run all detection algorithms
        anomalies.extend(self._detect_error_spike(logs))
        anomalies.extend(self._detect_frequency_spike(logs))
        anomalies.extend(self._detect_source_dominance(logs))
        anomalies.extend(self._detect_time_anomalies(logs))

        # Sort by severity (score) descending
        anomalies.sort(key=lambda a: a.score, reverse=True)

        return anomalies

    def _detect_error_spike(self, logs: list[LogEntry]) -> list[AnomalyResult]:

        if not logs:
            return []

        error_logs = [
            log for log in logs if log.level in (LogLevel.ERROR, LogLevel.FATAL)
        ]
        error_rate = len(error_logs) / len(logs)

        if error_rate > self.error_threshold:
            score = min(0.5 + (error_rate - self.error_threshold) * 2, 1.0)

            return [
                AnomalyResult(
                    type=AnomalyType.ERROR_SPIKE,
                    score=score,
                    description=f"Error rate {error_rate:.1%} exceeds threshold of {self.error_threshold:.1%}",
                    affected_logs=[log.id for log in error_logs],
                )
            ]

        return []

    def _detect_frequency_spike(self, logs: list[LogEntry]) -> list[AnomalyResult]:

        current_rate = len(logs)

        if current_rate > self.baseline_rate * 2:
            ratio = current_rate / self.baseline_rate
            score = min(0.5 + (ratio - 2) * 0.1, 1.0)

            return [
                AnomalyResult(
                    type=AnomalyType.FREQUENCY_SPIKE,
                    score=score,
                    description=f"Log volume spike: {current_rate} logs (baseline: {self.baseline_rate})",
                    affected_logs=[log.id for log in logs],
                )
            ]

        return []

    def _detect_source_dominance(self, logs: list[LogEntry]) -> list[AnomalyResult]:

        if not logs:
            return []

        source_counts = Counter(log.source for log in logs)
        total = len(logs)
        anomalies: list[AnomalyResult] = []

        for source, count in source_counts.items():
            ratio = count / total
            if ratio > self.dominance_threshold:
                # Score increases as dominance increases
                score = min(ratio, 1.0)
                affected = [log.id for log in logs if log.source == source]

                anomalies.append(
                    AnomalyResult(
                        type=AnomalyType.SOURCE_DOMINANCE,
                        score=score,
                        description=f"Source '{source}' generates {ratio:.1%} of logs ({count}/{total})",
                        affected_logs=affected,
                    )
                )

        return anomalies

    def _detect_time_anomalies(self, logs: list[LogEntry]) -> list[AnomalyResult]:

        anomalies: list[AnomalyResult] = []

        timestamps: Counter[str] = Counter()
        for log in logs:
            try:
                ts = datetime.fromisoformat(log.timestamp.replace("Z", "+00:00"))
                minute_key = ts.strftime("%Y-%m-%d %H:%M")
                timestamps[minute_key] += 1
            except (ValueError, AttributeError):
                continue

        for minute, count in timestamps.items():
            if count > len(logs) * 0.5 and count > 10:
                affected = [
                    log.id
                    for log in logs
                    if log.timestamp.startswith(minute[:10])
                    and minute[11:16] in log.timestamp
                ]

                anomalies.append(
                    AnomalyResult(
                        type=AnomalyType.TIME_ANOMALY,
                        score=min(count / len(logs), 1.0),
                        description=f"Log burst detected: {count} logs at {minute}",
                        affected_logs=affected,
                    )
                )

        return anomalies

    def calculate_error_rate(self, logs: list[LogEntry]) -> float:

        if not logs:
            return 0.0

        error_count = sum(
            1 for log in logs if log.level in (LogLevel.ERROR, LogLevel.FATAL)
        )
        return error_count / len(logs)

    def get_severity_summary(self, logs: list[LogEntry]) -> dict[str, int]:

        counts: dict[str, int] = {
            "DEBUG": 0,
            "INFO": 0,
            "WARN": 0,
            "ERROR": 0,
            "FATAL": 0,
        }

        for log in logs:
            counts[log.level.value] += 1

        return counts
