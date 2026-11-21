import fs from "node:fs/promises";
import path from "node:path";

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?/;

/**
 * @param {string} appDir
 * @returns {string}
 */
/**
 * Plans for a project live under docs/{project-name}-plan.
 * @param {string} appDir
 * @returns {string}
 */
export function planFolderName(appDir) {
  return `${slugify(path.basename(appDir))}-plan`;
}

/**
 * @param {string} appDir
 * @param {string} slug
 * @param {string} file
 * @returns {string}
 */
export function planRelativePath(appDir, slug, file) {
  return ["docs", planFolderName(appDir), slug, file].join("/");
}

/**
 * @param {string} appDir
 * @returns {string}
 */
export function plansDir(appDir) {
  return path.join(appDir, "docs", planFolderName(appDir));
}

/**
 * The old starter said docs/plans. A project plan lives under docs/{project-name}-plan.
 * @param {string} text
 * @param {string} folder
 * @returns {string}
 */
export function projectPlanMention(text, folder) {
  return text
    .replaceAll("{project-name}-plan", folder)
    .replaceAll("docs/plans/", `docs/${folder}/`)
    .replaceAll("docs/plans", `docs/${folder}`);
}

/**
 * Move a leftover docs/plans directory and retarget the docs that name it.
 * @param {string} appDir
 */
export async function pointPlansAtProject(appDir) {
  const folder = planFolderName(appDir);
  const from = path.join(appDir, "docs", "plans");
  const to = plansDir(appDir);
  if (path.resolve(from) !== path.resolve(to)) {
    let info = null;
    try {
      info = await fs.stat(from);
    } catch (error) {
      if (/** @type {NodeJS.ErrnoException} */ (error).code !== "ENOENT") throw error;
    }
    if (info?.isDirectory()) {
      await fs.mkdir(to, { recursive: true });
      const entries = await fs.readdir(from);
      for (const name of entries) {
        const dest = path.join(to, name);
        const taken = await fs.access(dest).then(() => true).catch(() => false);
        if (!taken) await fs.rename(path.join(from, name), dest);
      }
      const left = await fs.readdir(from);
      if (left.length === 0) await fs.rmdir(from);
    }
  }
  for (const name of ["AGENTS.md", "README.md", "docs", ".agents"]) {
    await rewritePlanMentions(path.join(appDir, name), folder);
  }
}

/**
 * @param {string} target
 * @param {string} folder
 */
async function rewritePlanMentions(target, folder) {
  let info;
  try {
    info = await fs.stat(target);
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === "ENOENT") return;
    throw error;
  }
  if (info.isDirectory()) {
    const entries = await fs.readdir(target, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules") continue;
      await rewritePlanMentions(path.join(target, entry.name), folder);
    }
    return;
  }
  if (!target.endsWith(".md")) return;
  const raw = await fs.readFile(target, "utf8");
  const next = projectPlanMention(raw, folder);
  if (next !== raw) await fs.writeFile(target, next, "utf8");
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
 * @returns {Promise<Array<{ id: string, path: string, status: string, title: string, body: string, built: boolean }>>}
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
        built: parsed.front.built === "true",
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
    throw new PlanGateError("Approve the /speckit.plan before /speckit.implement. Nothing is implemented until a person says so.");
  }
  return approved;
}

/**
 * Keep a plan the model already saved. Otherwise store its draft so approval can be asked.
 * @param {object} input
 * @param {string} input.appDir
 * @param {string} input.slug
 * @param {string} input.title
 * @param {string} input.body
 */
export async function ensureDraftPlan({ appDir, slug, title, body }) {
  const relative = planRelativePath(appDir, slug, "plan.md");
  const existing = await readPlanIfPresent(path.resolve(appDir, relative));
  if (existing) return existing;
  const text = String(body ?? "").trim().replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
  if (!text) return null;
  return writePlan({ appDir, slug, title, body: text });
}

/**
 * The numbered plan directory, created before the seat writes the file.
 * @param {string} appDir
 * @param {string} slug
 * @returns {Promise<string>}
 */
export async function ensurePlanDir(appDir, slug) {
  const dir = path.join(plansDir(appDir), slug);
  await fs.mkdir(dir, { recursive: true });
  return dir;
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
  const dir = await ensurePlanDir(appDir, slug);
  const filePath = path.join(dir, "plan.md");
  const raw = `---\nstatus: ${status}\ntitle: ${title}\n---\n\n${body.trim()}\n`;
  await fs.writeFile(filePath, raw, "utf8");
  return { id: slug, path: filePath, title, body: body.trim(), status };
}

/**
 * @param {Record<string, string>} front
 * @returns {string}
 */
