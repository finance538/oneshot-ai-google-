import { and, desc, eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { voiceTranscripts } from '../../db/schema.js';
import { failure, HttpError, identifier, jsonBody, owner, reply, sameOrigin, text, throttle } from '../lib/platform.js';

export default async (req: Request) => {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') throw new HttpError(405, 'طريقة الطلب غير مدعومة.');
    if (req.method === 'POST') sameOrigin(req);
    const user = await owner();
    const db = database();
    if (req.method === 'GET') {
      const transcripts = await db.select().from(voiceTranscripts)
        .where(eq(voiceTranscripts.ownerId, user.id)).orderBy(desc(voiceTranscripts.createdAt)).limit(100);
      return reply({ transcripts });
    }
    await throttle(`voice-transcripts:${user.id}`, 120);
    const body = await jsonBody(req, 200_000);
    const id = identifier(body.id);
    if (body.action === 'delete') {
      await db.delete(voiceTranscripts).where(and(eq(voiceTranscripts.ownerId, user.id), eq(voiceTranscripts.id, id)));
      return reply({ deleted: true });
    }
    if (body.action !== 'save') throw new HttpError(400, 'الإجراء غير مدعوم.');
    const title = text(body.title, 100);
    const transcriptText = text(body.transcriptText, 30000);
    const durationSeconds = body.durationSeconds;
    if (typeof durationSeconds !== 'number' || !Number.isInteger(durationSeconds) || durationSeconds < 0 || durationSeconds > 180) {
      throw new HttpError(400, 'مدة التسجيل غير صالحة.');
    }
    await db.insert(voiceTranscripts).values({ ownerId: user.id, id, title, transcriptText, durationSeconds })
      .onConflictDoNothing();
    return reply({ saved: true });
  } catch (error) { return failure(error); }
};
