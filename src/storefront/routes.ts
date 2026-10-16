const publicPages = new Set([
  "/",
  "/products",
  "/about",
  "/vision",
  "/privacy",
  "/refund",
  "/terms",
  "/support",
  "/accounts",
  "/api-integration",
]);

const workspacePages = new Set([
  "/dashboard",
  "/workspace",
  "/merchant",
  "/admin",
  "/marketer",
  "/loader",
  "/sign-in",
  "/signin",
  "/login",
  "/sign-up",
  "/signup",
  "/register",
]);

const customerPages = new Set([
  "/customer",
  "/wallet",
]);

export function normalizePathname(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

export function isStorefrontPath(path: string): boolean {
  const normalized = normalizePathname(path);
  return publicPages.has(normalized) || normalized.startsWith("/products/");
}

export function isWorkspacePath(path: string): boolean {
  return workspacePages.has(normalizePathname(path));
}

export function isCustomerPath(path: string): boolean {
  return customerPages.has(normalizePathname(path));
}

export function isWalletPath(path: string): boolean {
  return normalizePathname(path) === "/wallet";
}

const PENDING_RETURN_STORAGE_KEY = "oneshot_pending_return_to";
const PENDING_SKU_STORAGE_KEY = "oneshot_pending_sku";

const ALLOWED_RETURN_QUERY_KEYS = new Set([
  "sku",
  "topup",
  "category",
  "q",
  "limit",
  "lang",
  "theme",
  "mode",
]);

export function validateInternalReturnUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\") || /[\r\n\t]/.test(trimmed)) {
    return null;
  }
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "https://www.1shotcam.com";
    const parsed = new URL(trimmed, base);
    if (parsed.origin !== base) return null;
    const pathname = normalizePathname(parsed.pathname);
    if (
      !isStorefrontPath(pathname) &&
      !isCustomerPath(pathname) &&
      !isWorkspacePath(pathname)
    ) {
      return null;
    }
    const cleanParams = new URLSearchParams();
    for (const [key, value] of parsed.searchParams.entries()) {
      if (ALLOWED_RETURN_QUERY_KEYS.has(key) && value.trim()) {
        cleanParams.set(key, value.trim().slice(0, 120));
      }
    }
    const search = cleanParams.toString();
    return `${pathname}${search ? `?${search}` : ""}`;
  } catch {
    return null;
  }
}

function extractSkuFromReturnUrl(urlPath: string | null | undefined): string | null {
  if (!urlPath) return null;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "https://www.1shotcam.com";
    const parsed = new URL(urlPath, base);
    const sku = parsed.searchParams.get("sku")?.trim();
    return sku ? sku.slice(0, 40) : null;
  } catch {
    return null;
  }
}

function withSkuOnWalletUrl(urlPath: string, sku: string | null | undefined): string {
  const cleanSku = sku?.trim();
  if (!cleanSku) return urlPath;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "https://www.1shotcam.com";
    const parsed = new URL(urlPath, base);
    if (normalizePathname(parsed.pathname) === "/wallet" && !parsed.searchParams.has("sku")) {
      parsed.searchParams.set("sku", cleanSku.slice(0, 40));
    }
    return validateInternalReturnUrl(`${parsed.pathname}${parsed.search}`) || urlPath;
  } catch {
    return urlPath;
  }
}

export function persistReturnDestination(destination: string | null | undefined, sku?: string | null): string | null {
  const validated = validateInternalReturnUrl(destination);
  if (typeof window === "undefined") return validated;
  try {
    if (validated) {
      sessionStorage.setItem(PENDING_RETURN_STORAGE_KEY, validated);
      localStorage.setItem(PENDING_RETURN_STORAGE_KEY, validated);
    }
    const cleanSku = sku?.trim() || extractSkuFromReturnUrl(validated);
    if (cleanSku) {
      sessionStorage.setItem(PENDING_SKU_STORAGE_KEY, cleanSku.slice(0, 40));
      localStorage.setItem(PENDING_SKU_STORAGE_KEY, cleanSku.slice(0, 40));
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }
  return validated;
}

export function readStoredReturnDestination(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_RETURN_STORAGE_KEY) || localStorage.getItem(PENDING_RETURN_STORAGE_KEY);
    return validateInternalReturnUrl(raw);
  } catch {
    return null;
  }
}

export function readStoredPendingSku(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_SKU_STORAGE_KEY) || localStorage.getItem(PENDING_SKU_STORAGE_KEY);
    return raw && raw.trim() ? raw.trim().slice(0, 40) : null;
  } catch {
    return null;
  }
}

