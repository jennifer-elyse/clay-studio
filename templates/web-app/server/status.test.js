import test from "node:test";
import assert from "node:assert/strict";
import { transitionRequest } from "./status.js";

test("a request status moves only on the XState machine", () => {
  assert.equal(transitionRequest("draft", "submit"), "submitted");
  assert.equal(transitionRequest("submitted", "approve"), "approved");
  assert.equal(transitionRequest("submitted", "reject"), "rejected");
  assert.equal(transitionRequest("approved", "close"), "closed");
  assert.equal(transitionRequest("rejected", "close"), "closed");
  assert.throws(() => transitionRequest("draft", "approve"), (error) => error.code === "ILLEGAL_TRANSITION");
  assert.throws(() => transitionRequest("closed", "submit"), (error) => error.code === "ILLEGAL_TRANSITION");
  assert.throws(() => transitionRequest("missing", "submit"), (error) => error.code === "ILLEGAL_TRANSITION");
});
