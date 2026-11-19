import { ClayBot } from "./ClayBot.jsx";

/**
 * Shown while the app starts, and over the frame until its first page loads.
 * Visual only: PreviewPane announces the same words in its status region.
 * @param {object} props
 * @param {string} props.label
 * @param {boolean} [props.overlay]
 */
export function PreviewLoading({ label, overlay = false }) {
  return (
    <div className={overlay ? "clay-preview-loading is-overlay" : "clay-preview-loading"} aria-hidden="true">
      <ClayBot clip="rolling.webp" />
      <span>{label}</span>
      <span className="clay-preview-loading-bar" />
    </div>
  );
}