function frontMatter(front) {
  return Object.entries(front)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

/**
 * @param {string} filePath
 * @param {Record<string, string>} patch
 */
async function rewritePlan(filePath, patch) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = parsePlanMarkdown(raw);
  const nextFront = { ...parsed.front, title: parsed.front.title ?? parsed.title, ...patch };
  await fs.writeFile(filePath, `---\n${frontMatter(nextFront)}\n---\n\n${parsed.body.trim()}\n`, "utf8");
  return { ...parsed, front: nextFront, status: nextFront.status ?? parsed.status, path: filePath };
}

/**
 * @param {string} filePath
 * @param {"draft" | "approved" | "rejected"} status
 */
export async function setPlanStatus(filePath, status) {
  return rewritePlan(filePath, { status });
}

/**
 * Plan is done once a person approves it. Build is done once /build finishes against that plan.
 * @param {string} appDir
 * @returns {Promise<{ plan: boolean, build: boolean }>}
 */
export async function commandDone(appDir) {
  if (!appDir) return { plan: false, build: false };
  const plans = await listPlans(appDir);
  return {
    plan: plans.some((plan) => plan.status === "approved"),
    build: plans.some((plan) => plan.built),
  };
}

/**
 * Remember a successful /build on the approved plan for this project.
 * @param {string} appDir
 * @returns {Promise<boolean>}
 */
export async function markPlanBuilt(appDir) {
  const plan = await latestApprovedPlan(appDir);
  if (!plan) return false;
  await rewritePlan(plan.path, { built: "true" });
  return true;
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
 * A finished /plan only offers approval when this returns the written file.
 * Unknown statuses stay drafts so the card can still ask for approval.
 *
 * @param {string} filePath
 * @param {string} raw
 */
export function planFromMarkdown(filePath, raw) {
  const parsed = parsePlanMarkdown(raw);
  const status = String(parsed.status).replace(/^["']|["']$/g, "").trim();
  return {
    id: path.basename(path.dirname(filePath)),
    path: filePath,
    title: parsed.title,
    body: parsed.body.trim(),
    status: status === "approved" || status === "rejected" ? status : "draft",
  };
}

/**
 * @param {string} filePath
 */
async function readPlanIfPresent(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return planFromMarkdown(filePath, raw);
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === "ENOENT") return null;
    throw error;
  }
}

/**
 * @param {string} appDir
 * @param {number} sinceMs
 */
async function newestPlanSince(appDir, sinceMs) {
  const dir = plansDir(appDir);
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === "ENOENT") return null;
    throw error;
  }
  /** @type {{ plan: ReturnType<typeof planFromMarkdown>, mtimeMs: number } | null} */
  let newest = null;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(dir, entry.name, "plan.md");
    try {
      const info = await fs.stat(filePath);
      if (info.mtimeMs < sinceMs) continue;
      const plan = await readPlanIfPresent(filePath);
      if (!plan) continue;
      if (!newest || info.mtimeMs >= newest.mtimeMs) newest = { plan, mtimeMs: info.mtimeMs };
    } catch (error) {
      if (/** @type {NodeJS.ErrnoException} */ (error).code !== "ENOENT") throw error;
    }
  }
  return newest?.plan ?? null;
}

/**
 * @param {string} appDir
 * @param {string} relativePath
 * @param {number} [sinceMs]
 * @returns {Promise<{ ok: true, plan: ReturnType<typeof planFromMarkdown> } | { ok: false, message: string }>}
 */
export async function planReadyForApproval(appDir, relativePath, sinceMs = 0) {
  const expected = path.resolve(appDir, relativePath);
  const direct = await readPlanIfPresent(expected);
  if (direct) return { ok: true, plan: direct };
  const fallback = sinceMs > 0 ? await newestPlanSince(appDir, sinceMs) : null;
  if (fallback) return { ok: true, plan: fallback };
  return { ok: false, message: "The plan file was not written, so there is nothing to approve." };
}

/**
 * @param {string} appDir
 * @param {string} title
 */
export async function nextPlanSlug(appDir, title) {
  const dir = plansDir(appDir);
  let directories = 0;
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    directories = entries.filter((entry) => entry.isDirectory()).length;
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code !== "ENOENT") throw error;
  }
  const listed = (await listPlans(appDir)).length;
  const n = String(Math.max(directories, listed) + 1).padStart(3, "0");
  return `${n}-${slugify(title)}`;
}

/**
 * @param {object} input
 * @param {string} input.appDir
 * @param {string} input.slug
 * @param {string} input.title
 * @param {string} input.body
 * @param {string} [input.status]
 */
export async function writeSpec({ appDir, slug, title, body, status = "draft" }) {
  const dir = path.join(plansDir(appDir), slug);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, "spec.md");
  const raw = `---\nstatus: ${status}\ntitle: ${title}\nslug: ${slug}\n---\n\n${body.trim()}\n`;
  await fs.writeFile(filePath, raw, "utf8");
  return { id: slug, path: filePath, title, body: body.trim(), status };
}
