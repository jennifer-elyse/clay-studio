import { WebSocketServer } from "ws";
import { z } from "zod";

export const ClientMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("send"), prompt: z.string() }),
  z.object({ type: z.literal("approve_plan"), path: z.string() }),
  z.object({ type: z.literal("steer"), text: z.string() }),
  z.object({ type: z.literal("set_seat"), seat: z.enum(["cursor", "copilot", "mock"]) }),
  z.object({ type: z.literal("cancel") }),
]);

/**
 * @param {import("node:http").Server} server
 * @param {Awaited<ReturnType<import("@cswg/agent-host").createHost>>} host
 */
export function attachSocket(server, host) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({ type: "snapshot", snapshot: host.snapshot() }));

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
          for await (const event of host.send(parsed.prompt)) {
            socket.send(JSON.stringify(event));
          }
        } else if (parsed.type === "approve_plan") {
          const event = await host.approvePlan(parsed.path);
          socket.send(JSON.stringify(event));
        } else if (parsed.type === "steer") {
          await host.steer(parsed.text);
        } else if (parsed.type === "set_seat") {
          for await (const event of host.setSeat(parsed.seat)) {
            socket.send(JSON.stringify(event));
          }
        } else if (parsed.type === "cancel") {
          await host.cancel();
        }
      } catch (error) {
        socket.send(
          JSON.stringify({
            type: "error",
            id: "ws",
            text: error instanceof Error ? error.message : "Host error",
          }),
        );
      }
    });
  });
}
