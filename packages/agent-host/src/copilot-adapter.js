import { makeEvent } from "./events.js";
import { COPILOT_MODEL } from "./models.js";
import { assertBuildAllowed, nextPlanSlug, setPlanStatus } from "./plan-gate.js";
import { copyTemplate, getPreview, previewTools, startPreview, stopPreview } from "./preview.js";
import { needsSecurityPass, secureAfterRun } from "./npm-security.js";
import { promptFor } from "./prompts.js";

const CAPTION =
  "Copilot seat — plans are still required; coding uses Copilot models, not Grok 4.7 High.";

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

  async function ensureSession() {
    if (session) return session;
    const mod = await sdk();
    const CopilotClient = mod.CopilotClient ?? mod.default?.CopilotClient ?? mod.default;
    if (!CopilotClient) throw new Error("CopilotClient export missing from @github/copilot-sdk");
    const gitHubToken = token();
    client = new CopilotClient({
      gitHubToken: gitHubToken || undefined,
      useLoggedInUser: !gitHubToken,
    });
    const sessionId = `clay-${ctx.slug}`;
    try {
      session = await client.resumeSession?.(sessionId);
    } catch {
      session = null;
    }
    if (!session) {
      session = await client.createSession({
        sessionId,
        model: COPILOT_MODEL,
        gitHubToken: gitHubToken || undefined,
        workingDirectory: ctx.appDir,
        availableTools: Object.keys(previewTools(() => ctx.appDir)),
      });
    }
    agentId = session.sessionId ?? session.id ?? sessionId;
    return session;
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
      const runId = `run-${Date.now()}`;
      yield makeEvent("run_started", { runId, agentId });
      yield makeEvent("seat", {
        seat: { provider: "copilot", model: COPILOT_MODEL, caption: CAPTION },
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

      const handle = await ensureSession();
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
            const sessionHandle = await ensureSession();
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
        return;
      }
      yield makeEvent("run_finished", { runId, agentId, status: "finished" });
    },
    async cancel() {
      cancelled = true;
    },
    async reset() {
      session = null;
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
      return { seat: "copilot", model: COPILOT_MODEL };
    },
    getPreview: () => getPreview(ctx.appDir),
    stopPreview: () => stopPreview(ctx.appDir),
    ensureWorkspace: async () => {
      ctx.appDir = await copyTemplate({ slug: ctx.slug, templateDir: ctx.templateDir, appsDir: ctx.appsDir });
      return ctx.appDir;
    },
  };
}
