import { test } from "node:test"
import assert from "node:assert/strict"
import { createPlan, completion, nextStep } from "./Plan.js"

const valid = {
  id: "test", title: "Test plan", lang: "fr", summary: "A test plan",
  steps: [
    { id: "one", title: "Step one" },
    { id: "two", title: "Step two" }
  ]
}

test("createPlan accepts a valid plan and freezes it", () => {
  const plan = createPlan(valid)
  assert.equal(plan.id, "test")
  assert.ok(Object.isFrozen(plan))
})

test("createPlan rejects a plan without steps", () => {
  assert.throws(() => createPlan({ ...valid, steps: [] }), TypeError)
})

test("createPlan rejects duplicate step ids", () => {
  const steps = [{ id: "dup", title: "A" }, { id: "dup", title: "B" }]
  assert.throws(() => createPlan({ ...valid, steps }), TypeError)
})

test("completion and nextStep reflect progress", () => {
  const plan = createPlan(valid)
  const progress = { doneSteps: ["one"] }
  assert.equal(completion(plan, progress), 0.5)
  assert.equal(nextStep(plan, progress).id, "two")
  assert.equal(nextStep(plan, { doneSteps: ["one", "two"] }), undefined)
})
