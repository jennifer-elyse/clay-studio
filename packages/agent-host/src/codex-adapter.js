import { FAST_TURN_LIMIT } from "./context.js";
import { makeEvent, runStartFields } from "./events.js";
import { codexEffort, defaultModels, modelFor, phaseFor, seatCaption, selectableModels } from "./models.js";
import { assertBuildAllowed, ensurePlanDir, nextPlanSlug, planRelativePath, setPlanStatus } from "./plan-gate.js";
import { containPreview, copyTemplate, getPreview, onPreviewCrash, stopPreview } from "./preview.js";
import { needsSecurityPass, secureAfterRun } from "./npm-security.js";
import { approvalEvents } from "./plan-offer.js";
import { promptFor } from "./prompts.js";

/**
 * @param {object} ctx
 * @param {string} ctx.appDir
 * @param {string} ctx.slug
 * @param {string} [ctx.templateDir]
 * @param {import("./models.js").SeatModelOverrides} [ctx.seatModels]
 */
export function createCodexAdapter(ctx) {
  /** @type {any} */
  let codex = null;
  /** @type {any} */
  let thread = null;
  let threadKey = "";
  let fastTurns = 0;
  let agentId = `codex-${ctx.slug}`;
  let cancelled = false;

  onPreviewCrash((appDir) => {
    if (appDir !== ctx.appDir) return;
    cancelled = true;
  });

  async function sdk() {
    try {
      return await import("@openai/codex-sdk");
    } catch {
      throw new Error("Codex is not installed with Clay Studio. Close the window and open Clay Studio again.");
    }
  }

  /**
   * Fast turns reuse one thread so the cached instructions stay warm.
   * Plan and build start a fresh thread so they do not carry the chat.
   *
   * @param {"plan" | "build" | "fast"} phase
   */
  function releaseThread() {
    thread = null;
    threadKey = "";
  }

  async function ensureThread(phase) {
    const model = modelFor(phase, "codex", ctx.seatModels);
    const effort = codexEffort(phase);
    if (phase !== "fast" || fastTurns >= FAST_TURN_LIMIT) {
      releaseThread();
      if (phase === "fast") fastTurns = 0;
    }
    const key = phase === "fast" ? `fast:${model}:${effort}` : "";
    if (thread && key && threadKey === key) return thread;
    const mod = await sdk();
    const Codex = mod.Codex ?? mod.default?.Codex ?? mod.default;
    if (!Codex) throw new Error("Codex export missing from @openai/codex-sdk");
    if (!codex) codex = new Codex();
    thread = codex.startThread({
      workingDirectory: ctx.appDir,
      sandboxMode: "workspace-write",
      skipGitRepoCheck: true,
      model,
      modelReasoningEffort: effort,
    });
    threadKey = key;
    agentId = thread?.id ?? agentId;
    return thread;
  }

  return {
    provider: /** @type {const} */ ("codex"),
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
      const modelId = modelFor(phase, "codex", ctx.seatModels);
      const runId = `run-${Date.now()}`;
      yield makeEvent("run_started", { runId, agentId, ...runStartFields(command) });
      yield makeEvent("seat", {
        seat: { provider: "codex", model: modelId, caption: seatCaption("codex", phase, modelId) },
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
      let planStarted = 0;
      if (command === "plan" || command === "spec") {
        planStarted = Date.now();
        const title = rest || "Studio change";
        const slug = await nextPlanSlug(ctx.appDir, title);
        const file = command === "spec" ? "spec.md" : "plan.md";
        await ensurePlanDir(ctx.appDir, slug);
        const target = { slug, path: planRelativePath(ctx.appDir, slug, file), title };
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
        seat: "codex",
        thinkFirst: options.thinkFirst === true,
      });
      const handle = await ensureThread(phase);
      if (typeof handle.run !== "function") throw new Error("Codex thread has no run method.");
      const result = await handle.run(fullPrompt);
      if (cancelled) {
        yield makeEvent("run_finished", { runId, agentId, status: "cancelled" });
        return;
      }
      const text = result?.finalResponse ?? result?.text ?? "";
      if (text) yield makeEvent("assistant_text", { text: String(text), runId, agentId });
      if (needsSecurityPass(command)) {
        yield* secureAfterRun({
          appDir: ctx.appDir,
          runId,
          agentId,
          repair: async function* repair(prompt) {
            const follow = await handle.run(prompt);
            const followText = follow?.finalResponse ?? follow?.text ?? "";
            if (followText) yield makeEvent("assistant_text", { text: String(followText), runId, agentId });
          },
        });
      }
      if (phase === "fast") {
        fastTurns += 1;
        if (fastTurns >= FAST_TURN_LIMIT) {
          releaseThread();
          fastTurns = 0;
        }
      } else {
        releaseThread();
        fastTurns = 0;
      }
      if (command === "plan" && planMeta) {
        const events = await approvalEvents({
          appDir: ctx.appDir,
          relativePath: planMeta.path,
          sinceMs: planStarted,
          runId,
          agentId,
        });
        for (const event of events) yield event;
        if (events.some((event) => event.type === "error")) return;
      }
      yield makeEvent("run_finished", { runId, agentId, status: "finished" });
    },
    async cancel() {
      cancelled = true;
    },
    async reset() {
      thread = null;
      threadKey = "";
      fastTurns = 0;
      codex = null;
      agentId = `codex-${ctx.slug}-${Date.now()}`;
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
      return makeEvent("summary", { text: "Codex keeps the thread. Ask it to summarize the work so far.", status: "completed" });
    },
    async getUsage() {
      return { seat: "codex", model: modelFor("fast", "codex", ctx.seatModels) };
    },
    /**
     * Codex exposes no catalog. The plan model and the quick-turn model are the choices.
     * @returns {Promise<Array<{ id: string, label: string }>>}
     */
    async listModels() {
      const defaults = defaultModels("codex");
      const saved = ctx.seatModels?.codex?.work;
      return selectableModels(
        [saved ? { id: saved } : null, { id: defaults.work }, { id: defaults.build }, { id: defaults.fast }].filter(
          (entry) => entry,
        ),
      );
    },
    getPreview: () => getPreview(ctx.appDir),
    stopPreview: () => stopPreview(ctx.appDir),
    ensureWorkspace: async () => {
      ctx.appDir = await copyTemplate({ slug: ctx.slug, templateDir: ctx.templateDir, appsDir: ctx.appsDir });
      return ctx.appDir;
    },
  };
}
