import { useMemo, useState } from "react";
import { clipForCommand } from "./animations.js";
import { parseSlash } from "./commands.js";
import { applyEvent, runStateFrom, stepsForRun } from "./map-events.js";

const NAMED_SEATS = ["cursor", "codex", "copilot"];

/**
 * @typedef {object} ClayChatProps
 * @property {import("@cswg/agent-host").UiEvent[]} [events]
 * @property {import("./map-events.js").TranscriptItem[]} [items]
 * @property {(input: string | { prompt: string, thinkFirst?: boolean }) => void} onSend
 * @property {(path: string) => void} [onApprovePlan]
 * @property {() => void} [onAdjustPlan]
 * @property {(seat: string) => void} [onSelectSeat]
 * @property {{ provider?: string, model?: string, caption?: string } | null} [seat]
 * @property {string} [previewUrl]
 * @property {string} [previewStatus]
 * @property {boolean} [busy]
 * @property {string} [log]
 */

/**
 * Chat draft, clips, and the seat picker for one Clay screen.
 * @param {ClayChatProps} props
 */
export function useClaySession(props) {
  const [draft, setDraft] = useState("");
  const [thinkFirst, setThinkFirst] = useState("");
  const [debug, setDebug] = useState(false);
  const [clip, setClip] = useState("idle.webp");
  const [minimized, setMinimized] = useState(false);
  const [seatsOpen, setSeatsOpen] = useState(false);
  const [seatProduct, setSeatProduct] = useState("");
  const events = props.events ?? [];
  const items = props.items ?? events.reduce(applyEvent, []);
  const run = useMemo(() => runStateFrom(events), [events]);
  const steps = useMemo(() => stepsForRun(events), [events]);

  /**
   * @param {string} text
   */
  function playClip(text) {
    const { command } = parseSlash(text);
    setClip((previous) => clipForCommand(command?.id, { previous }));
  }

  /**
   * @param {string} [product]
   */
  function openSeats(product = "") {
    setSeatProduct(product);
    setSeatsOpen(true);
  }

  /**
   * @param {string} text
   */
  function send(text) {
    const parsed = parseSlash(text);
    const armed = thinkFirst !== "" && parsed.command?.id === thinkFirst;
    setThinkFirst("");
    if (parsed.command?.id === "debug") {
      setDebug((value) => !value);
      playClip(text);
      return;
    }
    if (parsed.command?.id === "seat") {
      openSeats(NAMED_SEATS.includes(parsed.rest) ? parsed.rest : "");
      playClip(text);
      return;
    }
    playClip(text);
    props.onSend(armed ? { prompt: text, thinkFirst: true } : text);
  }

  /**
   * @param {string} slash
   * @param {{ thinkFirst?: boolean }} [options]
   */
  function pick(slash, options) {
    const id = parseSlash(slash).command?.id ?? "";
    setDraft(slash);
    setThinkFirst(options?.thinkFirst && (id === "plan" || id === "fix") ? id : "");
    playClip(options?.thinkFirst ? "/think" : slash);
  }

  function adjust() {
    pick("/plan ");
    props.onAdjustPlan?.();
  }

  /**
   * @param {string} id
   */
  function useSeat(id) {
    props.onSelectSeat?.(id);
    setSeatsOpen(false);
  }

  return {
    draft,
    setDraft,
    debug,
    clip,
    minimized,
    setMinimized,
    seatsOpen,
    setSeatsOpen,
    seatProduct,
    setSeatProduct,
    items,
    run,
    steps,
    thinkFirst,
    working: Boolean(props.busy) || run.phase === "working",
    openSeats,
    send,
    pick,
    adjust,
    useSeat,
  };
}
