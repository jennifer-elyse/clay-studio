import { ProjectsRootSection } from "./ProjectsRootSection.jsx";
import { SeatSection } from "./SeatSection.jsx";
import { ThemeSection } from "./ThemeSection.jsx";

/**
 * The body of the section that is open.
 * @param {object} props
 * @param {string} props.section
 * @param {"classic" | "blue"} [props.theme]
 * @param {(theme: "classic" | "blue") => void} [props.onTheme]
 * @param {string} props.projectsRoot
 * @param {() => void} props.onClose
 * @param {import("react").ComponentProps<typeof SeatSection>} props.seat
 * @param {(input: object) => Promise<{ ok: boolean, message?: string }>} [props.onSaveSettings]
 */
export function SettingsPanel({ section, theme = "classic", onTheme, clayColor, onClayColor, projectsRoot, onClose, seat, onSaveSettings }) {
  return (
    <div id="clay-settings-panel" className="clay-settings-panel" role="tabpanel" aria-labelledby={`clay-tab-${section}`}>
      {section === "projects" ? (
        <ProjectsRootSection root={projectsRoot} onSave={onSaveSettings} onClose={onClose} />
      ) : section === "theme" ? (
        <ThemeSection theme={theme} onTheme={onTheme} clayColor={clayColor} onClayColor={onClayColor} />
      ) : (
        <SeatSection {...seat} onSaveSettings={onSaveSettings} />
      )}
    </div>
  );
}
