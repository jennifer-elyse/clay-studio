import { Chevron } from "./Chevron.jsx";
import { ClayBot } from "./ClayBot.jsx";
import { LayoutSwitch } from "./LayoutSwitch.jsx";
import { ProjectMenu } from "./ProjectMenu.jsx";
import { SeatBadge } from "./SeatBadge.jsx";
import { SettingsButton } from "./SettingsButton.jsx";

/**
 * @param {object} props
 * @param {string} props.clip
 * @param {boolean} props.minimized
 * @param {() => void} props.onToggle
 * @param {"chat" | "preview"} [props.layout]
 * @param {(layout: "chat" | "preview") => void} [props.onLayout]
 * @param {boolean} [props.previewReady]
 * @param {{ provider?: string, model?: string, caption?: string } | null} [props.seat]
 * @param {import("./seat-model-form.js").SeatSettings | null} [props.seatSettings]
 * @param {() => Promise<{ ok?: boolean, models?: Array<{ id: string, label?: string }>, message?: string } | void>} [props.onLoadModels]
 * @param {(id: string) => Promise<{ ok?: boolean, message?: string } | void>} [props.onSelectModel]
 * @param {() => void} props.onOpenSettings
 * @param {{ id: string, name: string, folder: string } | null} [props.project]
 * @param {{ id: string, name: string, folder: string }[]} [props.projects]
 * @param {string} [props.projectNotice]
 * @param {number} [props.projectOpenSignal]
 * @param {string} [props.projectsRoot]
 * @param {(id: string) => void} [props.onSelectProject]
 * @param {(input: { id?: string, name: string, folder: string }) => void} [props.onSaveProject]
 * @param {(draft: { name: string, folder: string, open: boolean }) => void} [props.onProjectDraft]
 */
export function ClayHeader({
  clip,
  minimized,
  onToggle,
  layout = "chat",
  onLayout = () => {},
  previewReady = false,
  seat,
  seatSettings = null,
  onLoadModels,
  onSelectModel,
  onOpenSettings,
  project = null,
  projects = [],
  projectNotice = "",
  projectOpenSignal = 0,
  projectsRoot = "",
  onSelectProject,
  onSaveProject,
  onProjectDraft,
}) {
  const title = project?.name?.trim() || "Clay";
  if (minimized) {
    return (
      <header className="clay-header is-minimized">
        <h1 className="clay-header-title">{title}</h1>
        <LayoutSwitch layout={layout} onLayout={onLayout} previewReady={previewReady} />
        <button type="button" className="clay-minimize" aria-expanded="false" aria-label={`Show header, ${title}`} onClick={onToggle}>
          <Chevron direction="up" />
        </button>
      </header>
    );
  }
  return (
    <header className="clay-header" id="clay-header">
      <ClayBot clip={clip} />
      <div className="clay-wordmark">
        <strong>Clay</strong>
        <span>Mold freely. Ship safely.</span>
      </div>
      <div className="clay-header-actions">
        <ProjectMenu
          project={project}
          projects={projects}
          notice={projectNotice}
          openSignal={projectOpenSignal}
          projectsRoot={projectsRoot}
          onSelect={onSelectProject}
          onSave={onSaveProject}
          onDraft={onProjectDraft}
        />
        <LayoutSwitch layout={layout} onLayout={onLayout} previewReady={previewReady} />
        <SettingsButton onOpen={onOpenSettings} />
        <SeatBadge seat={seat} settings={seatSettings} onLoadModels={onLoadModels} onSelect={onSelectModel} />
      </div>
      <button type="button" className="clay-minimize" aria-expanded="true" aria-controls="clay-header" aria-label="Minimize" onClick={onToggle}>
        <Chevron />
      </button>
    </header>
  );
}
