import { useRef, useState } from "react";
import { FolderBrowser } from "./FolderBrowser.jsx";

/** @param {{ mode: "new" | "edit", name: string, notice: string, folder: import("./use-project-folder.js").ProjectFolder, onName: (value: string) => void, onNew: () => void, onSave: (name: string) => void }} props */
export function ProjectForm({ mode, name, notice, folder, onName, onNew, onSave }) {
  const nameRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const [local, setLocal] = useState("");
  const blocked = folder.blocked ? "Clay keeps projects outside itself." : "";
  const message = local || notice || blocked;

  function save(formData) {
    const trimmed = String(formData.get("name") ?? "").trim();
    if (!trimmed) {
      setLocal("Give the project a name.");
      nameRef.current?.focus();
      return;
    }
    if (!folder.selected || folder.blocked) {
      setLocal(blocked || "Use a name that can become a folder.");
      return;
    }
    onSave(trimmed);
  }

  return (
    <form className="clay-project-form" action={save}>
      <div className="clay-project-form-head">
        <strong>{mode === "edit" ? "Edit project" : "New project"}</strong>
        {mode === "edit" ? <button type="button" className="clay-project-switch" onClick={onNew}>New project</button> : null}
      </div>
      <label>
        Name
        <input key={mode} name="name" ref={nameRef} value={name} autoFocus autoComplete="off" onChange={(event) => { setLocal(""); onName(event.target.value); }} />
      </label>
      <FolderBrowser path={folder.path} label={folder.label} parent={folder.parent} selected={folder.selected} entries={folder.entries} projectFolders={folder.projectFolders} pending={folder.pending} onOpen={folder.openDir} />
      {message ? <p className="clay-project-notice">{message}</p> : null}
      <button type="submit" className="clay-header-tool is-project" disabled={folder.blocked} title={blocked || undefined}>
        {mode === "edit" ? "Save project" : "Add project"}
      </button>
    </form>
  );
}
