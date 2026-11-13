/**
 * @param {string} path
 * @param {RequestInit} [init]
 */
export async function api(path, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  if (init.method && init.method !== "GET") {
    headers.set("Idempotency-Key", crypto.randomUUID());
  }
  const res = await fetch(path, { ...init, headers });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message ?? "Request failed");
  return body;
}

export function listRequests() {
  return api("/v1/requests");
}

/**
 * @param {{ title: string, detail: string }} input
 */
export function createRequest(input) {
  return api("/v1/requests", { method: "POST", body: JSON.stringify(input) });
}

/**
 * @param {string} id
 * @param {string} status
 */
export function patchRequest(id, status) {
  return api(`/v1/requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}
