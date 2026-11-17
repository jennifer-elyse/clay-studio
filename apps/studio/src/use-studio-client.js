import { applyEvent, truncateFromMessage } from "@cswg/clay-chat";
import { makeEvent } from "@cswg/agent-host/events";
import { useEffect, useMemo, useRef, useState } from "react";
import { applyStudioEvent } from "./studio-events.js";
import { loadSettings, settingsFromLoad } from "./save-settings.js";
import { connectStudio } from "./ws-client.js";

const DOWNLOAD_TEXT = "Download Clay Studio to use Cursor, Codex, or Copilot on your computer. This page is read-only.";

function isDownloadPage() {
  return typeof document !== "undefined" && document.documentElement.dataset.clay === "download";
}

/** Live socket, transcript, and preview for the studio shell. */
export function useStudioClient() {
  const [events, setEvents] = useState(() => (isDownloadPage() ? [makeEvent("assistant_text", { text: DOWNLOAD_TEXT })] : []));
  const [seat, setSeat] = useState(() => (
    isDownloadPage() ? { provider: "mock", caption: "Download Clay Studio to use a seat." } : { provider: "mock" }
  ));
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewStatus, setPreviewStatus] = useState("");
  const [previewMessage, setPreviewMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsRoot, setProjectsRoot] = useState("");
  const [done, setDone] = useState(/** @type {{ plan: boolean, build: boolean }} */ ({ plan: false, build: false }));
  const [seatSettings, setSeatSettings] = useState(/** @type {import("./save-settings.js").SettingsState | null} */ (null));
  const clientRef = useRef(/** @type {import("./ws-client.js").StudioClient | null} */ (null));
  const settingsStamp = useRef(0);

  useEffect(() => {
    if (isDownloadPage()) return undefined;
    const sink = { setSeat, setPreviewStatus, setPreviewUrl, setPreviewMessage, setEvents, setBusy };
    const next = connectStudio({
      onSnapshot: (snap) => {
        setSeat({ provider: snap.seat });
        setProject(snap.project ?? null);
        setProjects(snap.projects ?? []);
        setProjectsRoot(snap.appsDir ?? "");
        setDone({ plan: Boolean(snap.done?.plan), build: Boolean(snap.done?.build) });
        setPreviewUrl(snap.preview?.url || "");
        setPreviewStatus(snap.preview?.url ? snap.preview.status || "ready" : "");
      },
      onEvent: (event) => applyStudioEvent(event, sink),
    });
    clientRef.current = next;
    const stamp = settingsStamp.current;
    let cancelled = false;
    loadSettings().then((result) => {
      if (cancelled) return;
      const settings = settingsFromLoad(stamp, settingsStamp.current, result);
      if (settings) setSeatSettings(settings);
    });
    return () => {
      cancelled = true;
      clientRef.current = null;
      next.close();
    };
  }, []);

  const items = useMemo(() => events.reduce(applyEvent, []), [events]);
  const client = useMemo(
    () => ({
      send: (input) => {
        const replaceId = input && typeof input === "object" ? input.replaceId : "";
        if (replaceId) setEvents((list) => truncateFromMessage(list, replaceId));
        clientRef.current?.send(input);
      },
      cancel: () => clientRef.current?.cancel(),
      approve: (path) => clientRef.current?.approve(path),
      setSeat: (seatId) => clientRef.current?.setSeat(seatId),
      selectProject: (id) => clientRef.current?.selectProject(id),
      saveProject: (input) => clientRef.current?.saveProject(input),
    }),
    [],
  );
  /**
   * @param {import("./save-settings.js").SettingsState} settings
   */
  function replaceSeatSettings(settings) {
    settingsStamp.current += 1;
    setSeatSettings(settings);
  }

  return {
    events, items, seat, project, projects, projectsRoot, setProjectsRoot, done, seatSettings,
    setSeatSettings: replaceSeatSettings, previewUrl, previewStatus, previewMessage, busy, client,
  };
}
