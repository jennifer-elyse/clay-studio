import { useId, useState } from "react";
import { COMMANDS, PILL_IDS } from "./commands.js";
import { Chevron } from "./Chevron.jsx";
import { CommandPill } from "./CommandPill.jsx";
import { HelpMenu } from "./HelpMenu.jsx";

/**
 * @param {object} props
 * @param {(slash: string) => void} props.onPick
 * @param {(slash: string) => void} [props.onThink]
 * @param {boolean} [props.thinkFirst]
 * @param {string} [props.draft]
 * @param {(slash: string) => void} [props.onSend]
 * @param {() => void} [props.onSeats]
 * @param {boolean} [props.busy]
 */
export function CommandPills({ onPick, onThink, thinkFirst = false, draft = "", onSend, onSeats, busy = false }) {
  const [collapsed, setCollapsed] = useState(false);
  const buttonsId = useId();
  const pills = PILL_IDS.map((id) => COMMANDS.find((command) => command.id === id)).filter((command) => command);
  const text = draft.trim();
  const label = collapsed ? "Show commands" : "Minimize commands";
  return (
    <div className={`clay-pills${collapsed ? " is-collapsed" : ""}`} role="toolbar" aria-label="Clay commands">
      <div id={buttonsId} className="clay-command-buttons" hidden={collapsed}>
        {pills.map((command) => (
          <CommandPill
            key={command.id}
            command={command}
            busy={busy}
            armed={thinkFirst && (text === command.slash || text.startsWith(`${command.slash} `))}
            onPick={onPick}
            onThink={onThink}
            onSend={onSend}
            onSeats={onSeats}
          />
        ))}
        <HelpMenu onSend={onSend} busy={busy} />
      </div>
      <button type="button" className="clay-minimize clay-pills-toggle" aria-expanded={!collapsed} aria-controls={buttonsId} aria-label={label} onClick={() => setCollapsed((value) => !value)}>
        <Chevron direction={collapsed ? "up" : "down"} />
      </button>
    </div>
  );
}
