import type { UserLoginEvent, UserSignupEvent } from '@netlify/functions';
import { isPlatformOwnerEmail } from '../../shared/platform-owner.js';

// حساب مالك المنصة في Netlify Identity يحصل على دور `admin` تلقائياً عند التسجيل
// وعند كل تسجيل دخول، فلا يحتاج أحد إلى إضافته يدوياً من لوحة Netlify.
// الأدوار في app_metadata يتحكم بها الخادم فقط، لذا تُضاف هنا وليس من المتصفح.
function grantOwnerRole(event: UserLoginEvent | UserSignupEvent) {
  if (!isPlatformOwnerEmail(event.user.email)) return undefined;
  const existing = Array.isArray(event.user.appMetadata?.roles)
    ? (event.user.appMetadata.roles as unknown[]).filter((role): role is string => typeof role === 'string')
    : [];
  if (existing.includes('admin')) return undefined;
  return {
    user: {
      ...event.user,
      appMetadata: { ...(event.user.appMetadata ?? {}), roles: [...existing, 'admin'] },
    },
  };
}

export default {
  userSignup(event: UserSignupEvent) { return grantOwnerRole(event); },
  userLogin(event: UserLoginEvent) { return grantOwnerRole(event); },
};
