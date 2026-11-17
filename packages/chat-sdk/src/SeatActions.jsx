/**
 * Only offers a switch. The current seat has nothing to confirm.
 * @param {object} props
 * @param {import("@cswg/agent-host/seats").ProductSeat | null} props.chosen
 * @param {string} props.current
 * @param {boolean} [props.busy]
 * @param {(id: string) => void} props.onUse
 */
export function SeatActions({ chosen, current, busy = false, onUse }) {
  if (!chosen || current === chosen.id) return null;
  return (
    <div className="clay-modal-actions">
      {busy ? <p className="clay-modal-note" id="clay-seat-busy">Clay is working. Switch when it finishes.</p> : null}
      <button type="button" className="clay-seat-use" disabled={busy} aria-describedby={busy ? "clay-seat-busy" : undefined} onClick={() => onUse(chosen.id)}>
        Use {chosen.label}
      </button>
    </div>
  );
}
