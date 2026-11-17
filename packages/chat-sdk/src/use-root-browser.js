import { useEffect, useState } from "react";
import { fetchDirectories } from "./fetch-directories.js";

const EMPTY = { path: "", label: "", parent: /** @type {string | null} */ (null), entries: /** @type {{ name: string, path: string }[]} */ ([]) };

/**
 * Browse folders to pick the projects folder. Starts at `start`, or the host default.
 * @param {object} input
 * @param {string} [input.start]
 * @param {typeof fetchDirectories} [input.listDirectories]
 */
export function useRootBrowser({ start = "", listDirectories = fetchDirectories }) {
  const [target, setTarget] = useState(start);
  const [listing, setListing] = useState(EMPTY);
  const [failed, setFailed] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    listDirectories(target ? { path: target } : {}, ac.signal)
      .then((body) => {
        setFailed("");
        setListing(body);
      })
      .catch((error) => {
        if (error?.name !== "AbortError") setFailed(error instanceof Error ? error.message : "That folder is not available.");
      });
    return () => ac.abort();
  }, [target, listDirectories]);

  return { ...listing, failed, openDir: setTarget };
}
