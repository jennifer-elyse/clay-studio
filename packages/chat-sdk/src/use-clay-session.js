import { useMemo, useState } from "react";
import { clipForCommand } from "./animations.js";
import { parseSlash } from "./commands.js";
import { applyEvent, runStateFrom, stepsForRun } from "./map-events.js";

const NAMED_SEATS = ["cursor", "codex", "copilot"];

/**
 * @typedef {object} ClayChatProps
 * @property {import("@cswg/agent-host").UiEvent[]} [events]
 * @property {import("./map-events.js").TranscriptItem[]} [items]
 * @property {(input: string | { prompt: string, thinkFirst?: boolean, projectName?: string, projectFolder?: string }) => void} onSend
 * @property {() => { ok: boolean, message?: string, projectName?: string, projectFolder?: string }} [preparePlan]
 * @property {(path: string) => void} [onApprovePlan]
 * @property {() => void} [onAdjustPlan]
 * @property {(seat: string) => void} [onSelectSeat]
 * @property {{ provider?: string, model?: string, caption?: string } | null} [seat]
 * @property {string} [previewUrl]
 * @property {string} [previewStatus]
 * @property {(url: string) => void} [onOpenPreview]
 * @property {boolean} [busy]
 * @property {string} [log]
 * @property {{ id?: string, name?: string, folder?: string } | null} [project]
 * @property {{ id: string, name: string, folder: string }[]} [projects]
 * @property {(id: string) => void} [onSelectProject]
 * @property {(input: { id?: string, name: string, folder: string }) => void} [onSaveProject]
 */

/**
 * Chat draft, clips, and the seat picker for one Clay screen.
 * @param {ClayChatProps} props
 */
export function useClaySession(props) {
  const [draft, setDraft] = useState("");
  const [thinkFirst, setThinkFirst] = useState(false);
  const [debug, setDebug] = useState(false);
  const [clip, setClip] = useState("idle.webp");
  const [minimized, setMinimized] = useState(false);
  const [seatsOpen, setSeatsOpen] = useState(false);
  const [seatProduct, setSeatProduct] = useState("");
  const events = useMemo(() => props.events ?? [], [props.events]);
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
    if (parsed.command?.id === "plan") {
      const ready = props.preparePlan?.() ?? { ok: true };
      if (!ready.ok) return false;
      playClip(text);
      /** @type {{ prompt: string, thinkFirst?: boolean, projectName?: string, projectFolder?: string }} */
      const body = { prompt: text };
      if (thinkFirst) body.thinkFirst = true;
      if (ready.projectName) {
        body.projectName = ready.projectName;
        if (ready.projectFolder) body.projectFolder = ready.projectFolder;
      }
      props.onSend(body.thinkFirst || body.projectName ? body : text);
      setThinkFirst(false);
      return;
    }
    playClip(text);
    const thinks = thinkFirst && parsed.command?.id === "fix";
    props.onSend(thinks ? { prompt: text, thinkFirst: true } : text);
    setThinkFirst(false);
  }

  /**
   * @param {string} value
   */
  function updateDraft(value) {
    setDraft(value);
    const id = parseSlash(value).command?.id;
    if (id !== "plan" && id !== "fix") setThinkFirst(false);
  }

  /**
   * @param {string} slash
   */
  function pick(slash) {
    setThinkFirst(false);
    setDraft(slash);
    playClip(slash);
  }

  /**
   * @param {string} slash
   */
  function think(slash) {
    setThinkFirst(true);
    setDraft(slash);
    playClip(slash);
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
    setDraft: updateDraft,
    thinkFirst,
    think,
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
    working: Boolean(props.busy) || run.phase === "working",
    openSeats,
    send,
    pick,
    adjust,
    useSeat,
  };
}
