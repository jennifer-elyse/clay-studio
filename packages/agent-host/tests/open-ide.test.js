import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHost } from "../src/host.js";
import { openCodeInIde, promptDeeplink } from "../src/open-ide.js";
import { copyTemplate } from "../src/preview.js";

const templateDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../templates/web-app");

async function collect(iter) {
  const events = [];
  for await (const event of iter) events.push(event);
  return events;
}

/**
 * @param {string} link
 */
function promptText(link) {
  return decodeURIComponent(link).replaceAll("+", " ");
}

describe("/code opens the IDE", () => {
  test("the prompt deeplink carries the workspace and the request", async () => {
    /** @type {{ command: string, args: string[] }[]} */
    const launches = [];
    const opened = await openCodeInIde(
      {
        appDir: "/tmp/route-board",
        rest: "rename a label",
        platform: "darwin",
        cursorCommand: "/Applications/Cursor.app/Contents/Resources/app/bin/cursor",
      },
      (command, args) => launches.push({ command, args }),
      async () => undefined,
    );
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    expect(opened.prompt).toContain("Use the IDE");
    expect(opened.prompt).toContain("Workspace: /tmp/route-board");
    expect(opened.prompt).toContain("rename a label");
    expect(opened.link).toBe(promptDeeplink(opened.prompt));
    expect(launches[0]).toEqual({
      command: "/Applications/Cursor.app/Contents/Resources/app/bin/cursor",
      args: ["-n", "--classic", "/tmp/route-board"],
    });
    expect(launches[1].command).toBe("open");
    expect(launches[1].args[0]).toContain("cursor://anysphere.cursor-deeplink/prompt");
    expect(promptText(launches[1].args[0])).toContain("rename a label");
  });

  test("the host leaves the prompt in the IDE", async () => {
    const appsDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-apps-"));
    process.env.CLAY_SESSION_PATH = path.join(appsDir, "session.json");
    process.env.CLAY_PROFILE_DIR = path.join(appsDir, "profile");
    await copyTemplate({ slug: "demo", appsDir, templateDir });
    /** @type {{ command: string, args: string[] }[]} */
    const launches = [];
    const host = await createHost({
      slug: "demo",
      seat: "mock",
      appsDir,
      templateDir,
      launchIde: (command, args) => launches.push({ command, args }),
      waitIde: async () => undefined,
    });
    const events = await collect(host.send("/code rename a label"));
    expect(events.some((event) => event.type === "user_text" && event.text === "/code rename a label")).toBe(true);
    expect(events.some((event) => event.text?.includes("Opened in the IDE"))).toBe(true);
    expect(events.some((event) => event.text?.includes("Use the IDE for:"))).toBe(false);
    expect(launches[0].args).toContain(host.appDir);
    expect(promptText(launches[1].args.at(-1) ?? "")).toContain("rename a label");
  });
});
