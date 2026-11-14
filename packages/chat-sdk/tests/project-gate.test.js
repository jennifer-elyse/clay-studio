import { folderDirectoryLabel, folderFromName, joinPath, orderFolderEntries, pathLeaf, pathParent, planNeedsProject } from "../src/project-gate.js";

describe("project gate", () => {
  test("shows the user directory, with Projects and known projects first", () => {
    expect(folderDirectoryLabel("/Users/jennk")).toBe("~");
    expect(folderDirectoryLabel("/Users/jennk/Projects")).toBe("~/Projects");
    expect(folderDirectoryLabel("/Users/jennk/Projects/route-board")).toBe("~/Projects/route-board");
    expect(folderDirectoryLabel("")).toBe("~/Projects");
    expect(orderFolderEntries([{ name: "Desktop" }, { name: "Documents" }, { name: "Projects" }]).map((entry) => entry.name)).toEqual([
      "Projects",
      "Desktop",
      "Documents",
    ]);
    expect(
      orderFolderEntries(
        [{ name: "frostly" }, { name: "studio-app" }, { name: "glasshouse" }],
        ["studio-app", "route-board-renamed"],
      ).map((entry) => entry.name),
    ).toEqual(["studio-app", "frostly", "glasshouse"]);
  });

  test("turns a name into a folder", () => {
    expect(folderFromName("Request tracker")).toBe("request-tracker");
    expect(folderFromName("")).toBe("");
    expect(joinPath("/Users/me/Projects", "route-board")).toBe("/Users/me/Projects/route-board");
    expect(pathLeaf("/Users/me/Projects/route-board")).toBe("route-board");
    expect(pathParent("/Users/me/Projects/route-board")).toBe("/Users/me/Projects");
  });

  test("planning needs a selected project or a name", () => {
    expect(planNeedsProject({ project: null, projects: [], name: "" }).ok).toBe(false);
    expect(planNeedsProject({ project: null, projects: [{ id: "a" }], name: "" }).message).toMatch(/Choose a project/);
    expect(planNeedsProject({ project: null, projects: [], name: "  Cooler  " })).toEqual({
      ok: true,
      projectName: "Cooler",
    });
    expect(planNeedsProject({ project: { id: "a" }, name: "" })).toEqual({ ok: true });
  });
});
