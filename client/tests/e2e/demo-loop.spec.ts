import { test, expect } from "@playwright/test"

/**
 * End-to-end demo loop for the breadth-first MVP:
 *   express need → choose plan → fill a dossier field → handoff with consent →
 *   register as the matching provider in /pro → "Affaire conclue" →
 *   back to the plan: the step is marked done.
 *
 * Uses planmyvacation because its first step (destination) collects inputs
 * and its second step (transport) carries a provider (the canonical
 * dossier-then-handoff shape across two unlocked steps in a DAG plan).
 */
test("user → provider demo loop closes in one browser", async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => localStorage.clear())

  await page.goto("/")
  await page.getByPlaceholder(/Acheter une maison/).fill("vacances")
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

  await page.getByRole("button", { name: "C'est fait ✓" }).first().click()

  const transportCard = page.locator("section.next-card", { hasText: "Réserver le transport" })
  await expect(transportCard).toBeVisible()
  await transportCard.getByRole("button", { name: "Être mis en relation" }).first().click()

  const dialog = page.locator("dialog.consent-dialog")
  await expect(dialog).toBeVisible()
  await dialog.getByRole("radio", { name: /Coordonnées \+ projet \+ finances/ }).check()
  await dialog.getByRole("button", { name: "Transmettre le dossier" }).click()
  await expect(dialog).toBeHidden()
  // Two providers share the "transport" category — a handoff to one marks all sent.
  await expect(transportCard.getByText("Dossier envoyé").first()).toBeVisible()

  await page.goto("/pro")
  await page.locator('select[name="category"]').selectOption("transport")
  await page.locator('input[name="email"]').fill("pro@example.com")
  await page.locator('input[name="region"]').fill("Île-de-France")
  await page.getByRole("button", { name: "S'inscrire" }).click()

  const userLead = page.locator("a.inbox-row", { hasText: "Réserver le transport" }).first()
  await expect(userLead).toBeVisible()
  await userLead.click()
  await expect(page).toHaveURL(/\/pro\/lead\//)

  await page.getByRole("button", { name: "Affaire conclue" }).click()
  await expect(page.getByText("✓ Affaire conclue")).toBeVisible()

  await page.goto("/plan/planmyvacation/run")
  await expect(page.getByText(/Réserver le transport/)).toBeHidden()
  await page.getByRole("link", { name: /voir le plan complet/ }).click()
  const transportDetails = page.locator("details", { hasText: "Réserver le transport" })
  await expect(transportDetails).toHaveClass(/done/)
})
