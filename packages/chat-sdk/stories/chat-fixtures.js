const trackerPlan = {
  id: "001",
  path: "docs/tracker-plan/001-tracker/plan.md",
  title: "Tracker",
  body: "## Goal\n\nApprove store requests.",
  status: "draft",
};

export const streamingEvents = [
  { type: "user_text", id: "u1", text: "/speckit.plan a tracker" },
  { type: "step", id: "s1", step: { label: "Reading your vision", status: "running" } },
  { type: "plan", id: "p1", plan: trackerPlan },
];

export const finishedEvents = [
  { type: "user_text", id: "u1", text: "/speckit.plan a tracker" },
  { type: "run_started", id: "s" },
  { type: "step", id: "s1", step: { label: "Reading your vision", status: "done" } },
  { type: "plan", id: "p1", plan: trackerPlan },
  { type: "run_finished", id: "f", status: "finished" },
];

export const copilotEvents = [
  { type: "assistant_text", id: "a", text: "Plans are still required on Copilot." },
];
