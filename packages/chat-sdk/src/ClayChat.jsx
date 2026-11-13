import { useMemo, useState } from "react";
import { clipForCommand } from "./animations.js";
import { ClayBot } from "./ClayBot.jsx";
import { parseSlash } from "./commands.js";
import { CommandPills } from "./CommandPills.jsx";
import { Composer } from "./Composer.jsx";
import { applyEvent, runStateFrom, stepsForRun } from "./map-events.js";
import { PreviewPane } from "./PreviewPane.jsx";
import { SeatBadge } from "./SeatBadge.jsx";
import { Transcript } from "./Transcript.jsx";
import "./tokens.css";
import "./ClayChat.css";

/**
 * @param {object} props
 * @param {import("@cswg/agent-host").UiEvent[]} [props.events]
 * @param {import("./map-events.js").TranscriptItem[]} [props.items]
 * @param {(prompt: string) => void} props.onSend
 * @param {(path: string) => void} [props.onApprovePlan]
 * @param {() => void} [props.onAdjustPlan]
 * @param {{ provider?: string, model?: string, caption?: string } | null} [props.seat]
 * @param {string} [props.previewUrl]
 * @param {string} [props.previewStatus]
 * @param {boolean} [props.busy]
 * @param {string} [props.log]
 */
export function ClayChat(props) {
  const [draft, setDraft] = useState("");
  const [debug, setDebug] = useState(false);
  const [clip, setClip] = useState("idle.webp");
  const [minimized, setMinimized] = useState(false);
  const items = props.items ?? (props.events ?? []).reduce(applyEvent, []);
  const events = props.events ?? [];
  const run = useMemo(() => runStateFrom(events), [events]);
  const steps = useMemo(() => stepsForRun(events), [events]);
  const working = props.busy || run.phase === "working";

  /**
   * @param {string} text
   */
  function playClip(text) {
    const { command } = parseSlash(text);
    setClip((previous) => clipForCommand(command?.id, { previous }));
  }

  function send(text) {
    if (parseSlash(text).command?.id === "debug") {
      setDebug((value) => !value);
      playClip(text);
      return;
    }
    playClip(text);
    props.onSend(text);
  }

  return (
    <div className={`clay-root clay-shell${minimized ? " is-minimized" : ""}`}>
      <header className="clay-header">
        <ClayBot clip={clip} />
        <div className="clay-wordmark">
          <strong>Clay</strong>
          <span>Mold freely. Ship safely.</span>
        </div>
        <div className="clay-header-actions">
          <button
            type="button"
            className="clay-minimize"
            aria-expanded={!minimized}
            aria-controls="clay-chat"
            onClick={() => setMinimized((value) => !value)}
          >
            {minimized ? "Show Clay" : "Minimize"}
          </button>
          <SeatBadge seat={props.seat} />
        </div>
      </header>
      <section className="clay-chat" id="clay-chat" hidden={minimized}>
        <Transcript
          items={items}
          steps={steps}
          busy={working}
          clip={clip}
          onStarter={send}
          onApprove={props.onApprovePlan}
          onAdjust={() => {
            setDraft("/plan ");
            playClip("/plan");
            props.onAdjustPlan?.();
          }}
        />
        {run.label ? (
          <p className={`clay-task is-${run.phase}`} role="status">
            {run.label}
          </p>
        ) : null}
        <CommandPills
          onPick={(slash) => {
            setDraft(slash);
            playClip(slash);
          }}
          onSend={send}
          busy={working}
        />
        <Composer onSend={send} busy={working} value={draft} onChange={setDraft} />
      </section>
      <PreviewPane url={props.previewUrl} status={props.previewStatus} debug={debug} log={props.log} />
    </div>
  );
}
