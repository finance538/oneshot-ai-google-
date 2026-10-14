import type { Context } from '@netlify/functions';
import { eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { documents, merchants } from '../../db/schema.js';
import { cents, email, failure, HttpError, identifier, jsonBody, reply, sameOrigin, text, throttle } from '../lib/platform.js';
import { enabledCapabilities, settings } from '../lib/policy.js';
import { openLinkMethods, type Gateway } from '../../shared/policy.js';
import { publicGateways } from '../lib/wallet.js';

const minimum = Number(process.env.SITE_PAY_MINIMUM || 100);
const maximum = Number(process.env.SITE_PAY_MAXIMUM || 500000);

export default async (req: Request, context: Context) => {
  try {
    if (!['GET', 'POST'].includes(req.method)) return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    const db = database();
    const { policy } = await settings();
    const rows = await publicGateways(policy);
    const choices: string[] = [];
    const owners = new Map<string, string>();
    for (const row of rows) {
      const gateway = row.gateway as Gateway;
      const active = enabledCapabilities(row.merchantId, gateway, policy);
      for (const method of openLinkMethods) if (active[method]) choices.push(`${gateway}:${method}`);
      owners.set(gateway, row.merchantId);
    }
    const name = rows.length
      ? (await db.select({ name: merchants.name }).from(merchants).where(eq(merchants.id, rows[0].merchantId)))[0]?.name
      : undefined;
    const enabled = policy.paymentsEnabled && policy.requestsEnabled && choices.length > 0;
    if (req.method === 'GET') return reply({
      merchantName: name || 'oneShot',
      minimum, maximum,
      choices: enabled ? choices : [],
      gateways: [...owners.keys()],
      enabled,
      adminConnected: rows.length > 0,
    });
    sameOrigin(req);
    await throttle(`site-pay:${context.ip || 'unknown'}`, 20);
    if (!enabled) throw new HttpError(409, 'لا توجد بوابة دفع مفعّلة على الموقع حالياً.');
    const body = await jsonBody(req);
    const requestId = identifier(body.requestId);
    const [existing] = await db.select({ id: documents.id }).from(documents).where(eq(documents.publicRequestId, requestId));
    if (existing) return reply({ id: existing.id });
    const choice = text(body.choice, 50);
    if (!choices.includes(choice)) throw new HttpError(409, 'طريقة الدفع غير مهيأة لهذا التاجر.');
    const amount = cents(body.amount);
    if (amount < minimum || amount > maximum) throw new HttpError(400, `المبلغ يجب أن يكون بين ${minimum / 100} و ${maximum / 100} ريال.`);
    const [gateway, method] = choice.split(':');
    const merchantId = owners.get(gateway);
    if (!merchantId) throw new HttpError(409, 'لا توجد بوابة دفع مفعّلة على الموقع حالياً.');
    const [document] = await db.insert(documents).values({
      merchantId, publicRequestId: requestId,
      title: (name || 'دفع عبر oneShot').slice(0, 120),
      customerName: text(body.customerName, 100), customerEmail: email(body.customerEmail),
      amount, gateway, method, expiresAt: new Date(Date.now() + 86400000),
    }).onConflictDoNothing().returning({ id: documents.id });
    if (document) return reply(document, 201);
    const [retry] = await db.select({ id: documents.id }).from(documents).where(eq(documents.publicRequestId, requestId));
    if (!retry) throw new HttpError(409, 'تعذر إنشاء الطلب. حاول لاحقاً.');
    return reply(retry);
  } catch (error) { return failure(error); }
};
