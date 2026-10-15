import { eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { platformSettings } from '../../db/schema.js';
import { defaultPolicy, gateways, methodAllowed, paymentMethods, type Gateway, type PaymentPolicy } from '../../shared/policy.js';
import { capabilities, HttpError } from './platform.js';
import { ngeniusCapabilities } from './ngenius.js';
import { telrCapabilities } from './telr.js';

// A stored policy may predate a gateway, so it is always merged over the defaults.
export function normalizePolicy(stored: PaymentPolicy | undefined | null): PaymentPolicy {
  return {
    ...defaultPolicy,
    ...(stored || {}),
    gateways: Object.fromEntries(gateways.map(gateway => [gateway, typeof stored?.gateways?.[gateway] === 'boolean' ? stored.gateways[gateway] : defaultPolicy.gateways[gateway]])) as Record<Gateway, boolean>,
    methods: Object.fromEntries(paymentMethods.map(method => [method, typeof stored?.methods?.[method] === 'boolean' ? stored.methods[method] : defaultPolicy.methods[method]])) as PaymentPolicy['methods'],
  };
}

export async function settings() {
  const [row] = await database().select().from(platformSettings).where(eq(platformSettings.id, 'global'));
  return { policy: normalizePolicy(row?.policy), version: row?.version ?? 0 };
}

export function enabledCapabilities(merchantId: string, gateway: Gateway, policy: PaymentPolicy): Record<string, boolean> {
  const available: Record<string, boolean> = gateway === 'telr' ? telrCapabilities(merchantId) : gateway === 'ngenius' ? ngeniusCapabilities(merchantId) : capabilities(merchantId);
  return Object.fromEntries(Object.entries(available).map(([method, active]) => [method, method === 'connected' ? active : active && methodAllowed(policy, gateway, method)]));
}

export function parsePolicy(value: unknown): PaymentPolicy {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'إعدادات غير صالحة.');
  const input = value as Record<string, unknown>;
  const flags = ['paymentsEnabled', 'requestsEnabled', 'openLinksEnabled', 'aiEnabled'] as const;
  if (flags.some(flag => typeof input[flag] !== 'boolean')) throw new HttpError(400, 'إعدادات غير صالحة.');
  const gatewaysInput = input.gateways as Record<string, unknown> | undefined;
  const methods = input.methods as Record<string, unknown> | undefined;
  if (!gatewaysInput || !methods || ['paytabs', 'telr'].some(gateway => typeof gatewaysInput[gateway] !== 'boolean') || paymentMethods.some(method => typeof methods[method] !== 'boolean')) throw new HttpError(400, 'إعدادات غير صالحة.');
  return {
    paymentsEnabled: input.paymentsEnabled as boolean,
    requestsEnabled: input.requestsEnabled as boolean,
    openLinksEnabled: input.openLinksEnabled as boolean,
    aiEnabled: input.aiEnabled as boolean,
    // A client that predates the N-Genius toggle keeps the default value for it.
    gateways: Object.fromEntries(gateways.map(gateway => [gateway, typeof gatewaysInput[gateway] === 'boolean' ? gatewaysInput[gateway] : defaultPolicy.gateways[gateway]])) as Record<Gateway, boolean>,
    methods: Object.fromEntries(paymentMethods.map(method => [method, methods[method]])) as PaymentPolicy['methods'],
  };
}
