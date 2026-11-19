import { PreviewLoading } from "./PreviewLoading.jsx";

/**
 * The app frame, covered by the loading state until its page has loaded.
 * @param {object} props
 * @param {string} props.src
 * @param {boolean} props.loaded
 * @param {(src: string) => void} props.onLoad
 */
export function PreviewFrame({ src, loaded, onLoad }) {
  return (
    <div className="clay-preview-frame" aria-busy={!loaded}>
      <iframe
        title="App preview"
        src={src}
        sandbox="allow-forms allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
        onLoad={() => onLoad(src)}
      />
      {loaded ? null : <PreviewLoading label="Opening your app…" overlay />}
    </div>
  );
}
