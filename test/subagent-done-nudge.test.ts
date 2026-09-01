import assert from "node:assert/strict";
import test from "node:test";
import { computeNudgeDelayMs, shouldScheduleAgentEndNudge } from "../pi-extension/subagents/subagent-done.ts";

test("completion nudge runs after the agent stops normally", () => {
  assert.equal(
    shouldScheduleAgentEndNudge([{ role: "assistant", stopReason: "stop" }]),
    true,
  );
});

test("completion nudge ignores provider errors", () => {
  assert.equal(
    shouldScheduleAgentEndNudge([{ role: "assistant", stopReason: "error" }]),
    false,
  );
});

test("completion nudge ignores user aborts", () => {
  assert.equal(
    shouldScheduleAgentEndNudge([{ role: "assistant", stopReason: "aborted" }]),
    false,
  );
});

test("completion nudge ignores output-limit stops", () => {
  assert.equal(
    shouldScheduleAgentEndNudge([{ role: "assistant", stopReason: "length" }]),
    false,
  );
});

const BASE = 5_000;
const CAP = 60_000;

// Regression: a parked agent (waiting on an ask_question answer) used to be
// pinged every NUDGE_DELAY_MS forever — turn end → nudge → new turn → turn
// end → nudge… The loop also stacked repetition pressure on the model.
test("nudge delay backs off exponentially and is capped", () => {
  assert.equal(computeNudgeDelayMs(BASE, 0, CAP), 5_000);
  assert.equal(computeNudgeDelayMs(BASE, 1, CAP), 10_000);
  assert.equal(computeNudgeDelayMs(BASE, 2, CAP), 20_000);
  assert.equal(computeNudgeDelayMs(BASE, 3, CAP), 40_000);
  assert.equal(computeNudgeDelayMs(BASE, 4, CAP), 60_000);
  assert.equal(computeNudgeDelayMs(BASE, 9, CAP), 60_000);
});
