import { useActionState } from "react";
import { SeatModelField } from "./SeatModelField.jsx";
import { seatModelFields, seatModelHint, seatModelInput } from "./seat-model-form.js";

/**
 * Saves through the form action. Save and Reset are both submit buttons, told apart by `intent`.
 * @param {object} props
 * @param {"cursor" | "codex" | "copilot"} props.seat
 * @param {object | null} props.settings
 * @param {(input: object) => Promise<{ ok: boolean, message?: string }>} [props.onSave]
 */
export function SeatModelForm({ seat, settings, onSave }) {
  const submitModels = async (_previous, formData) => {
    const reset = formData.get("intent") === "reset";
    const input = seatModelInput(seat, {
      work: String(formData.get("work") ?? ""),
      fast: String(formData.get("fast") ?? ""),
      reset,
    });
    const result = await onSave?.(input);
    if (result && !result.ok) return { message: result.message || "Could not save models." };
    return { message: reset ? "Reset to the defaults." : "Saved. Applies to the next run." };
  };
  const [state, submit, pending] = useActionState(submitModels, { message: "" });
  const fields = seatModelFields(seat, settings);
  const disabled = !settings || !onSave || pending;
  return (
    <form action={submit} className="clay-seat-models">
      <SeatModelField name="work" label="Plan & build model" field={fields.work} disabled={disabled} />
      <SeatModelField name="fast" label="Quick-turn model" field={fields.fast} disabled={disabled} />
      <p className="clay-modal-note">{seatModelHint(seat)}</p>
      {!settings ? <p className="clay-modal-note" role="status">Loading the current models.</p> : null}
      {state.message ? <p className="clay-modal-note" role="status">{state.message}</p> : null}
      <div className="clay-seat-models-actions">
        <button type="submit" name="intent" value="save" className="clay-seat-use" disabled={disabled}>
          Save models
        </button>
        <button type="submit" name="intent" value="reset" className="clay-seat-reset" disabled={disabled}>
          Reset to defaults
        </button>
      </div>
    </form>
  );
}
