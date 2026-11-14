import { ClayBot } from "./ClayBot.jsx";
import { PlanCard } from "./PlanCard.jsx";

/**
 * @param {object} props
 * @param {import("./map-events.js").TranscriptItem[]} props.items
 * @param {{ label: string, status: string }[]} [props.steps]
 * @param {boolean} [props.busy]
 * @param {string} [props.clip]
 * @param {(path: string) => void} [props.onApprove]
 * @param {(path: string) => void} [props.onAdjust]
 */
export function Transcript({ items, steps = [], clip = "idle.webp", onApprove, onAdjust }) {
  if (items.length === 0) {
    return (
      <div className="clay-transcript">
        <div className="clay-empty">
          <ClayBot clip={clip} size="lg" />
          <h1>What should we mold?</h1>
          <p>Describe an internal app. We will write a plan first.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="clay-transcript" aria-live="polite">
      {items.map((item) =>
        item.kind === "plan" && item.plan ? (
          <PlanCard key={item.id} plan={item.plan} onApprove={onApprove} onAdjust={onAdjust} />
        ) : (
          <div key={item.id} className={`clay-bubble${item.kind === "user" ? " is-user" : ""}${item.kind === "error" ? " is-error" : ""}`}>
            {item.text}
          </div>
        ),
      )}
      {steps.length > 0 ? (
        <div className="clay-steps">
          {steps.map((step) => (
            <span
              key={step.label}
              className={`clay-step${step.status === "running" ? " is-running" : ""}${step.status === "done" ? " is-done" : ""}${step.status === "error" ? " is-error" : ""}`}
            >
              {step.status === "done" ? `${step.label} — done` : step.status === "error" ? `${step.label} — failed` : `${step.label}…`}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
