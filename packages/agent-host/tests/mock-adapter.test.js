import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHost } from "../src/host.js";
import { copyTemplate } from "../src/preview.js";

const templateDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../templates/web-app");

async function collect(iter) {
  const events = [];
  for await (const event of iter) events.push(event);
  return events;
}

describe("mock host", () => {
  test("plan then build is gated", async () => {
    const appsDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-apps-"));
    process.env.CLAY_STUDIO_SEAT = "mock";
    process.env.CLAY_SESSION_PATH = path.join(appsDir, "session.json");
    process.env.CLAY_PROFILE_DIR = path.join(appsDir, "profile");
    await copyTemplate({ slug: "demo", appsDir, templateDir });
    const host = await createHost({ slug: "demo", seat: "mock", appsDir, templateDir });

    const blocked = await collect(host.send("/build"));
    expect(blocked.some((e) => e.type === "error")).toBe(true);

    const planned = await collect(host.send("/plan request tracker"));
    const planEvent = planned.find((e) => e.type === "plan");
    expect(planEvent?.plan?.status).toBe("draft");

    expect(host.snapshot().done).toEqual({ plan: false, build: false });
    await host.approvePlan(planEvent.plan.path);
    expect(host.snapshot().done).toEqual({ plan: true, build: false });
    const built = await collect(host.send("/build"));
    expect(built.some((e) => e.type === "assistant_text")).toBe(true);
    expect(built.some((e) => e.type === "error")).toBe(false);
    expect(host.snapshot().done).toEqual({ plan: true, build: true });

    const other = await host.saveProject({ name: "Other", folder: "other-app" });
    expect(host.snapshot().project?.id).toBe(other.id);
    expect(host.snapshot().done).toEqual({ plan: false, build: false });
    const demo = host.snapshot().projects.find((project) => project.folder === "demo");
    await host.selectProject(demo.id);
    expect(host.snapshot().done).toEqual({ plan: true, build: true });

    const again = await createHost({ slug: "demo", seat: "mock", appsDir, templateDir });
    expect(again.snapshot().done).toEqual({ plan: true, build: true });
  });

  test("help, settings, and clear", async () => {
    const appsDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-apps-"));
    process.env.CLAY_SESSION_PATH = path.join(appsDir, "session.json");
    process.env.CLAY_PROFILE_DIR = path.join(appsDir, "profile");
    const host = await createHost({ slug: "cmds", seat: "mock", appsDir, templateDir });
    const help = await collect(host.send("/help"));
    expect(help.some((e) => e.text?.includes("/spec"))).toBe(true);
    expect(help.some((e) => e.text?.includes("/plan"))).toBe(true);
    const spec = await collect(host.send("/spec intake form"));
    const said = spec.find((event) => event.text?.includes("spec.md"));
    const match = said?.text?.match(/docs\/plans\/\S+?spec\.md/);
    expect(match?.[0]).toMatch(/spec\.md$/);
    const raw = await fs.readFile(path.join(host.appDir, match[0]), "utf8");
    expect(raw).toContain("status: draft");
    expect(raw).toContain("AC-1");
    const settings = await collect(host.send("/settings"));
    expect(settings.some((e) => e.text?.includes("Seat: mock"))).toBe(true);
    const cleared = await collect(host.send("/clear"));
    expect(cleared.some((e) => e.type === "clear")).toBe(true);
    const reset = await collect(host.send("/reset"));
    expect(reset.some((e) => e.type === "user_text" && e.text === "/reset")).toBe(true);
    expect(reset.some((e) => e.type === "assistant_text" && e.text?.includes("Fresh agent"))).toBe(true);
  });

  test("a brain runs think before plan or fix", async () => {
    const appsDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-apps-"));
    process.env.CLAY_SESSION_PATH = path.join(appsDir, "session.json");
    process.env.CLAY_PROFILE_DIR = path.join(appsDir, "profile");
    const host = await createHost({ slug: "think-first", seat: "mock", appsDir, templateDir });
    const plain = await collect(host.send("/plan intake form"));
    const plainSaid = plain.filter((event) => event.type === "user_text").map((event) => event.text);
    expect(plainSaid).toEqual(["/plan intake form"]);

    const planned = await collect(host.send({ prompt: "/plan intake form", thinkFirst: true }));
    const said = planned.filter((event) => event.type === "user_text").map((event) => event.text);
    expect(said).toEqual(["/think intake form", "/plan intake form"]);
    expect(planned.some((event) => event.text?.includes("If I were planning"))).toBe(true);
    expect(planned.some((event) => event.type === "plan")).toBe(true);

    const fixedPlain = await collect(host.send("/fix the button"));
    const fixedPlainSaid = fixedPlain.filter((event) => event.type === "user_text").map((event) => event.text);
    expect(fixedPlainSaid).toEqual(["/fix the button"]);

    const fixed = await collect(host.send({ prompt: "/fix the button", thinkFirst: true }));
    const fixedSaid = fixed.filter((event) => event.type === "user_text").map((event) => event.text);
    expect(fixedSaid).toEqual(["/think the button", "/fix the button"]);
  });

  test("cancel stops a plan and resend starts a fresh turn", async () => {
    const appsDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-apps-"));
    process.env.CLAY_SESSION_PATH = path.join(appsDir, "session.json");
    process.env.CLAY_PROFILE_DIR = path.join(appsDir, "profile");
    const host = await createHost({ slug: "turns", seat: "mock", appsDir, templateDir });
    const started = host.snapshot().agentId;

    const iter = host.send("/plan request tracker");
    const seen = [];
    for (;;) {
      const next = await iter.next();
      if (next.done) break;
      seen.push(next.value);
      if (next.value.type === "step") break;
    }
    await host.cancel();
    for (;;) {
      const next = await iter.next();
      if (next.done) break;
      seen.push(next.value);
    }
    expect(seen.at(-1)).toMatchObject({ type: "run_finished", status: "cancelled" });
    expect(seen.some((event) => event.type === "plan")).toBe(false);
    expect(host.busy).toBe(false);
    expect(host.snapshot().agentId).toBe(started);

    const resent = await collect(host.send({ prompt: "hello again", replaceId: "u1" }));
    expect(resent.some((event) => event.type === "user_text" && event.text === "hello again")).toBe(true);
    expect(host.snapshot().agentId).not.toBe(started);
  });
});
