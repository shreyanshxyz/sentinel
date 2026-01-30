import { Response } from "express";
import { LogEntry } from "../types/log.types.js";
import { StreamResponse } from "../types/api.types.js";
import { appConfig } from "../config/index.js";
import { logger } from "../utils/logger.js";

interface ClientConnection {
  id: string;
  response: Response;
  connectedAt: number;
}

class StreamService {
  private clients: Map<string, ClientConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  start(): void {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      this.broadcastHeartbeat();
    }, appConfig.log.sseHeartbeatIntervalMs);

    logger.info("Stream service started");
  }

  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.clients.forEach((client) => {
      this.removeClient(client.id);
    });

    logger.info("Stream service stopped");
  }

  addClient(response: Response): string {
    const id = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const client: ClientConnection = {
      id,
      response,
      connectedAt: Date.now(),
    };

    this.clients.set(id, client);

    this.sendToClient(id, {
      type: "status",
      data: "connected",
      timestamp: new Date().toISOString(),
    });

    response.on("close", () => {
      this.removeClient(id);
    });

    response.on("error", (err) => {
      logger.error("SSE client error", { clientId: id, error: err.message });
      this.removeClient(id);
    });

    logger.debug("Client connected", {
      clientId: id,
      totalClients: this.clients.size,
    });

    return id;
  }

  removeClient(id: string): void {
    const client = this.clients.get(id);
    if (client) {
      this.clients.delete(id);
      client.response.end();
      logger.debug("Client disconnected", {
        clientId: id,
        totalClients: this.clients.size,
      });
    }
  }

  broadcastLog(log: LogEntry): void {
    const message: StreamResponse = {
      type: "log",
      data: log,
      timestamp: new Date().toISOString(),
    };
    this.broadcast(message);
  }

  private broadcastHeartbeat(): void {
    const message: StreamResponse = {
      type: "heartbeat",
      data: "ping",
      timestamp: new Date().toISOString(),
    };
    this.broadcast(message);
  }

  private broadcast(message: StreamResponse): void {
    const data = `event: ${message.type}\ndata: ${JSON.stringify(message)}\n\n`;

    this.clients.forEach((client) => {
      try {
        client.response.write(data);
      } catch (err) {
        logger.error("Failed to send to client", {
          clientId: client.id,
          error: err instanceof Error ? err.message : String(err),
        });
        this.removeClient(client.id);
      }
    });
  }

  private sendToClient(clientId: string, message: StreamResponse): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const data = `event: ${message.type}\ndata: ${JSON.stringify(message)}\n\n`;
      client.response.write(data);
    } catch (err) {
      logger.error("Failed to send to client", {
        clientId,
        error: err instanceof Error ? err.message : String(err),
      });
      this.removeClient(clientId);
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const streamService = new StreamService();
