import { applyStudioEvent } from "../src/studio-events.js";

describe("studio events", () => {
  test("a preview failure clears the frame and keeps the message", () => {
    /** @type {{ url: string, status: string, message: string }} */
    const state = { url: "http://127.0.0.1:4000", status: "ready", message: "" };
    const sink = {
      setPreviewStatus: (status) => {
        state.status = status;
      },
      setPreviewUrl: (url) => {
        state.url = url;
      },
      setPreviewMessage: (message) => {
        state.message = message;
      },
      setSeat() {},
      setEvents() {},
      setBusy() {},
    };
    applyStudioEvent(
      { type: "preview", preview: { status: "error", message: "The app stopped before it could open." } },
      sink,
    );
    expect(state).toEqual({
      url: "",
      status: "error",
      message: "The app stopped before it could open.",
    });
  });
});
