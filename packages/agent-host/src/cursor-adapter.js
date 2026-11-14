import { commandNeedsTools, compactAfter, compactBefore } from "./context.js";
import { makeEvent } from "./events.js";
import { friendlyTool, textFromCursorEvent } from "./friendly.js";
import { cursorModelOptions, modelFor, phaseFor, seatCaption } from "./models.js";
import { assertBuildAllowed, nextPlanSlug, setPlanStatus } from "./plan-gate.js";
import { containPreview, copyTemplate, getPreview, isInsideRepo, previewTools, stopPreview } from "./preview.js";
import { needsSecurityPass, secureAfterRun } from "./npm-security.js";
import { promptFor } from "./prompts.js";

/**
 * @param {object} ctx
 * @param {string} ctx.appDir
 * @param {string} ctx.slug
 * @param {string} [ctx.templateDir]
 * @param {string} [ctx.appsDir]
 * @param {string} [ctx.resumeAgentId]
 */
export function createCursorAdapter(ctx) {
  /** @type {any} */
  let agent = null;
  /** @type {any} */
  let activeRun = null;
  let agentId = "";
  let turns = 0;
  let hasHistory = false;

  async function sdk() {
    try {
      return await import("@cursor/sdk");
    } catch {
      throw new Error("Cursor SDK is not installed. Run npm install in clay-studio.");
    }
  }

  /**
   * Project rules only. User and team settings would be billed on every turn.
   * Preview tools are attached only on the turns that need them.
   *
   * @param {string} command
   */
  function sendLocal(command) {
    /** @type {{ settingSources: string[], customTools?: ReturnType<typeof previewTools> }} */
    const local = { settingSources: ["project"] };
    if (commandNeedsTools(command)) local.customTools = previewTools(() => ctx.appDir);
    return local;
  }

  /**
   * @param {"plan" | "build" | "fast"} phase
   */
  async function ensureAgent(phase) {
    if (isInsideRepo(ctx.appDir)) {
      throw new Error(`The Cursor project must stay outside Clay. Refusing ${ctx.appDir}.`);
    }
    const { Agent, Cursor } = await sdk();
    const cwd = ctx.appDir;
    const model = cursorModelOptions(modelFor(phase, "cursor"), phase);
    if (!agent) {
      const status = await Cursor.auth.status().catch(() => ({ loggedIn: false }));
      if (!status?.loggedIn && !process.env.CURSOR_API_KEY) {
        await Cursor.auth.login();
      }
      const resumeId = ctx.resumeAgentId || "";
      ctx.resumeAgentId = "";
      if (resumeId) {
        try {
          agent = await Agent.resume(resumeId, { local: { cwd, settingSources: ["project"] } });
          agentId = agent.agentId ?? agent.id ?? resumeId;
          hasHistory = true;
        } catch {
          agent = null;
        }
      }
      if (!agent) {
        agent = await Agent.create({
          model,
          local: { cwd, settingSources: ["project"] },
        });
        agentId = agent.agentId ?? agent.id ?? `cursor-${ctx.slug}`;
        hasHistory = false;
      }
    }
    return { agent, model, Agent };
  }

  /**
   * Replace the transcript with a summary so the next send does not resend it.
   *
   * @param {any} handle
   */
  async function* compact(handle) {
    hasHistory = false;
    turns = 0;
    if (typeof handle.summarize !== "function") return;
    const runId = `compact-${Date.now()}`;
    try {
      const run = await handle.summarize();
      activeRun = run;
      yield* streamRun(run, runId);
      await run.wait();
    } catch {
      /* No conversation yet, or the summary was cancelled. The send still proceeds. */
    } finally {
      activeRun = null;
    }
  }

  /**
   * @param {any} run
   * @param {string} runId
   */
  async function* streamRun(run, runId) {
    if (typeof run.stream !== "function") return;
    for await (const event of run.stream()) {
      const text = textFromCursorEvent(event);
      if (text) {
        yield makeEvent("assistant_text", { text, runId, agentId });
        continue;
      }
      const typed = event && typeof event === "object" ? /** @type {Record<string, unknown>} */ (event) : {};
      if (typed.type === "tool_call" || typed.type === "tool") {
        const name = String(typed.name ?? typed.tool ?? "tool");
        yield makeEvent("step", { step: { label: friendlyTool(name), status: "running" }, runId, agentId });
      }
      if (typed.type === "summary") {
        yield makeEvent("summary", {
          text: String(typed.result ?? typed.text ?? "Summarized the thread."),
          status: String(typed.status ?? "completed"),
          runId,
          agentId,
        });
      }
    }
  }

  return {
    provider: /** @type {const} */ ("cursor"),
    get agentId() {
      return agentId;
    },
    /**
     * @param {string} prompt
     * @param {object} options
     * @param {string} [options.command]
     * @param {string} [options.rest]
     * @param {boolean} [options.thinkFirst]
     */
    async *send(prompt, options = {}) {
      const command = options.command ?? "chat";
      const rest = options.rest ?? prompt;
      const phase = phaseFor(command);

      if (command === "run") {
        const runId = `run-${Date.now()}`;
        yield makeEvent("run_started", { runId, agentId });
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

      const { agent: handle } = await ensureAgent(phase);
      const modelId = modelFor(phase, "cursor");
      yield makeEvent("seat", {
        seat: { provider: "cursor", model: modelId, caption: seatCaption("cursor", phase, modelId) },
      });
      if (compactBefore({ phase, turns, hasHistory })) yield* compact(handle);

      const fullPrompt = promptFor(command, {
        appDir: ctx.appDir,
        rest,
        planPath: planMeta?.path,
        specPath,
        plan: planMeta,
        seat: "cursor",
        thinkFirst: options.thinkFirst === true,
      });

      const run = await handle.send(fullPrompt, {
        model: cursorModelOptions(modelId, phase),
        local: sendLocal(command),
      });
      activeRun = run;
      const runId = run.id ?? `run-${Date.now()}`;
      yield makeEvent("run_started", { runId, agentId });
      yield* streamRun(run, runId);
      const result = await run.wait();
      activeRun = null;
      if (result?.status === "error") {
        yield makeEvent("error", { text: "The Cursor run failed. Check the transcript.", runId, agentId });
        return;
      }
      if (needsSecurityPass(command)) {
        yield* secureAfterRun({
          appDir: ctx.appDir,
          runId,
          agentId,
          repair: async function* repair(prompt) {
            const follow = await handle.send(prompt, {
              model: cursorModelOptions(modelId, phase),
              local: sendLocal(command),
            });
            activeRun = follow;
            yield* streamRun(follow, runId);
            const followResult = await follow.wait();
            activeRun = null;
            if (followResult?.status === "error") {
              throw new Error("The security fix run failed.");
            }
          },
        });
      }
      if (compactAfter(phase)) yield* compact(handle);
      else turns += 1;
      yield makeEvent("run_finished", { runId, agentId, status: result?.status ?? "finished" });
    },
    async cancel() {
      if (activeRun?.supports?.("cancel")) await activeRun.cancel();
    },
    async reset() {
      if (agent?.close) await agent.close();
      else if (agent?.[Symbol.asyncDispose]) await agent[Symbol.asyncDispose]();
      agent = null;
      agentId = "";
      turns = 0;
      hasHistory = false;
      ctx.resumeAgentId = "";
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
    async steer(text) {
      if (activeRun?.steer) await activeRun.steer(text);
    },
    async summarize() {
      if (!agent?.summarize) return makeEvent("summary", { text: "Nothing to summarize yet.", status: "completed" });
      const run = await agent.summarize();
      const result = await run.wait();
      return makeEvent("summary", { text: String(result?.result ?? ""), status: result?.status ?? "completed" });
    },
    async getUsage() {
      if (agent?.getUsage) return agent.getUsage();
      return { seat: "cursor" };
    },
    async login() {
      const { Cursor } = await sdk();
      await Cursor.auth.login();
      return Cursor.auth.status();
    },
    getPreview: () => getPreview(ctx.appDir),
    stopPreview: () => stopPreview(ctx.appDir),
    ensureWorkspace: async () => {
      ctx.appDir = await copyTemplate({ slug: ctx.slug, templateDir: ctx.templateDir, appsDir: ctx.appsDir });
      return ctx.appDir;
    },
  };
}
