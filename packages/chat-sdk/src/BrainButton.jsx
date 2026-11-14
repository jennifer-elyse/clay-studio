/**
 * @param {object} props
 * @param {boolean} [props.armed]
 * @param {boolean} [props.disabled]
 * @param {() => void} [props.onClick]
 */
export function BrainButton({ armed = false, disabled = false, onClick }) {
  return (
    <button type="button" className={`clay-brain${armed ? " is-armed" : ""}`} aria-pressed={armed} aria-label="Think first" title="Think first." disabled={disabled} onClick={onClick}>
      <svg className="clay-brain-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
        <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
        <path d="M12 18v3" />
      </svg>
    </button>
  );
}
