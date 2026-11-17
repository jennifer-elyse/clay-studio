import { commandNeedsTools, compactAfter, compactBefore } from "./context.js";
import { makeEvent, runStartFields } from "./events.js";
import { friendlyTool, textFromCursorEvent } from "./friendly.js";
import {
  harnessModelChoices,
  hasSeatOverride,
  nextModelAfterLimit,
  phaseFor,
  resolveHarnessModel,
  seatCaption,
  selectableModels,
} from "./models.js";
import {
  assertBuildAllowed,
  nextPlanSlug,
  setPlanStatus,
} from "./plan-gate.js";
import {
  containPreview,
  copyTemplate,
  getPreview,
  isInsideRepo,
  onPreviewCrash,
  previewTools,
  stopPreview,
} from "./preview.js";
import { needsSecurityPass, secureAfterRun } from "./npm-security.js";
import { approvalEvents } from "./plan-offer.js";
import { promptFor } from "./prompts.js";
import { decideSubtask, emptySubtaskGate, MAX_SUBTASKS } from "./subtasks.js";

/**
 * A stored SDK login uses `status: "logged-in"`. `loggedIn` is not a field, so reading it
 * always looks signed out and opens the browser login on every new agent.
 * An API key in the environment is its own login.
 *
 * @param {{ status?: string } | null | undefined} status
 * @param {string} [apiKey]
 */
export function needsCursorLogin(status, apiKey = process.env.CURSOR_API_KEY) {
  if (apiKey) return false;
  return status?.status !== "logged-in";
}

/**
 * @param {{ error?: { message?: string, code?: string }, result?: string } | null | undefined} result
 */
function cursorFailureText(result) {
  const message = result?.error?.message?.trim();
  if (message) return message;
  const code = result?.error?.code?.trim();
  if (code && code.includes(" ")) return code;
  const text = result?.result?.trim();
  return text || "";
}

/**
 * @param {object} ctx
 * @param {string} ctx.appDir
 * @param {string} ctx.slug
 * @param {string} [ctx.templateDir]
 * @param {string} [ctx.appsDir]
 * @param {string} [ctx.resumeAgentId]
 * @param {import("./models.js").SeatModelOverrides} [ctx.seatModels]
 */
