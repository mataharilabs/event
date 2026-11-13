import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Default connection uses the Neon HTTP driver: fast, reliable single-shot
// queries for the vast majority of reads/writes. It does NOT support interactive
// transactions — for those, use `txDb` from "@/db/pool".
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
