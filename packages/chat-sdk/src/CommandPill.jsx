import { BrainButton } from "./BrainButton.jsx";

/**
 * @param {object} props
 * @param {{ id: string, slash: string, label: string, summary: string, needsInput?: boolean }} props.command
 * @param {boolean} [props.busy]
 * @param {boolean} [props.armed]
 * @param {(slash: string) => void} props.onPick
 * @param {(slash: string) => void} [props.onSend]
 * @param {(slash: string) => void} [props.onThink]
 * @param {() => void} [props.onSeats]
 */
export function CommandPill({ command, busy = false, armed = false, onPick, onSend, onThink, onSeats }) {
  const waiting = busy && command.id !== "stop";
  const title = waiting ? "Wait until this run finishes." : command.summary;
  const thinks = command.id === "plan" || command.id === "fix";

  function run() {
    if (command.id === "seat") {
      onSeats?.();
      return;
    }
    if (command.needsInput) onPick(`${command.slash} `);
    else onSend?.(command.slash);
  }

  if (!thinks) {
    return (
      <button type="button" className={`clay-pill is-${command.id}`} title={title} disabled={waiting} onClick={run}>
        {command.label}
      </button>
    );
  }

  return (
    <div className={`clay-pill is-${command.id} has-brain`}>
      <button type="button" className="clay-pill-main" title={title} disabled={waiting} onClick={run}>
        {command.label}
      </button>
      <BrainButton armed={armed} disabled={waiting} onClick={() => onThink?.(`${command.slash} `)} />
    </div>
  );
}
