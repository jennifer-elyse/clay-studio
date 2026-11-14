import { useEffect } from "react";

/**
 * Close a modal, popup, or popover when the pointer lands outside it, or Escape is pressed.
 * @param {boolean} open
 * @param {import("react").RefObject<HTMLElement | null>} root
 * @param {() => void} onClose
 */
export function useDismiss(open, root, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const dismiss = (event) => {
      if (event.type === "keydown") {
        if (event.key === "Escape") onClose();
        return;
      }
      const target = event.target;
      if (target instanceof Node && root.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismiss);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", dismiss);
    };
  }, [open, root, onClose]);
}
