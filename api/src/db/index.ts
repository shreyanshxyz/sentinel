import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";
import { appConfig } from "../config/index.js";
import { logger } from "../utils/logger.js";

const pool = new Pool({
  host: appConfig.database.host,
  port: appConfig.database.port,
  user: appConfig.database.user,
  password: appConfig.database.password,
  database: appConfig.database.name,
  max: appConfig.database.maxConnections,
  ssl: appConfig.database.ssl ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  logger.error("Unexpected database pool error", { error: err.message });
});

export const db = drizzle(pool, { schema });

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Database connection check failed", { error: message });
    return false;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
  logger.info("Database connection pool closed");
}

export { pool };
