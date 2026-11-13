import { canTransition, transitionRequest } from "../server/status.js";

describe("request status machine", () => {
  test("allows submitted to approved", () => {
    expect(canTransition("submitted", "approved")).toBe(true);
    expect(transitionRequest("submitted", "approved")).toBe("approved");
  });

  test("rejects illegal jumps", () => {
    expect(canTransition("draft", "closed")).toBe(false);
    expect(() => transitionRequest("closed", "approved")).toThrow();
  });
});
