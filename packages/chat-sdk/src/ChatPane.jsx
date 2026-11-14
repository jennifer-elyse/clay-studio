import { ChatTools } from "./ChatTools.jsx";
import { CommandPills } from "./CommandPills.jsx";
import { Composer } from "./Composer.jsx";
import { Transcript } from "./Transcript.jsx";

/**
 * @param {object} props
 * @param {boolean} props.hidden
 * @param {import("./map-events.js").TranscriptItem[]} props.items
 * @param {{ label: string, status: string }[]} props.steps
 * @param {boolean} props.working
 * @param {string} props.clip
 * @param {{ label?: string, phase?: string }} props.run
 * @param {string} props.draft
 * @param {(value: string) => void} props.onDraft
 * @param {(text: string) => void} props.onSend
 * @param {(slash: string, options?: { thinkFirst?: boolean }) => void} props.onPick
 * @param {() => void} props.onSeats
 * @param {string} [props.thinkFirst]
 * @param {(path: string) => void} [props.onApprove]
 * @param {() => void} props.onAdjust
 */
export function ChatPane({
  hidden,
  items,
  steps,
  working,
  clip,
  run,
  draft,
  onDraft,
  onSend,
  onPick,
  onSeats,
  onApprove,
  onAdjust,
  thinkFirst,
}) {
  return (
    <section className="clay-chat" id="clay-chat" hidden={hidden}>
      <ChatTools onSend={onSend} busy={working} />
      <Transcript items={items} steps={steps} busy={working} clip={clip} onApprove={onApprove} onAdjust={onAdjust} />
      {run.label ? <p className={`clay-task is-${run.phase}`} role="status">{run.label}</p> : null}
      <CommandPills onPick={onPick} onSend={onSend} onSeats={onSeats} busy={working} thinkFirst={thinkFirst} />
      <Composer onSend={onSend} busy={working} value={draft} onChange={onDraft} />
    </section>
  );
}
