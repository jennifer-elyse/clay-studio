import { Composer } from "../src/Composer.jsx";
import "../src/tokens.css";
import "../src/ClayChat.css";

const meta = { title: "Clay/Composer", component: Composer };
export default meta;

export const Ready = {
  render: () => (
    <div className="clay-root">
      <Composer onSend={() => undefined} value="A tracker for store requests" onChange={() => undefined} />
    </div>
  ),
};

export const Stop = {
  render: () => (
    <div className="clay-root">
      <Composer onSend={() => undefined} onCancel={() => undefined} busy value="" onChange={() => undefined} />
    </div>
  ),
};

export const Editing = {
  render: () => (
    <div className="clay-root">
      <Composer onSend={() => undefined} onCancelEdit={() => undefined} editing value="A tracker" onChange={() => undefined} />
    </div>
  ),
};
