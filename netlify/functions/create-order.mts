export default async () => Response.json({ error: 'تم إيقاف مسار الدفع المشترك؛ استخدم مساحة التاجر المستقلة.' }, { status: 410, headers: { 'Cache-Control': 'no-store' } });
