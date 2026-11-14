import { useRef } from "react";
import { ProjectForm } from "./ProjectForm.jsx";
import { ProjectSelect } from "./ProjectSelect.jsx";
import { useProjectMenu } from "./use-project-menu.js";

/**
 * @param {object} props
 * @param {{ id: string, name: string, folder: string, appDir?: string } | null} [props.project]
 * @param {{ id: string, name: string, folder: string }[]} [props.projects]
 * @param {string} [props.notice]
 * @param {number} [props.openSignal]
 * @param {(id: string) => void} [props.onSelect]
 * @param {(input: { id?: string, name: string, folder: string }) => void} [props.onSave]
 * @param {(draft: { name: string, folder: string, open: boolean }) => void} [props.onDraft]
 * @param {import("./fetch-directories.js").fetchDirectories} [props.listDirectories]
 */
export function ProjectMenu(props) {
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const menu = useProjectMenu(props, rootRef);
  const project = props.project ?? null;
  return (
    <div className="clay-project" ref={rootRef}>
      <ProjectSelect project={project} projects={props.projects ?? []} onSelect={menu.choose} onNew={() => menu.show("new")} />
      <button type="button" className="clay-header-tool is-project" onClick={() => (menu.open ? menu.close() : menu.show(project ? "edit" : "new"))}>
        {project ? "Edit" : "Add"}
      </button>
      {menu.open ? (
        <ProjectForm
          mode={menu.mode}
          name={menu.name}
          notice={props.notice || ""}
          folder={menu.folder}
          onName={menu.setName}
          onNew={() => menu.show("new")}
          onSave={menu.save}
        />
      ) : null}
    </div>
  );
}
