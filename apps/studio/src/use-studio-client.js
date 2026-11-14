import { applyEvent } from "@cswg/clay-chat";
import { useEffect, useMemo, useRef, useState } from "react";
import { applyStudioEvent } from "./studio-events.js";
import { connectStudio } from "./ws-client.js";

/** Live socket, transcript, and preview for the studio shell. */
export function useStudioClient() {
  const [events, setEvents] = useState([]);
  const [seat, setSeat] = useState({ provider: "mock" });
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewStatus, setPreviewStatus] = useState("");
  const [previewMessage, setPreviewMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const clientRef = useRef(/** @type {import("./ws-client.js").StudioClient | null} */ (null));

  useEffect(() => {
    const sink = { setSeat, setPreviewStatus, setPreviewUrl, setPreviewMessage, setEvents, setBusy };
    const next = connectStudio({
      onSnapshot: (snap) => {
        setSeat({ provider: snap.seat });
        setProject(snap.project ?? null);
        setProjects(snap.projects ?? []);
        if (snap.preview?.url) setPreviewUrl(snap.preview.url);
      },
      onEvent: (event) => applyStudioEvent(event, sink),
    });
    clientRef.current = next;
    return () => {
      clientRef.current = null;
      next.close();
    };
  }, []);

  const items = useMemo(() => events.reduce(applyEvent, []), [events]);
  const client = useMemo(
    () => ({
      send: (input) => clientRef.current?.send(input),
      approve: (path) => clientRef.current?.approve(path),
      setSeat: (seatId) => clientRef.current?.setSeat(seatId),
      selectProject: (id) => clientRef.current?.selectProject(id),
      saveProject: (input) => clientRef.current?.saveProject(input),
    }),
    [],
  );
  return { events, items, seat, project, projects, previewUrl, previewStatus, previewMessage, busy, client };
}
