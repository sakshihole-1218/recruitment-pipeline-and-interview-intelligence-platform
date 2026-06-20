export function normalizeEmail(email: unknown): string {
  return String(email ?? '')
    .trim()
    .toLowerCase();
}

export function normalizeSearch(search: unknown): string | undefined {
  const normalized = String(search ?? '').trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizePhoneE164(phone: unknown): string | null {
  const raw = String(phone ?? '').trim();
  if (raw.length === 0) return null;

  let normalized = raw.replace(/[\s().-]/g, '');

  if (normalized.startsWith('00')) {
    normalized = `+${normalized.slice(2)}`;
  }

  if (normalized.startsWith('+')) {
    normalized = `+${normalized.slice(1).replace(/\+/g, '')}`;
  }

  return normalized;
}
