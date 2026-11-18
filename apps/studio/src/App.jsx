import { ClayChat } from "@cswg/clay-chat";
import { useRef } from "react";
import { ImageUpload } from "./ImageUpload.jsx";
import { loadModels, saveSettings } from "./save-settings.js";
import { useStudioClient } from "./use-studio-client.js";

/** Studio shell. */
export function App() {
  const studio = useStudioClient();
  const upload = useRef(null);
  return (
    <>
      <ImageUpload opener={upload} project={studio.project} />
      <ClayChat
        events={studio.events}
        items={studio.items}
        busy={studio.busy}
        seat={studio.seat}
        project={studio.project}
        done={studio.done}
        projects={studio.projects}
        projectsRoot={studio.projectsRoot}
        seatSettings={studio.seatSettings}
        onLoadModels={loadModels}
        onSaveSettings={async (input) => {
          const result = await saveSettings(input);
          if (result.ok) {
            studio.setProjectsRoot(result.settings.projectsRoot);
            studio.setSeatSettings(result.settings);
          }
          return result;
        }}
        previewUrl={studio.previewUrl}
        previewStatus={studio.previewStatus}
        previewMessage={studio.previewMessage}
        onOpenPreview={(url) => {
          fetch("/api/preview/open", { method: "POST" }).catch(() => {
            window.open(url, "_blank", "noopener,noreferrer");
          });
        }}
        onSend={(prompt) => studio.client?.send(prompt)}
        onUpload={() => upload.current?.()}
        onCancel={() => studio.client?.cancel()}
        onApprovePlan={(path) => studio.client?.approve(path)}
        onSelectSeat={(seat) => studio.client?.setSeat(seat)}
        onSelectProject={(id) => studio.client?.selectProject(id)}
        onSaveProject={(input) => studio.client?.saveProject(input)}
      />
    </>
  );
}

