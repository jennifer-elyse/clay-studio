import { ProjectsRootSection } from "../src/ProjectsRootSection.jsx";
import { SeatModelForm } from "../src/SeatModelForm.jsx";
import "../src/tokens.css";
import "../src/ClayChat.css";

const settings = {
  seatModels: { codex: { work: "gpt-5.5" } },
  defaults: { codex: { work: "gpt-5.4", build: "gpt-5.4", fast: "gpt-5.4-mini" } },
};

const listing = {
  path: "/Users/you/Projects",
  label: "Projects",
  parent: "/Users/you",
  entries: [{ name: "notes", path: "/Users/you/Projects/notes" }],
};

const meta = { title: "Clay/Settings" };
export default meta;

export const ModelsLoading = {
  render: () => <SeatModelForm seat="codex" settings={null} onSave={async () => ({ ok: true })} />,
};

export const ModelsSaved = {
  render: () => <SeatModelForm seat="codex" settings={settings} onSave={async () => ({ ok: true })} />,
};

export const ProjectsFolder = {
  render: () => (
    <ProjectsRootSection
      root="/Users/you/Projects"
      onSave={async () => ({ ok: true })}
      onClose={() => undefined}
      listDirectories={async () => listing}
    />
  ),
};
