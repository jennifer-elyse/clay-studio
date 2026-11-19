import { AMBIENT_CLIPS, COMMAND_CLIPS } from "../src/animations.js";
import { ClayBot } from "../src/ClayBot.jsx";
import "../src/tokens.css";

const meta = { title: "Clay/ClayBot", component: ClayBot };
export default meta;

export const Idle = {
  render: () => (
    <div className="clay-root" style={{ padding: 24 }}>
      <ClayBot clip="idle.webp" size="lg" />
    </div>
  ),
};

export const Help = {
  render: () => (
    <div className="clay-root" style={{ padding: 24 }}>
      <ClayBot clip={COMMAND_CLIPS.help} size="lg" />
    </div>
  ),
};

export const Ambient = {
  render: () => (
    <div className="clay-root" style={{ padding: 24, display: "flex", gap: 16, flexWrap: "wrap" }}>
      {AMBIENT_CLIPS.map((clip) => (
        <ClayBot key={clip} clip={clip} />
      ))}
    </div>
  ),
};

export const BlueClay = {
  render: () => <div className="clay-root is-blue" style={{ padding: 24 }}><ClayBot theme="blue" clip="idle.webp" size="lg" /></div>,
};
export const UnicornMorph = {
  render: () => <div className="clay-root is-blue" style={{ padding: 24 }}><ClayBot theme="blue" clip="image.webp" size="lg" /></div>,
};
