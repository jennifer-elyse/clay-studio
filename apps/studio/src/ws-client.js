/**
 * @typedef {object} StudioClient
 * @property {(input: string | { prompt: string, thinkFirst?: boolean, projectName?: string, projectFolder?: string }) => void} send
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
    send: (input) => {
      const prompt = typeof input === "string" ? input : input.prompt;
      /** @type {{ type: "send", prompt: string, thinkFirst?: boolean, projectName?: string, projectFolder?: string }} */
      const body = { type: "send", prompt };
      if (typeof input !== "string") {
        if (input.thinkFirst) body.thinkFirst = true;
        if (input.projectName) body.projectName = input.projectName;
        if (input.projectFolder) body.projectFolder = input.projectFolder;
      }
      ready(body);
    },
    approve: (path) => ready({ type: "approve_plan", path }),
    steer: (text) => ready({ type: "steer", text }),
    setSeat: (seat) => ready({ type: "set_seat", seat }),
    saveProject: (input) => ready({ type: "save_project", ...input }),
    selectProject: (id) => ready({ type: "select_project", id }),
    close: () => socket.close(),
  };
}
