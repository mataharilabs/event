import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Transaction-capable connection. The neon-http driver (see "@/db") cannot run
// interactive transactions, so the few flows that need them — ticket-quota
// safety, payment-webhook idempotency, multi-statement admin operations — use
// this WebSocket-based serverless Pool instead.
//
// poolQueryViaFetch routes non-transactional pool queries over HTTP(fetch)
// rather than opening a WebSocket, keeping WebSocket use limited to actual
// transactions.
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const globalForPool = globalThis as unknown as { __txPool?: Pool };

const pool =
  globalForPool.__txPool ?? new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForPool.__txPool = pool;
}

// Use only for db.transaction(...). For regular queries, import `db` from "@/db".
export const txDb = drizzle(pool, { schema });
