export const paymentMethods = ['hosted', 'framed', 'mobile', 'mada_applepay', 'managed', 'own', 'paylink', 'invoice', 'recurring'] as const;
export type PaymentMethod = typeof paymentMethods[number];
export type Gateway = 'paytabs' | 'telr';

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
  gateways: { paytabs: true, telr: true },
  methods: { hosted: true, framed: true, mobile: true, mada_applepay: true, managed: true, own: true, paylink: true, invoice: true, recurring: true },
};

export function methodAllowed(policy: PaymentPolicy, gateway: Gateway, method: string) {
  return policy.paymentsEnabled && policy.gateways[gateway] && Object.prototype.hasOwnProperty.call(policy.methods, method) && policy.methods[method as PaymentMethod];
}

export const openLinkMethods = paymentMethods.filter(method => method !== 'recurring');
