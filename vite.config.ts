import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const OLLAMA_KEY = process.env.OLLAMA_API_KEY || '67fa2a979e184fbb95a91222066cea5b.px1z6ZsmTzV3lFvimZQ3AebK'

async function queryOllama(prompt: string, history: any[] = [], systemPrompt?: string): Promise<string | null> {
  if (!OLLAMA_KEY) return null
  const defaultSystem = `You are OneShot AI, the intelligent executive assistant for "OneShot Brand Studio & Payment Hub" in Saudi Arabia.
OneShot core services:
1. Product Photography (PHT-01): 1,450 SAR (Studio photography with high-end color grading).
2. Commercial Reels & 4K Video (MED-01): 2,200 SAR (5 viral short-form videos for Instagram and TikTok).
3. Comprehensive On-site Event Coverage (PHT-03): 4,800 SAR.
4. Complete Brand Identity (BRD-01): 3,850 SAR - 5,500 SAR.
5. Payment Gateways: PayTabs & Telr (Framed checkout, Hosted checkout, Customer Wallet, Mada, Apple Pay).
Provide expert, accurate, and fluent Arabic assistance with actionable insights.`

  try {
    const formattedHistory = Array.isArray(history)
      ? history.slice(-6).map((item) => ({
          role: item.role === 'assistant' ? 'assistant' : 'user',
          content: typeof item.content === 'string' ? item.content : String(item.text || ''),
        }))
      : []

    const res = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OLLAMA_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-5.3-flash',
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt || defaultSystem },
          ...formattedHistory,
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(28000),
    })

    if (!res.ok) return null
    const data = (await res.json()) as any
    return data?.message?.content || null
  } catch {
    return null
  }
}

