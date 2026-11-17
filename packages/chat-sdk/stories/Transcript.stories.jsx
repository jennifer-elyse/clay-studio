import { Transcript } from "../src/Transcript.jsx";
import "../src/tokens.css";
import "../src/ClayChat.css";
import { finishedEvents } from "./chat-fixtures.js";
import { applyEvent } from "../src/map-events.js";

const items = finishedEvents.reduce(applyEvent, []);
const meta = { title: "Clay/Transcript", component: Transcript };
export default meta;

export const WithMessages = {
  render: () => (
    <div className="clay-root" style={{ height: 420 }}>
      <Transcript items={items} onEdit={() => undefined} onResend={() => undefined} onApprove={() => undefined} onAdjust={() => undefined} />
    </div>
  ),
};

export const Busy = {
  render: () => (
    <div className="clay-root" style={{ height: 420 }}>
      <Transcript
        items={items}
        busy
        steps={[{ label: "Reading your vision", status: "running" }]}
        onEdit={() => undefined}
        onResend={() => undefined}
      />
    </div>
  ),
};
