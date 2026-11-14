import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { browseDirectories, projectSlug } from "../src/directories.js";

describe("project folders", () => {
  test("slugs a project name", () => {
    expect(projectSlug("Route Board")).toBe("route-board");
    expect(projectSlug("!!!")).toBe("");
  });

  test("defaults a new project to the user's Projects directory", async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "clay-home-"));
    await fs.mkdir(path.join(home, "Projects", "frostly"), { recursive: true });
    const listing = await browseDirectories({
      name: "Route Board",
      home,
      repoRoot: path.join(home, "clay-studio"),
    });
    expect(listing.path).toBe(path.join(home, "Projects"));
    expect(listing.selected).toBe(path.join(home, "Projects", "route-board"));
    expect(listing.pending).toBe("route-board");
    expect(listing.parent).toBe(home);
    expect(listing.entries.map((entry) => entry.name)).toEqual(["frostly"]);
    expect(listing.blocked).toBe(false);
    expect(listing.missing).toBe(false);
  });

  test("opens a chosen folder and keeps the slugged name inside it", async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "clay-home-"));
    const picked = path.join(home, "Projects", "frostly");
    await fs.mkdir(picked, { recursive: true });
    const listing = await browseDirectories({
      path: picked,
      leaf: "kept-name",
      name: "Route Board",
      home,
      repoRoot: path.join(home, "clay-studio"),
    });
    expect(listing.path).toBe(picked);
    expect(listing.selected).toBe(path.join(picked, "kept-name"));
    expect(listing.parent).toBe(path.join(home, "Projects"));
  });

  test("marks a folder inside Clay as blocked", async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "clay-home-"));
    const repo = path.join(home, "clay-studio");
    await fs.mkdir(repo, { recursive: true });
    const listing = await browseDirectories({ path: repo, name: "Nope", home, repoRoot: repo });
    expect(listing.blocked).toBe(true);
    expect(listing.selected).toBe(path.join(repo, "nope"));
  });

  test("keeps the default path when Projects does not exist yet", async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "clay-home-"));
    const listing = await browseDirectories({ name: "Hi", home, repoRoot: path.join(home, "repo") });
    expect(listing.missing).toBe(true);
    expect(listing.entries).toEqual([]);
    expect(listing.selected).toBe(path.join(home, "Projects", "hi"));
    expect(listing.pending).toBe("hi");
  });

  test("shows the user directory with Projects first", async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "clay-home-"));
    await fs.mkdir(path.join(home, "Desktop"));
    await fs.mkdir(path.join(home, "Documents"));
    await fs.mkdir(path.join(home, "Projects"));
    const listing = await browseDirectories({ path: home, home, repoRoot: path.join(home, "repo") });
    expect(listing.label).toBe("~");
    expect(listing.entries.map((entry) => entry.name)).toEqual(["Projects", "Desktop", "Documents"]);
  });

  test("lists Clay projects before other folders", async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "clay-home-"));
    const projects = path.join(home, "Projects");
    await fs.mkdir(path.join(projects, "notes"), { recursive: true });
    await fs.mkdir(path.join(projects, "studio-app"));
    await fs.writeFile(path.join(projects, "studio-app", "AGENTS.md"), "# Clay\n");
    const listing = await browseDirectories({ home, repoRoot: path.join(home, "clay-studio") });
    expect(listing.entries.map((entry) => entry.name)).toEqual(["studio-app", "notes"]);
    expect(listing.entries[0].project).toBe(true);
  });

  test("lists known projects before other folders", async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), "clay-home-"));
    await fs.mkdir(path.join(home, "Projects", "frostly"), { recursive: true });
    await fs.mkdir(path.join(home, "Projects", "studio-app"));
    const listing = await browseDirectories({
      home,
      first: ["studio-app"],
      repoRoot: path.join(home, "clay-studio"),
    });
    expect(listing.label).toBe(path.join("~", "Projects"));
    expect(listing.entries.map((entry) => entry.name)).toEqual(["studio-app", "frostly"]);
    expect(listing.entries[0].project).toBe(true);
    expect(listing.entries[1].project).toBe(false);
  });

  test("refuses a folder name that leaves the directory", async () => {
    await expect(browseDirectories({ leaf: "../etc" })).rejects.toThrow(/single name/);
  });
});
