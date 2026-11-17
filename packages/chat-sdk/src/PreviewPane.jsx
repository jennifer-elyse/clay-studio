import { OpenPreview } from "./OpenPreview.jsx";
import { frameSrc } from "./preview-frame.js";

/**
 * @param {object} props
 * @param {string} [props.url]
 * @param {string} [props.status]
 * @param {string} [props.message]
 * @param {boolean} [props.debug]
 * @param {string} [props.log]
 * @param {string} [props.activity]
 * @param {(url: string) => void} [props.onOpen]
 */
export function PreviewPane({ url, status, message = "", debug = false, log = "", activity = "", onOpen }) {
  const pageOrigin = typeof window === "undefined" ? "" : window.location.origin;
  const src = frameSrc(url, pageOrigin);
  const failed = status === "error" || Boolean(url && !src);
  const notice = message || "The app didn't start.";
  const waiting = activity || (status === "starting" ? "Starting…" : "Mold something, then press Run.");
  const label = failed ? notice : activity || src || (status === "starting" ? "Starting…" : "Preview sleeps until you Run");
  return (
    <aside className="clay-preview" aria-label="Live preview">
      <header>
        {src && !activity ? <OpenPreview url={src} onOpen={onOpen} /> : null}
        <span>{label}</span>
      </header>
      {src ? (
        <iframe title="App preview" src={src} sandbox="allow-forms allow-scripts allow-same-origin" referrerPolicy="no-referrer" />
      ) : (
        <div className="clay-preview-empty">{failed ? notice : waiting}</div>
      )}
      {debug ? <pre className="clay-debug">{log || "No process log yet."}</pre> : null}
    </aside>
  );
}
