import { ClayChat } from "../src/ClayChat.jsx";
import { copilotEvents, finishedEvents, streamingEvents } from "./chat-fixtures.js";

const meta = { title: "Clay/ClayChat", component: ClayChat };
export default meta;

export const Empty = {
  render: () => <ClayChat events={[]} onSend={() => undefined} seat={{ provider: "mock" }} />,
};

export const StreamingPlan = {
  render: () => (
    <ClayChat
      events={streamingEvents}
      onSend={() => undefined}
      onApprovePlan={() => undefined}
      seat={{ provider: "cursor", model: "claude-4.5-sonnet" }}
    />
  ),
};

export const Finished = {
  render: () => (
    <ClayChat
      events={finishedEvents}
      onSend={() => undefined}
      onApprovePlan={() => undefined}
      seat={{ provider: "mock" }}
    />
  ),
};

export const CopilotSeat = {
  render: () => (
    <ClayChat
      events={copilotEvents}
      onSend={() => undefined}
      seat={{ provider: "copilot", model: "gpt-6.1-sol", caption: "Copilot seat" }}
      previewUrl="about:blank"
    />
  ),
};
