import { WebSocketServer } from "ws";
import { z } from "zod";

export const ClientMessage = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("send"),
    prompt: z.string(),
    thinkFirst: z.boolean().optional(),
    projectName: z.string().optional(),
    projectFolder: z.string().optional(),
    replaceId: z.string().optional(),
  }),
  z.object({ type: z.literal("approve_plan"), path: z.string() }),
  z.object({ type: z.literal("steer"), text: z.string() }),
  z.object({ type: z.literal("set_seat"), seat: z.enum(["cursor", "codex", "copilot", "mock"]) }),
  z.object({
    type: z.literal("save_project"),
    id: z.string().optional(),
    name: z.string(),
    folder: z.string().optional(),
  }),
  z.object({ type: z.literal("select_project"), id: z.string() }),
  z.object({ type: z.literal("cancel") }),
]);

/**
 * @param {import("node:http").Server} server
 * @param {Awaited<ReturnType<import("@cswg/agent-host").createHost>>} host
 */
export function attachSocket(server, host) {
  const wss = new WebSocketServer({ server, path: "/ws" });
  /** @type {Set<import("ws").WebSocket>} */
  const sockets = new Set();

  /**
   * Every open studio window hears the same preview, so Run fills the right-hand pane.
   * @param {object} payload
   */
  function sendAll(payload) {
    const text = JSON.stringify(payload);
    for (const client of sockets) {
      if (client.readyState === 1) client.send(text);
    }
  }

  /** Project identity plus which of Plan and Build are already finished. */
  function viewKey() {
    const snap = host.snapshot();
    return JSON.stringify({ project: snap.project, done: snap.done });
  }

  host.subscribe?.((event) => sendAll(event));

  wss.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    sendAll({ type: "snapshot", snapshot: host.snapshot() });

    socket.on("message", async (raw) => {
      let parsed;
      try {
        parsed = ClientMessage.parse(JSON.parse(String(raw)));
      } catch {
        socket.send(JSON.stringify({ type: "error", text: "Bad message.", id: "bad" }));
        return;
      }
      try {
        if (parsed.type === "send") {
          const before = viewKey();
          for await (const event of host.send({
            prompt: parsed.prompt,
            thinkFirst: parsed.thinkFirst,
            projectName: parsed.projectName,
            projectFolder: parsed.projectFolder,
            replaceId: parsed.replaceId,
          })) {
            sendAll(event);
          }
          if (viewKey() !== before) {
            sendAll({ type: "snapshot", snapshot: host.snapshot() });
          }
        } else if (parsed.type === "approve_plan") {
          const event = await host.approvePlan(parsed.path);
          sendAll(event);
          sendAll({ type: "snapshot", snapshot: host.snapshot() });
        } else if (parsed.type === "steer") {
          await host.steer(parsed.text);
        } else if (parsed.type === "set_seat") {
          for await (const event of host.setSeat(parsed.seat)) {
            sendAll(event);
          }
        } else if (parsed.type === "save_project") {
          await host.saveProject({ id: parsed.id, name: parsed.name, folder: parsed.folder });
          sendAll({ type: "snapshot", snapshot: host.snapshot() });
        } else if (parsed.type === "select_project") {
          await host.selectProject(parsed.id);
          sendAll({ type: "snapshot", snapshot: host.snapshot() });
        } else if (parsed.type === "cancel") {
          await host.cancel();
        }
      } catch (error) {
        sendAll({
          type: "error",
          id: "ws",
          text: error instanceof Error ? error.message : "Host error",
        });
      }
    });
  });
}
