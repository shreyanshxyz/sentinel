import json
from typing import Any, Optional

import httpx

from config import config
from models.analysis import AIAnalysis
from models.log import LogEntry


class APIClient:
    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = (base_url or config.api_base_url).rstrip("/")
        self.api_key = api_key or config.api_key
        self.timeout = config.api_timeout

        self.client = httpx.AsyncClient(
            timeout=self.timeout,
            headers={
                "Content-Type": "application/json",
                "X-API-Key": self.api_key,
            },
        )

    async def get_pending_logs(self, limit: int = 50) -> list[LogEntry]:
        url = f"{self.base_url}/api/logs/analysis/pending"

        try:
            response = await self.client.get(url, params={"limit": limit})
            response.raise_for_status()

            data = response.json()
            if not data.get("success"):
                raise APIError(f"API returned error: {data.get('error')}")

            logs_data = data.get("data", [])
            return [LogEntry.model_validate(log) for log in logs_data]

        except httpx.HTTPStatusError as e:
            raise APIError(
                f"HTTP error {e.response.status_code}: {e.response.text}"
            ) from e
        except httpx.RequestError as e:
            raise APIError(f"Request failed: {e}") from e
        except Exception as e:
            raise APIError(f"Failed to parse logs: {e}") from e

    async def save_analysis(self, analysis: AIAnalysis) -> bool:
        url = f"{self.base_url}/api/logs/analysis"

        payload = analysis.to_api_response()

        try:
            response = await self.client.post(url, json=payload)
            response.raise_for_status()

            data = response.json()
            if not data.get("success"):
                raise APIError(f"API returned error: {data.get('error')}")

            return True

        except httpx.HTTPStatusError as e:
            raise APIError(
                f"HTTP error {e.response.status_code}: {e.response.text}"
            ) from e
        except httpx.RequestError as e:
            raise APIError(f"Request failed: {e}") from e
        except Exception as e:
            raise APIError(f"Failed to save analysis: {e}") from e

    async def get_log_analysis(self, log_id: str) -> Optional[AIAnalysis]:
        url = f"{self.base_url}/api/logs/{log_id}/analysis"

        try:
            response = await self.client.get(url)

            if response.status_code == 404:
                return None

            response.raise_for_status()

            data = response.json()
            if not data.get("success"):
                raise APIError(f"API returned error: {data.get('error')}")

            analysis_data = data.get("data", {})
            return self._parse_analysis_response(analysis_data)

        except httpx.HTTPStatusError as e:
            raise APIError(
                f"HTTP error {e.response.status_code}: {e.response.text}"
            ) from e
        except httpx.RequestError as e:
            raise APIError(f"Request failed: {e}") from e

    async def trigger_analysis(self, log_id: str) -> dict[str, Any]:
        url = f"{self.base_url}/api/logs/{log_id}/analyze"

        try:
            response = await self.client.post(url)
            response.raise_for_status()

            data = response.json()
            if not data.get("success"):
                raise APIError(f"API returned error: {data.get('error')}")

            return data.get("data", {})

        except httpx.HTTPStatusError as e:
            raise APIError(
                f"HTTP error {e.response.status_code}: {e.response.text}"
            ) from e
        except httpx.RequestError as e:
            raise APIError(f"Request failed: {e}") from e

    async def get_analysis_stats(self) -> dict[str, Any]:
        url = f"{self.base_url}/api/logs/analysis/stats"

        try:
            response = await self.client.get(url)
            response.raise_for_status()

            data = response.json()
            if not data.get("success"):
                raise APIError(f"API returned error: {data.get('error')}")

            return data.get("data", {})

        except httpx.HTTPStatusError as e:
            raise APIError(
                f"HTTP error {e.response.status_code}: {e.response.text}"
            ) from e
        except httpx.RequestError as e:
            raise APIError(f"Request failed: {e}") from e

    async def health_check(self) -> dict[str, Any]:
        url = f"{self.base_url}/api/health"

        try:
            response = await self.client.get(url)
            response.raise_for_status()

            data = response.json()
            return {
                "status": "healthy" if data.get("success") else "unhealthy",
                "api_response": data,
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
            }

    def _parse_analysis_response(self, data: dict[str, Any]) -> AIAnalysis:
        from models.analysis import FollowUpAction, Severity

        follow_ups = []
        for fu_data in data.get("followUps", []):
            try:
                follow_ups.append(
                    FollowUpAction(
                        id=fu_data.get("id", ""),
                        title=fu_data.get("title", ""),
                        description=fu_data.get("description", ""),
                        priority=Severity(fu_data.get("priority", "low")),
                        type=fu_data.get("type", "investigation"),
                    )
                )
            except (ValueError, KeyError):
                continue

        return AIAnalysis(
            id=data.get("id", ""),
            log_id=data.get("logId", ""),
            summary=data.get("summary", ""),
            root_cause=data.get("rootCause", ""),
            severity=Severity(data.get("severity", "low")),
            confidence=data.get("confidence", 0) / 100,
            patterns=data.get("patterns", []),
            related_logs=data.get("relatedLogs", []),
            follow_ups=follow_ups,
            anomaly_score=data.get("anomalyScore", 0),
            created_at=data.get("createdAt", ""),
            model_version=data.get("modelVersion", ""),
        )

    async def close(self) -> None:
        await self.client.aclose()


class APIError(Exception):
    pass
