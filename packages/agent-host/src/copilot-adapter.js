import { copilotPermissionDecision, planTextFromWrite, withoutToolPlaceholders } from "./copilot-plan.js";
import { commandNeedsTools, FAST_TURN_LIMIT } from "./context.js";
import { makeEvent, runStartFields } from "./events.js";
import {
  copilotEffort,
  modelFor,
  phaseFor,
  resolveCopilotModel,
  seatCaption,
  selectableModels,
} from "./models.js";
import {
  assertBuildAllowed,
  ensureDraftPlan,
  ensurePlanDir,
  nextPlanSlug,
  planFolderName,
  planRelativePath,
  setPlanStatus,
} from "./plan-gate.js";
import {
  containPreview,
  copyTemplate,
  getPreview,
  onPreviewCrash,
  previewTools,
  stopPreview,
} from "./preview.js";
import { needsSecurityPass, secureAfterRun } from "./npm-security.js";
import { approvalEvents } from "./plan-offer.js";
import { promptFor } from "./prompts.js";

/** Copilot waits 60 seconds unless a turn asks for longer. A build needs ten minutes. */
export const BUILD_WAIT_MS = 10 * 60 * 1000;
const PLAN_WAIT_MS = 3 * 60 * 1000;

/**
 * @param {string} command
 * @returns {number | undefined}
 */
export function copilotWaitMs(command) {
  if (command === "build") return BUILD_WAIT_MS;
  if (command === "plan" || command === "spec") return PLAN_WAIT_MS;
  return undefined;
}

