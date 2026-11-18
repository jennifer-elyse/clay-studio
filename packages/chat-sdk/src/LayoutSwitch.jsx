const OPTIONS = [
  { id: "chat", label: "Chat" },
  { id: "preview", label: "Preview" },
];

/**
 * Segmented switch between the Chat and Preview layouts.
 * @param {object} props
 * @param {"chat" | "preview"} props.layout
 * @param {(layout: "chat" | "preview") => void} props.onLayout
 * @param {boolean} [props.previewReady]
 */
export function LayoutSwitch({ layout, onLayout, previewReady = false }) {
  return (
    <div className="clay-layout-switch" role="group" aria-label="Layout">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className="clay-layout-option"
          aria-pressed={layout === option.id}
          onClick={() => onLayout(option.id)}
        >
          {option.label}
          {option.id === "preview" && previewReady && layout === "chat" ? (
            <span className="clay-layout-dot" role="img" aria-label="Preview ready" />
          ) : null}
        </button>
      ))}
    </div>
  );
}
