import { folderDirectoryLabel, orderFolderEntries } from "./project-gate.js";
import { FolderRow } from "./FolderRow.jsx";

/**
 * @param {object} props
 * @param {string} props.path
 * @param {string} [props.label]
 * @param {string | null} props.parent
 * @param {string} props.selected
 * @param {{ name: string, path: string, project?: boolean }[]} props.entries
 * @param {string[]} [props.projectFolders]
 * @param {string} props.pending
 * @param {(path: string) => void} props.onOpen
 */
export function FolderBrowser({ path, label = "", parent, selected, entries, projectFolders = [], pending, onOpen }) {
  const shown = selected || path;
  const directory = folderDirectoryLabel(shown, selected ? "" : label);
  const ordered = orderFolderEntries(entries, projectFolders);
  const projectCount = ordered.filter((entry) => entry.name === "Projects" || entry.project || projectFolders.includes(entry.name)).length;
  const projects = ordered.slice(0, projectCount);
  const rest = ordered.slice(projectCount);
  return (
    <div className="clay-folder-browser">
      <span className="clay-folder-label">Folder</span>
      <p className="clay-folder-path" title={shown || directory}>{directory}</p>
      <div className="clay-folder-list" role="listbox" aria-label="Project folder">
        {parent ? <button type="button" className="clay-folder-row" onClick={() => onOpen(parent)}>Up</button> : null}
        {projects.map((entry) => (
          <FolderRow key={entry.path} entry={entry} selected={selected} onOpen={onOpen} />
        ))}
        {pending ? <p className="clay-folder-pending" aria-current="true">{pending} · new folder</p> : null}
        {rest.map((entry) => (
          <FolderRow key={entry.path} entry={entry} selected={selected} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