/**
 * @param {object} ctx
 * @param {string} ctx.appDir
 * @param {string} ctx.slug
 * @param {string} [ctx.templateDir]
 * @param {string} [ctx.appsDir]
 * @param {import("./models.js").SeatModelOverrides} [ctx.seatModels]
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
  let chosenModel = "";
  let requestedModel = "";
  /** @type {{ slug: string, title: string } | null} */
  let pendingPlan = null;
  let planDraft = "";
  let spoken = "";
  /** @type {import("./models.js").CatalogModel[] | null} */
  let listedModels = null;

  onPreviewCrash((appDir) => {
    if (appDir !== ctx.appDir) return;
    cancelled = true;
  });

  async function sdk() {
    try {
      return await import("@github/copilot-sdk");
    } catch {
      throw new Error(
        "GitHub Copilot is not installed with Clay Studio. Close the window and open Clay Studio again.",
      );
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
    requestedModel = "";
    chosenModel = "";
    sessionHasTools = false;
    sessionGeneration += 1;
  }

  async function copilotClient() {
    if (client) return client;
    const mod = await sdk();
    const CopilotClient =
      mod.CopilotClient ?? mod.default?.CopilotClient ?? mod.default;
    if (!CopilotClient)
      throw new Error("CopilotClient export missing from @github/copilot-sdk");
    const gitHubToken = token();
    client = new CopilotClient({
      gitHubToken: gitHubToken || undefined,
      useLoggedInUser: !gitHubToken,
    });
    return client;
  }

  /**
   * The account catalog, cached after the first successful list.
   */
  async function accountModels() {
    if (listedModels) return listedModels;
    const handle = await copilotClient();
    await handle.start();
    const listed = await handle.listModels();
    listedModels = Array.isArray(listed) ? listed : [];
    return listedModels;
  }

  /**
   * @param {"plan" | "build" | "fast"} phase
   */
  async function modelForAccount(phase) {
    try {
      return resolveCopilotModel(phase, await accountModels(), ctx.seatModels);
    } catch {
      return modelFor(phase, "copilot", ctx.seatModels);
    }
  }

  /**
   * @param {Record<string, unknown>} config
   */
  async function openSession(config) {
    const handle = await copilotClient();
    try {
      chosenModel = String(config.model ?? "");
      return await handle.createSession(config);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        !/not available|unsupported/i.test(message) ||
        config.model === "auto"
      )
        throw error;
      chosenModel = "auto";
      return handle.createSession({ ...config, model: "auto" });
    }
  }

  /**
   * A new process starts a new session. Resuming the saved one would reload its whole transcript.
   *
   * @param {string} command
   * @param {"plan" | "build" | "fast"} phase
   * @param {string} modelId
   * @param {boolean} [fresh]
   */
  async function ensureSession(command, phase, modelId, fresh = false) {
    const needsTools = commandNeedsTools(command);
    if (
      fresh ||
      (session && requestedModel !== modelId) ||
      (needsTools && session && !sessionHasTools)
    ) {
      await dropSession();
      if (phase === "fast") fastTurns = 0;
    }
    if (session) return session;
    const gitHubToken = token();
    const sessionId = `clay-${ctx.slug}-${sessionGeneration}`;
    const defined = previewTools(() => ctx.appDir);
    session = await openSession({
      sessionId,
      model: modelId,
      gitHubToken: gitHubToken || undefined,
      workingDirectory: ctx.appDir,
      onPermissionRequest: (request) => {
        const written = planTextFromWrite(request);
        if ((command === "plan" || command === "spec") && written.length > planDraft.length) planDraft = written;
        return copilotPermissionDecision(request, command, planFolderName(ctx.appDir));
      },
      onExitPlanModeRequest: (request) => acceptPlanDraft(request),
      ...(needsTools
        ? {
            tools: Object.entries(defined).map(([name, tool]) => ({
              name,
              description: tool.description,
              parameters: tool.inputSchema,
              handler: () => tool.execute(),
            })),
          }
        : {}),
    });
    sessionHasTools = needsTools;
    requestedModel = modelId;
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
    const visible = withoutToolPlaceholders(typeof content === "string" ? content : "");
    if (visible) {
      spoken += `${visible}\n`;
      yield makeEvent("assistant_text", { text: visible, agentId });
    } else if (Array.isArray(content)) {
      for (const part of content) {
        const text = withoutToolPlaceholders(typeof part === "string" ? part : part?.text ?? "");
        if (text) {
          spoken += `${text}\n`;
          yield makeEvent("assistant_text", { text, agentId });
        }
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

  /**
   * Copilot's plan mode asks to leave the plan. Clay keeps the draft and asks the person instead.
   * @param {{ planContent?: string }} request
   */
  async function acceptPlanDraft(request) {
    const content =
      withoutToolPlaceholders(request?.planContent ?? "") || withoutToolPlaceholders(request?.summary ?? "");
    if (content) planDraft = content;
    if (pendingPlan && content) {
      await ensureDraftPlan({
        appDir: ctx.appDir,
        slug: pendingPlan.slug,
        title: pendingPlan.title,
        body: content,
      });
    }
    return {
      approved: false,
      feedback: "Clay asks the person to approve this plan before anything is built.",
    };
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
      const modelId =
        command === "run"
          ? modelFor(phase, "copilot", ctx.seatModels)
          : await modelForAccount(phase);
      const runId = `run-${Date.now()}`;
      yield makeEvent("run_started", { runId, agentId, ...runStartFields(command) });
      yield makeEvent("seat", {
        seat: {
          provider: "copilot",
          model: modelId,
          caption: seatCaption("copilot", phase, modelId),
        },
      });

      if (command === "run") {
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
        seat: "copilot",
        thinkFirst: options.thinkFirst === true,
      });

      pendingPlan = command === "plan" && planMeta ? { slug: planMeta.slug, title: planMeta.title } : null;
      planDraft = "";
      spoken = "";
      const handle = await ensureSession(
        command,
        phase,
        modelId,
        phase !== "fast" || fastTurns >= FAST_TURN_LIMIT,
      );
      const usedModel = chosenModel || modelId;
      if (usedModel !== modelId) {
        yield makeEvent("seat", {
          seat: {
            provider: "copilot",
            model: usedModel,
            caption: seatCaption("copilot", phase, usedModel),
          },
        });
      }
      await useModel(handle, usedModel, copilotEffort(phase));
      const payload = command === "plan" ? { prompt: fullPrompt, agentMode: "plan" } : { prompt: fullPrompt };
      if (typeof handle.sendAndWait === "function") {
        const response = await handle.sendAndWait(payload, copilotWaitMs(command));
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
      if (cancelled) {
        yield makeEvent("run_finished", { runId, agentId, status: "cancelled" });
        return;
      }
      if (needsSecurityPass(command)) {
        yield* secureAfterRun({
          appDir: ctx.appDir,
          runId,
          agentId,
          repair: async function* repair(prompt) {
            const sessionHandle = await ensureSession(
              command,
              phase,
              modelId,
              false,
            );
            const payload = { prompt };
            if (typeof sessionHandle.sendAndWait === "function") {
              yield* fromResponse(await sessionHandle.sendAndWait(payload, copilotWaitMs(command)));
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
      if (command === "plan" && planMeta) {
        await ensureDraftPlan({
          appDir: ctx.appDir,
          slug: planMeta.slug,
          title: planMeta.title,
          body: planDraft || spoken,
        });
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
      return makeEvent("summary", {
        text: "Copilot sessions summarize on the service.",
        status: "completed",
      });
    },
    /**
     * Models this Copilot account can run.
     * @returns {Promise<Array<{ id: string, label: string }>>}
     */
    async listModels() {
      return selectableModels(await accountModels());
    },
    async getUsage() {
      return {
        seat: "copilot",
        model: activeModel || modelFor("fast", "copilot", ctx.seatModels),
      };
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
