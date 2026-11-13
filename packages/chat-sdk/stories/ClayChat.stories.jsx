import { ClayChat } from "../src/ClayChat.jsx";

const meta = { title: "Clay/ClayChat", component: ClayChat };
export default meta;

export const Empty = {
  render: () => <ClayChat events={[]} onSend={() => undefined} seat={{ provider: "mock" }} />,
};

export const StreamingPlan = {
  render: () => (
    <ClayChat
      events={[
        { type: "user_text", id: "u1", text: "/plan a tracker" },
        { type: "step", id: "s1", step: { label: "Reading your vision", status: "running" } },
        {
          type: "plan",
          id: "p1",
          plan: {
            id: "001",
            path: "docs/plans/001-tracker/plan.md",
            title: "Tracker",
            body: "## Goal\n\nApprove store requests.",
            status: "draft",
          },
        },
      ]}
      onSend={() => undefined}
      onApprovePlan={() => undefined}
      seat={{ provider: "cursor", model: "claude-4.5-sonnet" }}
    />
  ),
};

export const Finished = {
  render: () => (
    <ClayChat
      events={[
        { type: "user_text", id: "u1", text: "/plan a tracker" },
        { type: "run_started", id: "s" },
        { type: "step", id: "s1", step: { label: "Reading your vision", status: "done" } },
        {
          type: "plan",
          id: "p1",
          plan: {
            id: "001",
            path: "docs/plans/001-tracker/plan.md",
            title: "Tracker",
            body: "## Goal\n\nApprove store requests.",
            status: "draft",
          },
        },
        { type: "run_finished", id: "f", status: "finished" },
      ]}
      onSend={() => undefined}
      onApprovePlan={() => undefined}
      seat={{ provider: "mock" }}
    />
  ),
};

export const CopilotSeat = {
  render: () => (
    <ClayChat
      events={[{ type: "assistant_text", id: "a", text: "Plans are still required on Copilot." }]}
      onSend={() => undefined}
      seat={{ provider: "copilot", model: "gpt-5.4", caption: "Copilot seat" }}
      previewUrl="about:blank"
    />
  ),
};
