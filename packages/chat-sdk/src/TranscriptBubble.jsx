/**
 * @param {object} props
 * @param {import("./map-events.js").TranscriptItem} props.item
 * @param {boolean} props.busy
 * @param {(item: import("./map-events.js").TranscriptItem) => void} [props.onEdit]
 * @param {(item: import("./map-events.js").TranscriptItem) => void} [props.onResend]
 */
export function TranscriptBubble({ item, busy, onEdit, onResend }) {
  const tone = item.kind === "user" ? " is-user" : item.kind === "error" ? " is-error" : "";
  const wait = busy ? "Wait until this run finishes." : "";
  return (
    <div className={`clay-turn${item.kind === "user" ? " is-user" : ""}`}>
      <div className={`clay-bubble${tone}`}>{item.text}</div>
      {item.kind === "user" ? (
        <div className="clay-message-actions">
          <button type="button" disabled={busy} title={wait || "Edit this message"} onClick={() => onEdit?.(item)}>
            Edit
          </button>
          <button type="button" disabled={busy} title={wait || "Send this message again"} onClick={() => onResend?.(item)}>
            Resend
          </button>
        </div>
      ) : null}
    </div>
  );
}
