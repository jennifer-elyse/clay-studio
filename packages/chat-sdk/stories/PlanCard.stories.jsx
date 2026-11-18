import { PlanCard } from "../src/PlanCard.jsx";
import "../src/tokens.css";
import "../src/ClayChat.css";

const plan = {
  title: "Request tracker",
  path: "docs/tracker-plan/001-tracker/plan.md",
  body: "## Goal\n\nTrack store requests with approve and reject.",
  status: "draft",
};

const meta = { title: "Clay/PlanCard", component: PlanCard };
export default meta;

export const Draft = {
  render: () => (
    <div className="clay-root" style={{ padding: 24, maxWidth: 420 }}>
      <PlanCard plan={plan} onApprove={() => undefined} onAdjust={() => undefined} />
    </div>
  ),
};

export const Approved = {
  render: () => (
    <div className="clay-root" style={{ padding: 24, maxWidth: 420 }}>
      <PlanCard plan={{ ...plan, status: "approved" }} />
    </div>
  ),
};
