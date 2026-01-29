import { LogLevel, LogEntry, LogSource, LogAnalysis } from "@/types/log";

const LOG_LEVELS: LogLevel[] = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"];
const LOG_SOURCES = [
  "api-server",
  "database",
  "auth-service",
  "payment-gateway",
  "web-server",
  "cache",
  "queue-worker",
];
const LOG_MESSAGES = {
  DEBUG: [
    "Cache hit for key: {key}",
    "Database query executed in {time}ms",
    "User session validated: {userId}",
    "API request processed: {method} {endpoint}",
  ],
  INFO: [
    "User login successful: {userId}",
    "Order processed: {orderId}",
    "Payment completed: {transactionId}",
    "Service health check passed",
    "New deployment detected: version {version}",
  ],
  WARN: [
    "Rate limit approaching for user: {userId}",
    "Database connection pool running low",
    "API response time exceeded threshold: {time}ms",
    "Deprecated endpoint accessed: {endpoint}",
  ],
  ERROR: [
    "Database connection failed: {error}",
    "Authentication failed for user: {userId}",
    "Payment processing failed: {transactionId}",
    "API timeout: {endpoint}",
    "File upload failed: {filename}",
  ],
  FATAL: [
    "System out of memory",
    "Database server unreachable",
    "Critical service dependency down",
    "Security breach detected",
    "Data corruption detected",
  ],
};

const LABELS = {
  environment: ["production", "staging", "development"],
  region: ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"],
  service: ["api", "worker", "scheduler", "gateway"],
  team: ["backend", "frontend", "devops", "security"],
};

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTimestamp(agoHours: number = 24): string {
  const now = new Date();
  const hoursAgo = new Date(
    now.getTime() - randomInt(0, agoHours * 60 * 60 * 1000),
  );
  return hoursAgo.toISOString();
}

function interpolateTemplate(template: string): string {
  return template
    .replace(/{key}/g, `user_${randomInt(1000, 9999)}`)
    .replace(/{time}/g, randomInt(10, 500).toString())
    .replace(/{userId}/g, `user_${randomInt(1000, 9999)}`)
    .replace(/{method}/g, randomChoice(["GET", "POST", "PUT", "DELETE"]))
    .replace(
      /{endpoint}/g,
      `/api/v${randomInt(1, 3)}/${randomChoice(["users", "orders", "payments", "products"])}`,
    )
    .replace(/{orderId}/g, `order_${randomInt(10000, 99999)}`)
    .replace(/{transactionId}/g, `txn_${randomInt(100000, 999999)}`)
    .replace(
      /{version}/g,
      `v${randomInt(1, 3)}.${randomInt(0, 9)}.${randomInt(0, 9)}`,
    )
    .replace(
      /{error}/g,
      randomChoice([
        "Connection timeout",
        "Invalid credentials",
        "Resource not found",
      ]),
    )
    .replace(/{filename}/g, `upload_${randomInt(1000, 9999)}.jpg`);
}

export function generateMockLogEntry(override?: Partial<LogEntry>): LogEntry {
  const level = randomChoice(LOG_LEVELS);
  const source = randomChoice(LOG_SOURCES);
  const messageTemplate = randomChoice(LOG_MESSAGES[level]);

  const labels: Record<string, string> = {};
  Object.entries(LABELS).forEach(([key, values]) => {
    if (Math.random() > 0.3) {
      labels[key] = randomChoice(values);
    }
  });

  return {
    id: `log_${Date.now()}_${randomInt(1000, 9999)}`,
    timestamp: randomTimestamp(),
    level,
    message: interpolateTemplate(messageTemplate),
    source,
    labels,
    metadata: {
      threadId: randomInt(1, 8),
      pid: randomInt(1000, 9999),
      serverId: randomInt(1, 10),
    },
    raw: `[${new Date().toISOString()}] ${level} ${source} - ${interpolateTemplate(messageTemplate)}`,
    ...override,
  };
}

export function generateMockLogEntries(count: number): LogEntry[] {
  return Array.from({ length: count }, () => generateMockLogEntry());
}

export function generateMockLogSources(): LogSource[] {
  return LOG_SOURCES.map((name, index) => ({
    id: `source_${index}`,
    name,
    type: randomChoice(["file", "syslog", "api", "database"]),
    status: randomChoice(["active", "inactive", "error"]),
    config: {
      path: `/var/log/${name}.log`,
      format: "json",
    },
    lastSeen: randomTimestamp(1),
  }));
}

export function generateMockLogAnalysis(logId: string): LogAnalysis {
  return {
    id: `analysis_${Date.now()}_${randomInt(1000, 9999)}`,
    logId,
    summary: randomChoice([
      "This appears to be a routine operational message with no immediate concerns.",
      "The log indicates a potential performance issue that should be monitored.",
      "Critical error detected requiring immediate attention.",
      "Authentication failure may indicate attempted unauthorized access.",
      "Database connectivity issue affecting application performance.",
    ]),
    severity: randomChoice(["low", "medium", "high", "critical"]),
    suggestions: [
      "Monitor related logs for patterns",
      "Check system resource utilization",
      "Verify service dependencies",
      "Review recent configuration changes",
    ].slice(0, randomInt(1, 3)),
    relatedLogs: Array.from(
      { length: randomInt(0, 5) },
      () =>
        `log_${Date.now() - randomInt(1000, 100000)}_${randomInt(1000, 9999)}`,
    ),
    patterns: ["authentication", "database", "network", "performance"].slice(
      0,
      randomInt(0, 3),
    ),
    createdAt: new Date().toISOString(),
  };
}
