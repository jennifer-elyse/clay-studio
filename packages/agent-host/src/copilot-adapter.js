import { commandNeedsTools, FAST_TURN_LIMIT } from "./context.js";
import { makeEvent } from "./events.js";
import { copilotEffort, modelFor, phaseFor, seatCaption } from "./models.js";
import { assertBuildAllowed, nextPlanSlug, setPlanStatus } from "./plan-gate.js";
import { containPreview, copyTemplate, getPreview, previewTools, stopPreview } from "./preview.js";
import { needsSecurityPass, secureAfterRun } from "./npm-security.js";
import { promptFor } from "./prompts.js";

/**
 * @param {object} ctx
 * @param {string} ctx.appDir
 * @param {string} ctx.slug
 * @param {string} [ctx.templateDir]
 * @param {string} [ctx.appsDir]
 * @param {string} [ctx.gitHubToken]
 */
export function createCopilotAdapter(ctx) {
  /** @type {any} */
  let client = null;
  /** @type {any} */
  let session = null;
  let agentId = `copilot-${ctx.slug}`;
  let cancelled = false;
  let activeModel = "";
  let fastTurns = 0;
  let sessionGeneration = 0;
  let sessionHasTools = false;

  async function sdk() {
    try {
      return await import("@github/copilot-sdk");
    } catch {
      throw new Error("GitHub Copilot SDK is not installed. Run npm install in clay-studio.");
    }
  }

  function token() {
    return (
      ctx.gitHubToken ||
      process.env.COPILOT_GITHUB_TOKEN ||
      process.env.GH_TOKEN ||
      process.env.GITHUB_TOKEN ||
      ""
    );
  }

  async function dropSession() {
    if (session?.disconnect) {
      try {
        await session.disconnect();
      } catch {
        /* The session is already gone. */
      }
    }
    session = null;
    activeModel = "";
    sessionHasTools = false;
    sessionGeneration += 1;
  }

  /**
   * A new process starts a new session. Resuming the saved one would reload its whole transcript.
   *
   * @param {string} command
   * @param {"plan" | "build" | "fast"} phase
   * @param {boolean} [fresh]
   */
  async function ensureSession(command, phase, fresh = false) {
    const needsTools = commandNeedsTools(command);
    if (fresh || (needsTools && session && !sessionHasTools)) {
      await dropSession();
      if (phase === "fast") fastTurns = 0;
    }
    if (session) return session;
    const mod = await sdk();
    const CopilotClient = mod.CopilotClient ?? mod.default?.CopilotClient ?? mod.default;
    if (!CopilotClient) throw new Error("CopilotClient export missing from @github/copilot-sdk");
    const gitHubToken = token();
    if (!client) {
      client = new CopilotClient({
        gitHubToken: gitHubToken || undefined,
        useLoggedInUser: !gitHubToken,
      });
    }
    const sessionId = `clay-${ctx.slug}-${sessionGeneration}`;
    session = await client.createSession({
      sessionId,
      model: modelFor(phase, "copilot"),
      gitHubToken: gitHubToken || undefined,
      workingDirectory: ctx.appDir,
      availableTools: needsTools ? Object.keys(previewTools(() => ctx.appDir)) : [],
    });
    sessionHasTools = needsTools;
    agentId = session.sessionId ?? session.id ?? sessionId;
    return session;
  }

  /**
   * @param {"plan" | "build" | "fast"} phase
   */
  async function noteTurn(phase) {
    if (phase === "fast") {
      fastTurns += 1;
      if (fastTurns >= FAST_TURN_LIMIT) {
        await dropSession();
        fastTurns = 0;
      }
      return;
    }
    fastTurns = 0;
    await dropSession();
  }

  /**
   * @param {any} response
   */
  function* fromResponse(response) {
    const data = response?.data ?? response ?? {};
    const content = data.content ?? data.text ?? data.message;
    if (typeof content === "string" && content) {
      yield makeEvent("assistant_text", { text: content, agentId });
    } else if (Array.isArray(content)) {
      for (const part of content) {
        const text = typeof part === "string" ? part : part?.text;
        if (text) yield makeEvent("assistant_text", { text, agentId });
      }
    }
  }

  /**
   * @param {any} handle
   * @param {string} modelId
   * @param {"low" | "medium"} effort
   */
  async function useModel(handle, modelId, effort) {
    if (typeof handle.setModel !== "function") return;
    const key = `${modelId}:${effort}`;
    if (activeModel === key) return;
    try {
      await handle.setModel(modelId, { reasoningEffort: effort });
    } catch {
      try {
        await handle.setModel(modelId);
      } catch {
        return;
      }
    }
    activeModel = key;
  }

  return {
    provider: /** @type {const} */ ("copilot"),
    get agentId() {
      return agentId;
    },
    /**
     * @param {string} prompt
     * @param {object} options
     * @param {string} [options.command]
     * @param {string} [options.rest]
     */
    async *send(prompt, options = {}) {
      cancelled = false;
      const command = options.command ?? "chat";
      const rest = options.rest ?? prompt;
      const phase = phaseFor(command);
      const modelId = modelFor(phase, "copilot");
      const runId = `run-${Date.now()}`;
      yield makeEvent("run_started", { runId, agentId });
      yield makeEvent("seat", {
        seat: { provider: "copilot", model: modelId, caption: seatCaption("copilot", phase, modelId) },
      });

      if (command === "run") {
        yield makeEvent("preview", { preview: { status: "starting" } });
        const opened = await containPreview({ appDir: ctx.appDir });
        if (!opened.ok) {
          yield makeEvent("preview", { preview: { status: "error", message: opened.message } });
          yield makeEvent("run_finished", { runId, agentId, status: "error" });
          return;
        }
        yield makeEvent("preview", { preview: { status: "ready", url: opened.url } });
        yield makeEvent("run_finished", { runId, agentId, status: "finished" });
        return;
      }

      let planMeta = null;
      let specPath = null;
      if (command === "plan" || command === "spec") {
        const title = rest || "Studio change";
        const slug = await nextPlanSlug(ctx.appDir, title);
        const file = command === "spec" ? "spec.md" : "plan.md";
        const target = { slug, path: `docs/plans/${slug}/${file}`, title };
        if (command === "spec") specPath = target.path;
        else planMeta = target;
      }
      if (command === "build") {
        planMeta = await assertBuildAllowed(ctx.appDir);
      }

      const fullPrompt = promptFor(command, {
        appDir: ctx.appDir,
        rest,
        planPath: planMeta?.path,
        specPath,
        plan: planMeta,
        seat: "copilot",
        thinkFirst: options.thinkFirst === true,
      });

      const handle = await ensureSession(command, phase, phase !== "fast" || fastTurns >= FAST_TURN_LIMIT);
      await useModel(handle, modelId, copilotEffort(phase));
      const payload = { prompt: fullPrompt };
      if (typeof handle.sendAndWait === "function") {
        const response = await handle.sendAndWait(payload);
        if (!cancelled) yield* fromResponse(response);
      } else if (typeof handle.send === "function") {
        const response = await handle.send(payload);
        if (response?.[Symbol.asyncIterator]) {
          for await (const event of response) {
            if (cancelled) break;
            yield* fromResponse(event);
          }
        } else if (!cancelled) {
          yield* fromResponse(response);
        }
      } else {
        throw new Error("Copilot session has no send method");
      }
      if (cancelled) return;
      if (needsSecurityPass(command)) {
        yield* secureAfterRun({
          appDir: ctx.appDir,
          runId,
          agentId,
          repair: async function* repair(prompt) {
            const sessionHandle = await ensureSession(command, phase, false);
            const payload = { prompt };
            if (typeof sessionHandle.sendAndWait === "function") {
              yield* fromResponse(await sessionHandle.sendAndWait(payload));
              return;
            }
            const response = await sessionHandle.send(payload);
            if (response?.[Symbol.asyncIterator]) {
              for await (const event of response) yield* fromResponse(event);
              return;
            }
            yield* fromResponse(response);
          },
        });
      }
      if (!cancelled) await noteTurn(phase);
      yield makeEvent("run_finished", { runId, agentId, status: "finished" });
    },
    async cancel() {
      cancelled = true;
    },
    async reset() {
      await dropSession();
      fastTurns = 0;
      agentId = `copilot-${ctx.slug}-${Date.now()}`;
    },
    async approvePlan(planPath) {
      const updated = await setPlanStatus(planPath, "approved");
      return makeEvent("plan", {
        plan: {
          id: planPath,
          path: planPath,
          title: updated.title,
          body: updated.body,
          status: "approved",
        },
      });
    },
    async steer() {
      return undefined;
    },
    async summarize() {
      return makeEvent("summary", { text: "Copilot sessions summarize on the service.", status: "completed" });
    },
    async getUsage() {
      return { seat: "copilot", model: activeModel || modelFor("fast", "copilot") };
    },
    getPreview: () => getPreview(ctx.appDir),
    stopPreview: () => stopPreview(ctx.appDir),
    ensureWorkspace: async () => {
      ctx.appDir = await copyTemplate({ slug: ctx.slug, templateDir: ctx.templateDir, appsDir: ctx.appsDir });
      return ctx.appDir;
    },
  };
}
