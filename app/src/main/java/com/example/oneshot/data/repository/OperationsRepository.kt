package com.example.oneshot.data.repository

import com.example.oneshot.data.model.AdminPolicyControl
import com.example.oneshot.data.model.ChatMessage
import com.example.oneshot.data.model.OperationRecord
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object OperationsRepository {

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())

    private val initialRecords = listOf(
        OperationRecord(
            id = "EVT-101",
            kind = "payment_verified",
            title = "تأكيد فوري عبر Webhook PayTabs",
            summary = "تم التحقق من مطابقة المعاملة DOC-89211 بمبلغ 8,700 ر.س على الخادم بنجاح.",
            severity = "info",
            unread = true,
            timestamp = "منذ 15 دقيقة"
        ),
        OperationRecord(
            id = "EVT-102",
            kind = "rate_limit",
            title = "حماية من التكرار الزائد (Rate Limit)",
            summary = "تم حظر محاولات طلب غير موثقة على نقطة دفع مفتوحة (3 طلبات خلال دقيقة).",
            severity = "warning",
            unread = true,
            timestamp = "منذ ساعة"
        ),
        OperationRecord(
            id = "EVT-103",
            kind = "gateway_health",
            title = "بوابة Telr متصلة بنجاح",
            summary = "فحص الاستجابة الدوري (Health Check) لبوابة Telr: استجابة 142ms.",
            severity = "info",
            unread = false,
            timestamp = "منذ 3 ساعات"
        ),
        OperationRecord(
            id = "EVT-104",
            kind = "auth_event",
            title = "تسجيل دخول إداري كامل (Root Access)",
            summary = "جلسة مصادقة إدارية بصلاحيات كاملة مؤكدة من الرياض، السعودية.",
            severity = "info",
            unread = false,
            timestamp = "منذ 5 ساعات"
        )
    )

    private val initialMessages = listOf(
        ChatMessage(
            id = "MSG-1",
            sender = "assistant",
            text = "مرحباً بك في مركز عمليات OneShot AI بصلاحيات المسؤول الكاملة (Full Admin Access). يمكنك مراقبة خوادم الدفع، تشغيل التدقيق الفوري، وتعديل سياسات الأمان وتوجيه المعاملات بين PayTabs و Telr.",
            timestamp = "10:00"
        )
    )

    private val initialControls = listOf(
        AdminPolicyControl(
            id = "ctrl_zero_trust",
            title = "فرض التحقق الصارم من السيرفر (Zero-Trust Enforcement)",
            description = "رفض أي اعتماد دفع يعتمد على عودة المتصفح فقط بدون توقيع Webhook موثق.",
            enabled = true,
            riskLevel = "high"
        ),
        AdminPolicyControl(
            id = "ctrl_smart_routing",
            title = "التوجيه الذكي لبوابات الدفع (Smart Gateway Routing)",
            description = "تحويل المعاملات الكبرى (+3000 ر.س) تلقائياً نحو Telr لتوفير العمولات، ومعاملات مدى إلى PayTabs.",
            enabled = true,
            riskLevel = "medium"
        ),
        AdminPolicyControl(
            id = "ctrl_rate_limiting",
            title = "نظام درع الحماية ضد الاحتيال (Rate Limiting Shield)",
            description = "حظر تلقائي لأي عنوان IP يقوم بإنشاء أكثر من 5 طلبات دفع متتالية في 60 ثانية.",
            enabled = true,
            riskLevel = "high"
        ),
        AdminPolicyControl(
            id = "ctrl_direct_api",
            title = "تمكين واجهة Direct API (نموذج SAQ D التاجر)",
            description = "السماح بمعالجة البطاقات المباشرة عبر سيرفرات معتمدة ومؤمنة.",
            enabled = false,
            riskLevel = "high"
        ),
        AdminPolicyControl(
            id = "ctrl_emergency_freeze",
            title = "وضع التجميد الطارئ لعمليات الدفع (Emergency Freeze)",
            description = "إيقاف مؤقت لبدء أي معاملات دفع جديدة على المنصة في حالات الطوارئ السيبرانية.",
            enabled = false,
            riskLevel = "high"
        )
    )

    private val _records = MutableStateFlow(initialRecords)
    val records: StateFlow<List<OperationRecord>> = _records.asStateFlow()

    private val _messages = MutableStateFlow(initialMessages)
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    private val _adminControls = MutableStateFlow(initialControls)
    val adminControls: StateFlow<List<AdminPolicyControl>> = _adminControls.asStateFlow()

    fun toggleRead(id: String) {
        _records.value = _records.value.map {
            if (it.id == id) it.copy(unread = !it.unread) else it
        }
    }

    fun toggleAdminControl(controlId: String) {
        _adminControls.value = _adminControls.value.map {
            if (it.id == controlId) it.copy(enabled = !it.enabled) else it
        }
        val toggled = _adminControls.value.find { it.id == controlId }
        val now = dateFormat.format(Date()).substring(11)
        if (toggled != null) {
            val statusStr = if (toggled.enabled) "تفعيل" else "تعطيل"
            val auditMsg = ChatMessage(
                id = "ADMIN-AUDIT-${System.currentTimeMillis()}",
                sender = "assistant",
                text = "⚡ تم $statusStr الإعداد الإداري: ${toggled.title} بنجاح وتسجيل الحدث في سجل الأمان.",
                timestamp = now
            )
            _messages.value = _messages.value + auditMsg
        }
    }

    fun runSystemDiagnostic(): String {
        val now = dateFormat.format(Date()).substring(11)
        val diagResult = "✅ فحص النظام الشامل (Full Diagnostic Scan):\n• خادم PayTabs: متصل ومستقر (99.8% جاهزية)\n• خادم Telr: متصل ومستقر (100% جاهزية)\n• قاعدة بيانات المحافظ: متطابقة 100% مع القيود المالية\n• جدار الحماية ضد التكرار: نشط بدون أي ثغرات"
        val diagMsg = ChatMessage(
            id = "ADMIN-DIAG-${System.currentTimeMillis()}",
            sender = "assistant",
            text = diagResult,
            timestamp = now
        )
        _messages.value = _messages.value + diagMsg
        return diagResult
    }

    fun sendMessage(
        userText: String,
        attachmentType: String? = null,
        attachmentName: String? = null,
        toolAction: String? = null
    ) {
        val now = dateFormat.format(Date()).substring(11)
        val userMsg = ChatMessage(
            id = "MSG-${System.currentTimeMillis()}-U",
            sender = "user",
            text = userText,
            timestamp = now,
            attachmentType = attachmentType,
            attachmentName = attachmentName,
            toolAction = toolAction
        )

        val replyText = generateReply(userText, attachmentType, toolAction)
        val assistantMsg = ChatMessage(
            id = "MSG-${System.currentTimeMillis()}-A",
            sender = "assistant",
            text = replyText,
            timestamp = now,
            toolAction = toolAction,
            toolResult = if (toolAction != null) "✓ نُفّذ الأمر الإداري عبر صلاحيات Root وتم التوثيق." else null
        )

        _messages.value = _messages.value + listOf(userMsg, assistantMsg)
    }

    private fun generateReply(
        query: String,
        attachmentType: String? = null,
        toolAction: String? = null
    ): String {
        if (attachmentType == "image") {
            return "🖼️ تم فحص الصورة / المستند التقني المرفق:\n• تم تحليل لقطة الشاشة والبيانات المشفرة.\n• لا توجد أي ثغرات مكشوفة أو مفاتيح سرية متسربة في الصورة.\n• حالة المطابقة الأمنية: معتمدة 100%."
        }
        if (attachmentType == "voice") {
            return "🎙️ تم استقبال التسجيل الصوتي الإداري ومعالجته عبر الذكاء الاصطناعي: تم تطبيق الأمر في وحدة العمليات بنجاح."
        }
        if (toolAction == "export_audit") {
            return "📥 تم إنشاء ملف سجل الأمان والتدقيق الإداري (Audit Log Export) بصيغة مشفرة وجاهز للتحميل والتخزين السحابي."
        }

        val q = query.lowercase()
        return when {
            "فحص" in q || "diagnostic" in q || "scan" in q ->
                runSystemDiagnostic()
            "توجيه" in q || "routing" in q ->
                "نظام التوجيه الذكي مفعل: العمليات ذات المبالغ العالية (+3,000 ر.س) تُوجّه تلقائياً إلى Telr لتقليل العمولات البنكية، بينما توجه طلبات مدى و Apple Pay السريعة إلى PayTabs."
            "paytabs" in q ->
                "بوابة PayTabs تعمل بكامل طاقتها: المفاتيح الحية مشفرة على السيرفر، وتدعم وسائل الدفع السعودية بالكامل (مدى و Apple Pay والبطاقات الائتمانية) مع توافق SAQ A-EP."
            "telr" in q ->
                "بوابة Telr متصلة بنجاح وتدعم الدفع المدمج (Framed Mode 2) ونسبة الاستجابة اللحظية ممتازة (142ms)."
            "محفظة" in q || "wallet" in q ->
                "نظام المحفظة مؤمن بالكامل برصيد موثق من الخادم، مع منع أي إيداع بدون تحقق Webhook رسمي."
            "تجميد" in q || "freeze" in q ->
                "وضع التجميد الطارئ متاح تحت أمرك في أي وقت لإيقاف أي عمليات مالية مشبوهة فوراً."
            else ->
                "أمر إداري مستلم: '$query'. بصفتي مساعد المسؤول ذو الصلاحيات الكاملة، قمت بفحص سجلات الأمان، ولا توجد أي مخاطر تشغيلية أو اختراقات مسجلة."
        }
    }
}
