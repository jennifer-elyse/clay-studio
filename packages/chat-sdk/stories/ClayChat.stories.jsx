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

export const WithSeatModels = {
  render: () => (
    <ClayChat
      events={[]}
      onSend={() => undefined}
      seat={{ provider: "codex", model: "gpt-5.4", caption: "Codex gpt-5.4, medium effort" }}
      seatSettings={{
        seatModels: { codex: { work: "gpt-5.5" } },
        defaults: {
          codex: { work: "gpt-5.4", build: "gpt-5.4", fast: "gpt-5.4-mini" },
          cursor: { work: "claude-4.5-sonnet", build: "grok-4.7", fast: "composer-2.5" },
          copilot: { work: "gpt-6.1-sol", build: "gpt-6.1-sol", fast: "gpt-6-luna" },
        },
      }}
      onSaveSettings={async () => ({ ok: true })}
    />
  ),
};

export const WithProjectsFolder = {
  render: () => (
    <ClayChat
      events={[]}
      onSend={() => undefined}
      seat={{ provider: "cursor", model: "claude-4.5-sonnet" }}
      projectsRoot="/Users/you/Projects"
      onSaveSettings={async () => ({ ok: true })}
    />
  ),
};

export const ChatLayout = {
  render: () => <ClayChat events={finishedEvents} onSend={() => undefined} seat={{ provider: "mock" }} previewStatus="" />,
};

export const PreviewLayoutWhenReady = {
  render: () => (
    <ClayChat
      events={finishedEvents}
      onSend={() => undefined}
      seat={{ provider: "mock" }}
      previewStatus="ready"
      previewUrl="http://127.0.0.1:4312"
    />
  ),
};

export const ReadyWhileInChatLayout = {
  render: PreviewLayoutWhenReady.render,
  play: async ({ canvasElement }) => {
    canvasElement.querySelector(".clay-layout-option")?.click();
  },
};
