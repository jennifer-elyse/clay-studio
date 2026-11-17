import { applyEvent, previewActivity, runStateFrom, stepLabel, stepsForRun, stepsFrom, truncateFromMessage } from "../src/map-events.js";

describe("map-events", () => {
  test("folds assistant chunks", () => {
    const first = applyEvent([], { type: "assistant_text", id: "a", text: "Hel" });
    const next = applyEvent(first, { type: "assistant_text", id: "b", text: "lo" });
    expect(next).toHaveLength(1);
    expect(next[0].text).toBe("Hello");
  });

  test("replaces plan by path", () => {
    const plan = { id: "1", path: "p", title: "T", body: "B", status: "draft" };
    const first = applyEvent([], { type: "plan", id: "p1", plan });
    const next = applyEvent(first, { type: "plan", id: "p2", plan: { ...plan, status: "approved" } });
    expect(next).toHaveLength(1);
    expect(next[0].plan?.status).toBe("approved");
  });

  test("clear wipes the transcript", () => {
    const first = applyEvent([], { type: "assistant_text", id: "a", text: "hi" });
    expect(applyEvent(first, { type: "clear", id: "c" })).toEqual([]);
  });

  test("collects steps", () => {
    const steps = stepsFrom([
      { type: "step", id: "1", step: { label: "Reading", status: "running" } },
      { type: "step", id: "2", step: { label: "Reading", status: "done" } },
    ]);
    expect(steps).toEqual([{ label: "Reading", status: "done" }]);
  });

  test("says when a run is finished", () => {
    const working = runStateFrom([
      { type: "run_started", id: "s" },
      { type: "step", id: "1", step: { label: "Reading", status: "running" } },
    ]);
    expect(working).toEqual({ phase: "working", label: "Working…" });

    const plan = { id: "1", path: "p", title: "T", body: "B", status: "draft" };
    const finished = runStateFrom([
      { type: "run_started", id: "s" },
      { type: "plan", id: "p1", plan },
      { type: "run_finished", id: "f", status: "finished" },
    ]);
    expect(finished).toEqual({ phase: "finished", label: "Done" });

    const built = runStateFrom([
      { type: "run_started", id: "s" },
      { type: "assistant_text", id: "a", text: "Built." },
      { type: "run_finished", id: "f", status: "finished" },
    ]);
    expect(built.label).toBe("Done");
  });

  test("a build says it is creating the application until it finishes", () => {
    const working = runStateFrom([
      { type: "run_started", id: "s", text: "Creating the application…" },
    ]);
    expect(working).toEqual({ phase: "working", label: "Creating the application…" });
    expect(previewActivity(working)).toBe("Creating the application…");
    expect(previewActivity(runStateFrom([{ type: "run_started", id: "s" }]))).toBe("");

    const finished = runStateFrom([
      { type: "run_started", id: "s", text: "Creating the application…" },
      { type: "run_finished", id: "f", status: "finished" },
    ]);
    expect(finished).toEqual({ phase: "finished", label: "Done" });
    expect(previewActivity(finished)).toBe("");
  });

  test("edit and resend drop that message and the replies after it", () => {
    const events = [
      { type: "user_text", id: "u1", text: "first" },
      { type: "assistant_text", id: "a1", text: "ok" },
      { type: "user_text", id: "u2", text: "second" },
      { type: "assistant_text", id: "a2", text: "done" },
    ];
    expect(truncateFromMessage(events, "u2").map((event) => event.id)).toEqual(["u1", "a1"]);
    expect(truncateFromMessage(events, "missing")).toBe(events);
  });

  test("a cancelled run says stopped without failing the step", () => {
    const events = [
      { type: "run_started", id: "s" },
      { type: "step", id: "1", step: { label: "Reading", status: "running" } },
      { type: "run_finished", id: "f", status: "cancelled" },
    ];
    expect(runStateFrom(events)).toEqual({ phase: "cancelled", label: "Stopped" });
    expect(stepsForRun(events)).toEqual([{ label: "Reading", status: "stopped" }]);
    expect(stepLabel({ label: "Reading", status: "stopped" })).toBe("Reading — stopped");
  });

  test("a finished run marks leftover steps done", () => {
    const steps = stepsForRun([
      { type: "run_started", id: "s" },
      { type: "step", id: "1", step: { label: "Editing", status: "running" } },
      { type: "run_finished", id: "f", status: "finished" },
    ]);
    expect(steps).toEqual([{ label: "Editing", status: "done" }]);
  });
});
