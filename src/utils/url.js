export function withBase(path = '/') {
  const base = import.meta.env.BASE_URL ?? '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const stripped = String(path).replace(/^\/+/g, '');
  if (!stripped) return normalizedBase;
  return `${normalizedBase}${stripped}`;
}
