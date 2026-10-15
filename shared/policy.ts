export const paymentMethods = ['hosted', 'framed', 'mobile', 'mada_applepay', 'samsung_pay', 'managed', 'own', 'paylink', 'invoice', 'recurring'] as const;
export type PaymentMethod = typeof paymentMethods[number];
export const gateways = ['paytabs', 'telr', 'ngenius', 'tap'] as const;
export type Gateway = typeof gateways[number];
export const gatewayNames: Record<Gateway, string> = { paytabs: 'PayTabs', telr: 'Telr', ngenius: 'N-Genius KSA', tap: 'Tap Payments' };

export interface PaymentPolicy {
  paymentsEnabled: boolean;
  requestsEnabled: boolean;
  openLinksEnabled: boolean;
  aiEnabled: boolean;
  gateways: Record<Gateway, boolean>;
  methods: Record<PaymentMethod, boolean>;
}

export const defaultPolicy: PaymentPolicy = {
  paymentsEnabled: true,
  requestsEnabled: true,
  openLinksEnabled: true,
  aiEnabled: false,
  gateways: { paytabs: true, telr: true, ngenius: true, tap: true },
  methods: { hosted: true, framed: true, mobile: true, mada_applepay: true, samsung_pay: true, managed: true, own: true, paylink: true, invoice: true, recurring: true },
};

export function gatewayName(gateway: string) {
  return gatewayNames[gateway as Gateway] || gateway;
}

export function methodAllowed(policy: PaymentPolicy, gateway: Gateway, method: string) {
  return policy.paymentsEnabled && policy.gateways[gateway] && Object.prototype.hasOwnProperty.call(policy.methods, method) && policy.methods[method as PaymentMethod];
}

export const openLinkMethods = paymentMethods.filter(method => method !== 'recurring');
