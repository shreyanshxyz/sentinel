import asyncio
from typing import Optional

from config import config
from models.analysis import AIAnalysis, AnomalyResult, FollowUpAction, Severity
from models.log import LogEntry
from services.anomaly_detector import AnomalyDetector
from services.api_client import APIClient
from services.llm_service import LLMService
from services.pattern_matcher import PatternMatcher
from utils.logger import logger


class LogAnalyzer:
    def __init__(
        self,
        api_client: Optional[APIClient] = None,
        llm_service: Optional[LLMService] = None,
        anomaly_detector: Optional[AnomalyDetector] = None,
        pattern_matcher: Optional[PatternMatcher] = None,
    ):
        self.api = api_client or APIClient()
        self.llm = llm_service or LLMService()
        self.detector = anomaly_detector or AnomalyDetector()
        self.matcher = pattern_matcher or PatternMatcher()

        self.analyses_completed = 0
        self.analyses_failed = 0

    async def analyze_batch(self, logs: list[LogEntry]) -> list[AIAnalysis]:
        if not logs:
            logger.debug("No logs to analyze")
            return []

        logger.info(f"Starting analysis of {len(logs)} logs")

        anomalies = self.detector.detect(logs)
        logger.info(f"Detected {len(anomalies)} anomalies")

        logs_to_analyze = self._select_logs_for_analysis(logs, anomalies)
        logger.info(f"Selected {len(logs_to_analyze)} logs for LLM analysis")

        results: list[AIAnalysis] = []

        for log in logs_to_analyze:
            try:
                analysis = await self._analyze_single_log(log, logs, anomalies)
                if analysis:
                    results.append(analysis)
                    self.analyses_completed += 1

                    await asyncio.sleep(0.5)

            except Exception as e:
                logger.error(f"Failed to analyze log {log.id}", error=str(e))
                self.analyses_failed += 1

        logger.info(
            f"Batch analysis complete",
            completed=self.analyses_completed,
            failed=self.analyses_failed,
        )

        return results

    def _select_logs_for_analysis(
        self, logs: list[LogEntry], anomalies: list[AnomalyResult]
    ) -> list[LogEntry]:
        selected_ids: set[str] = set()

        for anomaly in anomalies:
            selected_ids.update(anomaly.affected_logs[:10])

        error_logs = [log for log in logs if log.is_error]
        for log in error_logs[:20]:
            selected_ids.add(log.id)

        for log in logs:
            patterns = self.matcher.match(log)
            critical_patterns = {"out_of_memory", "brute_force_attempt", "database_connection_failed"}
            if any(p in critical_patterns for p in patterns):
                selected_ids.add(log.id)

        selected_logs = [log for log in logs if log.id in selected_ids]

        max_logs = config.max_logs_per_analysis
        if len(selected_logs) > max_logs:
            selected_logs.sort(key=lambda l: l.severity_score, reverse=True)
            selected_logs = selected_logs[:max_logs]

        return selected_logs

    async def _analyze_single_log(
        self,
        log: LogEntry,
        all_logs: list[LogEntry],
        anomalies: list[AnomalyResult],
    ) -> Optional[AIAnalysis]:
        logger.debug(f"Analyzing log {log.id}", level=log.level.value)

        context = self._get_context_logs(log, all_logs)

        anomaly_score = self._calculate_anomaly_score(log, anomalies)

        patterns = self.matcher.match(log)

        try:
            analysis = await self.llm.analyze_log(log, context, anomaly_score)

            analysis.patterns = list(set(analysis.patterns + patterns))

            if len(analysis.follow_ups) < 2:
                pattern_follow_ups = self._generate_follow_ups_from_patterns(patterns)
                analysis.follow_ups.extend(pattern_follow_ups)

            await self.api.save_analysis(analysis)

            logger.info(
                f"Analysis complete for log {log.id}",
                severity=analysis.severity.value,
                confidence=analysis.confidence,
            )

            return analysis

        except Exception as e:
            logger.error(f"LLM analysis failed for log {log.id}", error=str(e))

            return self._create_fallback_analysis(log, patterns, anomaly_score)

    def _get_context_logs(self, target: LogEntry, all_logs: list[LogEntry]) -> list[LogEntry]:
        source_logs = [
            log for log in all_logs
            if log.source == target.source and log.id != target.id
        ]

        try:
            source_logs.sort(
                key=lambda l: l.timestamp,
                reverse=True,
            )
        except Exception:
            pass

        return source_logs[:5]

    def _calculate_anomaly_score(
        self, log: LogEntry, anomalies: list[AnomalyResult]
    ) -> float:
        max_score = 0.0

        for anomaly in anomalies:
            if log.id in anomaly.affected_logs:
                max_score = max(max_score, anomaly.score)

        return max_score

    def _generate_follow_ups_from_patterns(self, patterns: list[str]) -> list[FollowUpAction]:
        follow_ups: list[FollowUpAction] = []

        pattern_actions: dict[str, tuple[str, str, Severity, str]] = {
            "database_connection_failed": (
                "Check Database Connectivity",
                "Verify database server is running and network is accessible",
                Severity.CRITICAL,
                "investigation",
            ),
            "out_of_memory": (
                "Investigate Memory Usage",
                "Check for memory leaks and consider increasing allocation",
                Severity.CRITICAL,
                "investigation",
            ),
            "auth_failure": (
                "Review Authentication Logs",
                "Check for brute force attempts or credential issues",
                Severity.HIGH,
                "investigation",
            ),
            "network_timeout": (
                "Check Network Latency",
                "Verify network connectivity and service response times",
                Severity.HIGH,
                "investigation",
            ),
            "slow_query": (
                "Optimize Database Queries",
                "Review slow query logs and add indexes if needed",
                Severity.MEDIUM,
                "fix",
            ),
        }

        for pattern in patterns:
            if pattern in pattern_actions:
                title, description, priority, action_type = pattern_actions[pattern]
                follow_ups.append(
                    FollowUpAction.create(
                        title=title,
                        description=description,
                        priority=priority,
                        type=action_type,
                    )
                )

        return follow_ups

    def _create_fallback_analysis(
        self,
        log: LogEntry,
        patterns: list[str],
        anomaly_score: float,
    ) -> Optional[AIAnalysis]:
        try:
            severity_map = {
                "DEBUG": Severity.LOW,
                "INFO": Severity.LOW,
                "WARN": Severity.MEDIUM,
                "ERROR": Severity.HIGH,
                "FATAL": Severity.CRITICAL,
            }
            severity = severity_map.get(log.level.value, Severity.LOW)

            summary = f"{log.level.value}: {log.message[:100]}"
            if patterns:
                summary += f" (Patterns: {', '.join(patterns)})"

            follow_ups = self._generate_follow_ups_from_patterns(patterns)

            analysis = AIAnalysis.create(
                log_id=log.id,
                summary=summary,
                root_cause="Analysis failed - based on log level and patterns only",
                severity=severity,
                confidence=0.3,
                patterns=patterns,
                follow_ups=follow_ups,
                anomaly_score=anomaly_score,
            )

            asyncio.create_task(self._store_fallback(analysis))

            return analysis

        except Exception as e:
            logger.error(f"Failed to create fallback analysis", error=str(e))
            return None

    async def _store_fallback(self, analysis: AIAnalysis) -> None:
        try:
            await self.api.save_analysis(analysis)
        except Exception as e:
            logger.error(f"Failed to store fallback analysis", error=str(e))

    async def close(self) -> None:
        await self.api.close()
        await self.llm.close()

    def get_stats(self) -> dict[str, int]:
        return {
            "completed": self.analyses_completed,
            "failed": self.analyses_failed,
            "total": self.analyses_completed + self.analyses_failed,
        }
