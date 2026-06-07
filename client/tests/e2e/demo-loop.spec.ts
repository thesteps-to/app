import { test, expect } from "@playwright/test"

/**
 * End-to-end demo loop for the breadth-first MVP:
 *   express need → choose plan → fill a dossier field → handoff with consent →
 *   register as the matching provider in /pro → "Affaire conclue" →
 *   back to the plan: the step is marked done.
 *
 * Uses planmyvacation because its first step (destination) collects inputs
 * and its second step (transport) carries a provider — the canonical
 * dossier-then-handoff shape across two unlocked steps in a DAG plan.
 */
test("user → provider demo loop closes in one browser", async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => localStorage.clear())

  await page.goto("/")
  await page.getByPlaceholder(/Acheter un logement/).fill("vacances")
  await page.getByRole("button", { name: "Trouver un plan" }).click()
  await expect(page).toHaveURL(/\/search\?q=vacances/)

  await page.getByRole("heading", { name: "Planifier mes vacances" }).first().click()
  await expect(page).toHaveURL(/\/plan\/planmyvacation/)
  await expect(page.getByRole("heading", { level: 1, name: "Planifier mes vacances" })).toBeVisible()

  await page.getByRole("link", { name: "Commencer ce plan" }).click()
  await expect(page).toHaveURL(/\/plan\/planmyvacation\/run/)

  const budgetInput = page.locator('[data-field="voyage-budget"]')
  await budgetInput.fill("2500")
  await budgetInput.blur()

  await page.getByRole("button", { name: /^C'est fait/ }).first().click()

  const transportCard = page.locator("li.ts-trail__item", { hasText: "Réserver le transport" }).first()
  await expect(transportCard).toBeVisible()
  await transportCard.getByRole("button", { name: "Être mis en relation" }).first().click()

  const dialog = page.locator("dialog.ts-dialog")
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: "Financier" }).click()
  await dialog.getByRole("button", { name: "Je partage ce dossier" }).click()
  await expect(dialog).toBeHidden()
  await expect(transportCard.getByText("Dossier envoyé").first()).toBeVisible()

  await page.goto("/pro")
  // First provider in the transport step is "Comparateur de vols" (type=vol).
  await page.locator('select[name="category"]').selectOption("vol")
  await page.locator('input[name="email"]').fill("pro@example.com")
  await page.locator('input[name="region"]').fill("Île-de-France")
  await page.getByRole("button", { name: "S'inscrire" }).click()

  const userLead = page.locator("a.inbox-row", { hasText: "Réserver le transport" }).first()
  await expect(userLead).toBeVisible()
  await userLead.click()
  await expect(page).toHaveURL(/\/pro\/lead\//)

  await page.getByRole("button", { name: "Affaire conclue" }).click()
  await expect(page.getByText("Affaire conclue").first()).toBeVisible()

  await page.goto("/plan/planmyvacation/run")
  const transportTrail = page.locator("li.ts-trail__item", { hasText: "Réserver le transport" }).first()
  await expect(transportTrail).toHaveAttribute("data-state", "done")
})
