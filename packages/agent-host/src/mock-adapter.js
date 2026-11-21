import { makeEvent, runStartFields } from "./events.js";
import { modelFor, phaseFor } from "./models.js";
import {
  assertBuildAllowed,
  nextPlanSlug,
  setPlanStatus,
  writePlan,
  writeSpec,
} from "./plan-gate.js";
import { containPreview, copyTemplate, getPreview, stopPreview } from "./preview.js";

/**
 * @param {number} ms
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {object} ctx
 * @param {string} ctx.appDir
 * @param {string} ctx.slug
 * @param {string} [ctx.templateDir]
 */
export function createMockAdapter(ctx) {
  let cancelled = false;
  let agentId = `mock-${ctx.slug}`;

  return {
    provider: /** @type {const} */ ("mock"),
    get agentId() {
      return agentId;
    },
    /**
     * @param {string} _prompt
     * @param {object} options
     * @param {string} [options.command]
     * @param {string} [options.rest]
     * @returns {AsyncGenerator<import("./events.js").UiEvent>}
     */
    async *send(_prompt, options = {}) {
      cancelled = false;
      const command = options.command ?? "chat";
      const rest = options.rest ?? "";
      const runId = `run-${Date.now()}`;
      yield makeEvent("run_started", { runId, agentId, ...runStartFields(command) });
      yield makeEvent("seat", {
        seat: {
          provider: "mock",
          model: modelFor(phaseFor(command), "mock"),
          caption: "Mock seat — sign in with Cursor or Copilot to use your account.",
        },
      });

      if (options.thinkFirst) {
        const text =
          command === "plan"
            ? `If I were planning “${rest}”, I'd keep the Clay starter and write a /speckit.plan first.`
            : `Reasoning first for ${command}${rest ? `: ${rest}` : ""}.`;
        yield makeEvent("assistant_text", { text });
      }

      if (command === "spec") {
        const title = rest || "First slice of the app";
        const slug = await nextPlanSlug(ctx.appDir, title);
        const body = [
          "## Outcome",
          "",
          title,
          "",
          "## Scope",
          "",
          "In:",
          "",
          "- The behavior the person asked for.",
          "",
          "Out:",
          "",
          "- Production credentials, APIM, and real customer data.",
          "",
          "## Behavior",
          "",
          "A person can see the result of this slice in the running app.",
          "",
          "## Acceptance criteria",
          "",
          "- [ ] AC-1: The slice does what was asked, with no extra behavior.",
        ].join("\n");
        const spec = await writeSpec({ appDir: ctx.appDir, slug, title, body });
        const relative = spec.path.replace(`${ctx.appDir}/`, "");
        yield makeEvent("assistant_text", {
          text: `Draft spec is ready at ${relative}. /speckit.plan can turn it into an approach.`,
        });
      } else if (command === "plan") {
        yield makeEvent("step", { step: { label: "Reading your vision", status: "running" } });
        await delay(40);
        if (cancelled) {
          yield makeEvent("run_finished", { runId, agentId, status: "cancelled" });
          return;
        }
        const title = rest || "First slice of the app";
        const slug = await nextPlanSlug(ctx.appDir, title);
        const body = [
          "## Goal",
          "",
          title,
          "",
          "## Approach",
          "",
          "1. Keep the Clay starter (React + Express + PGlite).",
          "2. Shape the request tracker for this workflow.",
          "3. Stay on localhost until a developer promotes it.",
          "",
          "## Out of scope",
          "",
          "Production credentials, APIM, and real customer data.",
        ].join("\n");
        const plan = await writePlan({ appDir: ctx.appDir, slug, title, body });
        yield makeEvent("step", { step: { label: "Reading your vision", status: "done" } });
        yield makeEvent("plan", { plan });
        yield makeEvent("assistant_text", {
          text: "Draft plan is ready. Approve it and I can build.",
        });
      } else if (command === "build") {
        const approved = await assertBuildAllowed(ctx.appDir);
        yield makeEvent("step", { step: { label: "Following the approved plan", status: "running" } });
        await delay(40);
        if (cancelled) {
          yield makeEvent("run_finished", { runId, agentId, status: "cancelled" });
          return;
        }
        yield makeEvent("step", { step: { label: "Following the approved plan", status: "done" } });
        yield makeEvent("assistant_text", {
          text: `Built against ${approved.title}. Press Run to open it locally.`,
        });
      } else if (command === "run") {
        yield makeEvent("preview", { preview: { status: "starting" } });
        const opened = await containPreview({
          appDir: ctx.appDir,
          install: process.env.CLAY_SKIP_INSTALL !== "1",
          fixture: process.env.CLAY_PREVIEW_FIXTURE === "1",
        });
        if (!opened.ok) {
          yield makeEvent("preview", { preview: { status: "error", message: opened.message } });
          yield makeEvent("run_finished", { runId, agentId, status: "error" });
          return;
        }
        yield makeEvent("preview", { preview: { status: "ready", url: opened.url } });
        yield makeEvent("assistant_text", { text: `It's running at ${opened.url}` });
      } else if (command === "constitution") {
        yield makeEvent("assistant_text", {
          text: rest
            ? `Constitution noted: ${rest}. Later steps are judged against it.`
            : "Tell me the principles this app should follow.",
        });
      } else if (command === "clarify") {
        yield makeEvent("assistant_text", {
          text: rest
            ? `One question on ${rest}: who can change this, and what happens when they cannot?`
            : "Which part of the spec should we clarify?",
        });
      } else if (command === "checklist") {
        yield makeEvent("assistant_text", {
          text: "Checklist: the spec names who acts, what changes, and what is out of scope.",
        });
      } else if (command === "tasks") {
        yield makeEvent("assistant_text", {
          text: "Tasks: setup, then the first user story, then polish. Nothing is implemented yet.",
        });
      } else if (command === "analyze") {
        yield makeEvent("assistant_text", {
          text: "Analyze: the spec, plan, and tasks agree. No files were changed.",
        });
      } else if (command === "converge") {
        yield makeEvent("assistant_text", {
          text: "Converged. The implementation satisfies the spec, plan, and tasks.",
        });
      } else if (command === "think") {
        yield makeEvent("step", { step: { label: "Thinking it through", status: "running" } });
        await delay(40);
        yield makeEvent("step", { step: { label: "Thinking it through", status: "done" } });
        yield makeEvent("assistant_text", {
          text: rest
            ? `If I were planning “${rest}”, I'd keep the Clay starter and write a /speckit.plan first.`
            : "Ask me to think about a workflow, then we can /speckit.plan it.",
        });
      } else {
        yield makeEvent("assistant_text", {
          text: rest
            ? `Specify, plan, or implement that. You said: “${rest}”.`
            : "What should we mold? Try Specify.",
        });
      }

      yield makeEvent("run_finished", {
        runId,
        agentId,
        status: cancelled ? "cancelled" : "finished",
      });
    },
    async cancel() {
      cancelled = true;
    },
    async reset() {
      agentId = `mock-${ctx.slug}-${Date.now()}`;
      cancelled = false;
    },
    async approvePlan(planPath) {
      const updated = await setPlanStatus(planPath, "approved");
      return makeEvent("plan", {
        plan: {
          id: updated.front?.title ? planPath : planPath,
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
      return makeEvent("summary", { text: "Mock session: plan, approve, build, run.", status: "completed" });
    },
    async getUsage() {
      return { seat: "mock", included: true };
    },
    /**
     * Demo mode has no account catalog.
     * @returns {Promise<Array<{ id: string, label: string }>>}
     */
    async listModels() {
      return [];
    },
    getPreview: () => getPreview(ctx.appDir),
    stopPreview: () => stopPreview(ctx.appDir),
    ensureWorkspace: async () => {
      ctx.appDir = await copyTemplate({ slug: ctx.slug, templateDir: ctx.templateDir, appsDir: ctx.appsDir });
      return ctx.appDir;
    },
  };
}
