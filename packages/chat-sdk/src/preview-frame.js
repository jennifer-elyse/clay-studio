/**
 * A preview may load only from this machine, and never as the Clay page itself.
 * @param {string} url
 * @param {string} [pageOrigin]
 * @returns {string}
 */
export function frameSrc(url, pageOrigin = "") {
  if (!url) return "";
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return "";
  }
  if (parsed.protocol !== "http:") return "";
  if (parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") return "";
  if (pageOrigin && parsed.origin === pageOrigin) return "";
  return parsed.href;
}
