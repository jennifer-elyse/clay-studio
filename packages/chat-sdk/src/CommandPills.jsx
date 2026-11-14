import { COMMANDS, PILL_IDS } from "./commands.js";
import { CommandPill } from "./CommandPill.jsx";
import { HelpMenu } from "./HelpMenu.jsx";

/**
 * @param {object} props
 * @param {(slash: string, options?: { thinkFirst?: boolean }) => void} props.onPick
 * @param {(slash: string) => void} [props.onSend]
 * @param {() => void} [props.onSeats]
 * @param {boolean} [props.busy]
 * @param {string} [props.thinkFirst]
 */
export function CommandPills({ onPick, onSend, onSeats, busy = false, thinkFirst = "" }) {
  const pills = COMMANDS.filter((command) => PILL_IDS.includes(command.id));
  return (
    <div className="clay-pills" role="toolbar" aria-label="Clay commands">
      {pills.map((command) => (
        <CommandPill
          key={command.id}
          command={command}
          busy={busy}
          armed={thinkFirst === command.id}
          onPick={onPick}
          onSend={onSend}
          onSeats={onSeats}
        />
      ))}
      <HelpMenu onSend={onSend} busy={busy} />
    </div>
  );
}
