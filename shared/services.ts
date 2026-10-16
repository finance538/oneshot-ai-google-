import { products } from '../src/storefront/catalog.js';
import { googleAdsPackage, mediaPackages } from '../src/storefront/media.js';

export const walletServices = [
  ...products.filter(product => product.status === 'ready_to_sell' && product.pricing.type === 'fixed' && product.pricing.currency === 'SAR').map(product => ({ sku: product.sku, nameAr: product.nameAr, nameEn: product.nameEn, amount: product.pricing.amount, billingCycle: product.pricing.billingCycle })),
  ...mediaPackages.map(product => ({ sku: product.sku, nameAr: product.nameAr, nameEn: product.nameEn, amount: product.price, billingCycle: product.days ? 'one_time' : 'monthly' })),
  { ...googleAdsPackage, billingCycle: 'one_time' },
];
