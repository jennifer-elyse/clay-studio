import { SeatModelForm } from "./SeatModelForm.jsx";

/**
 * Collapsed by default. Switching seat remounts the form, so its inputs start from that seat.
 * @param {object} props
 * @param {"cursor" | "codex" | "copilot"} props.seat
 * @param {object | null} props.settings
 * @param {(input: object) => Promise<{ ok: boolean, message?: string }>} [props.onSave]
 */
export function AdvancedSeatOptions({ seat, settings, onSave }) {
  return (
    <details className="clay-advanced">
      <summary>Advanced options</summary>
      <SeatModelForm key={seat} seat={seat} settings={settings} onSave={onSave} />
    </details>
  );
}
