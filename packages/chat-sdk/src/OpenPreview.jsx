/**
 * Icon that opens the running app in the default browser.
 * @param {object} props
 * @param {string} [props.url]
 * @param {(url: string) => void} [props.onOpen]
 */
export function OpenPreview({ url = "", onOpen }) {
  const ready = Boolean(url);
  return (
    <button
      type="button"
      className="clay-preview-open"
      aria-label="Open in browser"
      title={ready ? "Open in your browser" : "Run the app first."}
      disabled={!ready}
      onClick={() => (onOpen ? onOpen(url) : window.open(url, "_blank", "noopener,noreferrer"))}
    >
      <svg className="clay-preview-open-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 4h6v6" />
        <path d="M20 4 10 14" />
        <path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" />
      </svg>
    </button>
  );
}
