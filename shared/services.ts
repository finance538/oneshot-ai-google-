import { products } from '../src/storefront/catalog.js';
import { googleAdsPackage, mediaPackages } from '../src/storefront/media.js';

export type ServiceEligibility = 'wallet_ready' | 'quote_only' | 'unavailable';

export const walletServices = [
  ...products.filter(product => product.status === 'ready_to_sell' && product.pricing.type === 'fixed' && product.pricing.currency === 'SAR').map(product => ({ sku: product.sku, nameAr: product.nameAr, nameEn: product.nameEn, amount: product.pricing.amount, billingCycle: product.pricing.billingCycle })),
  ...mediaPackages.map(product => ({ sku: product.sku, nameAr: product.nameAr, nameEn: product.nameEn, amount: product.price, billingCycle: product.days ? 'one_time' : 'monthly' })),
  { ...googleAdsPackage, billingCycle: 'one_time' },
];

const walletEligibleSkuSet = new Set(walletServices.map(service => service.sku));
const catalogBySku = new Map(products.map(product => [product.sku, product]));

export function isWalletEligibleSku(sku: string | null | undefined): boolean {
  if (!sku) return false;
  return walletEligibleSkuSet.has(sku.trim());
}

export function getServiceEligibility(sku: string | null | undefined): {
  eligibility: ServiceEligibility;
  walletEligible: boolean;
  startsAt: boolean;
  unavailable: boolean;
} {
  const normalized = (sku || '').trim();
  if (walletEligibleSkuSet.has(normalized)) {
    return {
      eligibility: 'wallet_ready',
      walletEligible: true,
      startsAt: false,
      unavailable: false,
    };
  }
  const product = catalogBySku.get(normalized);
  if (!product || product.status !== 'ready_to_sell') {
    return {
      eligibility: 'unavailable',
      walletEligible: false,
      startsAt: product?.pricing.type === 'starts_at',
      unavailable: true,
    };
  }
  return {
    eligibility: 'quote_only',
    walletEligible: false,
    startsAt: product.pricing.type === 'starts_at',
    unavailable: false,
  };
}

