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
      project={studio.project}
      projects={studio.projects}
      previewUrl={studio.previewUrl}
      previewStatus={studio.previewStatus}
      previewMessage={studio.previewMessage}
      onOpenPreview={(url) => {
        fetch("/api/preview/open", { method: "POST" }).catch(() => {
          window.open(url, "_blank", "noopener,noreferrer");
        });
      }}
      onSend={(prompt) => studio.client?.send(prompt)}
      onApprovePlan={(path) => studio.client?.approve(path)}
      onSelectSeat={(seat) => studio.client?.setSeat(seat)}
      onSelectProject={(id) => studio.client?.selectProject(id)}
      onSaveProject={(input) => studio.client?.saveProject(input)}
    />
  );
}
