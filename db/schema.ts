import { pgTable, text, uuid, integer, timestamp, boolean, uniqueIndex, jsonb, index, primaryKey, bigint, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { OperationKind } from '../shared/operations.js';
import type { PaymentPolicy } from '../shared/policy.js';
import type { AssistantAction } from '../shared/admin-assistant.js';
import type { TestingSettings } from '../shared/testing-workspace.js';

export const testingWorkspaces = pgTable('testing_workspaces', {
  ownerId: text('owner_id').primaryKey(),
  settings: jsonb().$type<TestingSettings>().notNull(),
  version: integer().notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const customerProfiles = pgTable('customer_profiles', {
  ownerId: text('owner_id').primaryKey(),
  email: text().notNull(),
  fullName: text('full_name').notNull(),
  phone: text().notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const voiceTranscripts = pgTable('voice_transcripts', {
  ownerId: text('owner_id').notNull(),
  id: uuid().notNull(),
  title: text().notNull(),
  transcriptText: text('transcript_text').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  primaryKey({ columns: [table.ownerId, table.id] }),
  index('voice_transcripts_owner_created').on(table.ownerId, table.createdAt),
]);

export const merchants = pgTable('merchants', {
  id: uuid().defaultRandom().primaryKey(),
  ownerId: text('owner_id').notNull().unique(),
  name: text().notNull(),
  accountId: text('account_id').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const wallets = pgTable('customer_wallets', {
  id: uuid().defaultRandom().primaryKey(),
  ownerId: text('owner_id').notNull().unique(),
  balance: bigint({ mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [check('wallet_balance_nonnegative', sql`${table.balance} >= 0 AND ${table.balance} <= 9007199254740991`)]);

export const siteGateways = pgTable('site_payment_gateways', {
  gateway: text().primaryKey(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  adminId: text('admin_id').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const documents = pgTable('payment_documents', {
  id: uuid().defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  title: text().notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  amount: integer().notNull(),
  method: text().notNull(),
  gateway: text().notNull().default('paytabs'),
  openLinkId: uuid('open_link_id').references(() => openLinks.id),
  publicRequestId: uuid('public_request_id').unique(),
  interval: text().notNull().default('monthly'),
  status: text().notNull().default('pending'),
  gatewayUrl: text('gateway_url'),
  gatewayId: text('gateway_id'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [uniqueIndex('documents_merchant_created').on(table.merchantId, table.id)]);

export const attempts = pgTable('payment_attempts', {
  id: uuid().defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  period: text().notNull().unique(),
  amount: integer().notNull(),
  status: text().notNull().default('processing'),
  reference: text().unique(),
  gatewayUrl: text('gateway_url'),
  consent: boolean().notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const walletTopups = pgTable('wallet_topups', {
  documentId: uuid('document_id').primaryKey().references(() => documents.id),
  walletId: uuid('wallet_id').notNull().references(() => wallets.id),
  requestId: uuid('request_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [uniqueIndex('wallet_topup_request').on(table.walletId, table.requestId)]);

export const serviceOrders = pgTable('wallet_service_orders', {
  id: uuid().defaultRandom().primaryKey(),
  walletId: uuid('wallet_id').notNull().references(() => wallets.id),
  requestId: uuid('request_id').notNull(),
  sku: text().notNull(),
  title: text().notNull(),
  customerName: text('customer_name').notNull().default(''),
  customerEmail: text('customer_email').notNull().default(''),
  amount: integer().notNull(),
  billingCycle: text('billing_cycle').notNull(),
  status: text().notNull().default('paid'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [uniqueIndex('wallet_order_request').on(table.walletId, table.requestId)]);

export const walletEntries = pgTable('wallet_entries', {
  id: uuid().defaultRandom().primaryKey(),
  walletId: uuid('wallet_id').notNull().references(() => wallets.id),
  amount: integer().notNull(),
  description: text().notNull(),
  documentId: uuid('document_id').unique().references(() => documents.id),
  orderId: uuid('order_id').unique().references(() => serviceOrders.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [index('wallet_entries_owner_created').on(table.walletId, table.createdAt), check('wallet_entry_direction', sql`(${table.amount} > 0 AND ${table.documentId} IS NOT NULL AND ${table.orderId} IS NULL) OR (${table.amount} < 0 AND ${table.orderId} IS NOT NULL AND ${table.documentId} IS NULL)`)]);

export const subscriptions = pgTable('subscriptions', {
  id: uuid().defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().unique().references(() => documents.id),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  encryptedToken: text('encrypted_token').notNull(),
  initialReference: text('initial_reference').notNull(),
  status: text().notNull().default('active'),
  nextChargeAt: timestamp('next_charge_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const rateLimits = pgTable('payment_rate_limits', {
  key: text().primaryKey(),
  count: integer().notNull().default(1),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const openLinks = pgTable('open_payment_links', {
  id: uuid().defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  title: text().notNull(),
  minimum: integer().notNull(),
  maximum: integer().notNull(),
  allowedMethods: jsonb('allowed_methods').$type<string[]>().notNull(),
  enabled: boolean().notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const platformSettings = pgTable('platform_settings', {
  id: text().primaryKey(),
  policy: jsonb().$type<PaymentPolicy>().notNull(),
  version: integer().notNull().default(1),
  updatedBy: text('updated_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const settingsAudit = pgTable('platform_settings_audit', {
  id: uuid().defaultRandom().primaryKey(),
  actorId: text('actor_id').notNull(),
  policy: jsonb().$type<PaymentPolicy>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const gatewayRequests = pgTable('gateway_connection_requests', {
  id: uuid().defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  gateway: text().notNull(), // 'paytabs' | 'telr' | etc.
  status: text().notNull().default('pending'), // 'pending' | 'configured' | 'rejected'
  variables: jsonb().$type<Record<string, string>>().notNull(),
  notes: text(),
  submittedBy: text('submitted_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const assistantActions = pgTable('admin_assistant_actions', {
  id: uuid().defaultRandom().primaryKey(),
  actorId: text('actor_id').notNull(),
  action: jsonb().$type<AssistantAction>().notNull(),
  previous: jsonb().$type<Record<string, unknown>>().notNull(),
  status: text().notNull().default('pending'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

export const operationsEvents = pgTable('operations_events', {
  id: uuid().defaultRandom().primaryKey(),
  sourceKey: text('source_key').notNull().unique(),
  kind: text().$type<OperationKind>().notNull(),
  merchantId: uuid('merchant_id').references(() => merchants.id),
  subjectId: text('subject_id').notNull(),
  provider: text(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [index('operations_events_created').on(table.createdAt, table.id), index('operations_events_tenant_kind').on(table.merchantId, table.kind)]);

export const operationsReceipts = pgTable('operations_receipts', {
  eventId: uuid('event_id').notNull().references(() => operationsEvents.id),
  actorId: text('actor_id').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [primaryKey({ columns: [table.eventId, table.actorId] })]);

export const operationsRequests = pgTable('operations_connection_requests', {
  id: uuid().defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  actorId: text('actor_id').notNull(),
  status: text().notNull().default('pending_setup'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const operationsAudit = pgTable('operations_audit', {
  id: uuid().defaultRandom().primaryKey(),
  actorId: text('actor_id').notNull(),
  eventId: uuid('event_id').references(() => operationsEvents.id),
  merchantId: uuid('merchant_id').references(() => merchants.id),
  action: text().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [index('operations_audit_actor_created').on(table.actorId, table.createdAt)]);

/**
 * ترخيص طبقة الذكاء الاصطناعي لكل مستخدم (بمفتاح هوية Netlify).
 * الافتراضي: tier-1، و tier-x ممنوعة حتى تُمنح صراحةً من الإدارة.
 * لا تُقرأ هذه القيم من المتصفح أبداً — القرار على السيرفر.
 */
export const aiEntitlements = pgTable('ai_tier_entitlements', {
  ownerId: text('owner_id').primaryKey(),
  tier: text().notNull().default('tier-1'),
  tierX: boolean('tier_x').notNull().default(false),
  grantedBy: text('granted_by'),
  note: text(),
  bannedAt: timestamp('banned_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [check('ai_tier_valid', sql`${table.tier} in ('tier-1', 'tier-2', 'tier-3')`)]);

/** ترخيص كادر ذكاء اصطناعي لكل مستخدم: صلاحية **لكل خدمة** لا مفتاح عام واحد. */
export const aiStaffGrants = pgTable('ai_staff_grants', {
  ownerId: text('owner_id').notNull(),
  staffId: text('staff_id').notNull(),
  grantedBy: text('granted_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [primaryKey({ columns: [table.ownerId, table.staffId] })]);

/** سجل استهلاك لكل سؤال: أي طبقة/موديل استُخدم لحساب أي مستخدم (أساس التسعير بالاستخدام). */
export const aiUsage = pgTable('ai_usage_events', {
  id: uuid().defaultRandom().primaryKey(),
  ownerId: text('owner_id').notNull(),
  tier: text().notNull(),
  modelId: text('model_id').notNull(),
  staffId: text('staff_id'),
  outcome: text().notNull().default('ok'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [index('ai_usage_owner_created').on(table.ownerId, table.createdAt)]);

/** بطاقة محفوظة عبر البوابة (Card on File): توكن البطاقة مشفَّرًا — لا رقم بطاقة ولا CSC عندنا. */
export const savedCards = pgTable('saved_cards', {
  id: uuid().defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  email: text().notNull(),
  gateway: text().notNull(),
  encryptedToken: text('encrypted_token').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [uniqueIndex('saved_cards_merchant_email_gateway').on(table.merchantId, table.email, table.gateway)]);

/** ما يرسله مستلم Webhooks كما وصل، للسجل والمطابقة فقط — الحالة الحيّة تُقرأ من البوابة لا من هنا. */
export const gatewayEvents = pgTable('gateway_events', {
  id: uuid().defaultRandom().primaryKey(),
  gateway: text().notNull(),
  event: text().notNull(),
  reference: text(),
  payload: jsonb().notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [index('gateway_events_received').on(table.receivedAt)]);

/** سجل نوع الحساب عند التسجيل (تاجر أو مسوّق) وحالة اعتماد الإدارة لحسابات المسوّقين. */
export const accountRegistrations = pgTable('account_registrations', {
  id: uuid().defaultRandom().primaryKey(),
  ownerId: text('owner_id').notNull().unique(),
  email: text().notNull(),
  fullName: text('full_name').notNull(),
  role: text().notNull().default('merchant'), // 'merchant' | 'marketer'
  status: text().notNull().default('approved'), // 'pending' | 'approved' | 'rejected'
  referralCode: text('referral_code').unique(),
  commissionRate: integer('commission_rate').notNull().default(10),
  notes: text(),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  check('account_registration_role_valid', sql`${table.role} in ('merchant', 'marketer', 'loader', 'admin')`),
  check('account_registration_status_valid', sql`${table.status} in ('pending', 'approved', 'rejected')`),
  index('account_registrations_role_status').on(table.role, table.status),
]);

/** حملات وروابط الإحالة الخاصة بالمسوّقين المعتمدين. */
export const marketerCampaigns = pgTable('marketer_campaigns', {
  id: uuid().defaultRandom().primaryKey(),
  marketerId: uuid('marketer_id').notNull().references(() => accountRegistrations.id),
  ownerId: text('owner_id').notNull(),
  title: text().notNull(),
  targetProductSku: text('target_product_sku').notNull().default('ALL'),
  utmCampaign: text('utm_campaign').notNull(),
  channel: text().notNull().default('social'),
  clicks: integer().notNull().default(0),
  conversions: integer().notNull().default(0),
  earnedCommission: integer('earned_commission').notNull().default(0),
  enabled: boolean().notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [index('marketer_campaigns_owner').on(table.ownerId, table.createdAt)]);

/** وثيقة إعدادات لوحة التحكم المركزية (صف واحد id='global'). */
export const adminConfig = pgTable('admin_config', {
  id: text().primaryKey(),
  config: jsonb().notNull(),
  version: integer().notNull().default(1),
  updatedBy: text('updated_by').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/** بلاغات واقتراحات مستخدمي فترة البيتا (من الزر العائم). */
export const betaFeedback = pgTable('beta_feedback', {
  id: uuid().defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  category: text().notNull(), // 'bug' | 'feature' | 'rating'
  page: text().notNull().default(''),
  modelId: text('model_id'),
  message: text().notNull(),
  rewarded: boolean().notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [index('beta_feedback_created').on(table.createdAt)]);

/** سياقات عملاء الـ VIP وقيودهم الإلزامية (System Guardrails). */
export const clientContexts = pgTable('client_contexts', {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  nameEn: text('name_en').notNull().default(''),
  title: text().notNull().default(''),
  guardrails: jsonb().$type<string[]>().notNull().default([]),
  projects: jsonb().$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

