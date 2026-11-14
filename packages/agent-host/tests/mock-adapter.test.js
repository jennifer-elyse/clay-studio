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
    await copyTemplate({ slug: "demo", appsDir, templateDir });
    const host = await createHost({ slug: "demo", seat: "mock", appsDir, templateDir });

    const blocked = await collect(host.send("/build"));
    expect(blocked.some((e) => e.type === "error")).toBe(true);

    const planned = await collect(host.send("/plan request tracker"));
    const planEvent = planned.find((e) => e.type === "plan");
    expect(planEvent?.plan?.status).toBe("draft");

    await host.approvePlan(planEvent.plan.path);
    const built = await collect(host.send("/build"));
    expect(built.some((e) => e.type === "assistant_text")).toBe(true);
    expect(built.some((e) => e.type === "error")).toBe(false);
  });

  test("help, settings, and clear", async () => {
    const appsDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-apps-"));
    process.env.CLAY_SESSION_PATH = path.join(appsDir, "session.json");
    const host = await createHost({ slug: "cmds", seat: "mock", appsDir, templateDir });
    const help = await collect(host.send("/help"));
    expect(help.some((e) => e.text?.includes("/plan"))).toBe(true);
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
    const host = await createHost({ slug: "think-first", seat: "mock", appsDir, templateDir });
    const planned = await collect(host.send({ prompt: "/plan intake form", thinkFirst: true }));
    const said = planned.filter((event) => event.type === "user_text").map((event) => event.text);
    expect(said).toEqual(["/think intake form", "/plan intake form"]);
    expect(planned.some((event) => event.text?.includes("If I were planning"))).toBe(true);
    expect(planned.some((event) => event.type === "plan")).toBe(true);

    const fixed = await collect(host.send({ prompt: "/fix the button", thinkFirst: true }));
    const fixedSaid = fixed.filter((event) => event.type === "user_text").map((event) => event.text);
    expect(fixedSaid).toEqual(["/think the button", "/fix the button"]);
  });
});
