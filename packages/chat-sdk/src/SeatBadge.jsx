import { useEffect, useId, useRef, useState } from "react";
import { harnessModelMenu, harnessModelShown } from "./seat-model-form.js";
import { useDismiss } from "./use-dismiss.js";

/**
 * @param {string} provider
 */
function seatLabel(provider) {
  if (provider === "copilot") return "Copilot";
  if (provider === "cursor") return "Cursor";
  if (provider === "codex") return "Codex";
  return "DEMO MODE";
}

/**
 * The harness name. Clicking it lists that account's models and saves the one you pick.
 * @param {object} props
 * @param {{ provider?: string, model?: string, caption?: string } | null} [props.seat]
 * @param {import("./seat-model-form.js").SeatSettings | null} [props.settings]
 * @param {() => Promise<{ ok?: boolean, models?: Array<{ id: string, label?: string }>, message?: string } | void>} [props.onLoadModels]
 * @param {(id: string) => Promise<{ ok?: boolean, message?: string } | void>} [props.onSelect]
 */
export function SeatBadge({ seat, settings = null, onLoadModels, onSelect }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [models, setModels] = useState(/** @type {Array<{ id: string, label: string }>} */ ([]));
  const [pendingId, setPendingId] = useState("");
  const root = useRef(null);
  const menuId = useId();
  const request = useRef(0);
  const provider = seat?.provider ?? "";
  const shown = harnessModelShown(seat, settings);
  const label = provider ? seatLabel(provider) : "";
  useDismiss(open, root, () => setOpen(false));

  useEffect(() => {
    request.current += 1;
    setOpen(false);
    setLoading(false);
    setNotice("");
    setModels([]);
    setPendingId("");
  }, [provider]);

  if (!provider) return null;

  /**
   * @param {boolean} next
   */
  async function toggle(next) {
    setOpen(next);
    if (!next) {
      request.current += 1;
      return;
    }
    const ticket = ++request.current;
    if (provider === "mock") {
      setModels([]);
      setNotice("Demo mode has no models to choose. Pick Cursor, Codex, or Copilot in Settings.");
      return;
    }
    setLoading(true);
    setNotice("");
    /** @type {{ ok?: boolean, models?: Array<{ id: string, label?: string }>, message?: string } | void} */
    let result;
    try {
      result = onLoadModels ? await onLoadModels() : { ok: true, models: [] };
    } catch {
      result = { ok: false, models: [], message: "Could not load models." };
    }
    if (ticket !== request.current) return;
    const live = result && Array.isArray(result.models) ? result.models : [];
    const menu = harnessModelMenu(provider, settings, live, shown);
    setModels(menu);
    setLoading(false);
    if (menu.length === 0) {
      setNotice(result?.message || "No models are listed for this seat.");
      return;
    }
    if (live.length === 0 && result?.message) setNotice(result.message);
  }

  /**
   * @param {string} id
   */
  async function pick(id) {
    if (pendingId) return;
    setPendingId(id);
    setNotice("");
    const result = await onSelect?.(id);
    setPendingId("");
    if (result && result.ok === false) {
      setNotice(result.message || "Could not save that model.");
      return;
    }
    setOpen(false);
  }

  const tone = provider === "copilot" ? " is-copilot" : provider === "codex" ? " is-codex" : "";
  return (
    <div className="clay-badge-menu" ref={root}>
      <button
        type="button"
        className={`clay-badge${tone}`}
        title={seat?.caption || "Choose a model"}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? menuId : undefined}
        onClick={() => toggle(!open)}
      >
        {label}
        {shown ? ` · ${shown}` : ""}
      </button>
      {open ? (
        <div id={menuId} className="clay-model-menu" role="listbox" aria-label={`${label} models`}>
          {loading ? <p className="clay-model-note" role="status">Loading models.</p> : null}
          {notice ? <p className="clay-model-note" role="status">{notice}</p> : null}
          {!loading && models.length > 0 && !notice ? <p className="clay-model-note">Plan and build use this model.</p> : null}
          {models.map((model) => (
            <button
              key={model.id}
              type="button"
              role="option"
              aria-selected={model.id === shown}
              className={`clay-model-item${model.id === shown ? " is-selected" : ""}`}
              disabled={Boolean(pendingId)}
              onClick={() => pick(model.id)}
            >
              {model.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
