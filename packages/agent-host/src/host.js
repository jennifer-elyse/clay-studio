import path from "node:path";
import { z } from "zod";
import { formatHelp, parseSlash } from "./commands.js";
import { createCodexAdapter } from "./codex-adapter.js";
import { createCopilotAdapter } from "./copilot-adapter.js";
import { createCursorAdapter } from "./cursor-adapter.js";
import { isProductSeat, productSeat } from "./seats.js";
import { makeEvent } from "./events.js";
import { createMockAdapter } from "./mock-adapter.js";
import { PlanGateError } from "./plan-gate.js";
import { copyTemplate, defaultAppsDir, stopPreview } from "./preview.js";
import {
  assertFolderName,
  isClayProject,
  loadProjectRegistry,
  placementFor,
  projectLocation,
  rememberedDir,
  relocateProject,
  saveProjectRegistry,
} from "./projects.js";
import { openCodeInIde } from "./open-ide.js";
import { loadSession, saveSession } from "./session-store.js";

export const SendInputSchema = z.object({
  prompt: z.string(),
  command: z.string().optional(),
  rest: z.string().optional(),
  thinkFirst: z.boolean().optional(),
  projectName: z.string().optional(),
  projectFolder: z.string().optional(),
});

/**
 * @typedef {object} AgentPort
 * @property {string} provider
 * @property {string} agentId
 * @property {(prompt: string, options?: { command?: string, rest?: string, thinkFirst?: boolean }) => AsyncIterable<import("./events.js").UiEvent>} send
 * @property {() => Promise<void>} cancel
 * @property {() => Promise<void>} reset
 * @property {(planPath: string) => Promise<import("./events.js").UiEvent>} approvePlan
 * @property {(text: string) => Promise<void | undefined>} steer
 * @property {() => Promise<import("./events.js").UiEvent>} summarize
 * @property {() => Promise<unknown>} getUsage
 * @property {() => Promise<string>} ensureWorkspace
 */

/**
 * @returns {"cursor" | "codex" | "copilot" | "mock"}
 */
export function detectSeat() {
  const forced = process.env.CLAY_STUDIO_SEAT;
  if (forced === "cursor" || forced === "codex" || forced === "copilot" || forced === "mock") return forced;
  if (process.env.CURSOR_API_KEY) return "cursor";
  if (process.env.COPILOT_GITHUB_TOKEN || process.env.GH_TOKEN) return "copilot";
  return "mock";
}

/**
 * @param {object} [input]
 * @param {string} [input.slug]
 * @param {string} [input.seat]
 * @param {string} [input.appsDir]
 * @param {string} [input.templateDir]
 * @param {string} [input.gitHubToken]
 * @param {(command: string, args: string[]) => void} [input.launchIde]
 * @param {(ms: number) => Promise<void>} [input.waitIde]
 */
