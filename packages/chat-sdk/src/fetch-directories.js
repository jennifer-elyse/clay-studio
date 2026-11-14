import { z } from "zod";

const DirectoryEntry = z.object({
  name: z.string(),
  path: z.string(),
  project: z.boolean().optional(),
});

export const DirectoryListingSchema = z.object({
  path: z.string(),
  label: z.string().optional(),
  parent: z.string().nullable(),
  selected: z.string(),
  pending: z.string(),
  missing: z.boolean(),
  blocked: z.boolean(),
  entries: z.array(DirectoryEntry),
});

/**
 * @param {{ path?: string, name?: string, leaf?: string }} query
 * @param {AbortSignal} [signal]
 */
export async function fetchDirectories(query, signal) {
  const params = new URLSearchParams();
  if (query.path) params.set("path", query.path);
  if (query.name) params.set("name", query.name);
  if (query.leaf) params.set("leaf", query.leaf);
  const response = await fetch(`/api/directories?${params}`, { signal });
  const body = await response.json();
  if (!response.ok) {
    const message = body && typeof body.message === "string" ? body.message : "That folder is not available.";
    throw new Error(message);
  }
  return DirectoryListingSchema.parse(body);
}
