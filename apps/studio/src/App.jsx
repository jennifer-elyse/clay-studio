import { ClayChat } from "@cswg/clay-chat";
import { useStudioClient } from "./use-studio-client.js";

/** Studio shell. */
export function App() {
  const studio = useStudioClient();
  return (
    <ClayChat
      events={studio.events}
      items={studio.items}
      busy={studio.busy}
      seat={studio.seat}
      previewUrl={studio.previewUrl}
      previewStatus={studio.previewStatus}
      onSend={(prompt) => studio.client?.send(prompt)}
      onApprovePlan={(path) => studio.client?.approve(path)}
      onSelectSeat={(seat) => studio.client?.setSeat(seat)}
    />
  );
}
