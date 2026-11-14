import { applyEvent } from "@cswg/clay-chat";
import { useEffect, useMemo, useState } from "react";
import { applyStudioEvent } from "./studio-events.js";
import { connectStudio } from "./ws-client.js";

/** Live socket, transcript, and preview for the studio shell. */
export function useStudioClient() {
  const [events, setEvents] = useState([]);
  const [seat, setSeat] = useState({ provider: "mock" });
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewStatus, setPreviewStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [client, setClient] = useState(null);

  useEffect(() => {
    const sink = { setSeat, setPreviewStatus, setPreviewUrl, setEvents, setBusy };
    const next = connectStudio({
      onSnapshot: (snap) => {
        setSeat({ provider: snap.seat });
        if (snap.preview?.url) setPreviewUrl(snap.preview.url);
      },
      onEvent: (event) => applyStudioEvent(event, sink),
    });
    setClient(next);
    return () => next.close();
  }, []);

  const items = useMemo(() => events.reduce(applyEvent, []), [events]);
  return { events, items, seat, previewUrl, previewStatus, busy, client };
}
