import { useEffect } from "react";

/**
 * @param {boolean} active
 * @param {() => void} [onEscape]
 */
export function useEscape(active, onEscape) {
  useEffect(() => {
    if (!active || !onEscape) return undefined;
    /**
     * @param {KeyboardEvent} event
     */
    function onKey(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onEscape();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, onEscape]);
}
