/**
 * @param {object} props
 * @param {{ id: string, slash: string, label: string, summary: string, needsInput?: boolean }} props.command
 * @param {boolean} [props.busy]
 * @param {boolean} [props.armed]
 * @param {(slash: string, options?: { thinkFirst?: boolean }) => void} props.onPick
 * @param {(slash: string) => void} [props.onSend]
 * @param {() => void} [props.onSeats]
 */
export function CommandPill({ command, busy = false, armed = false, onPick, onSend, onSeats }) {
  const waiting = busy && command.id !== "stop";
  const title = waiting ? "Wait until this run finishes." : command.summary;

  function run(think) {
    if (command.id === "seat") {
      onSeats?.();
      return;
    }
    if (command.needsInput) onPick(`${command.slash} `, think ? { thinkFirst: true } : undefined);
    else onSend?.(command.slash);
  }

  if (command.id !== "plan" && command.id !== "fix") {
    return (
      <button type="button" className={`clay-pill is-${command.id}`} title={title} disabled={waiting} onClick={() => run(false)}>
        {command.label}
      </button>
    );
  }

  return (
    <span className={`clay-pill is-${command.id} has-brain`}>
      <button type="button" className="clay-pill-main" title={title} disabled={waiting} onClick={() => run(false)}>
        {command.label}
      </button>
      <button type="button" className={`clay-brain${armed ? " is-armed" : ""}`} aria-pressed={armed} aria-label={`Think, then ${command.label}`} title={waiting ? title : `Think, then ${command.label}`} disabled={waiting} onClick={() => run(true)}>
        <svg className="clay-brain-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path fill="currentColor" d="M6.2 2.2a2.4 2.4 0 0 0-2.3 1.8 2.1 2.1 0 0 0-1.6 2 2.1 2.1 0 0 0 .5 3.6 2.4 2.4 0 0 0 2.2 2.6H6.8V4.1A2.4 2.4 0 0 0 6.2 2.2Zm3.6 0a2.4 2.4 0 0 1 2.3 1.8 2.1 2.1 0 0 1 1.6 2 2.1 2.1 0 0 1-.5 3.6 2.4 2.4 0 0 1-2.2 2.6H9.2V4.1a2.4 2.4 0 0 1 .6-1.9Z" />
        </svg>
      </button>
    </span>
  );
}
