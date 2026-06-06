import { navigate } from "../router.ts"

export function renderLanding(host: HTMLElement): void {
  host.innerHTML = `
    <section class="landing">
      <h1>Quel projet voulez-vous mener à bien ?</h1>
      <p class="lead">
        thesteps.to prépare un plan étape par étape pour vos projets de vie, avec les bons
        professionnels au bon moment. Vous n'avez à penser qu'à la prochaine action.
      </p>
      <form class="need-form" autocomplete="off">
        <label for="need" class="visually-hidden">Décrivez votre besoin</label>
        <input id="need" name="q" type="search" required
               placeholder="Acheter une maison, créer mon entreprise, partir en vacances…">
        <button type="submit">Trouver un plan</button>
      </form>
      <p class="examples">
        Exemples : <a href="/search?q=maison">acheter une maison</a> ·
        <a href="/search?q=entreprise">créer mon entreprise</a> ·
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
