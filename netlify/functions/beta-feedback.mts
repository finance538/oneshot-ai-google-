// netlify/functions/beta-feedback.mts
// نقطة استقبال بلاغات واقتراحات مستخدمي البيتا (من الزر العائم).
// يُحفظ البلاغ في جدول اللوحة المركزية، ويُنسخ لاحقاً إلى support@1shotcam.com.

import { database } from '../../db/index.js';
import { betaFeedback } from '../../db/schema.js';
import { failure, jsonBody, owner, reply, sameOrigin, text, throttle } from '../lib/platform.js';

const CATEGORIES = ['bug', 'feature', 'rating'] as const;

export default async (req: Request) => {
  try {
    if (req.method !== 'POST') return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    sameOrigin(req);
    const user = await owner();
    await throttle(`feedback:${user.id}`, 20);
    const body = await jsonBody(req);
    const category = body.category;
    if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) return reply({ error: 'اختر تصنيفاً صحيحاً.' }, 400);
    const message = text(body.message, 2000);
    await database().insert(betaFeedback).values({
      userId: user.id,
      category: category as (typeof CATEGORIES)[number],
      page: typeof body.page === 'string' ? body.page.slice(0, 200) : '',
      modelId: typeof body.modelId === 'string' ? body.modelId.slice(0, 120) : null,
      message,
    });
    return reply({ ok: true });
  } catch (error) {
    return failure(error);
  }
};
