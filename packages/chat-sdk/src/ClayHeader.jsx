import { Chevron } from "./Chevron.jsx";
import { ClayBot } from "./ClayBot.jsx";
import { ProjectMenu } from "./ProjectMenu.jsx";
import { SeatBadge } from "./SeatBadge.jsx";
import { SettingsButton } from "./SettingsButton.jsx";

/**
 * @param {object} props
 * @param {string} props.clip
 * @param {boolean} props.minimized
 * @param {() => void} props.onToggle
 * @param {{ provider?: string, model?: string, caption?: string } | null} [props.seat]
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
  seat,
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
        <SettingsButton onOpen={onOpenSettings} />
        <SeatBadge seat={seat} />
      </div>
      <button type="button" className="clay-minimize" aria-expanded="true" aria-controls="clay-header" aria-label="Minimize" onClick={onToggle}>
        <Chevron />
      </button>
    </header>
  );
}
