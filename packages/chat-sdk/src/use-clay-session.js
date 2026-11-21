import { useMemo, useState } from "react";
import { clipForCommand } from "./animations.js";
import { needsProject, parseSlash, withThink } from "./commands.js";
import { applyEvent, runStateFrom, stepsForRun } from "./map-events.js";
import { harnessModelChoice } from "./seat-model-form.js";

/**
 * @param {string | { prompt: string, thinkFirst?: boolean, projectName?: string, projectFolder?: string }} payload
 * @param {string} replaceId
 */
function withReplace(payload, replaceId) {
  if (!replaceId) return payload;
  if (typeof payload === "string") return { prompt: payload, replaceId };
  return { ...payload, replaceId };
}

const NAMED_SEATS = ["cursor", "codex", "copilot"];

/**
 * @typedef {object} ClayChatProps
 * @property {import("@cswg/agent-host").UiEvent[]} [events]
 * @property {import("./map-events.js").TranscriptItem[]} [items]
 * @property {(input: string | { prompt: string, thinkFirst?: boolean, projectName?: string, projectFolder?: string, replaceId?: string }) => void | false} onSend
 * @property {() => void} [onUpload]
 * @property {() => void} [onCancel]
 * @property {() => { ok: boolean, message?: string, projectName?: string, projectFolder?: string }} [preparePlan]
 * @property {(path: string) => void} [onApprovePlan]
 * @property {() => void} [onAdjustPlan]
 * @property {(seat: string) => void} [onSelectSeat]
 * @property {string} [projectsRoot]
 * @property {object | null} [seatSettings] Saved seat model overrides and defaults from the host.
 * @property {(input: object) => Promise<{ ok: boolean, message?: string }>} [onSaveSettings]
 * @property {() => Promise<{ ok?: boolean, models?: Array<{ id: string, label?: string }>, message?: string }>} [onLoadModels]
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
 * @property {{ plan?: boolean, build?: boolean }} [done] Plan and Build stay off once each has finished for this project.
 */

/**
 * Chat draft, clips, and the seat picker for one Clay screen.
 * @param {ClayChatProps} props
 */
export function useClaySession(props) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState("");
  const [thinkFirst, setThinkFirst] = useState(false);
  const [debug, setDebug] = useState(false);
  const [clip, setClip] = useState("idle.webp");
  const [minimized, setMinimized] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState("seat");
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
   * Open Settings on the Seat tab. A click passes an event, not a seat, so only a string picks one.
   * @param {unknown} [product] a seat to preselect. Defaults to the current seat.
   */
  function openSettings(product) {
    playClip("/settings");
    setSeatProduct(typeof product === "string" ? product : (props.seat?.provider ?? ""));
    setSettingsSection("seat");
    setSettingsOpen(true);
  }

  /**
   * @param {string} text
   * @param {string} [replaceId]
   */
  function deliver(text, replaceId = "") {
    const parsed = parseSlash(text);
    if (parsed.command?.id === "upload") {
      setDraft("");
      setEditingId("");
      playClip(text);
      props.onUpload?.();
      return;
    }
    if (parsed.command?.id === "debug") {
      setDebug((value) => !value);
      playClip(text);
      setEditingId("");
      return;
    }
    if (parsed.command?.id === "seat") {
      openSettings(NAMED_SEATS.includes(parsed.rest) ? parsed.rest : undefined);
      playClip(text);
      setEditingId("");
      return;
    }
    const replacing = replaceId || editingId;
    const prompt = parsed.think || thinkFirst ? withThink(text).trim() : text;
    if (parsed.command && needsProject(parsed.command.id)) {
      const ready = props.preparePlan?.() ?? { ok: true };
      if (!ready.ok) return false;
      playClip(prompt);
      /** @type {{ prompt: string, thinkFirst?: boolean, projectName?: string, projectFolder?: string, replaceId?: string }} */
      const body = { prompt };
      if (parsed.think || thinkFirst) body.thinkFirst = true;
      if (ready.projectName) {
        body.projectName = ready.projectName;
        if (ready.projectFolder) body.projectFolder = ready.projectFolder;
      }
      if (replacing) body.replaceId = replacing;
      props.onSend(body.thinkFirst || body.projectName || body.replaceId ? body : prompt);
      setThinkFirst(false);
      setEditingId("");
      return;
    }
    playClip(prompt);
    const thinks = parseSlash(prompt).think;
    props.onSend(withReplace(thinks ? { prompt, thinkFirst: true } : prompt, replacing));
    setThinkFirst(false);
    setEditingId("");
  }

  /**
   * @param {string} text
   */
  function send(text) {
    return deliver(text);
  }

  const working = Boolean(props.busy) || run.phase === "working";

  /**
   * @param {import("./map-events.js").TranscriptItem} item
   */
  function editMessage(item) {
    if (working) return;
    setEditingId(item.id);
    updateDraft(item.text ?? "");
  }

  /**
   * @param {import("./map-events.js").TranscriptItem} item
   */
  function resendMessage(item) {
    const text = item.text ?? "";
    if (!text.trim() || working) return;
    updateDraft("");
    deliver(text, item.id);
  }

  function cancelEdit() {
    setEditingId("");
    updateDraft("");
  }

  /**
   * @param {string} value
   */
  function updateDraft(value) {
    setDraft(value);
    setThinkFirst(parseSlash(value).think);
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
    const next = withThink(slash);
    setThinkFirst(true);
    setDraft(next.endsWith(" ") ? next : `${next} `);
    playClip("/think");
  }

  function adjust() {
    pick("/speckit.plan ");
    props.onAdjustPlan?.();
  }

  /**
   * @param {string} id
   */
  function chooseSeat(id) {
    props.onSelectSeat?.(id);
    setSettingsOpen(false);
  }

  /**
   * The picked model runs plan and build. Quick turns keep their saved model.
   * @param {string} id
   * @returns {Promise<{ ok: boolean, message?: string }>}
   */
  async function chooseModel(id) {
    const provider = props.seat?.provider;
    if (provider !== "cursor" && provider !== "codex" && provider !== "copilot") {
      return { ok: false, message: "Choose Cursor, Codex, or Copilot first." };
    }
    if (!props.onSaveSettings) return { ok: false, message: "Could not save that model." };
    try {
      const result = await props.onSaveSettings(harnessModelChoice(provider, props.seatSettings, id));
      if (result && result.ok === false) return result;
      return { ok: true };
    } catch {
      return { ok: false, message: "Could not save that model." };
    }
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
    settingsOpen,
    setSettingsOpen,
    settingsSection,
    setSettingsSection,
    seatProduct,
    setSeatProduct,
    items,
    run,
    steps,
    working,
    messageActions: {
      onCancel: () => { playClip("/stop"); props.onCancel?.(); },
      editing: Boolean(editingId),
      onCancelEdit: cancelEdit,
      onEdit: editMessage,
      onResend: resendMessage,
    },
    openSettings,
    send,
    pick,
    adjust,
    chooseSeat,
    chooseModel,
  };
}
