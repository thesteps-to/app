export function renderNotFound(host: HTMLElement): void {
  host.innerHTML = `
    <section class="not-found">
      <span class="ts-glyph ts-glyph--xl" data-state="locked"></span>
      <h1>Ce plan n'existe pas encore</h1>
      <p>Découvrez les plans disponibles dès maintenant.</p>
      <a class="ts-btn ts-btn--primary" href="/search">Voir tous les plans</a>
    </section>
  `
}
