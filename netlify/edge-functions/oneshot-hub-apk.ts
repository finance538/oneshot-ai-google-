// يخدم ملف الـAPK من دومين الموقع مباشرة (بدون تحويل إلى GitHub)
const UPSTREAM =
  "https://github.com/finance538/oneshot-ai-google-/releases/latest/download/oneshot-hub.apk";

export default async function handler(_request: Request): Promise<Response> {
  const upstream = await fetch(UPSTREAM, { redirect: "follow" });
  if (!upstream.ok || !upstream.body) {
    return new Response("ملف التطبيق غير متاح مؤقتاً", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "content-type": "application/vnd.android.package-archive",
      'content-disposition': 'attachment; filename="oneshot-hub.apk"',
      "cache-control": "public, max-age=300",
    },
  });
}
