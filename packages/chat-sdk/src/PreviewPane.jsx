import { useState } from "react";
import { OpenPreview } from "./OpenPreview.jsx";
import { PreviewFrame } from "./PreviewFrame.jsx";
import { PreviewLoading } from "./PreviewLoading.jsx";
import { frameSrc } from "./preview-frame.js";

/**
 * @param {object} props
 * @param {"classic" | "blue"} [props.theme]
 * @param {string} [props.url]
 * @param {string} [props.status]
 * @param {string} [props.message]
 * @param {boolean} [props.debug]
 * @param {string} [props.log]
 * @param {string} [props.activity]
 * @param {(url: string) => void} [props.onOpen]
 */
export function PreviewPane({ theme = "classic", url, status, message = "", debug = false, log = "", activity = "", onOpen }) {
  const pageOrigin = typeof window === "undefined" ? "" : window.location.origin;
  const src = frameSrc(url, pageOrigin);
  const failed = status === "error" || Boolean(url && !src);
  const notice = message || "The app didn't start.";
  const waiting = activity || "Mold something, then press Run.";
  const starting = status === "starting" && !activity && !failed;
  const label = failed ? notice : activity || src || (status === "starting" ? "Starting…" : "Preview sleeps until you Run");
  const [loadedSrc, setLoadedSrc] = useState("");
  if (!src && loadedSrc) setLoadedSrc("");
  const loaded = Boolean(src) && loadedSrc === src;
  const announcement = failed ? notice : starting ? "Starting your app…" : src && !loaded ? "Opening your app…" : loaded ? "Your app is ready." : "";
  return (
    <>
      <aside className="clay-preview" aria-label="Live preview">
        <header>
          {src && !activity ? <OpenPreview url={src} onOpen={onOpen} /> : null}
          <span>{label}</span>
        </header>
        {src ? <PreviewFrame src={src} loaded={loaded} onLoad={setLoadedSrc} /> : null}
        {starting ? <PreviewLoading theme={theme} label="Starting your app…" /> : null}
        {!src && !starting ? <div className="clay-preview-empty">{failed ? notice : waiting}</div> : null}
        {debug ? <pre className="clay-debug">{log || "No process log yet."}</pre> : null}
      </aside>
      {/* Outside the pane, which Chat layout hides, so the status is still heard there. */}
      <p className="clay-sr-only" role="status">{announcement}</p>
    </>
  );
}
