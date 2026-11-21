import { copilotPermissionDecision, planTextFromWrite, withoutToolPlaceholders } from "../src/copilot-plan.js";

describe("copilot plan tools", () => {
  test("placeholder tags are not plan text", () => {
    const text = withoutToolPlaceholders("## Goal\n\n<invoke_tool_placeholder>\nShip it.\n</invoke_tool_placeholder>");
    expect(text).toBe("## Goal\n\nShip it.");
    expect(withoutToolPlaceholders("<invoke_tool_placeholder></invoke_tool_placeholder>")).toBe("");
  });

  test("a plan may write its own file and nothing else", () => {
    const write = copilotPermissionDecision(
      { kind: "write", fileName: "docs/route-board-plan/001-intake/plan.md" },
      "plan",
      "route-board-plan",
    );
    expect(write).toEqual({ kind: "approve-once" });
    const code = copilotPermissionDecision(
      { kind: "write", fileName: "client/src/App.jsx" },
      "plan",
      "route-board-plan",
    );
    expect(code.kind).toBe("reject");
    const folder = copilotPermissionDecision(
      { kind: "shell", fullCommandText: "mkdir -p docs/route-board-plan/001-intake", commands: [{ identifier: "mkdir" }] },
      "plan",
      "route-board-plan",
    );
    expect(folder).toEqual({ kind: "approve-once" });
    const shell = copilotPermissionDecision(
      { kind: "shell", fullCommandText: "npm test", commands: [{ identifier: "npm" }] },
      "plan",
      "route-board-plan",
    );
    expect(shell.kind).toBe("reject");
    expect(copilotPermissionDecision({ kind: "read" }, "plan", "route-board-plan")).toEqual({ kind: "approve-once" });
  });

  test("analyze only reads, converge only appends tasks, and the constitution is one project file", () => {
    expect(copilotPermissionDecision({ kind: "write", fileName: "docs/app-plan/001/spec.md" }, "analyze", "app-plan").kind).toBe("reject");
    expect(copilotPermissionDecision({ kind: "write", fileName: "client/src/App.jsx" }, "converge", "app-plan").kind).toBe("reject");
    expect(copilotPermissionDecision({ kind: "write", fileName: "docs/app-plan/001/tasks.md" }, "converge", "app-plan")).toEqual({ kind: "approve-once" });
    expect(copilotPermissionDecision({ kind: "write", fileName: "docs/constitution.md" }, "constitution", "app-plan")).toEqual({ kind: "approve-once" });
    expect(copilotPermissionDecision({ kind: "write", fileName: "docs/app-plan/001/constitution.md" }, "constitution", "app-plan").kind).toBe("reject");
  });

  test("the write request carries the plan", () => {
    const text = planTextFromWrite({
      kind: "write",
      newFileContents: "---\nstatus: draft\n---\n\n## Goal\n\nTrack requests.\n",
    });
    expect(text).toContain("Track requests.");
  });
});