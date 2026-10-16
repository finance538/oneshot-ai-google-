// حساب مالك المنصة في Netlify Identity. هذا البريد يملك صلاحيات الإدارة دائماً،
// بغض النظر عن متغير ADMIN_EMAILS أو الأدوار المخزّنة في app_metadata.
export const PLATFORM_OWNER_EMAIL = 'brand@1shotcam.com';

export function normalizeEmail(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function isPlatformOwnerEmail(value: unknown): boolean {
  const normalized = normalizeEmail(value);
  return normalized.length > 0 && normalized === PLATFORM_OWNER_EMAIL;
}
