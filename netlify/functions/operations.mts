import { failure, HttpError, isAdmin, jsonBody, owner, reply, sameOrigin, throttle } from '../lib/platform.js';
import { mutateOperations, readOperations, requireOperationsPreview } from '../lib/operations.js';

export default async (req: Request) => {
  try {
    if (!['GET', 'POST'].includes(req.method)) return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    requireOperationsPreview();
    const user = await owner();
    if (!isAdmin(user)) throw new HttpError(403, 'مركز العمليات متاح لمسؤول المنصة فقط.');
    if (req.method === 'GET') {
      const params = new URL(req.url).searchParams;
      const unread = params.get('unread');
      if (unread !== null && unread !== 'true' && unread !== 'false') throw new HttpError(400, 'مرشح التنبيهات غير صالح.');
      await throttle(`operations-read:${user.id}`, 600);
      return reply(await readOperations(user.id, { query: params.get('query') ?? '', kind: params.get('kind') ?? '', merchantId: params.get('merchantId') ?? undefined, offset: params.get('offset') ?? 0, unread: unread === 'true' }));
    }
    sameOrigin(req);
    const body = await jsonBody(req);
    const allowed = body.action === 'set-read' ? ['action', 'id', 'read', 'confirmation'] : ['action', 'merchantId', 'confirmation'];
    if (Object.keys(body).some(key => !allowed.includes(key))) throw new HttpError(400, 'حقول غير مدعومة. لا ترسل أسراراً أو بيانات شخصية.');
    await throttle(`operations-write:${user.id}`, 30);
    return reply(await mutateOperations(user.id, body));
  } catch (error) { return failure(error); }
};
