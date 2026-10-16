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

export function isStorefrontPath(path: string) {
  return (
    publicPages.has(path.replace(/\/+$/, "") || "/") ||
    path.startsWith("/products/")
  );
}
