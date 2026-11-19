import { useState } from "react";
import { ChatPane } from "./ChatPane.jsx";
import { ClayHeader } from "./ClayHeader.jsx";
import { planNeedsProject } from "./project-gate.js";
import { KeepShell } from "./KeepShell.jsx";
import { PreviewPane } from "./PreviewPane.jsx";
import { SettingsModal } from "./SettingsModal.jsx";
import { previewActivity } from "./map-events.js";
import { useClaySession } from "./use-clay-session.js";
import { useLayout } from "./use-layout.js";
import { readTheme, saveTheme } from "./theme.js";
import { readClayColor, saveClayColor } from "./clay-color.js";
import "./styles/main.scss";
/** @param {import("./use-clay-session.js").ClayChatProps} props */
export function ClayChat(props) {
  const [theme, setTheme] = useState(readTheme);
  const [clayColor, setClayColor] = useState(readClayColor);
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
  const { layout, previewReady, pick } = useLayout({ ...props, debug: session.debug, projectId: props.project?.id ?? "" });
  function chooseTheme(value) {
    setTheme(value);
    saveTheme(value);
  }
  function chooseClayColor(value) {
    if (saveClayColor(value)) setClayColor(value.toUpperCase());
  }
  return (
    <div className={`clay-root${theme === "blue" ? " is-blue" : ""}`}>
      <div className="clay-shell" data-layout={layout}>
        <ClayHeader
          clip={session.clip}
          theme={theme}
          clayColor={clayColor}
          minimized={session.minimized}
          layout={layout}
          onLayout={pick}
          previewReady={previewReady}
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
          theme={theme}
          clayColor={clayColor}
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
        <KeepShell>
          <PreviewPane theme={theme} url={props.previewUrl} status={props.previewStatus} message={props.previewMessage} activity={previewActivity(session.run)} debug={session.debug} log={props.log} onOpen={props.onOpenPreview} />
        </KeepShell>
        <SettingsModal
          open={session.settingsOpen}
          theme={theme}
          onTheme={chooseTheme}
          clayColor={clayColor}
          onClayColor={chooseClayColor}
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
