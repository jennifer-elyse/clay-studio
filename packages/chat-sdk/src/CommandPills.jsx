import { COMMANDS, PILL_IDS } from "./commands.js";

/**
 * @param {object} props
 * @param {(slash: string) => void} props.onPick
 * @param {(slash: string) => void} [props.onSend]
 * @param {boolean} [props.busy]
 */
export function CommandPills({ onPick, onSend, busy = false }) {
  const pills = COMMANDS.filter((command) => PILL_IDS.includes(command.id));
  return (
    <div className="clay-pills" role="toolbar" aria-label="Clay commands">
      {pills.map((command) => (
        <button
          key={command.id}
          type="button"
          className={`clay-pill is-${command.id}`}
          title={command.summary}
          disabled={busy && command.id !== "stop"}
          onClick={() => {
            if (command.needsInput) onPick(`${command.slash} `);
            else onSend?.(command.slash);
          }}
        >
          {command.label}
        </button>
      ))}
    </div>
  );
}
