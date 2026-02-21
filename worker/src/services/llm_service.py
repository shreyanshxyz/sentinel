import json
import re
from typing import Any, Optional

import httpx

from config import config
from models.analysis import AIAnalysis, FollowUpAction, Severity
from models.log import LogEntry, LogLevel
from utils.logger import logger


class LLMService:
    SYSTEM_PROMPT = """You are an expert DevOps engineer and system administrator analyzing system logs.
Your task is to analyze log entries and provide insights in a structured format.

Guidelines:
- Be concise but informative
- Focus on actionable insights
- Identify root causes when possible
- Suggest specific follow-up actions
- Be honest when the cause is unclear

Respond ONLY with valid JSON matching the requested format."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        self.api_key = api_key or config.groq_api_key
        self.model = model or config.groq_model
        self.timeout = timeout or config.ollama_timeout
        self.use_groq = config.use_groq and bool(self.api_key)

        self.client = httpx.AsyncClient(timeout=self.timeout)

    async def analyze_log(
        self,
        log: LogEntry,
        context: list[LogEntry],
        anomaly_score: float = 0.0,
    ) -> AIAnalysis:
        prompt = self._build_prompt(log, context)

        response = await self._call_groq(prompt)

        result = self._parse_response(response, log.id)

        result.anomaly_score = anomaly_score
        result.model_version = self.model

        return result

    async def analyze_stream(
        self,
        log: LogEntry,
        context: list[LogEntry],
    ):
        prompt = self._build_prompt(log, context)
        
        if not self.use_groq:
            raise LLMError("Groq is not configured. Set GROQ_API_KEY environment variable.")

        url = "https://api.groq.com/openai/v1/chat/completions"

        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": config.ollama_temperature,
            "max_tokens": 1024,
            "stream": True,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        try:
            async with self.client.stream("POST", url, json=payload, headers=headers) as response:
                if response.status_code != 200:
                    error_body = await response.aread()
                    error_text = error_body.decode('utf-8')
                    logger.error(f"Groq API error", status_code=response.status_code, error=error_text)
                    raise LLMError(f"Groq API error {response.status_code}: {error_text}")

                full_response = ""
                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line:
                        continue
                    
                    if line.startswith("data: "):
                        line = line[6:]  
                    
                    if not line or line == "[DONE]":
                        continue
                    
                    try:
                        chunk_data = json.loads(line)
                        if chunk_data.get("choices"):
                            delta = chunk_data["choices"][0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                full_response += content
                                yield content
                    except json.JSONDecodeError as e:
                        logger.warning(f"Failed to parse chunk as JSON", line=line[:100], error=str(e))
                        continue
                
                logger.info(f"Groq streaming complete", model=self.model, response_length=len(full_response))

        except httpx.HTTPStatusError as e:
            error_detail = ""
            try:
                error_detail = e.response.text
            except:
                pass
            logger.error(f"Groq HTTP error", status_code=e.response.status_code, error=error_detail)
            raise LLMError(f"Groq HTTP error {e.response.status_code}: {error_detail}") from e
        except httpx.RequestError as e:
            logger.error(f"Failed to connect to Groq", error=str(e))
            raise LLMError(f"Failed to connect to Groq: {e}") from e

    def _build_prompt(self, log: LogEntry, context: list[LogEntry]) -> str:
        context_str = "\n".join(
            f"  - [{ctx.timestamp}] {ctx.level.value} {ctx.source}: {ctx.message[:100]}"
            for ctx in context[:5]
        ) or "  (No recent context available)"

        labels_str = ", ".join(f"{k}={v}" for k, v in log.labels.items()) or "None"

        metadata_str = ", ".join(f"{k}={v}" for k, v in (log.metadata or {}).items()) or "None"

        prompt = f"""Analyze this system log entry:

=== LOG ENTRY ===
ID: {log.id}
Timestamp: {log.timestamp}
Level: {log.level.value}
Source: {log.source}
Message: {log.message}
Labels: {labels_str}
Metadata: {metadata_str}

=== RECENT CONTEXT (Last 5 logs) ===
{context_str}

