// netlify/lib/tier-grant.ts
// توقيع ترخيص المستوى الرابع X — مشترك بين سيرفر Netlify وبوابة السيرفر.
//
// الفكرة: لا سر جديد ولا متغيّر بيئة إضافي. المفتاح مشتق من توكن البوابة نفسه
// (`ONESHOT_VPS_AGENT_TOKEN`) الذي يملكه الطرفان، والتوقيع مربوط بالموديل والطابع
// الزمني، فحتى لو تسرّب التوكن وحده لا يمكن تشغيل نماذج abliterated بلا توقيع لحظي
// صادر من مسار مخوّل (بعد التحقق من ترخيص المستخدم في قاعدة البيانات).
//
// مرآة التنفيذ في البوابة: /root/oneshot-agent-gateway/tier-guard.mjs

import { createHash, createHmac } from 'node:crypto';

/** مفتاح التوقيع المشتق من توكن البوابة. */
export function tierGrantKey(token: string): Buffer {
  return createHash('sha256').update(`${token}:ai-tier-grant`).digest();
}

/** توقيع `modelId|timestamp` بصيغة hex. */
export function grantSignature(modelId: string, timestamp: number, token: string): string {
  return createHmac('sha256', tierGrantKey(token)).update(`${modelId}|${timestamp}`).digest('hex');
}

/** التوقيع بتوكن البوابة من متغيّرات البيئة (واجهة الاستخدام في الدوال). */
export function tierGrantSignature(modelId: string, timestamp: number): string {
  return grantSignature(modelId, timestamp, String(process.env.ONESHOT_VPS_AGENT_TOKEN || ''));
}