export async function createHost(input = {}) {
  let seat = /** @type {"cursor" | "codex" | "copilot" | "mock"} */ (input.seat || detectSeat());
  const appsDir = input.appsDir || defaultAppsDir();
  const registry = await loadProjectRegistry();
  const ctx = {
    appDir: "",
    slug: "",
    appsDir,
    templateDir: input.templateDir,
    gitHubToken: input.gitHubToken,
  };

  /** @type {import("./projects.js").ProjectRecord | null} */
  let active = null;
  /** @type {AgentPort} */
  let adapter;
  let busy = false;

  /**
   * @param {import("./projects.js").ProjectRecord} project
   */
  function describe(project) {
    return {
      id: project.id,
      name: project.name,
      folder: project.folder,
      appDir: projectLocation(project, appsDir),
    };
  }

  async function persist() {
    if (!active || !ctx.appDir) return;
    await saveSession({
      agentId: adapter.agentId,
      seat,
      appDir: ctx.appDir,
      slug: ctx.slug,
      previewUrl: adapter.getPreview?.()?.url,
    });
  }

  /**
   * @param {import("./projects.js").ProjectRecord} project
   */
  async function activate(project) {
    const nextDir = projectLocation(project, appsDir);
    const parent = path.dirname(nextDir);
    const sameDir = Boolean(adapter) && ctx.appDir === nextDir;
    if (sameDir) {
      active = project;
      registry.activeId = project.id;
      await saveProjectRegistry(registry);
      await persist();
      return;
    }
    if (ctx.appDir && ctx.appDir !== nextDir) await stopPreview(ctx.appDir);
    if (adapter) await adapter.reset();
    ctx.resumeAgentId = "";
    ctx.appsDir = parent;
    ctx.slug = project.folder;
    ctx.appDir = await copyTemplate({ slug: project.folder, appsDir: parent, templateDir: ctx.templateDir });
    active = project;
    registry.activeId = project.id;
    await saveProjectRegistry(registry);
    adapter = makeAdapter(seat, ctx);
    await persist();
  }

  /**
   * @param {{ id?: string, name: string, folder?: string }} input
   */
  async function saveProject(input) {
    const name = input.name.trim();
    if (!name) throw new Error("Give the project a name.");
    const place = placementFor(input.folder, name, appsDir);
    const remembered = rememberedDir(place.dir, appsDir);
    const nextDir = path.resolve(place.dir);

    /**
     * @param {import("./projects.js").ProjectRecord} project
     */
    function applyPlace(project) {
      project.name = name;
      project.folder = place.folder;
      if (remembered) project.dir = remembered;
      else delete project.dir;
    }

    if (input.id) {
      const current = registry.projects.find((project) => project.id === input.id);
      if (!current) throw new Error("That project is not in the list.");
      const taken = registry.projects.find((project) => project.id !== input.id && projectLocation(project, appsDir) === nextDir);
      if (taken) throw new Error(`${place.folder} is already a project. Choose it from the list.`);
      const from = projectLocation(current, appsDir);
      if (from !== nextDir) {
        if (active?.id === current.id && ctx.appDir) await stopPreview(ctx.appDir);
        await relocateProject(from, nextDir);
      }
      applyPlace(current);
      await saveProjectRegistry(registry);
      if (active?.id === current.id) await activate(current);
      return describe(current);
    }

    const existing = registry.projects.find((project) => projectLocation(project, appsDir) === nextDir);
    if (existing) {
      applyPlace(existing);
      await activate(existing);
      return describe(existing);
    }

    /** @type {import("./projects.js").ProjectRecord} */
    const project = { id: crypto.randomUUID(), name, folder: place.folder };
    if (remembered) project.dir = remembered;
    registry.projects.push(project);
    try {
      await activate(project);
    } catch (error) {
      registry.projects = registry.projects.filter((item) => item.id !== project.id);
      throw error;
    }
    return describe(project);
  }

  /**
   * @param {string} id
   */
  async function selectProject(id) {
    const project = registry.projects.find((item) => item.id === id);
    if (!project) throw new Error("Choose a project from the list.");
    if (active?.id !== project.id) await activate(project);
    return describe(project);
  }

  if (input.slug) {
    const folder = assertFolderName(input.slug);
    const existing = registry.projects.find((project) => project.folder === folder);
    const project = existing ?? { id: crypto.randomUUID(), name: folder, folder };
    if (!existing) registry.projects.push(project);
    ctx.slug = folder;
    ctx.appDir = await copyTemplate({ slug: folder, appsDir, templateDir: ctx.templateDir });
    active = project;
    registry.activeId = project.id;
    await saveProjectRegistry(registry);
  } else {
    const session = await loadSession();
    const sessionDir = session?.appDir ? path.resolve(session.appDir) : "";
    const sessionFolder = session?.slug && path.dirname(sessionDir) === path.resolve(appsDir) ? session.slug : "";
    const remembered =
      registry.projects.find((project) => projectLocation(project, appsDir) === sessionDir) ??
      registry.projects.find((project) => project.folder === sessionFolder) ??
      registry.projects.find((project) => project.id === registry.activeId) ??
      null;
    const folder = remembered?.folder || sessionFolder;
    const located = remembered ? projectLocation(remembered, appsDir) : folder ? path.join(appsDir, folder) : "";
    if (folder && located && (await isClayProject(located))) {
      const project = remembered ?? { id: crypto.randomUUID(), name: folder, folder };
      if (!registry.projects.some((item) => item.id === project.id)) registry.projects.push(project);
      ctx.appsDir = path.dirname(located);
      ctx.slug = project.folder;
      ctx.appDir = await copyTemplate({ slug: project.folder, appsDir: ctx.appsDir, templateDir: ctx.templateDir });
      active = project;
      registry.activeId = project.id;
      await saveProjectRegistry(registry);
    }
  }

  const saved = await loadSession();
  if (saved && seat === "cursor" && saved.seat === "cursor" && saved.slug === ctx.slug && saved.agentId) {
    ctx.resumeAgentId = saved.agentId;
  }

  adapter = makeAdapter(seat, ctx);
  if (active) await persist();

  return {
    get seat() {
      return seat;
    },
    get appDir() {
      return ctx.appDir;
    },
    get busy() {
      return busy;
    },
    get adapter() {
      return adapter;
    },
    /**
     * @param {unknown} raw
     */
    async *send(raw) {
      const parsed = SendInputSchema.parse(typeof raw === "string" ? { prompt: raw } : raw);
      const slash = parseSlash(parsed.prompt);
      const command = parsed.command ?? slash.command?.id ?? "chat";
      const rest = parsed.rest ?? slash.rest;
      if (command === "stop") {
        await adapter.cancel();
        yield makeEvent("assistant_text", { text: "Stopped." });
        return;
      }
      if (command === "reset") {
        await adapter.reset();
        yield makeEvent("user_text", { text: parsed.prompt });
        yield makeEvent("assistant_text", { text: "Fresh agent. What should we mold?" });
        await persist();
        return;
      }
      if (command === "seat") {
        yield makeEvent("user_text", { text: parsed.prompt });
        if (!rest) {
          yield makeEvent("assistant_text", { text: "Choose Cursor, Codex, or Copilot." });
          return;
        }
        if (rest !== "mock" && !isProductSeat(rest)) {
          yield makeEvent("error", { text: "Use Cursor, Codex, or Copilot." });
          return;
        }
        yield* this.setSeat(/** @type {"cursor" | "codex" | "copilot" | "mock"} */ (rest));
        return;
      }
      if (command === "help") {
        yield makeEvent("user_text", { text: parsed.prompt });
        yield makeEvent("assistant_text", { text: formatHelp() });
        return;
      }
      if (command === "clear") {
        yield makeEvent("clear", {});
        return;
      }
      if (command === "code") {
        yield makeEvent("user_text", { text: parsed.prompt });
        if (!ctx.appDir) {
          yield makeEvent("error", { text: "Name a project before opening the IDE.", status: "project" });
          return;
        }
        const opened = await openCodeInIde(
          { appDir: ctx.appDir, rest, platform: process.platform },
          input.launchIde,
          input.waitIde,
        );
        if (!opened.ok) {
          yield makeEvent("error", { text: opened.message });
          return;
        }
        yield makeEvent("assistant_text", { text: "Opened in the IDE. Review the prompt there, then send it." });
        return;
      }
      if (command === "settings") {
        const snap = this.snapshot();
        yield makeEvent("user_text", { text: parsed.prompt });
        yield makeEvent("assistant_text", {
          text: [
            `Seat: ${snap.seat}`,
            `Agent: ${snap.agentId || "(none yet)"}`,
            snap.project ? `Project: ${snap.project.name} (${snap.project.folder})` : "Project: name one before planning",
            `Workspace: ${snap.appDir || "(none yet)"}`,
            snap.preview?.url ? `Preview: ${snap.preview.url}` : "Preview: not running",
            "Pills: /plan /build /run /spec /help /settings. Restricted data stays out of prompts.",
          ].join("\n"),
        });
        return;
      }
      if (command === "summarize") {
        yield makeEvent("user_text", { text: parsed.prompt });
        const event = await adapter.summarize();
        yield event;
        return;
      }
      if (busy) {
        yield makeEvent("error", { text: "One run at a time. Stop the current run, or wait." });
        return;
      }
      if (command === "plan" && !active) {
        const given = (parsed.projectName ?? "").trim();
        if (!given) {
          yield makeEvent("user_text", { text: parsed.prompt });
          yield makeEvent("error", { text: "Name a project before planning.", status: "project" });
          return;
        }
        try {
          await saveProject({ name: given, folder: parsed.projectFolder });
        } catch (error) {
          yield makeEvent("user_text", { text: parsed.prompt });
          yield makeEvent("error", {
            text: error instanceof Error ? error.message : "The project could not be created.",
            status: "project",
          });
          return;
        }
      }
      busy = true;
      try {
        const thinkFirst = parsed.thinkFirst === true && (command === "plan" || command === "fix");
        if (thinkFirst) yield makeEvent("user_text", { text: rest ? `/think ${rest}` : "/think" });
        yield makeEvent("user_text", { text: parsed.prompt });
        for await (const event of adapter.send(parsed.prompt, { command, rest, thinkFirst })) {
          yield event;
          if (event.type === "error") break;
        }
      } catch (error) {
        const raw =
          error instanceof PlanGateError
            ? error.message
            : error instanceof Error
              ? error.message
              : "The agent could not start.";
        const message = raw.split("\n")[0].slice(0, 160);
        yield makeEvent("error", { text: message, status: error instanceof PlanGateError ? error.code : "error" });
      } finally {
        busy = false;
        await persist();
      }
    },
    /**
     * @param {"cursor" | "codex" | "copilot" | "mock"} next
     */
    async *setSeat(next) {
      const chosen = productSeat(next);
      const caption = chosen?.summary ?? "Mock seat for local demos.";
      if (next === seat) {
        yield makeEvent("seat", { seat: { provider: seat, caption: `Already on ${caption}` } });
        return;
      }
      await adapter.reset?.();
      ctx.resumeAgentId = "";
      seat = next;
      adapter = makeAdapter(seat, ctx);
      process.env.CLAY_STUDIO_SEAT = seat;
      await persist();
      yield makeEvent("seat", { seat: { provider: seat, caption } });
    },
    cancel: () => adapter.cancel(),
    reset: () => adapter.reset(),
    approvePlan: (planPath) => adapter.approvePlan(planPath),
    steer: (text) => adapter.steer(text),
    summarize: () => adapter.summarize(),
    getUsage: () => adapter.getUsage(),
    saveProject,
    selectProject,
    snapshot() {
      return {
        seat,
        appDir: ctx.appDir,
        slug: ctx.slug,
        busy,
        agentId: adapter.agentId,
        appsDir,
        project: active ? describe(active) : null,
        projects: registry.projects.map((project) => describe(project)),
        preview: adapter.getPreview?.() ? { url: adapter.getPreview().url, status: "ready" } : null,
      };
    },
  };
}

/**
 * @param {"cursor" | "codex" | "copilot" | "mock"} seat
 * @param {object} ctx
 */
function makeAdapter(seat, ctx) {
  if (seat === "cursor") return createCursorAdapter(ctx);
  if (seat === "codex") return createCodexAdapter(ctx);
  if (seat === "copilot") return createCopilotAdapter(ctx);
  return createMockAdapter(ctx);
}

export { loadSession };
