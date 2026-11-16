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
