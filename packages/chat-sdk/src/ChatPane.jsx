import { ChatTools } from "./ChatTools.jsx";
import { CommandPills } from "./CommandPills.jsx";
import { Composer } from "./Composer.jsx";
import { KeepShell } from "./KeepShell.jsx";
import { Transcript } from "./Transcript.jsx";

/** @param {object} props */
export function ChatPane(props) {
  const { items, steps, working, clip, theme = "classic", run, draft, onDraft, onSend, onPick, onThink, thinkFirst, onSeats, onApprove, onAdjust, done } = props;
  return (
    <section className="clay-chat" id="clay-chat">
      <ChatTools onSend={onSend} busy={working} />
      <KeepShell>
        <Transcript
          items={items}
          steps={steps}
          busy={working}
          clip={clip}
          theme={theme}
          onApprove={onApprove}
          onAdjust={onAdjust}
          onEdit={props.onEdit}
          onResend={props.onResend}
        />
      </KeepShell>
      {run.label ? <p className={`clay-task is-${run.phase}`} role="status">{run.label}</p> : null}
      <CommandPills onPick={onPick} onThink={onThink} thinkFirst={thinkFirst} draft={draft} onSend={onSend} onSeats={onSeats} busy={working} done={done} />
      <Composer
        onSend={onSend}
        onCancel={props.onCancel}
        busy={working}
        editing={props.editing}
        onCancelEdit={props.onCancelEdit}
        value={draft}
        onChange={onDraft}
      />
    </section>
  );
}
