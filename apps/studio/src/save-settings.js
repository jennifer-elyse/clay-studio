/**
 * @typedef {{ work: string, build: string, fast: string }} SeatDefaults
 * @typedef {{ work?: string, fast?: string } | null} SeatPair
 * @typedef {{ cursor?: SeatPair, codex?: SeatPair, copilot?: SeatPair }} SeatModels
 * @typedef {{ projectsRoot: string, seatModels: Record<string, { work?: string, fast?: string }>, defaults: Record<"cursor" | "codex" | "copilot", SeatDefaults> }} SettingsState
 */

/**
 * Read the projects folder and seat models from the host.
 * @param {typeof fetch} [send]
 * @returns {Promise<{ ok: true, settings: SettingsState } | { ok: false, message: string }>}
 */
export async function loadSettings(send = fetch) {
  try {
    const res = await send("/api/settings");
    const body = await res.json();
    if (!res.ok) return { ok: false, message: body.message || "Could not load settings." };
    return { ok: true, settings: body };
  } catch {
    return { ok: false, message: "Could not reach Clay. Try again." };
  }
}

/**
 * A load that started before a save must not replace what the save wrote.
 * @param {number} started stamp when the load began
 * @param {number} current stamp now
 * @param {{ ok: true, settings: SettingsState } | { ok: false, message: string }} result
 * @returns {SettingsState | null}
 */
export function settingsFromLoad(started, current, result) {
  if (started !== current || !result.ok) return null;
  return result.settings;
}

/**
 * Models the current harness lists for this account.
 * @typedef {{ id: string, label: string }} ListedModel
 */

/**
 * Read the model list for the harness that is connected now.
 * @param {typeof fetch} [send]
 * @returns {Promise<{ ok: true, models: ListedModel[], message: string } | { ok: false, models: ListedModel[], message: string }>}
 */
export async function loadModels(send = fetch) {
  try {
    const res = await send("/api/models");
    const body = await res.json();
    const models = Array.isArray(body.models)
      ? body.models.flatMap((row) => {
          if (!row || typeof row.id !== "string" || row.id.length === 0) return [];
          const label = typeof row.label === "string" && row.label.length > 0 ? row.label : row.id;
          return [{ id: row.id, label }];
        })
      : [];
    if (!res.ok) return { ok: false, models, message: body.message || "Could not load models." };
    return { ok: true, models, message: typeof body.message === "string" ? body.message : "" };
  } catch {
    return { ok: false, models: [], message: "Could not reach Clay. Try again." };
  }
}

/**
 * Save the projects folder and/or seat models through the host.
 * @param {{ projectsRoot?: string, seatModels?: SeatModels }} input
 * @param {typeof fetch} [send]
 * @returns {Promise<{ ok: true, settings: SettingsState } | { ok: false, message: string }>}
 */
export async function saveSettings(input, send = fetch) {
  try {
    const res = await send("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify(input),
    });
    const body = await res.json();
    if (!res.ok) return { ok: false, message: body.message || "Could not save settings." };
    return { ok: true, settings: body };
  } catch {
    return { ok: false, message: "Could not reach Clay. Try again." };
  }
}
