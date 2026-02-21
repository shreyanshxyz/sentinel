import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    user: process.env.DATABASE_USER || "sentinel",
    password: process.env.DATABASE_PASSWORD || "sentinel_password",
    database: process.env.DATABASE_NAME || "sentinel",
    ssl: process.env.DATABASE_SSL === "true",
  },
  verbose: true,
  strict: true,
});