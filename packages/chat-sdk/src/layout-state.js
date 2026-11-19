/** @typedef {"chat" | "preview"} Layout */
/** @typedef {"pickChat" | "pickPreview" | "previewShown" | "debugOn" | "projectChanged"} LayoutEvent */
/** @typedef {{ layout: Layout, seenPreview: string, debug: boolean, projectId: string }} LayoutState */

/**
 * Declared transitions: layout -> event -> next layout. A missing event keeps the layout.
 * @type {Readonly<Record<Layout, Readonly<Partial<Record<LayoutEvent, Layout>>>>>}
 */
export const LAYOUT_TRANSITIONS = Object.freeze({
  chat: Object.freeze({ pickPreview: "preview", previewShown: "preview", debugOn: "preview", projectChanged: "chat" }),
  preview: Object.freeze({ pickChat: "chat", projectChanged: "chat" }),
});

/**
 * @param {Layout} layout
 * @param {LayoutEvent} event
 * @returns {Layout}
 */
export function nextLayout(layout, event) {
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

/**
 * What the preview pane has to show: the loading state, the ready url, or the start error, else an empty string.
 * @param {string} [status]
 * @param {string} [url]
 * @param {string} [message]
 */
export function previewShownKey(status, url, message = "") {
  if (status === "starting") return "starting";
  if (status === "error") return `error:${message}`;
  return previewReadyKey(status, url);
}

/** @returns {LayoutState} */
export function initialLayout() {
  return { layout: "chat", seenPreview: "", debug: false, projectId: "" };
}

/**
 * Derive the next state from props. Returns the same object when nothing changed.
 * @param {LayoutState} state
 * @param {{ previewKey: string, debug: boolean, projectId: string }} input
 * @returns {LayoutState}
 */
export function syncLayout(state, { previewKey, debug, projectId }) {
  if (projectId !== state.projectId) {
    return { layout: nextLayout(state.layout, "projectChanged"), seenPreview: previewKey, debug, projectId };
  }
  if (previewKey === state.seenPreview && debug === state.debug) return state;
  const shown = previewKey !== "" && previewKey !== state.seenPreview;
  const afterPreview = shown ? nextLayout(state.layout, "previewShown") : state.layout;
  const layout = debug && !state.debug ? nextLayout(afterPreview, "debugOn") : afterPreview;
  return { ...state, layout, seenPreview: previewKey, debug };
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
