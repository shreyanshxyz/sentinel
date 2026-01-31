import re
from dataclasses import dataclass
from typing import Optional

from models.analysis import Severity
from models.log import LogEntry


@dataclass
class Pattern:
    name: str
    regex: re.Pattern
    description: str
    severity: Severity
    category: str


class PatternMatcher:
    PATTERNS: list[Pattern] = [
        Pattern(
            name="auth_failure",
            regex=re.compile(
                r"(authentication failed|login failed|invalid credentials|"
                r"unauthorized|access denied|wrong password|invalid token)",
                re.IGNORECASE,
            ),
            description="Authentication failure detected",
            severity=Severity.HIGH,
            category="auth",
        ),
        Pattern(
            name="auth_success",
            regex=re.compile(
                r"(login successful|authentication successful|user authenticated)",
                re.IGNORECASE,
            ),
            description="Successful authentication",
            severity=Severity.LOW,
            category="auth",
        ),
        Pattern(
            name="brute_force_attempt",
            regex=re.compile(
                r"(multiple failed login|too many attempts|rate limit exceeded|"
                r"account locked|suspicious activity)",
                re.IGNORECASE,
            ),
            description="Possible brute force attack detected",
            severity=Severity.CRITICAL,
            category="auth",
        ),
        Pattern(
            name="database_connection_failed",
            regex=re.compile(
                r"(database connection failed|could not connect to database|"
                r"connection refused|connection timeout|database unreachable)",
                re.IGNORECASE,
            ),
            description="Database connection failure",
            severity=Severity.CRITICAL,
            category="database",
        ),
        Pattern(
            name="database_error",
            regex=re.compile(
                r"(sql error|query failed|database error|constraint violation|"
                r"deadlock|lock timeout|transaction rollback)",
                re.IGNORECASE,
            ),
            description="Database error occurred",
            severity=Severity.HIGH,
            category="database",
        ),
        Pattern(
            name="slow_query",
            regex=re.compile(
                r"(slow query|query took|execution time|long running query|"
                r"query timeout)",
                re.IGNORECASE,
            ),
            description="Slow database query detected",
            severity=Severity.MEDIUM,
            category="database",
        ),
        Pattern(
            name="network_timeout",
            regex=re.compile(
                r"(timeout|timed out|connection timeout|read timeout|"
                r"request timeout|ETIMEDOUT)",
                re.IGNORECASE,
            ),
            description="Network timeout occurred",
            severity=Severity.HIGH,
            category="network",
        ),
        Pattern(
            name="connection_refused",
            regex=re.compile(
                r"(connection refused|ECONNREFUSED|no connection|"
                r"target machine actively refused)",
                re.IGNORECASE,
            ),
            description="Connection refused by target",
            severity=Severity.HIGH,
            category="network",
        ),
        Pattern(
            name="dns_error",
            regex=re.compile(
                r"(dns lookup failed|getaddrinfo|name resolution|"
                r"unknown host|ENOTFOUND)",
                re.IGNORECASE,
            ),
            description="DNS resolution failure",
            severity=Severity.HIGH,
            category="network",
        ),
        Pattern(
            name="ssl_error",
            regex=re.compile(
                r"(ssl error|tls error|certificate|handshake failed|"
                r"certificate verify failed|self signed certificate)",
                re.IGNORECASE,
            ),
            description="SSL/TLS error",
            severity=Severity.HIGH,
            category="network",
        ),
        Pattern(
            name="out_of_memory",
            regex=re.compile(
                r"(out of memory|memory exhausted|cannot allocate memory|"
                r"OOM|heap out of memory|ENOMEM)",
                re.IGNORECASE,
            ),
            description="Out of memory error",
            severity=Severity.CRITICAL,
            category="memory",
        ),
        Pattern(
            name="high_memory_usage",
            regex=re.compile(
                r"(high memory|memory usage|memory consumption|"
                r"memory limit approaching)",
                re.IGNORECASE,
            ),
            description="High memory usage detected",
            severity=Severity.MEDIUM,
            category="memory",
        ),
        Pattern(
            name="disk_full",
            regex=re.compile(
                r"(disk full|no space left|insufficient space|"
                r"write error|ENOSPC)",
                re.IGNORECASE,
            ),
            description="Disk space exhausted",
            severity=Severity.CRITICAL,
            category="storage",
        ),
        Pattern(
            name="exception",
            regex=re.compile(
                r"(exception|traceback|stack trace|error occurred|"
                r"unhandled exception|uncaught)",
                re.IGNORECASE,
            ),
            description="Application exception occurred",
            severity=Severity.HIGH,
            category="application",
        ),
        Pattern(
            name="null_pointer",
            regex=re.compile(
                r"(null pointer|cannot read property|undefined is not|"
                r"NoneType|AttributeError|TypeError)",
                re.IGNORECASE,
            ),
            description="Null pointer or undefined reference",
            severity=Severity.HIGH,
            category="application",
        ),
        Pattern(
            name="deprecation_warning",
            regex=re.compile(
                r"(deprecated|deprecation warning|will be removed|"
                r"legacy|obsolete)",
                re.IGNORECASE,
            ),
            description="Deprecation warning",
            severity=Severity.LOW,
            category="application",
        ),
        Pattern(
            name="external_service_error",
            regex=re.compile(
                r"(external service|third party|upstream|dependency|"
                r"service unavailable|503|502|504)",
                re.IGNORECASE,
            ),
            description="External service error",
            severity=Severity.HIGH,
            category="external",
        ),
        Pattern(
            name="rate_limited",
            regex=re.compile(
                r"(rate limit|too many requests|throttled|429|"
                r"quota exceeded|limit exceeded)",
                re.IGNORECASE,
            ),
            description="Rate limited by external service",
            severity=Severity.MEDIUM,
            category="external",
        ),
        Pattern(
            name="deployment",
            regex=re.compile(
                r"(deployment|deployed|rolling update|new version|"
                r"release|startup|initializing)",
                re.IGNORECASE,
            ),
            description="Deployment or startup event",
            severity=Severity.LOW,
            category="deployment",
        ),
        Pattern(
            name="restart",
            regex=re.compile(
                r"(restart|restarting|reboot|shutdown|stopping|"
                r"service stopped|service started)",
                re.IGNORECASE,
            ),
            description="Service restart event",
            severity=Severity.MEDIUM,
            category="deployment",
        ),
    ]

    def __init__(self):
        self.patterns = self.PATTERNS.copy()

    def match(self, log: LogEntry) -> list[str]:
        matches: list[str] = []

        for pattern in self.patterns:
            if pattern.regex.search(log.message):
                matches.append(pattern.name)

        return matches

    def match_with_details(self, log: LogEntry) -> list[Pattern]:
        return [p for p in self.patterns if p.regex.search(log.message)]

    def get_pattern(self, name: str) -> Optional[Pattern]:
        for pattern in self.patterns:
            if pattern.name == name:
                return pattern
        return None

    def get_patterns_by_category(self, category: str) -> list[Pattern]:
        return [p for p in self.patterns if p.category == category]

    def get_categories(self) -> list[str]:
        return sorted(set(p.category for p in self.patterns))

    def add_pattern(self, pattern: Pattern) -> None:
        self.patterns.append(pattern)

    def analyze_batch(self, logs: list[LogEntry]) -> dict[str, list[str]]:
        results: dict[str, list[str]] = {}
        for log in logs:
            matches = self.match(log)
            if matches:
                results[log.id] = matches
        return results

    def get_pattern_frequency(self, logs: list[LogEntry]) -> dict[str, int]:
        frequency: dict[str, int] = {}
        for log in logs:
            for pattern_name in self.match(log):
                frequency[pattern_name] = frequency.get(pattern_name, 0) + 1
        return frequency
