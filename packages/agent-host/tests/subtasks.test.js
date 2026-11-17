import { decideSubtask, emptySubtaskGate } from "../src/subtasks.js";

/**
 * @param {string} id
 * @param {"running" | "completed"} [status]
 */
function taskCall(id, status = "running") {
  return { type: "tool_call", name: "task", status, call_id: id };
}

describe("subtask cap", () => {
  test("five subtasks pass and the sixth stops the turn", () => {
    let gate = emptySubtaskGate();
    for (let index = 1; index <= 5; index += 1) {
      const decision = decideSubtask(gate, taskCall(String(index)));
      gate = decision.gate;
      expect(decision.stop).toBe("");
      expect(gate.count).toBe(index);
    }

    const sixth = decideSubtask(gate, taskCall("6"));
    expect(sixth.stop).toBe("cap");
    expect(sixth.gate.count).toBe(5);
  });

  test("a subtask that starts another agent is a loop", () => {
    const decision = decideSubtask(emptySubtaskGate(), {
      type: "tool-call-delta",
      callId: "parent",
      taskUpdate: { type: "tool-call-started", toolCall: { type: "task", args: {} } },
    });
    expect(decision.stop).toBe("loop");
    expect(decision.gate.count).toBe(0);
  });

  test("file tools are not subtasks", () => {
    const decision = decideSubtask(emptySubtaskGate(), {
      type: "tool_call",
      name: "read",
      status: "running",
      call_id: "r1",
    });
    expect(decision.stop).toBe("");
    expect(decision.gate.count).toBe(0);
  });
});
