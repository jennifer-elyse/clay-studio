import { useState } from "react";
import { FolderBrowser } from "./FolderBrowser.jsx";
import { useRootBrowser } from "./use-root-browser.js";

/**
 * @param {object} props
 * @param {string} props.root
 * @param {(input: { projectsRoot: string }) => Promise<{ ok: boolean, message?: string }>} [props.onSave]
 * @param {() => void} props.onClose
 */
export function ProjectsRootSection({ root, onSave, onClose }) {
  const browser = useRootBrowser({ start: root });
  const [message, setMessage] = useState("");
  const same = browser.path === root;
  const reason = same ? "This is already the projects folder." : "";

  async function save() {
    const result = await onSave?.({ projectsRoot: browser.path });
    setMessage(result && !result.ok ? result.message || "Could not save that folder." : "");
    if (result?.ok) onClose();
  }

  return (
    <>
      <p className="clay-modal-lead">New projects go in this folder. Projects you already have stay where they are.</p>
      <FolderBrowser path={browser.path} label={browser.label} parent={browser.parent} selected="" entries={browser.entries} pending="" onOpen={browser.openDir} />
      {browser.failed || message ? <p className="clay-modal-note" role="alert">{browser.failed || message}</p> : null}
      <div className="clay-modal-actions">
        {reason ? <p className="clay-modal-note" id="clay-root-same">{reason}</p> : null}
        <button type="button" className="clay-seat-use" disabled={same || !browser.path || !onSave} aria-describedby={same ? "clay-root-same" : undefined} onClick={save}>
          Use this folder
        </button>
      </div>
    </>
  );
}
