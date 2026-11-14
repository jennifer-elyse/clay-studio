import { z } from "zod";

export const ClientMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("send"), prompt: z.string() }),
  z.object({ type: z.literal("approve_plan"), path: z.string() }),
  z.object({ type: z.literal("steer"), text: z.string() }),
  z.object({ type: z.literal("set_seat"), seat: z.enum(["cursor", "codex", "copilot", "mock"]) }),
  z.object({ type: z.literal("cancel") }),
]);
