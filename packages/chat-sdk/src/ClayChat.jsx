import { useEffect, useState } from "react";
import { readTheme, saveTheme } from "./theme.js";
import { ChatPane } from "./ChatPane.jsx";
import { ClayHeader } from "./ClayHeader.jsx";
import { planNeedsProject } from "./project-gate.js";
import { KeepShell } from "./KeepShell.jsx";
import { PreviewPane } from "./PreviewPane.jsx";
import { SettingsModal } from "./SettingsModal.jsx";
import { previewActivity } from "./map-events.js";
import { useClaySession } from "./use-clay-session.js";
import "./tokens.css";
import "./ClayChat.css";
/** @param {import("./use-clay-session.js").ClayChatProps} props */
export function ClayChat(props) {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => saveTheme(theme), [theme]);
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
    <div className={`clay-root is-${theme}`}>
      <div className="clay-shell">
        <ClayHeader
          clip={session.clip}
          theme={theme}
          minimized={session.minimized}
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
          onSeats={() => session.send("/seats")}
          onApprove={props.onApprovePlan}
          onAdjust={() => session.adjust()}
          done={props.done}
        />
        <KeepShell>
          <PreviewPane url={props.previewUrl} status={props.previewStatus} message={props.previewMessage} activity={previewActivity(session.run)} debug={session.debug} log={props.log} onOpen={props.onOpenPreview} />
        </KeepShell>
        <SettingsModal
          open={session.settingsOpen}
          theme={theme}
          onTheme={setTheme}
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
