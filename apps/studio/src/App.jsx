import { ClayChat, applyEvent } from "@cswg/clay-chat";
import { useEffect, useMemo, useState } from "react";
import { connectStudio } from "./ws-client.js";

export function App() {
  const [events, setEvents] = useState([]);
  const [seat, setSeat] = useState({ provider: "mock" });
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewStatus, setPreviewStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [client, setClient] = useState(null);

  useEffect(() => {
    const next = connectStudio({
      onSnapshot: (snap) => {
        setSeat({ provider: snap.seat });
        if (snap.preview?.url) setPreviewUrl(snap.preview.url);
      },
      onEvent: (event) => {
        if (event.type === "seat" && event.seat) setSeat(event.seat);
        if (event.type === "preview" && event.preview) {
          setPreviewStatus(event.preview.status);
          if (event.preview.url) setPreviewUrl(event.preview.url);
        }
        if (event.type === "clear") {
          setEvents([]);
          setBusy(false);
          return;
        }
        if (event.type === "run_started") setBusy(true);
        if (event.type === "run_finished" || event.type === "error") setBusy(false);
        setEvents((list) => [...list, event]);
      },
    });
    setClient(next);
    return () => next.close();
  }, []);

  const items = useMemo(() => events.reduce(applyEvent, []), [events]);

  return (
    <ClayChat
      events={events}
      items={items}
      busy={busy}
      seat={seat}
      previewUrl={previewUrl}
      previewStatus={previewStatus}
      onSend={(prompt) => client?.send(prompt)}
      onApprovePlan={(path) => client?.approve(path)}
    />
  );
}
