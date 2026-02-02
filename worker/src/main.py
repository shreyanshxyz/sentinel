#!/usr/bin/env python3

import asyncio
import signal
import sys
from typing import Any

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from analyzer import LogAnalyzer
from config import config
from utils.logger import logger


class AIWorker:
    def __init__(self):
        self.analyzer: LogAnalyzer | None = None
        self.scheduler: AsyncIOScheduler | None = None
        self.running = False

        self.jobs_completed = 0
        self.jobs_failed = 0

    async def initialize(self) -> bool:
        logger.info("Initializing AI Worker", config=str(config))

        try:
            self.analyzer = LogAnalyzer()

            api_health = await self.analyzer.api.health_check()
            if api_health.get("status") != "healthy":
                logger.error("API is not healthy", health=api_health)
                return False

            logger.info("API connection established", health=api_health)

            llm_health = await self.analyzer.llm.health_check()
            if llm_health.get("status") != "healthy":
                logger.warning(
                    "Ollama is not available - analyses will use fallback mode",
                    health=llm_health,
                )
            else:
                logger.info(
                    "Ollama connection established",
                    model=config.ollama_model,
                    available_models=llm_health.get("available_models", []),
                )

            self.scheduler = AsyncIOScheduler()

            logger.info("AI Worker initialized successfully")
            return True

        except Exception as e:
            logger.error("Failed to initialize AI Worker", error=str(e))
            return False

    async def analysis_job(self) -> None:
        if not self.analyzer:
            logger.error("Analyzer not initialized")
            return

        job_id = self.jobs_completed + self.jobs_failed + 1
        logger.info(f"Starting analysis job #{job_id}")

        try:
            logs = await self.analyzer.api.get_pending_logs(limit=config.batch_size)

            if not logs:
                logger.info(f"Job #{job_id}: No pending logs to analyze")
                return

            logger.info(f"Job #{job_id}: Fetched {len(logs)} logs for analysis", log_ids=[log.id for log in logs])

            results = await self.analyzer.analyze_batch(logs)

            logger.info(
                f"Analysis job #{job_id} complete",
                logs_processed=len(logs),
                analyses_completed=len(results),
                stats=self.analyzer.get_stats(),
            )

            self.jobs_completed += 1

        except Exception as e:
            logger.error(f"Analysis job #{job_id} failed", error=str(e))
            self.jobs_failed += 1

    async def start(self) -> None:
        if not self.scheduler:
            logger.error("Worker not initialized")
            sys.exit(1)

        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

        self.scheduler.add_job(
            self.analysis_job,
            trigger=IntervalTrigger(seconds=config.analysis_interval),
            id="analysis_job",
            replace_existing=True,
            max_instances=1,
        )

        self.scheduler.start()
        self.running = True

        logger.info(
            "AI Worker started",
            interval_seconds=config.analysis_interval,
            batch_size=config.batch_size,
        )

        try:
            while self.running:
                await asyncio.sleep(1)
        except (KeyboardInterrupt, SystemExit):
            self.stop()

    def stop(self) -> None:
        logger.info("Stopping AI Worker...")
        self.running = False

        if self.scheduler:
            self.scheduler.shutdown(wait=True)

        if self.analyzer:
            asyncio.create_task(self.analyzer.close())

        logger.info(
            "AI Worker stopped",
            jobs_completed=self.jobs_completed,
            jobs_failed=self.jobs_failed,
        )

    def _signal_handler(self, signum: int, _frame: Any) -> None:
        signal_name = signal.Signals(signum).name
        logger.info(f"Received {signal_name}, shutting down...")
        self.stop()
        sys.exit(0)

    def get_status(self) -> dict[str, Any]:
        return {
            "running": self.running,
            "jobs_completed": self.jobs_completed,
            "jobs_failed": self.jobs_failed,
            "scheduler_running": self.scheduler.running if self.scheduler else False,
            "analyzer_stats": self.analyzer.get_stats() if self.analyzer else {},
        }


async def main() -> int:
    worker = AIWorker()

    if not await worker.initialize():
        logger.error("Failed to initialize worker")
        return 1

    await worker.start()

    return 0


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except Exception as e:
        logger.error("Fatal error", error=str(e))
        sys.exit(1)
