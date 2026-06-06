export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]!))
}

export function escapeAttr(value: string): string {
  return escapeHtml(value)
}
