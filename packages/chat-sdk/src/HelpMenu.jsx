import { useEffect, useId, useRef, useState } from "react";
import { COMMANDS } from "./commands.js";

/** @param {{ onSend?: (slash: string) => void, busy?: boolean }} props */
export function HelpMenu({ onSend, busy = false }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const menuId = useId();
  const items = ["help", "docs", "settings"].map((id) => COMMANDS.find((command) => command.id === id));

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      const outside = event.type === "pointerdown" && !root.current?.contains(event.target);
      if (outside || event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div className="clay-help" ref={root}>
      <button type="button" className="clay-pill clay-help-button" aria-expanded={open} aria-controls={menuId} aria-label="Help, docs, and settings" onClick={() => setOpen((value) => !value)}>
        ?
      </button>
      {open ? (
        <div id={menuId} className="clay-help-menu" role="menu">
          {items.map((command) => (
            <button key={command.id} type="button" role="menuitem" className="clay-help-item" disabled={busy} title={busy ? "Wait until this run finishes." : command.summary} onClick={() => { setOpen(false); onSend?.(command.slash); }}>
              {command.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
