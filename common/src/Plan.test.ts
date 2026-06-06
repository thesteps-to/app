import { test, expect } from "vitest"
import { createPlan, completion, nextStep, unlockedSteps, planFields } from "./Plan.ts"
import type { DossierField, Step } from "./Plan.ts"

const author = { id: "alice", name: "Alice" }
const step = (overrides: Partial<Step> & { id: string; title: string }): Step => ({
  summary: "",
  ...overrides,
})

const valid = {
  id: "test", title: "Test plan", lang: "fr", summary: "A test plan",
  author, needTags: ["test"],
  steps: [step({ id: "one", title: "Step one" }), step({ id: "two", title: "Step two" })],
}

test("createPlan accepts a valid plan and freezes it", () => {
  const plan = createPlan(valid)
  expect(plan.id).toBe("test")
  expect(plan.author.name).toBe("Alice")
  expect(plan.needTags).toEqual(["test"])
  expect(Object.isFrozen(plan)).toBe(true)
})

test("createPlan rejects a plan without steps", () => {
  expect(() => createPlan({ ...valid, steps: [] })).toThrow(TypeError)
})

test("createPlan rejects duplicate step ids", () => {
  const steps = [step({ id: "dup", title: "A" }), step({ id: "dup", title: "B" })]
  expect(() => createPlan({ ...valid, steps })).toThrow(TypeError)
})

test("createPlan rejects a missing author", () => {
  const { author: _omit, ...rest } = valid
  expect(() => createPlan(rest)).toThrow(/author/)
})

test("createPlan rejects needTags that is not an array of strings", () => {
  expect(() => createPlan({ ...valid, needTags: "buyahouse" })).toThrow(/needTags/)
  expect(() => createPlan({ ...valid, needTags: [1, 2] })).toThrow(/needTags/)
})

test("createPlan rejects a step that requires an unknown step", () => {
  const steps = [step({ id: "a", title: "A", requires: ["ghost"] })]
  expect(() => createPlan({ ...valid, steps })).toThrow(/unknown step/)
})

test("createPlan rejects a self-loop in requires", () => {
  const steps = [step({ id: "a", title: "A", requires: ["a"] })]
  expect(() => createPlan({ ...valid, steps })).toThrow(/cycle/i)
})

test("createPlan rejects a two-node cycle in requires", () => {
  const steps = [
    step({ id: "a", title: "A", requires: ["b"] }),
    step({ id: "b", title: "B", requires: ["a"] }),
  ]
  expect(() => createPlan({ ...valid, steps })).toThrow(/cycle/i)
})

test("createPlan rejects a longer cycle in requires", () => {
  const steps = [
    step({ id: "a", title: "A", requires: ["c"] }),
    step({ id: "b", title: "B", requires: ["a"] }),
    step({ id: "c", title: "C", requires: ["b"] }),
  ]
  expect(() => createPlan({ ...valid, steps })).toThrow(/cycle/i)
})

test("createPlan accepts a valid DAG", () => {
  const plan = createPlan({
    ...valid,
    steps: [
      step({ id: "a", title: "A" }),
      step({ id: "b", title: "B", requires: ["a"] }),
      step({ id: "c", title: "C", requires: ["a", "b"] }),
    ],
  })
  expect(plan.steps).toHaveLength(3)
})

test("completion and nextStep reflect progress on a linear plan", () => {
  const plan = createPlan(valid)
  const progress = { doneSteps: ["one"] }
  expect(completion(plan, progress)).toBe(0.5)
  expect(nextStep(plan, progress)?.id).toBe("two")
  expect(nextStep(plan, { doneSteps: ["one", "two"] })).toBeUndefined()
})

test("unlockedSteps respects requires and excludes done steps", () => {
  const plan = createPlan({
    ...valid,
    steps: [
      step({ id: "a", title: "A" }),
      step({ id: "b", title: "B", requires: ["a"] }),
      step({ id: "c", title: "C" }),
      step({ id: "d", title: "D", requires: ["b", "c"] }),
    ],
  })
  expect(unlockedSteps(plan, { doneSteps: [] }).map(s => s.id)).toEqual(["a", "c"])
  expect(unlockedSteps(plan, { doneSteps: ["a"] }).map(s => s.id)).toEqual(["b", "c"])
  expect(unlockedSteps(plan, { doneSteps: ["a", "b", "c"] }).map(s => s.id)).toEqual(["d"])
  expect(unlockedSteps(plan, { doneSteps: ["a", "b", "c", "d"] })).toEqual([])
})

test("nextStep returns the first unlocked step on a DAG plan", () => {
  const plan = createPlan({
    ...valid,
    steps: [
      step({ id: "a", title: "A" }),
      step({ id: "b", title: "B", requires: ["a"] }),
      step({ id: "c", title: "C" }),
    ],
  })
  expect(nextStep(plan, { doneSteps: [] })?.id).toBe("a")
  expect(nextStep(plan, { doneSteps: ["a"] })?.id).toBe("b")
})

test("planFields deduplicates fields by id within a plan", () => {
  const income: DossierField = { id: "income", label: "Revenus", type: "number", sensitivity: "financial" }
  const city: DossierField = { id: "city", label: "Ville", type: "text", sensitivity: "project" }
  const plan = createPlan({
    ...valid,
    steps: [
      step({ id: "a", title: "A", inputs: [income] }),
      step({ id: "b", title: "B", inputs: [income, city] }),
    ],
  })
  expect(planFields(plan).map(f => f.id)).toEqual(["income", "city"])
})

test("planFields merges across plans, first occurrence wins", () => {
  const planA = createPlan({
    ...valid, id: "a",
    steps: [step({
      id: "s", title: "S",
      inputs: [{ id: "name", label: "Nom", type: "text", sensitivity: "contact" }],
    })],
  })
  const planB = createPlan({
    ...valid, id: "b",
    steps: [step({
      id: "s", title: "S",
      inputs: [
        { id: "name", label: "Nom (different)", type: "text", sensitivity: "contact" },
        { id: "city", label: "Ville", type: "text", sensitivity: "project" },
      ],
    })],
  })
  const fields = planFields(planA, planB)
  expect(fields.map(f => f.id)).toEqual(["name", "city"])
  expect(fields[0]!.label).toBe("Nom")
})
