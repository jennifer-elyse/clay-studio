/**
 * @typedef {object} StudioClient
 * @property {(prompt: string) => void} send
 * @property {(path: string) => void} approve
 * @property {(text: string) => void} steer
 * @property {(seat: string) => void} setSeat
 * @property {() => void} close
 */

/**
 * @param {object} handlers
 * @param {(event: object) => void} handlers.onEvent
 * @param {(snap: object) => void} [handlers.onSnapshot]
 * @param {(err: string) => void} [handlers.onError]
 * @returns {StudioClient}
 */
export function connectStudio(handlers) {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${protocol}://${window.location.host}/ws`);

  socket.addEventListener("message", (message) => {
    const payload = JSON.parse(String(message.data));
    if (payload.type === "snapshot") handlers.onSnapshot?.(payload.snapshot);
    else if (payload.type === "error" && payload.socket) handlers.onError?.(payload.text);
    else handlers.onEvent(payload);
  });

  function ready(body) {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(body));
    else socket.addEventListener("open", () => socket.send(JSON.stringify(body)), { once: true });
  }

  return {
    send: (prompt) => ready({ type: "send", prompt }),
    approve: (path) => ready({ type: "approve_plan", path }),
    steer: (text) => ready({ type: "steer", text }),
    setSeat: (seat) => ready({ type: "set_seat", seat }),
    close: () => socket.close(),
  };
}
