import type { Context } from '@netlify/functions';
import { and, eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { documents, merchants, openLinks } from '../../db/schema.js';
import { cents, email, failure, HttpError, identifier, jsonBody, reply, sameOrigin, text, throttle } from '../lib/platform.js';
import { enabledCapabilities, settings } from '../lib/policy.js';
import { gateways, openLinkMethods, type Gateway } from '../../shared/policy.js';

export default async (req: Request, context: Context) => {
  try {
    if (!['GET', 'POST'].includes(req.method)) return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    const db = database();
    const id = identifier(new URL(req.url).searchParams.get('id'));
    const [row] = await db.select().from(openLinks).innerJoin(merchants, eq(openLinks.merchantId, merchants.id)).where(eq(openLinks.id, id));
    if (!row) throw new HttpError(404, 'رابط الدفع غير موجود.');
    const link = row.open_payment_links;
    const { policy } = await settings();
    const available = Object.fromEntries(gateways.map(gateway => [gateway, enabledCapabilities(link.merchantId, gateway, policy)])) as Record<Gateway, Record<string, boolean>>;
    const choices = link.allowedMethods.filter(value => {
      const [gateway, method] = value.split(':');
      return gateways.includes(gateway as Gateway) && openLinkMethods.includes(method as typeof openLinkMethods[number]) && available[gateway as Gateway][method];
    });
    const enabled = link.enabled && policy.paymentsEnabled && policy.requestsEnabled && policy.openLinksEnabled;
    if (req.method === 'GET') return reply({ link: { id: link.id, title: link.title, minimum: link.minimum, maximum: link.maximum, merchantName: row.merchants.name }, choices: enabled ? choices : [], enabled, aiEnabled: enabled && policy.aiEnabled });
    sameOrigin(req);
    await throttle(`open-link:${context.ip || 'unknown'}:${id}`, 20);
    if (!enabled || !policy.requestsEnabled) throw new HttpError(409, 'هذه الميزة متوقفة بواسطة مسؤول المنصة.');
    const body = await jsonBody(req);
    const requestId = identifier(body.requestId);
    const [existing] = await db.select({ id: documents.id }).from(documents).where(and(eq(documents.publicRequestId, requestId), eq(documents.openLinkId, id)));
    if (existing) return reply({ id: existing.id });
    const choice = text(body.choice, 50);
    if (!choices.includes(choice)) throw new HttpError(409, 'طريقة الدفع غير مهيأة لهذا التاجر.');
    const amount = cents(body.amount);
    if (amount < link.minimum || amount > link.maximum) throw new HttpError(400, 'المبلغ خارج حدود الرابط.');
    const [gateway, method] = choice.split(':');
    const [document] = await db.insert(documents).values({
      merchantId: link.merchantId, openLinkId: link.id, publicRequestId: requestId,
      title: link.title, customerName: text(body.customerName, 100), customerEmail: email(body.customerEmail),
      amount, gateway, method, expiresAt: new Date(Date.now() + 86400000),
    }).onConflictDoNothing().returning({ id: documents.id });
    if (document) return reply(document, 201);
    const [retry] = await db.select({ id: documents.id }).from(documents).where(and(eq(documents.publicRequestId, requestId), eq(documents.openLinkId, id)));
    if (!retry) throw new HttpError(409, 'تعذر إنشاء الطلب. حاول لاحقاً.');
    return reply(retry);
  } catch (error) { return failure(error); }
};