export function clearStoredReturnDestination(options?: { keepSku?: boolean }): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PENDING_RETURN_STORAGE_KEY);
    localStorage.removeItem(PENDING_RETURN_STORAGE_KEY);
    if (!options?.keepSku) {
      sessionStorage.removeItem(PENDING_SKU_STORAGE_KEY);
      localStorage.removeItem(PENDING_SKU_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function resolveCustomerReturnDestination(
  search = typeof window !== "undefined" ? window.location.search : "",
  pathname = typeof window !== "undefined" ? window.location.pathname : "/",
  userMetadata?: Record<string, unknown> | null,
): { destination: string; sku: string | null; shouldAutoRedirect: boolean } {
  const params = new URLSearchParams(search);
  const explicitReturn = validateInternalReturnUrl(params.get("returnTo") || params.get("next"));
  const urlSku = params.get("sku")?.trim() || null;
  const storedSku = readStoredPendingSku();
  const storedReturn = readStoredReturnDestination();
  const metadataSku =
    typeof userMetadata?.pending_sku === "string" && userMetadata.pending_sku.trim()
      ? userMetadata.pending_sku.trim().slice(0, 40)
      : null;
  const metadataReturn =
    typeof userMetadata?.return_to === "string"
      ? validateInternalReturnUrl(userMetadata.return_to)
      : null;
  const effectiveStoredSku = storedSku || metadataSku;

  if (explicitReturn) {
    const finalSku = extractSkuFromReturnUrl(explicitReturn) || urlSku || effectiveStoredSku;
    const finalDest = withSkuOnWalletUrl(explicitReturn, finalSku) || "/customer";
    return { destination: finalDest, sku: finalSku, shouldAutoRedirect: true };
  }

  if (urlSku) {
    if (normalizePathname(pathname) === "/wallet") {
      const validCurrent = validateInternalReturnUrl(`${pathname}${search}`);
      if (validCurrent) {
        return {
          destination: withSkuOnWalletUrl(validCurrent, urlSku),
          sku: urlSku,
          shouldAutoRedirect: true,
        };
      }
    }
    return {
      destination: `/wallet?sku=${encodeURIComponent(urlSku)}`,
      sku: urlSku,
      shouldAutoRedirect: true,
    };
  }

  if (normalizePathname(pathname) === "/wallet") {
    const validCurrent = validateInternalReturnUrl(`${pathname}${search}`);
    if (validCurrent) {
      return {
        destination: withSkuOnWalletUrl(validCurrent, effectiveStoredSku),
        sku: effectiveStoredSku,
        shouldAutoRedirect: true,
      };
    }
  }

  if (storedReturn) {
    const finalSku = extractSkuFromReturnUrl(storedReturn) || effectiveStoredSku;
    return {
      destination: withSkuOnWalletUrl(storedReturn, finalSku),
      sku: finalSku,
      shouldAutoRedirect: true,
    };
  }

  if (effectiveStoredSku) {
    return {
      destination: `/wallet?sku=${encodeURIComponent(effectiveStoredSku)}`,
      sku: effectiveStoredSku,
      shouldAutoRedirect: false,
    };
  }

  if (metadataReturn) {
    const finalSku = extractSkuFromReturnUrl(metadataReturn);
    return {
      destination: withSkuOnWalletUrl(metadataReturn, finalSku),
      sku: finalSku,
      shouldAutoRedirect: false,
    };
  }

  return {
    destination: "/customer",
    sku: null,
    shouldAutoRedirect: false,
  };
}

export function formatLocalizedAuthError(
  caught: unknown,
  tr: (arabic: string, english: string) => string,
): string {
  const raw = caught instanceof Error ? caught.message : typeof caught === "string" ? caught : "";
  const lower = raw.toLowerCase();

  if (
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("duplicate") ||
    lower.includes("مسجّل مسبقاً") ||
    lower.includes("مسجل مسبقاً") ||
    lower.includes("422")
  ) {
    return tr(
      "هذا البريد الإلكتروني مسجّل مسبقاً. سجّل الدخول بحسابك الحالي أو استعد كلمة المرور.",
      "This email address is already registered. Sign in to your existing account or reset your password.",
    );
  }

  if (
    lower.includes("email not confirmed") ||
    lower.includes("not confirmed") ||
    lower.includes("unconfirmed") ||
    lower.includes("تأكيد البريد")
  ) {
    return tr(
      "البريد الإلكتروني غير مؤكّد بعد. افتح رسالة التأكيد في بريدك الوارد ثم سجّل الدخول.",
      "Your email address is not confirmed yet. Open the confirmation link in your inbox, then sign in.",
    );
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("502") ||
    lower.includes("503") ||
    lower.includes("504") ||
    lower.includes("timeout") ||
    lower.includes("service unavailable")
  ) {
    return tr(
      "خدمة التحقق من الحساب غير متاحة مؤقتاً. تحقق من اتصالك بالإنترنت وحاول مرة أخرى بعد قليل.",
      "The authentication service is temporarily unavailable. Check your connection and try again shortly.",
    );
  }

  if (lower.includes("no user found") || lower.includes("user not found") || lower.includes("404")) {
    return tr(
      "لا يوجد حساب مسجّل بهذا البريد الإلكتروني. أنشئ حساباً جديداً للبدء.",
      "No account was found with this email address. Create a new account to get started.",
    );
  }

  if (lower.includes("invalid_grant") || lower.includes("invalid") || lower.includes("unauthorized") || lower.includes("400") || lower.includes("401")) {
    return tr(
      "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      "Incorrect email address or password.",
    );
  }

  if (lower.includes("password")) {
    return tr(
      "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
      "Password must be at least 8 characters long.",
    );
  }

  return tr(
    "تعذر إتمام الطلب حالياً. تحقق من صحة البيانات أو حاول مجدداً بعد قليل.",
    "Unable to complete your request right now. Check your details and try again shortly.",
  );
}

