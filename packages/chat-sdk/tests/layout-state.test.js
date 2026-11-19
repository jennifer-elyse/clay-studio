import {
  LAYOUT_TRANSITIONS,
  initialLayout,
  nextLayout,
  pickLayout,
  previewReadyKey,
  previewShownKey,
  syncLayout,
} from "../src/layout-state.js";

/** @param {Partial<{ previewKey: string, debug: boolean, projectId: string }>} [overrides] */
const input = (overrides) => ({ previewKey: "", debug: false, projectId: "", ...overrides });

describe("layout state", () => {
  test("transition table", () => {
    expect(nextLayout("chat", "pickPreview")).toBe("preview");
    expect(nextLayout("chat", "previewShown")).toBe("preview");
    expect(nextLayout("chat", "debugOn")).toBe("preview");
    expect(nextLayout("preview", "pickChat")).toBe("chat");
    expect(nextLayout("preview", "previewShown")).toBe("preview");
    expect(nextLayout("preview", "projectChanged")).toBe("chat");
    expect(nextLayout("chat", "projectChanged")).toBe("chat");
  });

  test("every layout declares projectChanged", () => {
    expect(LAYOUT_TRANSITIONS.chat.projectChanged).toBe("chat");
    expect(LAYOUT_TRANSITIONS.preview.projectChanged).toBe("chat");
  });

  test("ready key needs ready status and a url", () => {
    expect(previewReadyKey("ready", "http://127.0.0.1:1")).toBe("http://127.0.0.1:1");
    expect(previewReadyKey("starting", "http://127.0.0.1:1")).toBe("");
    expect(previewReadyKey("ready", "")).toBe("");
  });

  test("shown key covers starting, ready, and error, not stopped", () => {
    expect(previewShownKey("ready", "http://127.0.0.1:1")).toBe("http://127.0.0.1:1");
    expect(previewShownKey("error", "", "Port in use")).toBe("error:Port in use");
    expect(previewShownKey("starting", "")).toBe("starting");
    expect(previewShownKey("stopped", "", "Stopped")).toBe("");
    expect(previewShownKey("", "")).toBe("");
  });

  test("switches to preview as soon as Run starts the app", () => {
    let state = syncLayout(initialLayout(), input({ previewKey: "starting" }));
    expect(state.layout).toBe("preview");
    state = pickLayout(state, "pickChat");
    expect(syncLayout(state, input({ previewKey: "u1" })).layout).toBe("preview");
  });

  test("starts in chat and switches each time a preview becomes ready", () => {
    let state = initialLayout();
    expect(syncLayout(state, input())).toBe(state);
    state = syncLayout(state, input({ previewKey: "u1" }));
    expect(state.layout).toBe("preview");
    state = pickLayout(state, "pickChat");
    expect(syncLayout(state, input({ previewKey: "u1" }))).toBe(state);
    state = syncLayout(state, input());
    expect(state.layout).toBe("chat");
    expect(syncLayout(state, input({ previewKey: "u1" })).layout).toBe("preview");
  });

  test("switches to preview when the app fails to start", () => {
    const state = syncLayout(initialLayout(), input({ previewKey: "error:Port in use" }));
    expect(state.layout).toBe("preview");
  });

  test("switches to preview when debug turns on, not when it turns off", () => {
    let state = syncLayout(initialLayout(), input({ debug: true }));
    expect(state.layout).toBe("preview");
    state = pickLayout(state, "pickChat");
    state = syncLayout(state, input({ debug: false }));
    expect(state.layout).toBe("chat");
    expect(syncLayout(state, input({ debug: true })).layout).toBe("preview");
  });

  test("a project change returns to chat without auto-switching", () => {
    /** @type {import("../src/layout-state.js").LayoutState} */
    const state = { layout: "preview", seenPreview: "u1", debug: true, projectId: "a" };
    const next = syncLayout(state, input({ previewKey: "u1", debug: true, projectId: "b" }));
    expect(next).toEqual({ layout: "chat", seenPreview: "u1", debug: true, projectId: "b" });
    expect(state.layout).toBe("preview");
  });
});
