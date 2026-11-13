import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Use the WebSocket-based serverless driver (not neon-http): it supports
// interactive transactions (db.transaction), which are required for
// ticket-quota safety, payment-webhook idempotency, and multi-statement
// admin operations. The neon-http driver throws "No transactions support".
neonConfig.webSocketConstructor = ws;

// Reuse a single pool across hot reloads in development to avoid exhausting
// connections.
const globalForDb = globalThis as unknown as { __dbPool?: Pool };

const pool =
  globalForDb.__dbPool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__dbPool = pool;
}

export const db = drizzle(pool, { schema });

export type Database = typeof db;
