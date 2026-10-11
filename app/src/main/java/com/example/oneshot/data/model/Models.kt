package com.example.oneshot.data.model

data class Category(
    val id: String,
    val nameAr: String,
    val nameEn: String,
    val descriptionAr: String
)

data class ServiceProduct(
    val sku: String,
    val nameAr: String,
    val nameEn: String,
    val categoryId: String,
    val subCategory: String,
    val amount: Double,
    val currency: String = "SAR",
    val billingCycle: String = "one_time",
    val deliveryDays: Int = 3,
    val revisionsCount: Int = 2,
    val shortDescription: String,
    val detailedDescription: String,
    val deliverables: List<String> = emptyList(),
    val exclusions: List<String> = emptyList(),
    val tag: String? = null
)

data class WalletData(
    val balance: Double = 0.0,
    val gateways: List<String> = listOf("paytabs", "telr"),
    val paymentsEnabled: Boolean = true,
    val entries: List<LedgerEntry> = emptyList(),
    val topups: List<WalletTopup> = emptyList(),
    val orders: List<WalletOrder> = emptyList()
)

data class LedgerEntry(
    val id: String,
    val amount: Double,
    val description: String,
    val createdAt: String,
    val isCredit: Boolean
)

data class WalletTopup(
    val id: String,
    val amount: Double,
    val gateway: String,
    val status: String,
    val createdAt: String
)

data class WalletOrder(
    val id: String,
    val sku: String,
    val title: String,
    val amount: Double,
    val status: String,
    val billingCycle: String,
    val customerName: String,
    val customerEmail: String,
    val createdAt: String
)

enum class PaymentMethod(val id: String, val nameAr: String, val nameEn: String, val tag: String) {
    HOSTED("hosted", "صفحة الدفع المستضافة", "Hosted Checkout", "الأبسط للبدء"),
    FRAMED("framed", "الدفع داخل الموقع", "Embedded Checkout", "داخل المنصة"),
    MANAGED("managed", "النموذج المُدار", "Managed Form", "SAQ A-EP"),
    OWN("own", "نموذجك الخاص", "Own Form · Direct API", "SAQ D-Merchant"),
    PAYLINK("paylink", "روابط الدفع", "PayLinks", "جاهز للمشاركة"),
    INVOICE("invoice", "الفواتير", "Invoice API", "للخدمات والأعمال"),
    RECURRING("recurring", "الاشتراكات", "Tokenization · Recurring", "تجديد تلقائي"),
    MADA_APPLEPAY("mada_applepay", "مدى و Apple Pay", "Mada · Apple Pay", "وسائل دفع")
}

data class PaymentDocument(
    val id: String,
    val title: String,
    val customerName: String,
    val customerEmail: String,
    val amount: Double,
    val method: PaymentMethod,
    val gateway: String,
    val interval: String = "one_time",
    val status: String = "paid", // paid, pending, review, cancelled
    val createdAt: String,
    val expiresAt: String,
    val gatewayUrl: String? = null
)

data class OpenLink(
    val id: String,
    val title: String,
    val minimum: Double,
    val maximum: Double,
    val allowedMethods: List<String>,
    val enabled: Boolean,
    val createdAt: String
)

data class GatewayConfig(
    val paytabsProfileId: String = "104928",
    val paytabsServerKey: String = "S2JNNK...9824",
    val paytabsClientKey: String = "CKJMM...4421",
    val paytabsApiBase: String = "https://secure.paytabs.sa",
    val paytabsStatus: String = "connected", // connected, testing, disabled
    val telrStoreId: String = "28374",
    val telrApiKey: String = "tElR_88...912a",
    val telrTestMode: Boolean = false,
    val telrStatus: String = "connected"
)

data class OperationRecord(
    val id: String,
    val kind: String, // auth_spike, rate_limit, gateway_disconnect, payment_anomaly
    val title: String,
    val summary: String,
    val severity: String, // info, warning, critical
    val unread: Boolean,
    val timestamp: String,
    val merchantId: String = "oneshot-hq"
)

data class ChatMessage(
    val id: String,
    val sender: String, // "user", "assistant"
    val text: String,
    val timestamp: String,
    val attachmentType: String? = null, // "image", "document", "voice"
    val attachmentName: String? = null,
    val toolAction: String? = null,
    val toolResult: String? = null
)

data class PlatformMetrics(
    val totalPaid: Double = 148500.0,
    val paidCount: Int = 184,
    val pendingCount: Int = 12,
    val customersCount: Int = 96
)

data class DailyActivity(
    val day: String,
    val amount: Double
)

// === Merchant CEO Agents & Executive Suite ===

enum class AgentRole(val titleAr: String, val titleEn: String) {
    CEO("الرئيس التنفيذي", "Chief Executive Officer"),
    CFO("المدير المالي", "Chief Financial Officer"),
    CMO("مدير التسويق", "Chief Marketing Officer"),
    COO("مدير العمليات", "Chief Operating Officer")
}

data class CeoAgent(
    val id: String,
    val role: AgentRole,
    val nameAr: String,
    val titleAr: String,
    val description: String,
    val status: String = "active", // active, analyzing, standby
    val capabilities: List<String> = emptyList()
)

data class ExecutiveKpi(
    val title: String,
    val value: String,
    val subtitle: String,
    val isPositive: Boolean = true
)

data class DelegatedTask(
    val id: String,
    val agentId: String,
    val title: String,
    val status: String, // completed, in_progress, pending
    val output: String,
    val createdAt: String
)

// === Admin Full Access Control ===

data class AdminPolicyControl(
    val id: String,
    val title: String,
    val description: String,
    val enabled: Boolean,
    val riskLevel: String // low, medium, high
)
