/**
 * @param {string} provider
 */
function seatLabel(provider) {
  if (provider === "copilot") return "Copilot";
  if (provider === "cursor") return "Cursor";
  if (provider === "codex") return "Codex";
  return "DEMO MODE";
}

/**
 * @param {object} props
 * @param {{ provider?: string, model?: string, caption?: string } | null} [props.seat]
 * @param {() => void} [props.onOpen]
 */
export function SeatBadge({ seat, onOpen }) {
  if (!seat?.provider) return null;
  const label = seatLabel(seat.provider);
  return (
    <button
      type="button"
      className={`clay-badge${seat.provider === "copilot" ? " is-copilot" : ""}${seat.provider === "codex" ? " is-codex" : ""}`}
      title={seat.caption || "Choose a product"}
      onClick={onOpen}
    >
      {label}
      {seat.model ? ` · ${seat.model}` : ""}
    </button>
  );
}
