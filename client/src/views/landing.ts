import { navigate } from "../router.ts"

export function renderLanding(host: HTMLElement): void {
  host.innerHTML = `
    <section class="landing">
      <div class="landing-hero">
        <h1>Votre prochain projet,<br>une étape à la fois.</h1>
        <p>Dites-moi ce que vous voulez accomplir. Je prépare le plan, je gère les détails, je vous mets en relation avec les bons professionnels au bon moment.</p>
      </div>

      <form class="need-form" autocomplete="off">
        <div class="ts-field">
          <label class="ts-label" for="need">Votre projet</label>
          <input class="ts-input" id="need" name="q" type="search" required
                 placeholder="Acheter un logement, créer mon entreprise, partir en vacances…">
        </div>
        <button class="ts-btn ts-btn--primary ts-btn--lg" type="submit">Trouver un plan</button>
      </form>
      <p class="examples">
        Exemples :
        <a href="/search?q=maison">acheter une maison</a>
        <a href="/search?q=entreprise">créer mon entreprise</a>
        <a href="/search?q=vacances">planifier mes vacances</a>
      </p>
    </section>
  `
  const form = host.querySelector<HTMLFormElement>("form.need-form")
  form?.addEventListener("submit", event => {
    event.preventDefault()
    const input = form.querySelector<HTMLInputElement>("input[name=q]")
    const q = input?.value.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
  })
}
