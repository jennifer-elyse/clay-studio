import { ClayBot } from "./ClayBot.jsx";
import { stepLabel } from "./map-events.js";
import { PlanCard } from "./PlanCard.jsx";
import { TranscriptBubble } from "./TranscriptBubble.jsx";

/**
 * @param {object} props
 * @param {import("./map-events.js").TranscriptItem[]} props.items
 * @param {{ label: string, status: string }[]} [props.steps]
 * @param {boolean} [props.busy]
 * @param {string} [props.clip]
 * @param {"classic" | "blue"} [props.theme]
 * @param {(path: string) => void} [props.onApprove]
 * @param {() => void} [props.onAdjust]
 * @param {(item: import("./map-events.js").TranscriptItem) => void} [props.onEdit]
 * @param {(item: import("./map-events.js").TranscriptItem) => void} [props.onResend]
 */
export function Transcript({ items, steps = [], busy = false, clip = "idle.webp", theme = "classic", onApprove, onAdjust, onEdit, onResend }) {
  if (items.length === 0) {
    return (
      <div className="clay-transcript">
        <div className="clay-empty">
          <ClayBot clip={clip} theme={theme} size="lg" />
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
          <TranscriptBubble key={item.id} item={item} busy={busy} onEdit={onEdit} onResend={onResend} />
        ),
      )}
      {steps.length > 0 ? (
        <div className="clay-steps">
          {steps.map((step) => (
            <span key={step.label} className={`clay-step is-${step.status}`}>
              {stepLabel(step)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
