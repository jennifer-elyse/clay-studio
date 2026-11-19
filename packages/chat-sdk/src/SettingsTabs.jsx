const TABS = [
  { id: "seat", label: "Seat" },
  { id: "projects", label: "Projects folder" },
  { id: "theme", label: "Theme" },
];

/**
 * @param {object} props
 * @param {string} props.section
 * @param {(id: string) => void} props.onSection
 */
export function SettingsTabs({ section, onSection }) {
  return (
    <div className="clay-settings-tabs" role="tablist" aria-label="Settings" aria-orientation="vertical">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`clay-tab-${tab.id}`}
          aria-selected={section === tab.id}
          aria-controls="clay-settings-panel"
          className={`clay-settings-tab${section === tab.id ? " is-selected" : ""}`}
          onClick={() => onSection(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
