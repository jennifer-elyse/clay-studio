import { ClientMessage } from "../server/ws.js";

describe("client messages", () => {
  test("accepts send", () => {
    expect(ClientMessage.parse({ type: "send", prompt: "/plan" }).type).toBe("send");
  });

  test("rejects unknown", () => {
    expect(() => ClientMessage.parse({ type: "explode" })).toThrow();
  });
});
