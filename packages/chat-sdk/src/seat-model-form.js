/**
 * Pure helpers for the Advanced seat models form. Blank means no override.
 *
 * @typedef {"cursor" | "codex" | "copilot"} SeatId
 * @typedef {{ work?: string, fast?: string }} SeatPair
 * @typedef {{ work: string, build: string, fast: string }} SeatDefaults
 * @typedef {{ seatModels?: Partial<Record<SeatId, SeatPair>>, defaults?: Partial<Record<SeatId, SeatDefaults>> }} SeatSettings
 */

/**
 * The two inputs for a seat. A saved name is the value. No save leaves the field blank
 * and puts the default in the placeholder, so the user can type a model or keep that default.
 * Cursor plan and build differ, so the work placeholder names both.
 *
 * @param {SeatId} seat
 * @param {SeatSettings | null | undefined} settings
 */
export function seatModelFields(seat, settings) {
  const defaults = settings?.defaults?.[seat];
  const saved = settings?.seatModels?.[seat] ?? {};
  const workPlaceholder = seat === "cursor"
    ? `${defaults?.work ?? ""} plan · ${defaults?.build ?? ""} build`
    : defaults?.work ?? "";
  return {
    work: { value: saved.work ?? "", placeholder: workPlaceholder },
    fast: { value: saved.fast ?? "", placeholder: defaults?.fast ?? "" },
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
 * Remount key for the uncontrolled inputs. Null until settings have loaded.
 * Changes when the saved names or the defaults on screen change, so `defaultValue` is read again.
 * @param {SeatId} seat
 * @param {SeatSettings | null | undefined} settings
 * @returns {string | null}
 */
export function seatModelKey(seat, settings) {
  if (!settings) return null;
  return JSON.stringify(seatModelFields(seat, settings));
}

/**
 * The model named on the harness. A saved plan-and-build name wins over the model from the last run.
 * @param {{ provider?: string, model?: string } | null | undefined} seat
 * @param {SeatSettings | null | undefined} settings
 */
export function harnessModelShown(seat, settings) {
  const provider = seat?.provider;
  if (provider !== "cursor" && provider !== "codex" && provider !== "copilot") return seat?.model || "";
  return settings?.seatModels?.[provider]?.work || seat?.model || "";
}

/**
 * Save the picked model for plan and build. The quick-turn name stays as it was.
 * @param {SeatId} seat
 * @param {SeatSettings | null | undefined} settings
 * @param {string} modelId
 */
export function harnessModelChoice(seat, settings, modelId) {
  const saved = settings?.seatModels?.[seat] ?? {};
  return seatModelInput(seat, { work: modelId, fast: saved.fast ?? "" });
}

/**
 * Models to offer when the account catalog is empty. Built from that seat's defaults.
 * @param {string | undefined} seat
 * @param {SeatSettings | null | undefined} settings
 * @returns {Array<{ id: string, label: string }>}
 */
export function fallbackHarnessModels(seat, settings) {
  if (seat !== "cursor" && seat !== "codex" && seat !== "copilot") return [];
  const defaults = settings?.defaults?.[seat];
  if (!defaults) return [];
  /** @type {Array<{ id: string, label: string }>} */
  const rows = [];
  const seen = new Set();
  for (const id of [defaults.work, defaults.build, defaults.fast]) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    rows.push({ id, label: id });
  }
  return rows;
}

/**
 * The open menu. A live account list wins. The model on the badge stays selectable.
 * @param {string | undefined} seat
 * @param {SeatSettings | null | undefined} settings
 * @param {Array<{ id?: string, label?: string }> | null | undefined} live
 * @param {string} current
 * @returns {Array<{ id: string, label: string }>}
 */
export function harnessModelMenu(seat, settings, live, current) {
  const listed = (Array.isArray(live) ? live : []).flatMap((row) => {
    if (!row || typeof row.id !== "string" || row.id.length === 0) return [];
    const label = typeof row.label === "string" && row.label.length > 0 ? row.label : row.id;
    return [{ id: row.id, label }];
  });
  const base = listed.length > 0 ? listed : fallbackHarnessModels(seat, settings);
  if (!current || base.some((row) => row.id === current)) return base;
  return [{ id: current, label: current }, ...base];
}

/**
 * Help text under the inputs. Cursor is the only seat where work covers two models.
 * @param {SeatId} seat
 */
export function seatModelHint(seat) {
  const work = seat === "cursor"
    ? "Blank uses the top Claude the account lists for plan and the top Grok for build. A name here runs plan and build on that one model."
    : "Blank keeps the default for plan and build. A name here runs both on that model.";
  return `${work} The second field is for quick turns. Blank keeps that default too. Changes apply to the next run.`;
}
