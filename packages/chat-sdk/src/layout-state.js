/** @typedef {"chat" | "preview"} Layout */
/** @typedef {{ layout: Layout, seenReady: string, projectId: string }} LayoutState */

/** Declared transitions: layout -> event -> next layout. */
export const LAYOUT_TRANSITIONS = Object.freeze({
  chat: Object.freeze({ pickPreview: "preview", previewReady: "preview" }),
  preview: Object.freeze({ pickChat: "chat", projectChanged: "chat" }),
});

/**
 * @param {Layout} layout
 * @param {"pickChat" | "pickPreview" | "previewReady" | "projectChanged"} event
 * @returns {Layout}
 */
export function nextLayout(layout, event) {
  if (event === "projectChanged") return "chat";
  return LAYOUT_TRANSITIONS[layout][event] ?? layout;
}

/**
 * The url when the preview is ready, else an empty string.
 * @param {string} [status]
 * @param {string} [url]
 */
export function previewReadyKey(status, url) {
  return status === "ready" && url ? url : "";
}

/** @returns {LayoutState} */
export function initialLayout() {
  return { layout: "chat", seenReady: "", projectId: "" };
}

/**
 * Derive the next state from props. Returns the same object when nothing changed.
 * @param {LayoutState} state
 * @param {{ readyKey: string, projectId: string }} input
 * @returns {LayoutState}
 */
export function syncLayout(state, { readyKey, projectId }) {
  if (projectId !== state.projectId) {
    return { layout: nextLayout(state.layout, "projectChanged"), seenReady: readyKey, projectId };
  }
  if (readyKey === state.seenReady) return state;
  const layout = readyKey === "" ? state.layout : nextLayout(state.layout, "previewReady");
  return { ...state, layout, seenReady: readyKey };
}

/**
 * @param {LayoutState} state
 * @param {"pickChat" | "pickPreview"} event
 * @returns {LayoutState}
 */
export function pickLayout(state, event) {
  const layout = nextLayout(state.layout, event);
  return layout === state.layout ? state : { ...state, layout };
}
