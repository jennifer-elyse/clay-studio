import { useState } from "react";
import { initialLayout, pickLayout, previewReadyKey, previewShownKey, syncLayout } from "./layout-state.js";

/**
 * Chat or Preview layout, switched to Preview when the preview has something to show or debug turns on.
 * @param {{ previewStatus?: string, previewUrl?: string, previewMessage?: string, debug: boolean, projectId: string }} input
 */
export function useLayout({ previewStatus, previewUrl, previewMessage, debug, projectId }) {
  const [state, setState] = useState(initialLayout);
  const previewKey = previewShownKey(previewStatus, previewUrl, previewMessage);
  const synced = syncLayout(state, { previewKey, debug, projectId });
  if (synced !== state) setState(synced);
  return {
    layout: synced.layout,
    previewReady: previewReadyKey(previewStatus, previewUrl) !== "",
    /** @param {"chat" | "preview"} next */
    pick: (next) => setState((current) => pickLayout(current, next === "chat" ? "pickChat" : "pickPreview")),
  };
}
