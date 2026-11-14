import { z } from "zod";
import { formatHelp, parseSlash } from "./commands.js";
import { createCodexAdapter } from "./codex-adapter.js";
import { createCopilotAdapter } from "./copilot-adapter.js";
import { createCursorAdapter } from "./cursor-adapter.js";
import { isProductSeat, productSeat } from "./seats.js";
import { makeEvent } from "./events.js";
import { createMockAdapter } from "./mock-adapter.js";
import { PlanGateError } from "./plan-gate.js";
import { copyTemplate, defaultAppsDir } from "./preview.js";
import { loadSession, saveSession } from "./session-store.js";

export const SendInputSchema = z.object({
  prompt: z.string(),
  command: z.string().optional(),
  rest: z.string().optional(),
  thinkFirst: z.boolean().optional(),
});

/**
 * @typedef {object} AgentPort
 * @property {string} provider
 * @property {string} agentId
 * @property {(prompt: string, options?: { command?: string, rest?: string }) => AsyncIterable<import("./events.js").UiEvent>} send
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
 */
export async function createHost(input = {}) {
  const slug = input.slug || "studio-app";
  let seat = /** @type {"cursor" | "codex" | "copilot" | "mock"} */ (input.seat || detectSeat());
  const appsDir = input.appsDir || defaultAppsDir();
  const appDir = await copyTemplate({ slug, appsDir, templateDir: input.templateDir });
  const ctx = { appDir, slug, appsDir, templateDir: input.templateDir, gitHubToken: input.gitHubToken };

  /** @type {AgentPort} */
  let adapter = makeAdapter(seat, ctx);
  let busy = false;

  async function persist() {
    await saveSession({
      agentId: adapter.agentId,
      seat,
      appDir,
      slug,
      previewUrl: adapter.getPreview?.()?.url,
    });
  }

  return {
    get seat() {
      return seat;
    },
    get appDir() {
      return appDir;
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
      if (command === "settings") {
        const snap = this.snapshot();
        yield makeEvent("user_text", { text: parsed.prompt });
        yield makeEvent("assistant_text", {
          text: [
            `Seat: ${snap.seat}`,
            `Agent: ${snap.agentId || "(none yet)"}`,
            `Workspace: ${snap.appDir}`,
            snap.preview?.url ? `Preview: ${snap.preview.url}` : "Preview: not running",
            "Pills: /plan /build /run /help /settings. Restricted data stays out of prompts.",
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
      busy = true;
      try {
        const steps = [];
        if (parsed.thinkFirst && (command === "plan" || command === "fix")) {
          steps.push({ prompt: rest ? `/think ${rest}` : "/think", command: "think", rest });
        }
        steps.push({ prompt: parsed.prompt, command, rest });
        for (const step of steps) {
          yield makeEvent("user_text", { text: step.prompt });
          let failed = false;
          for await (const event of adapter.send(step.prompt, { command: step.command, rest: step.rest })) {
            yield event;
            if (event.type === "error") failed = true;
          }
          if (failed) break;
        }
      } catch (error) {
        const message =
          error instanceof PlanGateError
            ? error.message
            : error instanceof Error
              ? error.message
              : "The agent could not start.";
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
    snapshot() {
      return {
        seat,
        appDir,
        slug,
        busy,
        agentId: adapter.agentId,
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
