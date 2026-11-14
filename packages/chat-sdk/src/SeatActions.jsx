/**
 * @param {object} props
 * @param {import("@cswg/agent-host/seats").ProductSeat | null} props.chosen
 * @param {string} props.current
 * @param {(id: string) => void} props.onUse
 * @param {() => void} props.onClose
 */
export function SeatActions({ chosen, current, onUse, onClose }) {
  const label = chosen && current === chosen.id ? `Stay on ${chosen.label}` : `Use ${chosen?.label}`;
  return (
    <div className="clay-modal-actions">
      {chosen ? (
        <button type="button" className="clay-seat-use" onClick={() => onUse(chosen.id)}>
          {label}
        </button>
      ) : null}
      <button type="button" className="clay-modal-close" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
