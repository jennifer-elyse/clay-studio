/**
 * Products a person can connect. Connection text is what the host reads.
 * Keys stay on the machine. The modal never asks for a secret.
 *
 * @typedef {object} ConnectionDetail
 * @property {string} name
 * @property {string} detail
 *
 * @typedef {object} ProductSeat
 * @property {"cursor" | "codex" | "copilot"} id
 * @property {string} label
 * @property {string} summary
 * @property {ConnectionDetail[]} details
 */

/** @type {ProductSeat[]} */
export const PRODUCT_SEATS = [
  {
    id: "cursor",
    label: "Cursor",
    summary: "Local Cursor agent on this computer. Claude plans. Grok 4.7 High writes the code.",
    details: [
      {
        name: "CURSOR_API_KEY",
        detail:
          "A user key from Cursor Dashboard → Integrations, or a team service-account key from Team Settings → Service accounts. Team Admin API keys do not work.",
      },
      {
        name: "Cursor app login",
        detail:
          "If that key is not set, Clay uses the Cursor login on this computer and can open Cursor sign-in.",
      },
      {
        name: "@cursor/sdk",
        detail:
          "Installed with Clay Studio. The agent runs locally in the app folder. A model is required for a local run.",
      },
    ],
  },
  {
    id: "codex",
    label: "Codex",
    summary: "Local Codex thread. Plans stay required before implementation.",
    details: [
      {
        name: "CODEX_API_KEY",
        detail: "For a non-interactive run. Set it on this machine, not in the chat.",
      },
      {
        name: "codex login",
        detail:
          "Or a login already stored by `codex login` (ChatGPT) or `codex login --api-key`. Codex keeps that in CODEX_HOME/auth.json and does not read OPENAI_API_KEY.",
      },
      {
        name: "@openai/codex-sdk",
        detail: "The local thread runs in the app folder with workspace write access.",
      },
    ],
  },
  {
    id: "copilot",
    label: "Copilot",
    summary: "GitHub Copilot on this computer. Plans stay required. Coding uses Copilot models.",
    details: [
      {
        name: "GH_TOKEN",
        detail:
          "Or COPILOT_GITHUB_TOKEN or GITHUB_TOKEN, for a GitHub user who has Copilot. The token stays on this machine.",
      },
      {
        name: "GitHub login",
        detail: "If no token is set, Clay uses the GitHub user already logged in on this computer.",
      },
      {
        name: "@github/copilot-sdk",
        detail: "Installed with Clay Studio. The session uses the app folder as its working directory.",
      },
    ],
  },
];

/** @type {ReadonlySet<string>} */
const PRODUCT_IDS = new Set(PRODUCT_SEATS.map((seat) => seat.id));

/**
 * @param {string} value
 * @returns {value is "cursor" | "codex" | "copilot"}
 */
export function isProductSeat(value) {
  return PRODUCT_IDS.has(value);
}

/**
 * @param {string} id
 * @returns {ProductSeat | null}
 */
export function productSeat(id) {
  return PRODUCT_SEATS.find((seat) => seat.id === id) ?? null;
}
