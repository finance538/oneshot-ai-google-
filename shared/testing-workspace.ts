import { z } from 'zod';

export const merchantViews = ['overview', 'ceo', 'staff', 'gemini_studio', 'links', 'invoices', 'subscriptions', 'integrations', 'security', 'loader', 'settings', 'wallet'];
export const adminViews = ['admin', 'assistant', 'gemini_studio', 'staff', 'ceo', 'overview', 'links', 'invoices', 'subscriptions', 'integrations', 'security', 'loader', 'settings', 'wallet'];

export function canUseTestingTools(account: { isAdmin?: boolean; accountRole?: string; registrationStatus?: string }) {
  return account.isAdmin === true || (account.registrationStatus === 'approved' && ['loader', 'merchant'].includes(account.accountRole ?? ''));
}

export function requestedWorkspaceView(path: string): 'loader' | 'admin' | 'overview' | undefined {
  const normalized = path.replace(/\/+$/, '');
  if (['/loader', '/tester'].includes(normalized)) return 'loader';
  if (normalized === '/admin') return 'admin';
  if (normalized === '/merchant') return 'overview';
}

const shortText = z.string().max(120);
const ip = z.ipv4();
export const proxySchema = z.object({
  code: z.string().min(2).max(20), name: shortText, ip, isp: shortText, ping: z.string().max(20),
}).strict();

export const ipSimulationSchema = z.object({
  enabled: z.boolean(), selectedCountryCode: z.string().min(2).max(20),
  customIp: z.union([ip, z.literal('')]), customCountryName: shortText,
  customCityName: shortText, customIsp: shortText, isCustomActive: z.boolean(),
  proxyMode: z.enum(['fixed', 'auto_card_bin', 'fraud_stress', 'random_rotation']),
  injectHeaders: z.object({
    xForwardedFor: z.boolean(), cfConnectingIp: z.boolean(), xRealIp: z.boolean(),
    trueClientIp: z.boolean(), clientGeoCountry: z.boolean(),
  }).strict(),
  simulateVpnDetection: z.boolean(), simulateLatency: z.boolean(), strictGeoFence: z.boolean(),
}).strict();

export type IpSimulationConfig = z.infer<typeof ipSimulationSchema>;
export const defaultIpSimulation: IpSimulationConfig = {
  enabled: true, selectedCountryCode: 'SA_RUH', customIp: '', customCountryName: '', customCityName: '',
  customIsp: '', isCustomActive: false, proxyMode: 'fixed',
  injectHeaders: { xForwardedFor: true, cfConnectingIp: true, xRealIp: true, trueClientIp: false, clientGeoCountry: true },
  simulateVpnDetection: false, simulateLatency: true, strictGeoFence: true,
};

export const securityRulesSchema = z.object({
  '3ds_secure': z.boolean(), avs_address_check: z.boolean(), geo_ip_mismatch: z.boolean(),
  proxy_vpn_blocker: z.boolean(), velocity_rate_limit: z.boolean(), device_fingerprint: z.boolean(),
  cvv_mandatory_check: z.boolean(), amount_anomaly_detector: z.boolean(),
}).strict();

export const testingSettingsSchema = z.object({
  schemaVersion: z.literal(1),
  simulator: z.object({
    gatewayId: z.string().refine(value => ['paytabs', 'telr', 'myfatoorah', 'payzaty', 'tabby', 'noonpayments', 'payone', 'ngenius', 'tap'].includes(value)),
    integrationId: z.string().refine(value => ['hosted', 'mobile', 'framed', 'managed', 'direct_api', 'embedded', 'snippet', 'widget', 'hosted_session', 'mobile_sdk', 'plugins', 'mada_applepay', 'own'].includes(value)),
    deviceEnvironment: z.enum(['desktop', 'mobile']), isVpnEnabled: z.boolean(),
    proxy: proxySchema, customIp: z.union([ip, z.literal('')]), activeIp: ip,
    suiteMode: z.enum(['simulator', 'card_checker', 'country_matrix', 'fraud_toolkit', 'ai_bin_intelligence', 'multi_bin_matcher', 'failures_dashboard']),
    productSku: z.string().max(100).regex(/^[A-Za-z0-9_-]*$/),
  }).strict(),
  securityRules: securityRulesSchema,
  ipSimulation: ipSimulationSchema,
}).strict();
export type TestingSettings = z.infer<typeof testingSettingsSchema>;
export type TestingWorkspaceRecord = { settings: TestingSettings; version: number; updatedAt: string | null };

export function defaultTestingSettings(): TestingSettings {
  return {
    schemaVersion: 1,
    simulator: {
      gatewayId: 'paytabs', integrationId: 'hosted', deviceEnvironment: 'desktop', isVpnEnabled: true,
      proxy: { code: 'SA', name: 'المملكة العربية السعودية (الرياض)', ip: '178.80.124.45', isp: 'STC Telecom', ping: '12ms' },
      customIp: '', activeIp: '178.80.124.45', suiteMode: 'simulator', productSku: '',
    },
    securityRules: { '3ds_secure': true, avs_address_check: true, geo_ip_mismatch: true, proxy_vpn_blocker: false,
      velocity_rate_limit: true, device_fingerprint: true, cvv_mandatory_check: true, amount_anomaly_detector: true },
    ipSimulation: structuredClone(defaultIpSimulation),
  };
}

// Only these legacy settings are eligible for an explicit import. Never import session or card data.
export function importLegacyTestingSettings(current: TestingSettings, read: (key: string) => string | null): TestingSettings | null {
  const next = structuredClone(current);
  let found = false;
  const rules = read('oneshot_security_systems');
  if (rules) {
    const parsed: unknown = JSON.parse(rules);
    if (!Array.isArray(parsed)) throw new Error('Invalid legacy security settings');
    for (const rule of parsed) {
      if (rule && typeof rule === 'object' && typeof rule.id === 'string' && Object.prototype.hasOwnProperty.call(next.securityRules, rule.id) && typeof rule.enabled === 'boolean') {
        next.securityRules[rule.id as keyof TestingSettings['securityRules']] = rule.enabled;
        found = true;
      }
    }
  }
  const config = read('oneshot_admin_ip_spoofing');
  if (config) { next.ipSimulation = ipSimulationSchema.parse({ ...defaultIpSimulation, ...JSON.parse(config) }); found = true; }
  const proxy = read('oneshot_test_active_proxy');
  if (proxy) {
    next.simulator.proxy = proxySchema.parse(JSON.parse(proxy));
    next.simulator.activeIp = next.simulator.proxy.ip;
    found = true;
  }
  return found ? testingSettingsSchema.parse(next) : null;
}
