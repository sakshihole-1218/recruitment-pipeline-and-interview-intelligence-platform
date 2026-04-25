export function normalizeEmail(email: unknown): string {
  return String(email ?? '').trim().toLowerCase();
}

export function normalizeSearch(search: unknown): string | undefined {
  const normalized = String(search ?? '').trim();
  return normalized.length > 0 ? normalized : undefined;
}
