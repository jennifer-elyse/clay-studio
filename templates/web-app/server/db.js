import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {PGlite | null} */
let db = null;

export async function openDb() {
  if (db) return db;
  const dataDir = process.env.CLAY_PGLITE_DIR || path.join(here, "..", ".clay", "pglite");
  db = new PGlite(dataDir);
  const schema = await fs.readFile(path.join(here, "schema.sql"), "utf8");
  await db.exec(schema);
  return db;
}

/**
 * @param {import("@electric-sql/pglite").Row} row
 */
export function mapRequest(row) {
  return {
    id: String(row.id),
    title: String(row.title),
    detail: String(row.detail),
    status: String(row.status),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}
