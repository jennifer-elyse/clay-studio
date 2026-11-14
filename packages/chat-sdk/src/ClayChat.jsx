import { useState } from "react";
import { ChatPane } from "./ChatPane.jsx";
import { ClayHeader } from "./ClayHeader.jsx";
import { planNeedsProject } from "./project-gate.js";
import { KeepShell } from "./KeepShell.jsx";
import { PreviewPane } from "./PreviewPane.jsx";
import { SeatModal } from "./SeatModal.jsx";
import { useClaySession } from "./use-clay-session.js";
import "./tokens.css";
import "./ClayChat.css";
/** @param {import("./use-clay-session.js").ClayChatProps} props */
export function ClayChat(props) {
  const [projectDraft, setProjectDraft] = useState({ name: "", folder: "", open: false });
  const [projectNotice, setProjectNotice] = useState("");
  const [projectOpenSignal, setProjectOpenSignal] = useState(0);
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
      <div className="clay-shell">
        <ClayHeader
          clip={session.clip}
          minimized={session.minimized}
          seat={props.seat}
          project={props.project}
          projects={props.projects}
          projectNotice={projectNotice}
          projectOpenSignal={projectOpenSignal}
          onSelectProject={props.onSelectProject}
          onSaveProject={props.onSaveProject}
          onProjectDraft={(draft) => {
            setProjectDraft(draft);
            if (draft.name.trim()) setProjectNotice("");
          }}
          onToggle={() => session.setMinimized((value) => !value)}
          onOpenSeats={() => session.openSeats(props.seat?.provider)}
        />
        <ChatPane
          items={session.items}
          steps={session.steps}
          working={session.working}
          clip={session.clip}
          run={session.run}
          draft={session.draft}
          onDraft={session.setDraft}
          onSend={session.send}
          onPick={session.pick}
          onThink={session.think}
          thinkFirst={session.thinkFirst}
          onSeats={() => session.openSeats()}
          onApprove={props.onApprovePlan}
          onAdjust={() => session.adjust()}
        />
        <KeepShell>
          <PreviewPane url={props.previewUrl} status={props.previewStatus} message={props.previewMessage} debug={session.debug} log={props.log} onOpen={props.onOpenPreview} />
        </KeepShell>
        <SeatModal open={session.seatsOpen} product={session.seatProduct} current={props.seat?.provider} onProduct={session.setSeatProduct} onUse={session.useSeat} onClose={() => session.setSeatsOpen(false)} />
      </div>
    </div>
  );
}
