import { Chevron } from "./Chevron.jsx";

/**
 * @param {object} props
 * @param {{ id?: string, name?: string, appDir?: string, folder?: string } | null} props.project
 * @param {{ id: string, name: string }[]} props.projects
 * @param {(id: string) => void} props.onSelect
 * @param {() => void} props.onNew
 */
export function ProjectSelect({ project, projects, onSelect, onNew }) {
  const directory = project?.appDir || project?.folder || "";
  return (
    <label className="clay-project-picker">
      <span className="clay-project-caption">Project</span>
      <span className="clay-select">
        <select
          aria-label="Project"
          value={project?.id ?? ""}
          onChange={(event) => {
            const id = event.target.value;
            if (id === "__new__") onNew();
            else if (id) onSelect(id);
          }}
        >
          <option value="">{projects.length ? "Choose a project" : "No projects yet"}</option>
          {projects.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
          <option value="__new__">New project…</option>
        </select>
        <Chevron />
        {directory ? <span className="clay-project-dir" title={directory} aria-hidden="true">{directory}</span> : null}
      </span>
    </label>
  );
}
