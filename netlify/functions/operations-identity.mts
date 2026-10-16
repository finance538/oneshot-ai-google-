import { randomUUID } from 'node:crypto';
import type { Config, UserLoginEvent, UserSignupEvent } from '@netlify/functions';
import { eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { merchants } from '../../db/schema.js';
import { previewOnly } from '../../shared/operations.js';
import { captureOperation } from '../lib/operations.js';

async function record(event: UserLoginEvent | UserSignupEvent, kind: 'sign_in' | 'customer_registration') {
  if (!previewOnly(process.env.CONTEXT)) return;
  try {
    const userId = event.user.id;
    const timestamp = kind === 'customer_registration' ? event.user.createdAt : event.user.lastSignInAt;
    const parsed = timestamp ? new Date(timestamp) : null;
    const createdAt = parsed && Number.isFinite(parsed.getTime()) && parsed.getTime() <= Date.now() + 60000 ? parsed : new Date();
    const sourceKey = kind === 'customer_registration' ? `identity-signup:${userId}` : `identity-login:${userId}:${timestamp && parsed && Number.isFinite(parsed.getTime()) ? createdAt.toISOString() : randomUUID()}`;
    await database().transaction(async tx => {
      const [merchant] = await tx.select({ id: merchants.id }).from(merchants).where(eq(merchants.ownerId, userId));
      await captureOperation(tx, { sourceKey, kind, subjectId: userId, merchantId: merchant?.id ?? null, createdAt });
    });
  } catch {
    console.error('Preview operations Identity event capture failed; authentication was not modified.');
  }
}

export default {
  async userSignup(event: UserSignupEvent) { await record(event, 'customer_registration'); },
  async userLogin(event: UserLoginEvent) { await record(event, 'sign_in'); },
};

export const config: Config = { background: true };
