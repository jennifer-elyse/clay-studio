import { ClayBot } from "./ClayBot.jsx";
import { SeatBadge } from "./SeatBadge.jsx";

/**
 * @param {object} props
 * @param {string} props.clip
 * @param {boolean} props.minimized
 * @param {() => void} props.onToggle
 * @param {{ provider?: string, model?: string, caption?: string } | null} [props.seat]
 * @param {() => void} props.onOpenSeats
 */
export function ClayHeader({ clip, minimized, onToggle, seat, onOpenSeats }) {
  return (
    <header className="clay-header">
      <ClayBot clip={clip} />
      <div className="clay-wordmark">
        <strong>Clay</strong>
        <span>Mold freely. Ship safely.</span>
      </div>
      <div className="clay-header-actions">
        <button
          type="button"
          className="clay-minimize"
          aria-expanded={!minimized}
          aria-controls="clay-chat"
          onClick={onToggle}
        >
          {minimized ? "Show Clay" : "Minimize"}
        </button>
        <SeatBadge seat={seat} onOpen={onOpenSeats} />
      </div>
    </header>
  );
}
