import { makeEvent } from "./events.js";
import { CODEX_MODEL } from "./models.js";
import { assertBuildAllowed, nextPlanSlug, setPlanStatus } from "./plan-gate.js";
import { copyTemplate, getPreview, startPreview, stopPreview } from "./preview.js";
import { needsSecurityPass, secureAfterRun } from "./npm-security.js";
import { promptFor } from "./prompts.js";

const CAPTION = "Codex seat — plans are still required. The thread runs locally in the app folder.";

/**
 * @param {object} ctx
 * @param {string} ctx.appDir
 * @param {string} ctx.slug
 * @param {string} [ctx.templateDir]
 */
export function createCodexAdapter(ctx) {
  /** @type {any} */
  let codex = null;
  /** @type {any} */
  let thread = null;
  let agentId = `codex-${ctx.slug}`;
  let cancelled = false;

  async function sdk() {
    try {
      return await import("@openai/codex-sdk");
    } catch {
      throw new Error("Codex SDK is not installed. Run npm install @openai/codex-sdk in clay-studio.");
    }
  }

  async function ensureThread() {
    if (thread) return thread;
    const mod = await sdk();
    const Codex = mod.Codex ?? mod.default?.Codex ?? mod.default;
    if (!Codex) throw new Error("Codex export missing from @openai/codex-sdk");
    codex = new Codex();
    /** @type {Record<string, string | boolean>} */
    const options = {
      workingDirectory: ctx.appDir,
      sandboxMode: "workspace-write",
      skipGitRepoCheck: true,
    };
    if (CODEX_MODEL) options.model = CODEX_MODEL;
    thread = codex.startThread(options);
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
      const runId = `run-${Date.now()}`;
      yield makeEvent("run_started", { runId, agentId });
      yield makeEvent("seat", {
        seat: { provider: "codex", model: CODEX_MODEL || undefined, caption: CAPTION },
      });

      if (command === "run") {
        yield makeEvent("preview", { preview: { status: "starting" } });
        const handle = await startPreview({ appDir: ctx.appDir });
        yield makeEvent("preview", { preview: { status: "ready", url: handle.url } });
        yield makeEvent("run_finished", { runId, agentId, status: "finished" });
        return;
      }

      let planMeta = null;
      if (command === "plan") {
        const title = rest || "Studio change";
        const slug = await nextPlanSlug(ctx.appDir, title);
        planMeta = { slug, path: `docs/plans/${slug}/plan.md`, title };
      }
      if (command === "build") {
        planMeta = await assertBuildAllowed(ctx.appDir);
      }

      const fullPrompt = promptFor(command, {
        appDir: ctx.appDir,
        rest,
        planPath: planMeta?.path,
        plan: planMeta,
      });
      const handle = await ensureThread();
      if (typeof handle.run !== "function") throw new Error("Codex thread has no run method.");
      const result = await handle.run(fullPrompt);
      if (cancelled) return;
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
        return;
      }
      yield makeEvent("run_finished", { runId, agentId, status: "finished" });
    },
    async cancel() {
      cancelled = true;
    },
    async reset() {
      thread = null;
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
      return { seat: "codex", model: CODEX_MODEL || "account default" };
    },
    getPreview: () => getPreview(ctx.appDir),
    stopPreview: () => stopPreview(ctx.appDir),
    ensureWorkspace: async () => {
      ctx.appDir = await copyTemplate({ slug: ctx.slug, templateDir: ctx.templateDir, appsDir: ctx.appsDir });
      return ctx.appDir;
    },
  };
}
