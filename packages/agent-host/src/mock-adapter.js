import { makeEvent } from "./events.js";
import { modelFor } from "./models.js";
import {
  assertBuildAllowed,
  listPlans,
  nextPlanSlug,
  setPlanStatus,
  writePlan,
} from "./plan-gate.js";
import { copyTemplate, getPreview, startFixturePreview, startPreview, stopPreview } from "./preview.js";

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
      yield makeEvent("run_started", { runId, agentId });
      yield makeEvent("seat", {
        seat: {
          provider: "mock",
          model: modelFor(command === "plan" ? "plan" : "build", "mock"),
          caption: "Mock seat — sign in with Cursor or Copilot to use your account.",
        },
      });

      if (command === "plan") {
        yield makeEvent("step", { step: { label: "Reading your vision", status: "running" } });
        await delay(40);
        if (cancelled) return;
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
        if (cancelled) return;
        yield makeEvent("step", { step: { label: "Following the approved plan", status: "done" } });
        yield makeEvent("assistant_text", {
          text: `Built against ${approved.title}. Press Run to open it locally.`,
        });
      } else if (command === "run") {
        yield makeEvent("preview", { preview: { status: "starting" } });
        const handle =
          process.env.CLAY_PREVIEW_FIXTURE === "1"
            ? await startFixturePreview(undefined, ctx.appDir)
            : await startPreview({
                appDir: ctx.appDir,
                install: process.env.CLAY_SKIP_INSTALL !== "1",
              });
        yield makeEvent("preview", { preview: { status: "ready", url: handle.url } });
        yield makeEvent("assistant_text", { text: `It's running at ${handle.url}` });
      } else if (command === "docs") {
        const plans = await listPlans(ctx.appDir);
        const lines = plans.map((plan) => `- ${plan.status}: ${plan.title}`).join("\n") || "- No plans yet.";
        yield makeEvent("assistant_text", {
          text: `Vision, design, and the ERD live in docs/. Plans:\n${lines}`,
        });
      } else if (command === "fix") {
        yield makeEvent("step", { step: { label: "Looking at the preview", status: "running" } });
        await delay(40);
        yield makeEvent("step", { step: { label: "Looking at the preview", status: "done" } });
        yield makeEvent("assistant_text", {
          text: rest
            ? `Noted: “${rest}”. In a live seat I'd patch the UI. Mock seat records the request.`
            : "Tell me which screen looks wrong.",
        });
      } else if (command === "search") {
        yield makeEvent("assistant_text", {
          text: rest
            ? `Mock search for “${rest}”: docs/vision.md, docs/erd.md, server/requests.js.`
            : "What should I search for?",
        });
      } else if (command === "think") {
        yield makeEvent("step", { step: { label: "Thinking it through", status: "running" } });
        await delay(40);
        yield makeEvent("step", { step: { label: "Thinking it through", status: "done" } });
        yield makeEvent("assistant_text", {
          text: rest
            ? `If I were planning “${rest}”, I'd keep the Clay starter and write a /plan first.`
            : "Ask me to think about a workflow, then we can /plan it.",
        });
      } else if (command === "write") {
        yield makeEvent("assistant_text", {
          text: rest
            ? `I'd draft that into docs/ (not code): ${rest}`
            : "What copy or doc should we write?",
        });
      } else if (command === "code") {
        yield makeEvent("assistant_text", {
          text: rest
            ? `Mock seat would edit JS for: ${rest}. New features still need an approved /plan.`
            : "What should we change in the code?",
        });
      } else if (command === "image") {
        yield makeEvent("assistant_text", {
          text: rest
            ? `Picture: a warm clay-studio screen showing “${rest}” with the mascot in the corner. Synthetic only.`
            : "What should the picture show?",
        });
      } else {
        yield makeEvent("assistant_text", {
          text: rest
            ? `I can Plan, Build, or Run that. You said: “${rest}”.`
            : "What should we mold? Try Plan.",
        });
      }

      if (!cancelled) {
        yield makeEvent("run_finished", { runId, agentId, status: "finished" });
      }
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
    getPreview: () => getPreview(ctx.appDir),
    stopPreview: () => stopPreview(ctx.appDir),
    ensureWorkspace: async () => {
      ctx.appDir = await copyTemplate({ slug: ctx.slug, templateDir: ctx.templateDir });
      return ctx.appDir;
    },
  };
}
