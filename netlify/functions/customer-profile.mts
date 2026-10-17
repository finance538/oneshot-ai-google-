import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/netlify-db';
import { customerProfiles } from '../../db/schema.js';
import { failure, HttpError, jsonBody, owner, reply, sameOrigin, text } from '../lib/platform.js';

export default async (req: Request) => {
  try {
    if (!['GET', 'POST'].includes(req.method)) return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    const user = await owner();
    if (!user.confirmedAt || !user.email) throw new HttpError(403, 'أكّد بريدك الإلكتروني للمتابعة.');
    const db = drizzle();
    if (req.method === 'POST') {
      sameOrigin(req);
      const body = await jsonBody(req, 2000);
      const fullName = text(body.fullName, 100);
      const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
      if (phone && !/^[+\d\s()-]{6,30}$/.test(phone)) throw new HttpError(400, 'رقم الهاتف غير صالح.');
      const [profile] = await db.insert(customerProfiles).values({
        ownerId: user.id, email: user.email, fullName, phone,
      }).onConflictDoUpdate({ target: customerProfiles.ownerId, set: {
        email: user.email, fullName, phone, updatedAt: new Date(),
      } }).returning();
      return reply({ profile });
    }
    // Identity owns credentials. Only the verified session chooses the profile owner.
    const name = user.userMetadata?.full_name;
    await db.insert(customerProfiles).values({
      ownerId: user.id, email: user.email,
      fullName: (typeof name === 'string' ? name : user.name || '').trim().slice(0, 100),
    }).onConflictDoUpdate({ target: customerProfiles.ownerId, set: { email: user.email } });
    const [profile] = await db.select().from(customerProfiles).where(eq(customerProfiles.ownerId, user.id));
    return reply({ profile });
  } catch (error) { return failure(error); }
};
