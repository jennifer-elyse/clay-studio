import { OpenPreview } from "./OpenPreview.jsx";
import { frameSrc } from "./preview-frame.js";

/**
 * @param {object} props
 * @param {string} [props.url]
 * @param {string} [props.status]
 * @param {string} [props.message]
 * @param {boolean} [props.debug]
 * @param {string} [props.log]
 * @param {(url: string) => void} [props.onOpen]
 */
export function PreviewPane({ url, status, message = "", debug = false, log = "", onOpen }) {
  const pageOrigin = typeof window === "undefined" ? "" : window.location.origin;
  const src = frameSrc(url, pageOrigin);
  const failed = status === "error" || Boolean(url && !src);
  const notice = message || "The app didn't start.";
  const label = failed ? notice : src || (status === "starting" ? "Starting…" : "Preview sleeps until you Run");
  return (
    <aside className="clay-preview" aria-label="Live preview">
      <header>
        {src ? <OpenPreview url={src} onOpen={onOpen} /> : null}
        <span>{label}</span>
      </header>
      {src ? (
        <iframe title="App preview" src={src} sandbox="allow-forms allow-scripts allow-same-origin" referrerPolicy="no-referrer" />
      ) : (
        <div className="clay-preview-empty">{failed ? notice : status === "starting" ? "Starting…" : "Mold something, then press Run."}</div>
      )}
      {debug ? <pre className="clay-debug">{log || "No process log yet."}</pre> : null}
    </aside>
  );
}
