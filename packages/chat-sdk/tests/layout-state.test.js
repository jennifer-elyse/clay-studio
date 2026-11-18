import { initialLayout, nextLayout, pickLayout, previewReadyKey, syncLayout } from "../src/layout-state.js";

describe("layout state", () => {
  test("transition table", () => {
    expect(nextLayout("chat", "pickPreview")).toBe("preview");
    expect(nextLayout("chat", "previewReady")).toBe("preview");
    expect(nextLayout("preview", "pickChat")).toBe("chat");
    expect(nextLayout("preview", "previewReady")).toBe("preview");
    expect(nextLayout("preview", "projectChanged")).toBe("chat");
  });

  test("ready key needs ready status and a url", () => {
    expect(previewReadyKey("ready", "http://127.0.0.1:1")).toBe("http://127.0.0.1:1");
    expect(previewReadyKey("starting", "http://127.0.0.1:1")).toBe("");
    expect(previewReadyKey("ready", "")).toBe("");
  });

  test("starts in chat and switches each time a preview becomes ready", () => {
    let state = initialLayout();
    expect(syncLayout(state, { readyKey: "", projectId: "" })).toBe(state);
    state = syncLayout(state, { readyKey: "u1", projectId: "" });
    expect(state.layout).toBe("preview");
    state = pickLayout(state, "pickChat");
    expect(syncLayout(state, { readyKey: "u1", projectId: "" })).toBe(state);
    state = syncLayout(state, { readyKey: "", projectId: "" });
    expect(state.layout).toBe("chat");
    expect(syncLayout(state, { readyKey: "u1", projectId: "" }).layout).toBe("preview");
  });

  test("a project change returns to chat without auto-switching", () => {
    const state = { layout: "preview", seenReady: "u1", projectId: "a" };
    const next = syncLayout(state, { readyKey: "u1", projectId: "b" });
    expect(next).toEqual({ layout: "chat", seenReady: "u1", projectId: "b" });
    expect(state.layout).toBe("preview");
  });
});
