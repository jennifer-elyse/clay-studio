import { BrainButton } from "./BrainButton.jsx";
import { pillLock } from "./pill-state.js";

/**
 * @param {object} props
 * @param {{ id: string, slash: string, label: string, summary: string, needsInput?: boolean, brain?: boolean }} props.command
 * @param {boolean} [props.busy]
 * @param {boolean} [props.armed]
 * @param {{ plan?: boolean, build?: boolean }} [props.done]
 * @param {(slash: string) => void} props.onPick
 * @param {(slash: string) => void} [props.onSend]
 * @param {(slash: string) => void} [props.onThink]
 * @param {() => void} [props.onSeats]
 */
export function CommandPill({ command, busy = false, armed = false, done, onPick, onSend, onThink, onSeats }) {
  const lock = pillLock(command.id, done);
  const waiting = !lock && busy && command.id !== "stop";
  const title = lock || (waiting ? "Wait until this run finishes." : command.summary);
  const off = Boolean(lock) || waiting;
  const thinks = command.brain === true;

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
      <button type="button" className={`clay-pill is-${command.id}${lock ? " is-retired" : ""}`} title={title} disabled={off} onClick={run}>
        {command.label}
      </button>
    );
  }

  return (
    <div className={`clay-pill is-${command.id} has-brain${lock ? " is-retired" : ""}`}>
      <button type="button" className="clay-pill-main" title={title} disabled={off} onClick={run}>
        {command.label}
      </button>
      <BrainButton armed={armed} disabled={off} onClick={() => onThink?.(`${command.slash} `)} />
    </div>
  );
}
