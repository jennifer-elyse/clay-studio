/**
 * @param {object} props
 * @param {{ title: string, body: string, status: string, path: string }} props.plan
 * @param {(path: string) => void} [props.onApprove]
 * @param {(path: string) => void} [props.onAdjust]
 */
export function PlanCard({ plan, onApprove, onAdjust }) {
  const draft = plan.status === "draft";
  return (
    <article className="clay-plan" aria-label="Plan">
      <h2>{plan.title}</h2>
      <p>{draft ? "Needs your approval before anything is built." : "Approved. Ready to build."}</p>
      <pre>{plan.body}</pre>
      {draft ? (
        <div className="clay-plan-actions">
          <button type="button" onClick={() => onApprove?.(plan.path)}>
            Approve
          </button>
          <button type="button" className="secondary" onClick={() => onAdjust?.(plan.path)}>
            Adjust
          </button>
        </div>
      ) : null}
    </article>
  );
}
