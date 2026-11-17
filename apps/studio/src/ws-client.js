/**
 * @typedef {object} StudioClient
 * @property {(input: string | { prompt: string, thinkFirst?: boolean, projectName?: string, projectFolder?: string, replaceId?: string }) => void} send
 * @property {() => void} cancel
 * @property {(path: string) => void} approve
 * @property {(text: string) => void} steer
 * @property {(seat: string) => void} setSeat
 * @property {(input: { id?: string, name: string, folder?: string }) => void} saveProject
 * @property {(id: string) => void} selectProject
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
  let socket = /** @type {WebSocket | null} */ (null);
  let closed = false;
  let retry = /** @type {ReturnType<typeof setTimeout> | null} */ (null);

  function connect() {
    socket = new WebSocket(`${protocol}://${window.location.host}/ws`);
    socket.addEventListener("message", (message) => {
      const payload = JSON.parse(String(message.data));
      if (payload.type === "snapshot") handlers.onSnapshot?.(payload.snapshot);
      else if (payload.type === "error" && payload.socket) handlers.onError?.(payload.text);
      else handlers.onEvent(payload);
    });
    socket.addEventListener("close", () => {
      if (closed) return;
      retry = setTimeout(connect, 400);
    });
  }

  connect();

  function ready(body) {
    const current = socket;
    if (current && current.readyState === WebSocket.OPEN) current.send(JSON.stringify(body));
    else current?.addEventListener("open", () => current.send(JSON.stringify(body)), { once: true });
  }

  return {
    send: (input) => {
      const prompt = typeof input === "string" ? input : input.prompt;
      /** @type {{ type: "send", prompt: string, thinkFirst?: boolean, projectName?: string, projectFolder?: string, replaceId?: string }} */
      const body = { type: "send", prompt };
      if (typeof input !== "string") {
        if (input.thinkFirst) body.thinkFirst = true;
        if (input.projectName) body.projectName = input.projectName;
        if (input.projectFolder) body.projectFolder = input.projectFolder;
        if (input.replaceId) body.replaceId = input.replaceId;
      }
      ready(body);
    },
    cancel: () => ready({ type: "cancel" }),
    approve: (path) => ready({ type: "approve_plan", path }),
    steer: (text) => ready({ type: "steer", text }),
    setSeat: (seat) => ready({ type: "set_seat", seat }),
    saveProject: (input) => ready({ type: "save_project", ...input }),
    selectProject: (id) => ready({ type: "select_project", id }),
    close: () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    },
  };
}
