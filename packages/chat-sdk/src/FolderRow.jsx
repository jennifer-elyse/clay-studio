/**
 * @param {object} props
 * @param {{ name: string, path: string }} props.entry
 * @param {string} props.selected
 * @param {(path: string) => void} props.onOpen
 */
export function FolderRow({ entry, selected, onOpen }) {
  const current = entry.path === selected;
  return (
    <button
      type="button"
      role="option"
      aria-selected={current}
      className={current ? "clay-folder-row is-current" : "clay-folder-row"}
      title={current ? "This is the project folder." : `Open ${entry.name}`}
      onClick={() => {
        if (!current) onOpen(entry.path);
      }}
    >
      {entry.name}
    </button>
  );
}
