/** @param {{ onClose: () => void }} props */
export function SettingsHeader({ onClose }) {
  return (
    <div className="clay-settings-head">
      <h2 id="clay-settings-title">Settings</h2>
      <button type="button" className="clay-minimize clay-settings-close" aria-label="Close settings" onClick={onClose}>
        <svg className="clay-chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
