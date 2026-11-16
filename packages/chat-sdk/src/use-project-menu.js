import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { useDismiss } from "./use-dismiss.js";
import { useProjectFolder } from "./use-project-folder.js";

/**
 * @param {object} props
 * @param {{ id?: string, name?: string, folder?: string, appDir?: string } | null} [props.project]
 * @param {{ folder?: string }[]} [props.projects]
 * @param {number} [props.openSignal]
 * @param {string} [props.projectsRoot]
 * @param {(id: string) => void} [props.onSelect]
 * @param {(input: { id?: string, name: string, folder: string }) => void} [props.onSave]
 * @param {(draft: { name: string, folder: string, open: boolean }) => void} [props.onDraft]
 * @param {import("./fetch-directories.js").fetchDirectories} [props.listDirectories]
 * @param {import("react").RefObject<HTMLDivElement | null>} rootRef
 */
export function useProjectMenu(props, rootRef) {
  const project = props.project ?? null;
  const signal = props.openSignal ?? 0;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(/** @type {"new" | "edit"} */ ("new"));
  const [name, setName] = useState("");
  const [seenSignal, setSeenSignal] = useState(signal);
  const folder = useProjectFolder({
    open,
    mode,
    name,
    appDir: project?.appDir || "",
    projectsRoot: props.projectsRoot,
    projectFolders: (props.projects ?? []).map((item) => item.folder).filter(Boolean),
    listDirectories: props.listDirectories,
  });
  const close = useCallback(() => setOpen(false), []);
  const publishDraft = useEffectEvent(() => {
    props.onDraft?.({ name, folder: open ? folder.selected : "", open });
  });

  useEffect(() => {
    publishDraft();
  }, [name, folder.selected, open]);

  useDismiss(open, rootRef, close);

  if (signal !== seenSignal) {
    setSeenSignal(signal);
    if (signal) {
      setMode("new");
      setName("");
      folder.reset();
      setOpen(true);
    }
  }

  function show(nextMode) {
    setMode(nextMode);
    setName(nextMode === "edit" ? project?.name ?? "" : "");
    folder.reset();
    setOpen(true);
  }

  return {
    open,
    mode,
    name,
    setName,
    folder,
    show,
    close,
    choose: (id) => {
      close();
      props.onSelect?.(id);
    },
    save: (trimmed) => {
      props.onSave?.({ id: mode === "edit" ? project?.id : undefined, name: trimmed, folder: folder.selected });
      close();
    },
  };
}
