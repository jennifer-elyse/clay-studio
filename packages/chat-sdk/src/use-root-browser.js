import { useEffect, useState } from "react";
import { fetchDirectories } from "./fetch-directories.js";

const EMPTY = { path: "", label: "", parent: /** @type {string | null} */ (null), entries: /** @type {{ name: string, path: string }[]} */ ([]) };

/**
 * Folder to list. A changed `start` replaces whatever the user was browsing.
 * @param {{ start: string, seen: string, target: string }} current
 * @returns {{ seen: string, target: string, changed: boolean }}
 */
export function followRoot(current) {
  if (current.start === current.seen) return { seen: current.seen, target: current.target, changed: false };
  return { seen: current.start, target: current.start, changed: true };
}

/**
 * Browse folders to pick the projects folder. Follows `start` when that folder changes.
 * @param {object} input
 * @param {string} [input.start]
 * @param {typeof fetchDirectories} [input.listDirectories]
 */
export function useRootBrowser({ start = "", listDirectories = fetchDirectories }) {
  const [seen, setSeen] = useState(start);
  const [target, setTarget] = useState(start);
  const [listing, setListing] = useState(EMPTY);
  const [failed, setFailed] = useState("");
  const next = followRoot({ start, seen, target });
  if (next.changed) {
    setSeen(next.seen);
    setTarget(next.target);
    setFailed("");
  }

  useEffect(() => {
    const ac = new AbortController();
    listDirectories(target ? { path: target } : {}, ac.signal)
      .then((body) => {
        if (ac.signal.aborted) return;
        setFailed("");
        setListing(body);
      })
      .catch((error) => {
        if (ac.signal.aborted || error?.name === "AbortError") return;
        setFailed(error instanceof Error ? error.message : "That folder is not available.");
      });
    return () => ac.abort();
  }, [target, listDirectories]);

  return { ...listing, failed, openDir: setTarget };
}
