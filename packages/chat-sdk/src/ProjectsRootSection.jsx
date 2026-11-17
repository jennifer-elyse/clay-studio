import { useActionState } from "react";
import { FolderBrowser } from "./FolderBrowser.jsx";
import { useRootBrowser } from "./use-root-browser.js";

/**
 * @param {object} props
 * @param {string} props.root
 * @param {(input: { projectsRoot: string }) => Promise<{ ok: boolean, message?: string }>} [props.onSave]
 * @param {() => void} props.onClose
 * @param {import("./fetch-directories.js").fetchDirectories} [props.listDirectories]
 */
export function ProjectsRootSection({ root, onSave, onClose, listDirectories }) {
  const browser = useRootBrowser({ start: root, listDirectories });
  const [state, save, pending] = useActionState(async () => {
    const result = await onSave?.({ projectsRoot: browser.path });
    if (result && !result.ok) return { message: result.message || "Could not save that folder." };
    if (result?.ok) onClose();
    return { message: "" };
  }, { message: "" });
  const same = browser.path === root;
  const reason = same ? "This is already the projects folder." : pending ? "Saving this folder." : !browser.path ? "Choose a folder." : "";
  const note = browser.failed || state.message;

  return (
    <form action={save}>
      <p className="clay-modal-lead">New projects go in this folder. Projects you already have stay where they are.</p>
      <FolderBrowser path={browser.path} label={browser.label} parent={browser.parent} selected="" entries={browser.entries} pending="" onOpen={browser.openDir} />
      {note ? <p className="clay-modal-note" role="alert">{note}</p> : null}
      <div className="clay-modal-actions">
        {reason ? <p className="clay-modal-note" id="clay-root-reason">{reason}</p> : null}
        <button type="submit" className="clay-seat-use" disabled={Boolean(reason) || !onSave} aria-describedby={reason ? "clay-root-reason" : undefined}>
          Use this folder
        </button>
      </div>
    </form>
  );
}
