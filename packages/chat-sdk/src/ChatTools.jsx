import { COMMANDS } from "./commands.js";

/** @param {{ onSend?: (slash: string) => void, busy?: boolean }} props */
export function ChatTools({ onSend, busy = false }) {
  const tools = [
    { id: "clear", tone: "is-clear" },
    { id: "reset", tone: "is-reset" },
  ].map((tool) => ({ ...COMMANDS.find((command) => command.id === tool.id), tone: tool.tone }));

  return (
    <div className="clay-chat-tools">
      {tools.map((command) => (
        <button
          key={command.id}
          type="button"
          className={`clay-tool ${command.tone}`}
          disabled={busy}
          title={busy ? "Wait until this run finishes." : command.summary}
          onClick={() => onSend?.(command.slash)}
        >
          {command.label}
        </button>
      ))}
    </div>
  );
}
