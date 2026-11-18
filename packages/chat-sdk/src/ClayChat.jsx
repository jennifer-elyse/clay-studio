import { useState } from "react";
import { ChatPane } from "./ChatPane.jsx";
import { ClayHeader } from "./ClayHeader.jsx";
import { planNeedsProject } from "./project-gate.js";
import { KeepShell } from "./KeepShell.jsx";
import { PreviewPane } from "./PreviewPane.jsx";
import { SettingsModal } from "./SettingsModal.jsx";
import { initialLayout, pickLayout, previewReadyKey, syncLayout } from "./layout-state.js";
import { previewActivity } from "./map-events.js";
import { useClaySession } from "./use-clay-session.js";
import "./tokens.css";
import "./ClayChat.css";
/** @param {import("./use-clay-session.js").ClayChatProps} props */
export function ClayChat(props) {
  const [projectDraft, setProjectDraft] = useState({ name: "", folder: "", open: false });
  const [projectNotice, setProjectNotice] = useState("");
  const [projectOpenSignal, setProjectOpenSignal] = useState(0);
  const [layoutState, setLayoutState] = useState(initialLayout);
  const readyKey = previewReadyKey(props.previewStatus, props.previewUrl);
  const synced = syncLayout(layoutState, { readyKey, projectId: props.project?.id ?? "" });
  if (synced !== layoutState) setLayoutState(synced);
  const layout = synced.layout;
  const session = useClaySession({
    ...props,
    preparePlan: () => {
      const ready = planNeedsProject({
        project: props.project,
        projects: props.projects,
        name: projectDraft.open ? projectDraft.name : "",
      });
      if (!ready.ok) {
        setProjectNotice(ready.message);
        setProjectOpenSignal((value) => value + 1);
        return ready;
      }
      setProjectNotice("");
      return { ...ready, projectFolder: projectDraft.folder };
    },
  });
  return (
    <div className="clay-root">
      <div className="clay-shell" data-layout={layout}>
        <ClayHeader
          clip={session.clip}
          minimized={session.minimized}
          layout={layout}
          onLayout={(next) => setLayoutState((state) => pickLayout(state, next === "chat" ? "pickChat" : "pickPreview"))}
          previewReady={readyKey !== ""}
          seat={props.seat}
          seatSettings={props.seatSettings}
          onLoadModels={props.onLoadModels}
          onSelectModel={session.chooseModel}
          project={props.project}
          projects={props.projects}
          projectNotice={projectNotice}
          projectOpenSignal={projectOpenSignal}
          projectsRoot={props.projectsRoot}
          onSelectProject={props.onSelectProject}
          onSaveProject={props.onSaveProject}
          onProjectDraft={(draft) => {
            setProjectDraft(draft);
            if (draft.name.trim()) setProjectNotice("");
          }}
          onToggle={() => session.setMinimized((value) => !value)}
          onOpenSettings={session.openSettings}
        />
        <ChatPane
          items={session.items}
          steps={session.steps}
          working={session.working}
          clip={session.clip}
          run={session.run}
          draft={session.draft}
          onDraft={session.setDraft}
          onSend={session.send} {...session.messageActions}
          onPick={session.pick}
          onThink={session.think}
          thinkFirst={session.thinkFirst}
          onSeats={() => session.openSettings()}
          onApprove={props.onApprovePlan}
          onAdjust={() => session.adjust()}
          done={props.done}
        />
        {layout === "preview" ? (
          <KeepShell>
            <PreviewPane url={props.previewUrl} status={props.previewStatus} message={props.previewMessage} activity={previewActivity(session.run)} debug={session.debug} log={props.log} onOpen={props.onOpenPreview} />
          </KeepShell>
        ) : null}
        <SettingsModal
          open={session.settingsOpen}
          section={session.settingsSection}
          onSection={session.setSettingsSection}
          product={session.seatProduct}
          current={props.seat?.provider}
          busy={session.working}
          projectsRoot={props.projectsRoot}
          onProduct={session.setSeatProduct}
          onUse={session.chooseSeat}
          seatSettings={props.seatSettings}
          onSaveSettings={props.onSaveSettings}
          onClose={() => session.setSettingsOpen(false)}
        />
      </div>
    </div>
  );
}
