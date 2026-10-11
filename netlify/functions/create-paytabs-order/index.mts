export default async () => Response.json({ error: 'انتقل إلى منصة التجار لإنشاء رابط دفع آمن ومعزول.' }, { status: 410, headers: { 'Cache-Control': 'no-store' } });
