import { test, expect } from "vitest"
import { createPlan, completion, nextStep } from "./Plan.ts"

const valid = {
  id: "test", title: "Test plan", lang: "fr", summary: "A test plan",
  steps: [
    { id: "one", title: "Step one", summary: "" },
    { id: "two", title: "Step two", summary: "" }
  ]
}

test("createPlan accepts a valid plan and freezes it", () => {
  const plan = createPlan(valid)
  expect(plan.id).toBe("test")
  expect(Object.isFrozen(plan)).toBe(true)
})

test("createPlan rejects a plan without steps", () => {
  expect(() => createPlan({ ...valid, steps: [] })).toThrow(TypeError)
})

test("createPlan rejects duplicate step ids", () => {
  const steps = [{ id: "dup", title: "A", summary: "" }, { id: "dup", title: "B", summary: "" }]
  expect(() => createPlan({ ...valid, steps })).toThrow(TypeError)
})

test("completion and nextStep reflect progress", () => {
  const plan = createPlan(valid)
  const progress = { doneSteps: ["one"] }
  expect(completion(plan, progress)).toBe(0.5)
  expect(nextStep(plan, progress)?.id).toBe("two")
  expect(nextStep(plan, { doneSteps: ["one", "two"] })).toBeUndefined()
})