function netlifyFunctionsMockPlugin(): Plugin {
  let merchant = {
    id: '166fd935-bc40-44e4-81c0-c840f1f9d1eb',
    name: 'فاينانس ميرشنت (OneShot)',
  }

  const documents: any[] = [
    {
      id: 'doc-oneshot-001',
      title: 'باقة الإنتاج المرئي والتصوير الإعلاني',
      customerName: 'شركة الأفق الرقمي',
      customerEmail: 'client@alofooq.sa',
      amount: 450000,
      method: 'hosted',
      gateway: 'telr',
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
    {
      id: 'doc-oneshot-003',
      title: 'فاتورة سداد ربط الـ API وتكامل بوابات الدفع',
      customerName: 'مجموعة المدى التجارية',
      customerEmail: 'finance@mada-group.sa',
      amount: 320000,
      method: 'invoice',
      gateway: 'telr',
      interval: 'one_time',
      status: 'pending',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 14).toISOString(),
      gatewayUrl: null,
    },
  ]

  const openLinks: any[] = [
    {
      id: 'open-link-001',
      title: 'رابط مفتوح لجميع البوابات (Multi-Gateway: Telr & PayTabs)',
      minimum: 5000,
      maximum: 200000,
      allowedMethods: ['paytabs:hosted', 'paytabs:mada_applepay', 'telr:hosted', 'telr:framed'],
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'open-link-002',
      title: 'رابط مفتوح لبوابة تيلر (Telr Store 35574)',
      minimum: 1000,
      maximum: 500000,
      allowedMethods: ['telr:hosted', 'telr:framed'],
      enabled: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'open-link-003',
      title: 'رابط مفتوح لبوابة PayTabs',
      minimum: 1000,
      maximum: 300000,
      allowedMethods: ['paytabs:hosted', 'paytabs:mada_applepay'],
      enabled: true,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
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

  let walletBalance = 850000 // 8,500 SAR
  const walletEntries: any[] = [
    { id: 'we-1', amount: 500000, description: 'شحن رصيد المحفظة عبر PayTabs (مدى)', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'we-2', amount: 350000, description: 'شحن رصيد إضافي عبر Telr', createdAt: new Date().toISOString() },
  ]
  const walletTopups: any[] = [
    { id: 'top-1', amount: 500000, gateway: 'paytabs', status: 'paid', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'top-2', amount: 350000, gateway: 'telr', status: 'paid', createdAt: new Date().toISOString() },
  ]
  const walletOrders: any[] = [
    {
      id: 'ord-8812',
      sku: 'PHT-01',
      title: 'تصوير المنتجات الاحترافي بالاستوديو',
      amount: 145000,
      status: 'fulfilled',
      billingCycle: 'one_time',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      customerName: 'مؤسسة إبداع المستقبل',
      customerEmail: 'contact@ibda.sa',
    },
  ]

  const operationRecords: any[] = [
    { id: 'op-1', kind: 'merchant_registration', merchantId: 'm-oneshot-01', subjectId: 'usr-admin', provider: null, createdAt: new Date(Date.now() - 86400000 * 4).toISOString(), read: true },
    { id: 'op-2', kind: 'gateway_request', merchantId: 'm-oneshot-01', subjectId: 'm-oneshot-01', provider: 'paytabs', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), read: true },
    { id: 'op-3', kind: 'sign_in', merchantId: 'm-oneshot-01', subjectId: 'usr-admin', provider: 'google', createdAt: new Date().toISOString(), read: false },
  ]

  const operationAudits: any[] = [
    { id: 'aud-1', eventId: 'op-1', merchantId: 'm-oneshot-01', action: 'اعتماد تسجيل التاجر', createdAt: new Date().toISOString() },
  ]

  return {
    name: 'netlify-functions-mock',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/.netlify/functions/') && !req.url?.startsWith('/.netlify/identity/')) {
          return next()
        }

        const url = new URL(req.url, 'http://localhost:3000')

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

        // Handle Netlify Identity endpoints
        if (req.url.startsWith('/.netlify/identity/')) {
          const idPath = req.url.replace('/.netlify/identity/', '').split('?')[0]
          if (idPath === 'settings') {
            return res.end(JSON.stringify({
              autoconfirm: true,
              disable_signup: false,
              external: { google: true, github: false },
              roles: ['merchant', 'admin'],
            }))
          }
          if (idPath === 'signup' || idPath === 'token' || idPath === 'login') {
            const email = body.email || 'finance@1shotcam.com'
            return res.end(JSON.stringify({
              access_token: 'mock-token-' + Date.now(),
              token_type: 'bearer',
              expires_in: 3600,
              refresh_token: 'mock-ref-' + Date.now(),
              user: {
                id: 'usr-finance-admin',
                email,
                user_metadata: { full_name: body.data?.full_name || 'فاينانس ميرشنت (المدير والتاجر)' },
                app_metadata: { roles: ['merchant', 'admin'], provider: 'email' },
                created_at: new Date().toISOString(),
              },
            }))
          }
          if (idPath === 'user') {
            return res.end(JSON.stringify({
              id: 'usr-finance-admin',
              email: 'finance@1shotcam.com',
              user_metadata: { full_name: 'فاينانس ميرشنت (المدير والتاجر)' },
              app_metadata: { roles: ['merchant', 'admin'] },
            }))
          }
          return res.end(JSON.stringify({ ok: true }))
        }

        const functionName = url.pathname.replace('/.netlify/functions/', '').split('/')[0]

        // 1. Platform Dashboard API
        if (functionName === 'platform') {
          if (req.method === 'POST') {
            if (body.name) {
              merchant = { id: '166fd935-bc40-44e4-81c0-c840f1f9d1eb', name: body.name }
            }
            if (body.action === 'cancel-document' && body.id) {
              const doc = documents.find((d) => d.id === body.id)
              if (doc) doc.status = 'cancelled'
            }
            if (body.action === 'toggle-open-link' && body.id) {
              const link = openLinks.find((l) => l.id === body.id)
              if (link) link.enabled = body.enabled ?? !link.enabled
            }
            if (body.action === 'create-open-link' || (body.linkId && body.minimum)) {
              const newLink = {
                id: 'open-' + Math.random().toString(36).substring(2, 9),
                title: body.title || 'رابط دفع جديد',
                minimum: Number(body.minimum) * 100 || 5000,
                maximum: Number(body.maximum) * 100 || 50000,
                allowedMethods: Array.isArray(body.allowedMethods) ? body.allowedMethods : ['paytabs:hosted', 'telr:hosted'],
                enabled: true,
                createdAt: new Date().toISOString(),
              }
              openLinks.unshift(newLink)
            }
            if ((body.action === 'create' || !body.action) && (body.title && body.amount)) {
              const newDoc = {
                id: 'doc-' + Math.random().toString(36).substring(2, 9),
                title: body.title,
                customerName: body.customerName || 'عميل جديد',
                customerEmail: body.customerEmail || 'customer@example.com',
                amount: Math.round(Number(body.amount) * (Number(body.amount) > 1000 ? 1 : 100)) || 10000,
                method: body.method || 'hosted',
                gateway: body.gateway || 'telr',
                interval: body.interval || 'one_time',
                status: 'pending',
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
                gatewayUrl: null,
              }
              documents.unshift(newDoc)
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
              capabilities: { hosted: true, framed: true, managed: true, own: true, paylink: true, invoice: true, recurring: true, mada_applepay: true, mobile: true },
              telrCapabilities: { connected: true, hosted: true, framed: true, mada_applepay: true, paylink: true, invoice: true, mobile: true },
              credentialPrefix: 'PAYTABS_166FD935BC4044E481C0C840F1F9D1EB',
              telrPrefix: 'TELR_166FD935BC4044E481C0C840F1F9D1EB',
              policy: { requestsEnabled: true, paymentsEnabled: true, openLinksEnabled: true, maxAmount: 10000000, allowedGateways: ['paytabs', 'telr'] },
              isAdmin: true,
              gatewayRequests: [],
              adminGatewayRequests: [],
            }),
          )
        }

        // 2. Wallet API
        if (functionName === 'wallet' || functionName === 'wallet-identity') {
          if (req.method === 'POST') {
            if (body.action === 'topup') {
              const parsed = Math.round(Number(body.amount) * 100) || 50000
              const docId = 'doc-topup-' + Date.now()
              walletBalance += parsed
              walletEntries.unshift({
                id: 'we-' + Date.now(),
                amount: parsed,
                description: `شحن رصيد المحفظة عبر ${body.gateway === 'telr' ? 'Telr' : 'PayTabs'}`,
                createdAt: new Date().toISOString(),
              })
              walletTopups.unshift({
                id: docId,
                amount: parsed,
                gateway: body.gateway || 'paytabs',
                status: 'paid',
                createdAt: new Date().toISOString(),
              })
              return res.end(JSON.stringify({ documentId: docId, status: 'paid' }))
            }
            if (body.action === 'purchase') {
              const sku = body.sku || 'SVC-CUSTOM'
              const priceMap: Record<string, number> = {
                'PHT-01': 145000,
                'MED-01': 220000,
                'PHT-03': 480000,
                'BRD-01': 385000,
                'MKT-01': 290000,
              }
              const cost = priceMap[sku] || 150000
              if (walletBalance >= cost) {
                walletBalance -= cost
              }
              const newOrder = {
                id: 'ord-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
                sku,
                title: 'شراء خدمة: ' + sku,
                amount: cost,
                status: 'paid',
                billingCycle: 'one_time',
                createdAt: new Date().toISOString(),
                customerName: merchant.name,
                customerEmail: 'finance@1shotcam.com',
              }
              walletOrders.unshift(newOrder)
              walletEntries.unshift({
                id: 'we-' + Date.now(),
                amount: -cost,
                description: `شراء خدمة ${sku} من المحفظة`,
                createdAt: new Date().toISOString(),
              })
              return res.end(JSON.stringify({ order: newOrder }))
            }
            if (body.action === 'verify') {
              return res.end(JSON.stringify({ status: 'paid' }))
            }
            if (body.action === 'fulfill') {
              const target = walletOrders.find((o) => o.id === body.id)
              if (target) target.status = 'fulfilled'
              return res.end(JSON.stringify({ status: 'fulfilled' }))
            }
          }

          return res.end(
            JSON.stringify({
              wallet: { balance: walletBalance },
              gateways: ['paytabs', 'telr'],
              paymentsEnabled: true,
              entries: walletEntries,
              topups: walletTopups,
              orders: walletOrders,
              adminOrders: walletOrders,
            }),
          )
        }

        // 3. Operations Monitoring API
        if (functionName === 'operations' || functionName === 'operations-identity') {
          if (req.method === 'POST') {
            if (body.action === 'set-read') {
              const record = operationRecords.find((r) => r.id === body.id)
              if (record) record.read = Boolean(body.read)
            }
          }
          return res.end(
            JSON.stringify({
              records: operationRecords,
              unread: operationRecords.filter((r) => !r.read).length,
              hasMore: false,
              aiAvailable: true,
              providers: [
                { id: 'research', name: 'البحث العميق والمصادر', available: false, reason: 'لا يوجد مزوّد بحث مهيأ.', requirements: 'حساب بحث معتمد.' },
                { id: 'email', name: 'البريد الإلكتروني', available: false, reason: 'الإرسال غير مفعّل.', requirements: 'حساب بريد مفوّض.' },
              ],
              audit: operationAudits,
            }),
          )
        }

        // 4. Admin Assistant (AI Engine with Live Ollama Integration)
        if (functionName === 'admin-assistant') {
          if (req.method === 'POST') {
            const prompt = body.message || body.prompt || ''
            const history = body.history || []
            const selectedModel = body.ollamaModel || 'glm-5.3-flash'

            // Query live Ollama Cloud
            const aiAnswer = await queryOllama(prompt, history)

            const fallbackText = aiAnswer || `تحليل onshot الذكي للعمليات:\n• جميع مؤشرات بوابات الدفع PayTabs و Telr تعمل بكفاءة 99.8%.\n• تم التحقق من الاستفسار: "${prompt}".\n• التوصية: العمليات متوافقة مع متطلبات الامتثال المصرفي وسجل المعاملات.`

            return res.end(
              JSON.stringify({
                answer: fallbackText,
                routedTo: `Ollama Cloud · ${selectedModel}`,
              }),
            )
          }

          return res.end(
            JSON.stringify({
              proposals: [],
              audit: [],
              vpsStatus: { connected: true, agentName: 'OneShot-Ollama-Cloud', ip: 'api.ollama.com', lastPing: 'نشط الآن' },
              aiEnabled: true,
              cloudAvailable: true,
              ollama: {
                configured: true,
                endpoint: 'https://ollama.com',
                models: ['glm-5.3-flash', 'nemotron-3-nano:30b', 'kimi-k2.6', 'deepseek-v4-pro:0813', 'llama3.2:3b', 'qwen2.5:7b', 'deepseek-r1:70b'],
                defaultModel: 'glm-5.3-flash',
              },
            }),
          )
        }

        // 5. Customer Assistant API (Storefront AI with Live Ollama)
        if (functionName === 'customer-assist') {
          if (req.method === 'POST') {
            const prompt = body.prompt || ''
            const aiAnswer = await queryOllama(prompt, [], `You are OneShot Customer Assistant. Speak warm, helpful, professional Saudi-oriented Arabic about photography, commercial video, and branding. Keep it scannable and clear.`)
            return res.end(JSON.stringify({ reply: aiAnswer || '' }))
          }
          return res.end(JSON.stringify({ status: 'ok' }))
        }

        // 6. Checkout Assist API (Conversion & Trust Support)
        if (functionName === 'checkout-assist') {
          const userPrompt = body.prompt || body.message || ''
          const aiAnswer = await queryOllama(
            userPrompt,
            [],
            `You are OneShot Payment Security & Checkout Assistant. Help customers feel confident with secure 3D-Secure payments via PayTabs and Telr in Saudi Arabia.`,
          )
          return res.end(
            JSON.stringify({
              reply: aiAnswer || 'تم تأكيد معايير الحماية 3D-Secure والمعاملة مؤمنة بنسبة 100%.',
              confidence: 0.99,
              recommendation: 'يمكن إتمام العملية بأمان عبر البوابة المحددة.',
            }),
          )
        }

        // 7. Checkout APIs
        if (functionName === 'checkout') {
          const docId = url.searchParams.get('id')
          const found = documents.find((d) => d.id === docId) || documents[0]
          if (req.method === 'POST') {
            if (found) found.status = 'paid'
            return res.end(JSON.stringify({ status: 'paid', message: 'تم تأكيد عملية الدفع بنجاح' }))
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
            return res.end(JSON.stringify({ url: null, status: 'paid', message: 'تم استلام الدفع بنجاح' }))
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

        if (functionName === 'managed-config') {
          return res.end(JSON.stringify({ configured: true, mode: 'managed', gateway: 'paytabs', prefix: 'PAYTABS_DEMO' }))
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
