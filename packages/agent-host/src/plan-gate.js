import fs from "node:fs/promises";
import path from "node:path";

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/;

/**
 * @param {string} appDir
 * @returns {string}
 */
export function plansDir(appDir) {
  return path.join(appDir, "docs", "plans");
}

/**
 * @param {string} raw
 * @returns {{ status: string, title: string, body: string, front: Record<string, string> }}
 */
export function parsePlanMarkdown(raw) {
  const match = raw.match(FRONTMATTER);
  /** @type {Record<string, string>} */
  const front = {};
  let body = raw;
  if (match) {
    for (const line of match[1].split("\n")) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      front[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
    body = raw.slice(match[0].length);
  }
  return {
    status: front.status ?? "draft",
    title: front.title ?? "Untitled plan",
    body,
    front,
  };
}

/**
 * @param {string} appDir
 * @returns {Promise<Array<{ id: string, path: string, status: string, title: string, body: string }>>}
 */
export async function listPlans(appDir) {
  const dir = plansDir(appDir);
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === "ENOENT") return [];
    throw error;
  }
  const plans = [];
  for (const entry of entries) {
    const filePath = entry.isDirectory()
      ? path.join(dir, entry.name, "plan.md")
      : entry.name.endsWith(".md")
        ? path.join(dir, entry.name)
        : null;
    if (!filePath) continue;
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = parsePlanMarkdown(raw);
      plans.push({
        id: entry.name.replace(/\.md$/, ""),
        path: filePath,
        status: parsed.status,
        title: parsed.title,
        body: parsed.body,
      });
    } catch {
      // skip unreadable stubs
    }
  }
  return plans.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * @param {string} appDir
 */
export async function latestApprovedPlan(appDir) {
  const plans = await listPlans(appDir);
  const approved = plans.filter((plan) => plan.status === "approved");
  return approved.at(-1) ?? null;
}

export class PlanGateError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "PlanGateError";
    this.code = "PLAN_REQUIRED";
  }
}

/**
 * @param {string} appDir
 */
export async function assertBuildAllowed(appDir) {
  const approved = await latestApprovedPlan(appDir);
  if (!approved) {
    throw new PlanGateError("Approve a /plan before building. Nothing is implemented until a person says so.");
  }
  return approved;
}

/**
 * @param {object} input
 * @param {string} input.appDir
 * @param {string} input.slug
 * @param {string} input.title
 * @param {string} input.body
 * @param {string} [input.status]
 */
export async function writePlan({ appDir, slug, title, body, status = "draft" }) {
  const dir = path.join(plansDir(appDir), slug);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, "plan.md");
  const raw = `---\nstatus: ${status}\ntitle: ${title}\n---\n\n${body.trim()}\n`;
  await fs.writeFile(filePath, raw, "utf8");
  return { id: slug, path: filePath, title, body: body.trim(), status };
}

/**
 * @param {string} filePath
 * @param {"draft" | "approved" | "rejected"} status
 */
export async function setPlanStatus(filePath, status) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = parsePlanMarkdown(raw);
  const nextFront = { ...parsed.front, status, title: parsed.front.title ?? parsed.title };
  const front = Object.entries(nextFront)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
  await fs.writeFile(filePath, `---\n${front}\n---\n\n${parsed.body.trim()}\n`, "utf8");
  return { ...parsed, status, path: filePath };
}

/**
 * @param {string} name
 */
export function slugify(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return slug || "change";
}

/**
 * @param {string} appDir
 * @param {string} title
 */
export async function nextPlanSlug(appDir, title) {
  const existing = await listPlans(appDir);
  const n = String(existing.length + 1).padStart(3, "0");
  return `${n}-${slugify(title)}`;
}
