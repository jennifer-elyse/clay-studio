import { isProductSeat, PRODUCT_SEATS, productSeat } from "../src/seats.js";

describe("product seats", () => {
  test("offers Cursor, Codex, and Copilot", () => {
    expect(PRODUCT_SEATS.map((seat) => seat.id)).toEqual(["cursor", "codex", "copilot"]);
  });

  test("Cursor connection names the agent key and the app login", () => {
    const cursor = productSeat("cursor");
    const names = cursor.details.map((item) => item.name);
    expect(names).toContain("CURSOR_API_KEY");
    expect(names).toContain("Cursor app login");
    expect(cursor.details.find((item) => item.name === "CURSOR_API_KEY").detail).toMatch(/Integrations/);
    expect(isProductSeat("codex")).toBe(true);
    expect(isProductSeat("mock")).toBe(false);
  });
});
