import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Neon HTTP driver: fast, reliable single-shot queries over HTTP. It does not
// support interactive transactions (db.transaction), and the WebSocket-based
// serverless driver fails when bundled here (ws frame-masking breaks), so flows
// that need atomicity use db.batch([...]) instead — a single HTTP transaction.
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
