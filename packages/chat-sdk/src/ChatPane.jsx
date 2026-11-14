import { ChatTools } from "./ChatTools.jsx";
import { CommandPills } from "./CommandPills.jsx";
import { Composer } from "./Composer.jsx";
import { KeepShell } from "./KeepShell.jsx";
import { Transcript } from "./Transcript.jsx";

/**
 * @param {object} props
 * @param {import("./map-events.js").TranscriptItem[]} props.items
 * @param {{ label: string, status: string }[]} props.steps
 * @param {boolean} props.working
 * @param {string} props.clip
 * @param {{ label?: string, phase?: string }} props.run
 * @param {string} props.draft
 * @param {(value: string) => void} props.onDraft
 * @param {(text: string) => void} props.onSend
 * @param {(slash: string) => void} props.onPick
 * @param {(slash: string) => void} props.onThink
 * @param {boolean} props.thinkFirst
 * @param {() => void} props.onSeats
 * @param {(path: string) => void} [props.onApprove]
 * @param {() => void} props.onAdjust
 */
export function ChatPane({
  items, steps, working, clip, run, draft, onDraft, onSend, onPick, onThink, thinkFirst, onSeats, onApprove, onAdjust,
}) {
  return (
    <section className="clay-chat" id="clay-chat">
      <ChatTools onSend={onSend} busy={working} />
      <KeepShell>
        <Transcript items={items} steps={steps} busy={working} clip={clip} onApprove={onApprove} onAdjust={onAdjust} />
      </KeepShell>
      {run.label ? <p className={`clay-task is-${run.phase}`} role="status">{run.label}</p> : null}
      <CommandPills onPick={onPick} onThink={onThink} thinkFirst={thinkFirst} draft={draft} onSend={onSend} onSeats={onSeats} busy={working} />
      <Composer onSend={onSend} busy={working} value={draft} onChange={onDraft} />
    </section>
  );
}
