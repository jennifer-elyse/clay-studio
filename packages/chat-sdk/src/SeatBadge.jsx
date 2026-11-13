/**
 * @param {object} props
 * @param {{ provider?: string, model?: string, caption?: string } | null} [props.seat]
 */
export function SeatBadge({ seat }) {
  if (!seat?.provider) return null;
  const label = seat.provider === "copilot" ? "Copilot" : seat.provider === "cursor" ? "Cursor" : "Mock";
  return (
    <div className={`clay-badge${seat.provider === "copilot" ? " is-copilot" : ""}`} title={seat.caption}>
      {label}
      {seat.model ? ` · ${seat.model}` : ""}
    </div>
  );
}
