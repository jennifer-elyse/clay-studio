import { ClientMessage } from "../server/ws.js";

describe("client messages", () => {
  test("accepts send", () => {
    expect(ClientMessage.parse({ type: "send", prompt: "/plan" }).type).toBe("send");
  });

  test("accepts a named project", () => {
    expect(ClientMessage.parse({ type: "save_project", name: "Cooler", folder: "cooler" }).type).toBe("save_project");
    expect(ClientMessage.parse({ type: "select_project", id: "abc" }).id).toBe("abc");
    expect(ClientMessage.parse({ type: "send", prompt: "/plan", projectName: "Cooler" }).projectName).toBe("Cooler");
    expect(ClientMessage.parse({ type: "send", prompt: "again", replaceId: "u1" }).replaceId).toBe("u1");
    expect(ClientMessage.parse({ type: "cancel" }).type).toBe("cancel");
  });

  test("rejects unknown", () => {
    expect(() => ClientMessage.parse({ type: "explode" })).toThrow();
  });
});