=== YOUR TASK ===
Provide a detailed analysis of this log entry. Consider:
1. What happened? (brief summary)
2. Why did it happen? (root cause if identifiable)
3. How severe is this? (low/medium/high/critical)
4. What patterns do you see?
5. What should be done next? (follow-up actions)

=== RESPONSE FORMAT ===
Respond with ONLY a JSON object in this exact format:
{{
    "summary": "Brief description of what happened (1-2 sentences)",
    "root_cause": "Likely root cause, or 'Unknown' if not clear",
    "severity": "low|medium|high|critical",
    "confidence": 0.85,
    "patterns": ["pattern1", "pattern2"],
    "recommendations": [
        {{
            "title": "Action title",
            "description": "Detailed action description",
            "priority": "low|medium|high|critical",
            "type": "investigation|fix|monitor|documentation"
        }}
    ]
}}

Confidence should be 0.0-1.0 based on how certain you are.
Provide 1-3 actionable recommendations.
JSON only, no markdown, no explanations outside the JSON."""

        return prompt

    async def _call_groq(self, prompt: str) -> str:
        if not self.use_groq:
            raise LLMError("Groq is not configured. Set GROQ_API_KEY environment variable.")

        url = "https://api.groq.com/openai/v1/chat/completions"

        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": config.ollama_temperature,
            "max_tokens": 1024,
            "stream": False,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        try:
            response = await self.client.post(url, json=payload, headers=headers)
            response.raise_for_status()

            data = response.json()
            return data["choices"][0]["message"]["content"]

        except httpx.HTTPStatusError as e:
            raise LLMError(
                f"Groq HTTP error: {e.response.status_code} - {e.response.text}"
            ) from e
        except httpx.RequestError as e:
            raise LLMError(f"Failed to connect to Groq: {e}") from e
        except json.JSONDecodeError as e:
            raise LLMError(f"Invalid JSON response from Groq: {e}") from e

    def _parse_response(self, response: str, log_id: str) -> AIAnalysis:
        json_str = self._extract_json(response)

        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise LLMError(f"Failed to parse LLM response as JSON: {e}\nResponse: {response[:500]}") from e

        summary = data.get("summary", "No summary provided")
        root_cause = data.get("root_cause", "Unknown")
        severity_str = data.get("severity", "low").lower()
        confidence = float(data.get("confidence", 0.5))
        patterns = data.get("patterns", [])
        recommendations = data.get("recommendations", [])

        try:
            severity = Severity(severity_str)
        except ValueError:
            severity = Severity.LOW

        follow_ups: list[FollowUpAction] = []
        for rec in recommendations[:3]:
            try:
                action = FollowUpAction.create(
                    title=rec.get("title", "Unnamed action"),
                    description=rec.get("description", ""),
                    priority=Severity(rec.get("priority", "low").lower()),
                    type=rec.get("type", "investigation"),
                )
                follow_ups.append(action)
            except (ValueError, KeyError):
                continue

        confidence = max(0.0, min(1.0, confidence))

        return AIAnalysis.create(
            log_id=log_id,
            summary=summary,
            root_cause=root_cause,
            severity=severity,
            confidence=confidence,
            patterns=patterns if isinstance(patterns, list) else [],
            follow_ups=follow_ups,
        )

    def _extract_json(self, text: str) -> str:
        patterns = [
            r"```json\s*(.*?)\s*```",
            r"```\s*(.*?)\s*```",
            r"(\{.*\})",
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                return match.group(1).strip()

        return text.strip()

    async def health_check(self) -> dict[str, Any]:
        if not self.use_groq:
            return {
                "status": "unhealthy",
                "error": "Groq not configured",
                "configured_model": self.model,
            }

        try:
            url = "https://api.groq.com/openai/v1/models"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
            }
            response = await self.client.get(url, headers=headers)
            response.raise_for_status()

            data = response.json()
            models = [m.get("id") for m in data.get("data", {})]

            return {
                "status": "healthy",
                "available_models": models,
                "configured_model": self.model,
                "model_available": self.model in models,
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "configured_model": self.model,
            }

    async def close(self) -> None:
        await self.client.aclose()


class LLMError(Exception):
    pass
