export function renderNotFound(host: HTMLElement): void {
  host.innerHTML = `
    <section class="not-found">
      <h1>Plan introuvable</h1>
      <p>Ce plan n'existe pas (encore). Découvrez les plans disponibles :</p>
      <p><a class="primary" href="/search">Voir tous les plans</a></p>
    </section>
  `
}
