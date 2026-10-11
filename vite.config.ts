import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

function netlifyFunctionsMockPlugin(): Plugin {
  let merchant = { id: 'm-oneshot-01', name: 'OneShot Studio' }
  const documents: any[] = [
    {
      id: 'doc-oneshot-001',
      title: 'باقة الإنتاج المرئي والتصوير الإعلاني',
      customerName: 'شركة الأفق الرقمي',
      customerEmail: 'client@alofooq.sa',
      amount: 450000,
      method: 'hosted',
      gateway: 'paytabs',
      interval: 'one_time',
      status: 'paid',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      gatewayUrl: null,
    },
    {
      id: 'doc-oneshot-002',
      title: 'اشتراك إدارة الحملات والتسويق الرقمي',
      customerName: 'مؤسسة إبداع المستقبل',
      customerEmail: 'contact@ibda.sa',
      amount: 250000,
      method: 'recurring',
      gateway: 'paytabs',
      interval: 'monthly',
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 25).toISOString(),
      gatewayUrl: null,
    },
  ]
  const openLinks: any[] = [
    {
      id: 'open-link-001',
      title: 'رابط دفع عام - خدمات التصوير الفوري',
      minimum: 5000,
      maximum: 200000,
      allowedMethods: ['hosted', 'mada_applepay'],
      enabled: true,
      createdAt: new Date().toISOString(),
    },
  ]
  const subscriptions: any[] = [
    {
      id: 'sub-001',
      documentId: 'doc-oneshot-002',
      status: 'active',
      nextChargeAt: new Date(Date.now() + 86400000 * 25).toISOString(),
    },
  ]
  const attempts: any[] = [
    {
      id: 'att-001',
      documentId: 'doc-oneshot-001',
      amount: 450000,
      reference: 'TXN-998811',
      status: 'paid',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ]

  let walletBalance = 850000

  return {
    name: 'netlify-functions-mock',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/.netlify/functions/')) {
          return next()
        }

        const url = new URL(req.url, 'http://localhost:3000')
        const functionName = url.pathname.replace('/.netlify/functions/', '').split('/')[0]

        let body: any = {}
        if (req.method === 'POST') {
          try {
            const chunks: Buffer[] = []
            for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
            const raw = Buffer.concat(chunks).toString('utf8')
            if (raw) body = JSON.parse(raw)
          } catch {
            // ignore parse error
          }
        }

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')

        if (functionName === 'platform') {
          if (req.method === 'POST') {
            if (body.name) {
              merchant = { id: 'm-oneshot-01', name: body.name }
            }
            if (body.title && body.amount) {
              const newDoc = {
                id: 'doc-' + Math.random().toString(36).substring(2, 9),
                title: body.title,
                customerName: body.customerName || 'عميل جديد',
                customerEmail: body.customerEmail || 'customer@example.com',
                amount: Number(body.amount) || 10000,
                method: body.method || 'hosted',
                gateway: body.gateway || 'paytabs',
                interval: body.interval || 'one_time',
                status: 'pending',
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
                gatewayUrl: null,
              }
              documents.unshift(newDoc)
            }
            if (body.linkId && body.minimum) {
              const newLink = {
                id: 'open-' + Math.random().toString(36).substring(2, 9),
                title: body.title || 'رابط دفع جديد',
                minimum: Number(body.minimum) || 5000,
                maximum: Number(body.maximum) || 50000,
                allowedMethods: body.allowedMethods || ['hosted'],
                enabled: true,
                createdAt: new Date().toISOString(),
              }
              openLinks.unshift(newLink)
            }
          }

          return res.end(
            JSON.stringify({
              merchant,
              documents,
              subscriptions,
              attempts,
              openLinks,
              metrics: {
                paidCount: documents.filter((d) => d.status === 'paid').length + attempts.length,
                totalPaid: 700000,
                pendingCount: documents.filter((d) => d.status === 'pending').length,
                customers: 12,
              },
              daily: [
                { day: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], amount: 150000 },
                { day: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], amount: 450000 },
                { day: new Date(Date.now() - 86400000).toISOString().split('T')[0], amount: 100000 },
              ],
              capabilities: { hosted: true, framed: true, managed: true, mada_applepay: true },
              isAdmin: true,
              gatewayRequests: [],
            }),
          )
        }

        if (functionName === 'managed-config') {
          return res.end(
            JSON.stringify({
              configured: true,
              mode: 'managed',
              gateway: 'paytabs',
              prefix: 'PAYTABS_DEMO',
            }),
          )
        }

        if (functionName === 'checkout') {
          const docId = url.searchParams.get('id')
          const found = documents.find((d) => d.id === docId) || documents[0]
          if (req.method === 'POST') {
            return res.end(
              JSON.stringify({
                status: 'paid',
                message: 'تم تأكيد عملية الدفع بنجاح',
              }),
            )
          }
          return res.end(
            JSON.stringify({
              document: {
                id: found?.id || 'demo-checkout',
                title: found?.title || 'خدمات استوديو OneShot',
                amount: found?.amount || 25000,
                gateway: found?.gateway || 'paytabs',
                method: found?.method || 'hosted',
                interval: found?.interval || 'one_time',
                status: found?.status || 'pending',
                expiresAt: found?.expiresAt || new Date(Date.now() + 86400000).toISOString(),
                merchantName: merchant.name,
              },
              available: true,
              gatewayUrl: null,
              aiEnabled: true,
            }),
          )
        }

        if (functionName === 'open-checkout') {
          const linkId = url.searchParams.get('id')
          const found = openLinks.find((l) => l.id === linkId) || openLinks[0]
          if (req.method === 'POST') {
            return res.end(
              JSON.stringify({
                url: null,
                status: 'paid',
                message: 'تم استلام الدفع بنجاح',
              }),
            )
          }
          return res.end(
            JSON.stringify({
              link: {
                id: found?.id || 'open-link-001',
                title: found?.title || 'دفع فوري - استوديو ون شوت',
                minimum: found?.minimum || 1000,
                maximum: found?.maximum || 100000,
                merchantName: merchant.name,
              },
              choices: ['hosted', 'mada_applepay'],
              enabled: true,
              aiEnabled: true,
            }),
          )
        }

        if (functionName === 'wallet' || functionName === 'wallet-identity') {
          if (req.method === 'POST' && body.action === 'topup') {
            walletBalance += Number(body.amount) || 10000
          }
          return res.end(
            JSON.stringify({
              wallet: {
                id: 'wallet-001',
                balance: walletBalance,
                currency: 'SAR',
                status: 'active',
              },
              transactions: [
                { id: 'tx-01', amount: 450000, type: 'credit', description: 'إيداع من عميل - إنتاج مرئي', createdAt: new Date().toISOString() },
                { id: 'tx-02', amount: -25000, type: 'debit', description: 'رسوم تشغيل بوابة PayTabs', createdAt: new Date(Date.now() - 3600000).toISOString() },
              ],
            }),
          )
        }

        if (functionName === 'operations' || functionName === 'operations-identity') {
          return res.end(
            JSON.stringify({
              status: 'operational',
              gateways: {
                paytabs: { status: 'healthy', latency: '42ms', uptime: '99.98%' },
                telr: { status: 'healthy', latency: '58ms', uptime: '99.95%' },
              },
              activeAudits: [],
              events: [
                { id: 'ev-1', message: 'PayTabs Gateway token handshake validated', time: new Date().toISOString() },
                { id: 'ev-2', message: 'OneShot Brand Studio Operations Center active', time: new Date(Date.now() - 3600000).toISOString() },
              ],
            }),
          )
        }

        if (functionName === 'checkout-assist' || functionName === 'admin-assistant') {
          const userPrompt = body.prompt || body.message || 'مرحباً، كيف يمكنني مساعدتك؟'
          return res.end(
            JSON.stringify({
              reply: `تم استلام استفسارك: "${userPrompt}". تم فحص معايير العملية عبر خوارزميات OneShot والأنظمة متوافقة بنسبة 100%.`,
              confidence: 0.98,
              recommendation: 'يمكن إتمام العملية بأمان عبر البوابة المحددة.',
            }),
          )
        }

        return res.end(JSON.stringify({ success: true, status: 'ok' }))
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), netlifyFunctionsMockPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
})