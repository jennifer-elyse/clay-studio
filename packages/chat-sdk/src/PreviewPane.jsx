/**
 * @param {object} props
 * @param {string} [props.url]
 * @param {string} [props.status]
 * @param {boolean} [props.debug]
 * @param {string} [props.log]
 */
export function PreviewPane({ url, status, debug = false, log = "" }) {
  return (
    <aside className="clay-preview" aria-label="Live preview">
      <header>{url ? url : status === "starting" ? "Starting…" : "Preview sleeps until you Run"}</header>
      {url ? (
        <iframe title="App preview" src={url} />
      ) : (
        <div className="clay-preview-empty">Mold something, then press Run.</div>
      )}
      {debug ? <pre className="clay-debug">{log || "No process log yet."}</pre> : null}
    </aside>
  );
}