export function createCursorAdapter(ctx) {
  /** @type {any} */
  let agent = null;
  /** @type {any} */
  let activeRun = null;
  let cancelRequested = false;
  let agentId = "";
  let turns = 0;
  let hasHistory = false;
  /** @type {import("./models.js").CatalogModel[] | null} */
  let listedModels = null;
  let lastCursorError = "";

  onPreviewCrash((appDir) => {
    if (appDir !== ctx.appDir || !activeRun) return;
    cancelRequested = true;
    const run = activeRun;
    if (run.supports?.("cancel")) run.cancel().catch(() => {});
  });

  async function sdk() {
    try {
      return await import("@cursor/sdk");
    } catch {
      throw new Error(
        "Cursor is not installed with Clay Studio. Close the window and open Clay Studio again.",
      );
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
    if (commandNeedsTools(command))
      local.customTools = previewTools(() => ctx.appDir);
    return local;
  }

  /**
   * The account catalog, cached after the first successful list.
   * @param {{ models?: { list?: () => Promise<import("./models.js").CatalogModel[]> } }} Cursor
   */
  async function cursorCatalog(Cursor) {
    if (listedModels) return listedModels;
    try {
      const listed = await Cursor.models?.list?.();
      listedModels = Array.isArray(listed) ? listed : [];
    } catch {
      return [];
    }
    return listedModels;
  }

  /**
   * @param {"plan" | "build" | "fast"} phase
   */
  async function ensureAgent(phase) {
    if (isInsideRepo(ctx.appDir)) {
      throw new Error(
        `The Cursor project must stay outside Clay. Refusing ${ctx.appDir}.`,
      );
    }
    const { Agent, Cursor } = await sdk();
    const cwd = ctx.appDir;
    if (!agent) {
      const status = await Cursor.auth.status().catch(() => ({ status: "logged-out" }));
      if (needsCursorLogin(status)) await Cursor.auth.login();
    }
    const model = resolveHarnessModel(
      phase,
      "cursor",
      await cursorCatalog(Cursor),
      ctx.seatModels,
    );
    if (!agent) {
      const resumeId = ctx.resumeAgentId || "";
      ctx.resumeAgentId = "";
      if (resumeId) {
        try {
          agent = await Agent.resume(resumeId, {
            local: { cwd, settingSources: ["project"] },
          });
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
    return { agent, model, catalog: await cursorCatalog(Cursor) };
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
    let gate = emptySubtaskGate();
    for await (const event of run.stream()) {
      const decision = decideSubtask(gate, event);
      gate = decision.gate;
      if (decision.stop) {
        const text =
          decision.stop === "loop"
            ? "Stopped. A subtask cannot start another agent."
            : `Stopped. Clay can open ${MAX_SUBTASKS} subtasks, and no more.`;
        yield makeEvent("assistant_text", { text, runId, agentId });
        cancelRequested = true;
        if (run.supports?.("cancel")) {
          try {
            await run.cancel();
          } catch {
            /* The run already finished. */
          }
        }
        return;
      }
      const text = textFromCursorEvent(event);
      if (text) {
        yield makeEvent("assistant_text", { text, runId, agentId });
        continue;
      }
      const typed =
        event && typeof event === "object"
          ? /** @type {Record<string, unknown>} */ (event)
          : {};
      if (typed.type === "tool_call" || typed.type === "tool") {
        const name = String(typed.name ?? typed.tool ?? "tool");
        yield makeEvent("step", {
          step: { label: friendlyTool(name), status: "running" },
          runId,
          agentId,
        });
      }
      if (typed.type === "status" && String(typed.status).toUpperCase() === "ERROR" && typed.message) {
        lastCursorError = String(typed.message);
        yield makeEvent("assistant_text", { text: lastCursorError, runId, agentId });
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
      cancelRequested = false;
      const command = options.command ?? "chat";
      const rest = options.rest ?? prompt;
      const phase = phaseFor(command);

      if (command === "run") {
        const runId = `run-${Date.now()}`;
        yield makeEvent("run_started", { runId, agentId, ...runStartFields(command) });
        yield makeEvent("preview", { preview: { status: "starting" } });
        const opened = await containPreview({ appDir: ctx.appDir });
        if (!opened.ok) {
          yield makeEvent("preview", {
            preview: { status: "error", message: opened.message },
          });
          yield makeEvent("run_finished", { runId, agentId, status: "error" });
          return;
        }
        yield makeEvent("preview", {
          preview: { status: "ready", url: opened.url },
        });
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
        const target = { slug, path: `docs/plans/${slug}/${file}`, title };
        if (command === "spec") specPath = target.path;
        else planMeta = target;
      }
      if (command === "build") {
        planMeta = await assertBuildAllowed(ctx.appDir);
      }

      const { agent: handle, model: firstModel, catalog } = await ensureAgent(phase);
      const choices = harnessModelChoices(phase, "cursor", catalog, ctx.seatModels);
      let model = choices.find((choice) => choice.id === firstModel.id) ?? firstModel;
      const modelId = model.id;
      yield makeEvent("seat", {
        seat: {
          provider: "cursor",
          model: modelId,
          caption: seatCaption("cursor", phase, modelId),
        },
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

      let result;
      let runId = "";
      let choiceIndex = Math.max(0, choices.findIndex((choice) => choice.id === model.id));
      while (true) {
        const run = await handle.send(fullPrompt, {
          model,
          local: sendLocal(command),
        });
        activeRun = run;
        runId = run.id ?? `run-${Date.now()}`;
        yield makeEvent("run_started", { runId, agentId, ...runStartFields(command) });
        yield* streamRun(run, runId);
        try {
          result = await run.wait();
        } catch (error) {
          activeRun = null;
          if (cancelRequested) {
            yield makeEvent("run_finished", { runId, agentId, status: "cancelled" });
            return;
          }
          throw error;
        }
        activeRun = null;
        if (cancelRequested) {
          yield makeEvent("run_finished", { runId, agentId, status: "cancelled" });
          return;
        }
        if (result?.status !== "error") break;
        const reason = cursorFailureText(result) || lastCursorError;
        lastCursorError = "";
        const next = hasSeatOverride("cursor", phase, ctx.seatModels)
          ? null
          : nextModelAfterLimit(choices, choiceIndex, reason);
        if (!next) {
          yield makeEvent("run_finished", { runId, agentId, status: "error" });
          yield makeEvent("error", {
            text: reason || "The Cursor run failed.",
            runId,
            agentId,
          });
          return;
        }
        choiceIndex = choices.findIndex((choice) => choice.id === next.id);
        model = next;
        yield makeEvent("assistant_text", {
          text: `Switching to ${next.id}.`,
          runId,
          agentId,
        });
        yield makeEvent("seat", {
          seat: {
            provider: "cursor",
            model: next.id,
            caption: seatCaption("cursor", phase, next.id),
          },
        });
      }
      if (needsSecurityPass(command)) {
        yield* secureAfterRun({
          appDir: ctx.appDir,
          runId,
          agentId,
          repair: async function* repair(prompt) {
            const follow = await handle.send(prompt, {
              model,
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
      yield makeEvent("run_finished", {
        runId,
        agentId,
        status: result?.status ?? "finished",
      });
    },
    async cancel() {
      cancelRequested = true;
      if (!activeRun?.supports?.("cancel")) return;
      try {
        await activeRun.cancel();
      } catch {
        /* The run already finished. */
      }
    },
    async reset() {
      if (agent?.close) await agent.close();
      else if (agent?.[Symbol.asyncDispose]) await agent[Symbol.asyncDispose]();
      agent = null;
      agentId = "";
      turns = 0;
      hasHistory = false;
      listedModels = null;
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
      if (!agent?.summarize)
        return makeEvent("summary", {
          text: "Nothing to summarize yet.",
          status: "completed",
        });
      const run = await agent.summarize();
      const result = await run.wait();
      return makeEvent("summary", {
        text: String(result?.result ?? ""),
        status: result?.status ?? "completed",
      });
    },
    async getUsage() {
      if (agent?.getUsage) return agent.getUsage();
      return { seat: "cursor" };
    },
    /**
     * Models this Cursor account can run. Uses the catalog already fetched for a run when there is one.
     * @returns {Promise<Array<{ id: string, label: string }>>}
     */
    async listModels() {
      if (listedModels) return selectableModels(listedModels);
      const { Cursor } = await sdk();
      if (typeof Cursor.models?.list !== "function") throw new Error("Cursor did not list its models.");
      const listed = await Cursor.models.list();
      listedModels = Array.isArray(listed) ? listed : [];
      return selectableModels(listedModels);
    },
    async login() {
      const { Cursor } = await sdk();
      await Cursor.auth.login();
      return Cursor.auth.status();
    },
    getPreview: () => getPreview(ctx.appDir),
    stopPreview: () => stopPreview(ctx.appDir),
    ensureWorkspace: async () => {
      ctx.appDir = await copyTemplate({
        slug: ctx.slug,
        templateDir: ctx.templateDir,
        appsDir: ctx.appsDir,
      });
      return ctx.appDir;
    },
  };
}
