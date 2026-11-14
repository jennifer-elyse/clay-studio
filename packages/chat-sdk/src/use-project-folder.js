import { useEffect, useState } from "react";
import { fetchDirectories } from "./fetch-directories.js";
import { folderFromName, joinPath, pathLeaf, pathParent } from "./project-gate.js";

const EMPTY = {
  path: "",
  label: "",
  parent: /** @type {string | null} */ (null),
  blocked: false,
  entries: /** @type {{ name: string, path: string, project?: boolean }[]} */ ([]),
};

/**
 * @typedef {object} ProjectFolder
 * @property {string} path
 * @property {string} label
 * @property {string | null} parent
 * @property {string} selected
 * @property {{ name: string, path: string, project?: boolean }[]} entries
 * @property {string[]} projectFolders
 * @property {string} pending
 * @property {boolean} blocked
 * @property {(path: string) => void} openDir
 * @property {() => void} reset
 */

/**
 * Browse project folders. Until the user navigates, the folder is ~/Projects/{slug}.
 * @param {object} input
 * @param {boolean} input.open
 * @param {"new" | "edit"} input.mode
 * @param {string} input.name
 * @param {string} input.appDir
 * @param {string[]} [input.projectFolders]
 * @param {typeof fetchDirectories} [input.listDirectories]
 * @returns {ProjectFolder}
 */
export function useProjectFolder({ open, mode, name, appDir, projectFolders = [], listDirectories = fetchDirectories }) {
  const [parent, setParent] = useState("");
  const [listing, setListing] = useState(EMPTY);
  const slug = mode === "edit" ? pathLeaf(appDir) : folderFromName(name);
  const selected = listing.path && slug ? joinPath(listing.path, slug) : "";
  const pending = slug && !listing.entries.some((entry) => entry.name === slug) ? slug : "";

  useEffect(() => {
    if (!open) return undefined;
    /** @type {{ path?: string, name?: string, leaf?: string }} */
    const query = {};
    if (parent) query.path = parent;
    else if (mode === "edit" && appDir) query.path = pathParent(appDir);
    if (mode === "edit" && slug) query.leaf = slug;
    else if (name.trim()) query.name = name.trim();
    const ac = new AbortController();
    listDirectories(query, ac.signal)
      .then((body) => setListing(body))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setListing(EMPTY);
      });
    return () => ac.abort();
  }, [open, mode, name, appDir, parent, slug, listDirectories]);

  return {
    path: listing.path,
    label: listing.label || "",
    parent: listing.parent,
    selected,
    entries: listing.entries,
    projectFolders,
    pending: listing.path ? pending : "",
    blocked: listing.blocked,
    openDir: (next) => setParent(next),
    reset: () => {
      setParent("");
      setListing(EMPTY);
    },
  };
}
