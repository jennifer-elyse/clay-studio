import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHost } from "../src/host.js";
import { installationProfileDir, projectsPath } from "../src/projects.js";

const templateDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../templates/web-app");

async function collect(iter) {
  const events = [];
  for await (const event of iter) events.push(event);
  return events;
}

/**
 * @returns {Promise<{ appsDir: string, host: Awaited<ReturnType<typeof createHost>> }>}
 */
async function bareHost() {
  const appsDir = await fs.mkdtemp(path.join(os.tmpdir(), "clay-projects-"));
  const profileDir = path.join(appsDir, "profile");
  process.env.CLAY_STUDIO_SEAT = "mock";
  process.env.CLAY_SESSION_PATH = path.join(appsDir, "session.json");
  process.env.CLAY_PROFILE_DIR = profileDir;
  const host = await createHost({ seat: "mock", appsDir, templateDir });
  return { appsDir, profileDir, host };
}

describe("named projects", () => {
  test("the project cache stays on the installation profile", async () => {
    const previousProfile = process.env.CLAY_PROFILE_DIR;
    delete process.env.CLAY_PROFILE_DIR;
    expect(installationProfileDir()).toBe(path.join(os.homedir(), ".clay", "studio"));
    expect(projectsPath()).toBe(path.join(os.homedir(), ".clay", "studio", "projects.json"));
    if (previousProfile === undefined) delete process.env.CLAY_PROFILE_DIR;
    else process.env.CLAY_PROFILE_DIR = previousProfile;

    const { appsDir, profileDir, host } = await bareHost();
    await host.saveProject({ name: "Request tracker", folder: "tracker" });
    const saved = JSON.parse(await fs.readFile(path.join(profileDir, "projects.json"), "utf8"));
    expect(saved.projects.map((project) => project.name)).toEqual(["Request tracker"]);
    await expect(fs.access(path.join(appsDir, "projects.json"))).rejects.toThrow();

    const again = await createHost({ seat: "mock", appsDir, templateDir });
    expect(again.snapshot().projects.map((project) => project.folder)).toEqual(["tracker"]);
    expect(again.snapshot().project?.name).toBe("Request tracker");
  });

  test("planning waits for a project or a name", async () => {
    const { appsDir, host } = await bareHost();
    expect(host.snapshot().project).toBeNull();

    const blocked = await collect(host.send("/plan cooler requests"));
    expect(blocked.some((event) => event.type === "error" && event.text?.includes("Name a project"))).toBe(true);
    expect(blocked.some((event) => event.type === "plan")).toBe(false);

    const named = await collect(host.send({ prompt: "/plan cooler requests", projectName: "Cooler requests" }));
    expect(named.some((event) => event.type === "plan")).toBe(true);
    const snap = host.snapshot();
    expect(snap.project?.name).toBe("Cooler requests");
    expect(snap.project?.folder).toBe("cooler-requests");
    expect(snap.projects.map((project) => project.name)).toEqual(["Cooler requests"]);
    await expect(fs.access(path.join(appsDir, "cooler-requests", "AGENTS.md"))).resolves.toBeUndefined();
  });

  test("a project can be added, chosen, and given a new folder", async () => {
    const { appsDir, host } = await bareHost();
    const first = await host.saveProject({ name: "Request tracker", folder: "tracker" });
    const second = await host.saveProject({ name: "Route board", folder: "routes" });
    expect(host.snapshot().projects).toHaveLength(2);
    expect(host.snapshot().project?.id).toBe(second.id);

    await host.selectProject(first.id);
    expect(host.appDir).toBe(path.join(appsDir, "tracker"));

    const renamed = await host.saveProject({ id: first.id, name: "Store requests", folder: "store-requests" });
    expect(renamed.folder).toBe("store-requests");
    expect(host.appDir).toBe(path.join(appsDir, "store-requests"));
    await expect(fs.access(path.join(appsDir, "tracker"))).rejects.toThrow();
    await expect(fs.access(path.join(appsDir, "store-requests", "AGENTS.md"))).resolves.toBeUndefined();

    const planned = await collect(host.send("/plan extra pallet"));
    expect(planned.some((event) => event.type === "plan")).toBe(true);
    expect(planned.some((event) => event.type === "error")).toBe(false);
  });

  test("a chosen folder becomes the project directory", async () => {
    const { appsDir, host } = await bareHost();
    const destParent = await fs.mkdtemp(path.join(os.tmpdir(), "clay-chosen-"));
    const chosen = path.join(destParent, "route-board");
    const saved = await host.saveProject({ name: "Route board", folder: chosen });
    expect(saved.folder).toBe("route-board");
    expect(saved.appDir).toBe(chosen);
    expect(host.appDir).toBe(chosen);
    await expect(fs.access(path.join(appsDir, "route-board"))).rejects.toThrow();
    await expect(fs.access(path.join(chosen, "AGENTS.md"))).resolves.toBeUndefined();

    const moved = path.join(destParent, "nested", "route-board");
    const edited = await host.saveProject({ id: saved.id, name: "Route board", folder: moved });
    expect(edited.appDir).toBe(moved);
    await expect(fs.access(chosen)).rejects.toThrow();
    await expect(fs.access(path.join(moved, "AGENTS.md"))).resolves.toBeUndefined();

    const again = await createHost({ seat: "mock", appsDir, templateDir });
    expect(again.appDir).toBe(moved);
  });

  test("a project cannot be placed inside Clay", async () => {
    const { host } = await bareHost();
    await expect(host.saveProject({ name: "Inside", folder: templateDir })).rejects.toThrow(/outside/);
  });
});

describe("projects folder setting", () => {
  test("a new folder takes new projects and existing projects stay put", async () => {
    const { appsDir, host } = await bareHost();
    const first = await host.saveProject({ name: "Alpha" });
    const other = await fs.mkdtemp(path.join(os.tmpdir(), "clay-root-"));
    process.env.CLAY_PROFILE_DIR = path.join(other, "profile");
    await host.setProjectsRoot(other);
    expect(host.projectsRoot).toBe(other);
    const second = await host.saveProject({ name: "Beta" });
    expect(second.appDir).toBe(path.join(other, "beta"));
    const listed = host.snapshot().projects.find((project) => project.id === first.id);
    expect(listed.appDir).toBe(path.join(appsDir, "alpha"));
  });

  test("a missing folder is refused", async () => {
    const { appsDir, host } = await bareHost();
    await expect(host.setProjectsRoot(path.join(appsDir, "nope"))).rejects.toThrow("does not exist");
  });
});
