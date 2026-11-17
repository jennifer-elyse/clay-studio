/**
 * Pure helpers for the Advanced seat models form. Blank means no override.
 *
 * @typedef {"cursor" | "codex" | "copilot"} SeatId
 * @typedef {{ work?: string, fast?: string }} SeatPair
 * @typedef {{ work: string, build: string, fast: string }} SeatDefaults
 * @typedef {{ seatModels?: Partial<Record<SeatId, SeatPair>>, defaults?: Partial<Record<SeatId, SeatDefaults>> }} SeatSettings
 */

/**
 * The two inputs for a seat. Cursor work has no single default (plan and build differ),
 * so its value is blank and the placeholder shows both.
 *
 * @param {SeatId} seat
 * @param {SeatSettings | null | undefined} settings
 */
export function seatModelFields(seat, settings) {
  const defaults = settings?.defaults?.[seat];
  const saved = settings?.seatModels?.[seat] ?? {};
  if (seat === "cursor") {
    return {
      work: { value: saved.work ?? "", placeholder: `${defaults?.work ?? ""} plan · ${defaults?.build ?? ""} build` },
      fast: { value: saved.fast ?? "", placeholder: defaults?.fast ?? "" },
    };
  }
  return {
    work: { value: saved.work ?? defaults?.work ?? "", placeholder: defaults?.work ?? "" },
    fast: { value: saved.fast ?? defaults?.fast ?? "", placeholder: defaults?.fast ?? "" },
  };
}

/**
 * The Settings input for a save or a reset. Reset clears the seat (null).
 *
 * @param {SeatId} seat
 * @param {{ work?: string, fast?: string, reset?: boolean }} edit
 */
export function seatModelInput(seat, edit) {
  if (edit.reset) return { seatModels: { [seat]: null } };
  return { seatModels: { [seat]: { work: edit.work ?? "", fast: edit.fast ?? "" } } };
}

/**
 * Help text under the inputs. Cursor is the only seat where work covers two models.
 * @param {SeatId} seat
 */
export function seatModelHint(seat) {
  const work = seat === "cursor"
    ? "Blank keeps Claude for plan and Grok 4.7 for build. A name here runs plan and build on that one model."
    : "Used for plan and build.";
  return `${work} Quick turns use the second field. Changes apply to the next run.`;
}
