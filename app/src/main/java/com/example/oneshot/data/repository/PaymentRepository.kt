package com.example.oneshot.data.repository

import com.example.oneshot.data.model.DailyActivity
import com.example.oneshot.data.model.OpenLink
import com.example.oneshot.data.model.PaymentDocument
import com.example.oneshot.data.model.PaymentMethod
import com.example.oneshot.data.model.PlatformMetrics
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object PaymentRepository {

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())

    private val initialDocuments = listOf(
        PaymentDocument(
            id = "DOC-89211",
            title = "فاتورة إنتاج وسائط وهندسة هوية بصرية",
            customerName = "شركة أفق للاستثمار",
            customerEmail = "finance@ofooq.sa",
            amount = 8700.0,
            method = PaymentMethod.INVOICE,
            gateway = "paytabs",
            status = "paid",
            createdAt = "2026-10-09 16:30",
            expiresAt = "2026-10-16 16:30"
        ),
        PaymentDocument(
            id = "DOC-89190",
            title = "جلسة تصوير منتجات استوديو الرياض",
            customerName = "مؤسسة خطوة عطر",
            customerEmail = "khotwa.store@gmail.com",
            amount = 2400.0,
            method = PaymentMethod.HOSTED,
            gateway = "telr",
            status = "paid",
            createdAt = "2026-10-08 11:15",
            expiresAt = "2026-10-15 11:15"
        ),
        PaymentDocument(
            id = "DOC-89145",
            title = "ربط وتكامل بوابة PayTabs مع نظام Odoo",
            customerName = "مجموعة التقنية الحديثة",
            customerEmail = "tech@modern-group.sa",
            amount = 2800.0,
            method = PaymentMethod.FRAMED,
            gateway = "paytabs",
            status = "pending",
            createdAt = "2026-10-07 09:40",
            expiresAt = "2026-10-14 09:40"
        ),
        PaymentDocument(
            id = "DOC-89082",
            title = "حملة إعلانات Google Ads لشهر أكتوبر",
            customerName = "عيادات د. نورة",
            customerEmail = "clinic.marketing@noura.med.sa",
            amount = 3500.0,
            method = PaymentMethod.PAYLINK,
            gateway = "paytabs",
            status = "paid",
            createdAt = "2026-10-05 15:20",
            expiresAt = "2026-10-12 15:20"
        ),
        PaymentDocument(
            id = "DOC-89012",
            title = "تطوير مساعد ذكاء اصطناعي RAG",
            customerName = "سالم القرني",
            customerEmail = "salem.qarni@cloudlog.sa",
            amount = 4500.0,
            method = PaymentMethod.HOSTED,
            gateway = "telr",
            status = "review",
            createdAt = "2026-10-03 13:00",
            expiresAt = "2026-10-10 13:00"
        )
    )

    private val initialOpenLinks = listOf(
        OpenLink(
            id = "LNK-771",
            title = "دفعة مشاريع وخدمات الاستوديو المفتوحة",
            minimum = 100.0,
            maximum = 20000.0,
            allowedMethods = listOf("hosted", "framed", "mada_applepay"),
            enabled = true,
            createdAt = "2026-10-01 10:00"
        ),
        OpenLink(
            id = "LNK-772",
            title = "عربون حجز جلسات التصوير الفوتوغرافي",
            minimum = 500.0,
            maximum = 5000.0,
            allowedMethods = listOf("hosted", "mada_applepay"),
            enabled = true,
            createdAt = "2026-10-03 14:00"
        )
    )

    private val _documents = MutableStateFlow(initialDocuments)
    val documents: StateFlow<List<PaymentDocument>> = _documents.asStateFlow()

    private val _openLinks = MutableStateFlow(initialOpenLinks)
    val openLinks: StateFlow<List<OpenLink>> = _openLinks.asStateFlow()

    private val _metrics = MutableStateFlow(
        PlatformMetrics(
            totalPaid = 148500.0,
            paidCount = 184,
            pendingCount = 12,
            customersCount = 96
        )
    )
    val metrics: StateFlow<PlatformMetrics> = _metrics.asStateFlow()

    val dailyActivity = listOf(
        DailyActivity("السبت", 8500.0),
        DailyActivity("الأحد", 14200.0),
        DailyActivity("الإثنين", 19800.0),
        DailyActivity("الثلاثاء", 12400.0),
        DailyActivity("الأربعاء", 24600.0),
        DailyActivity("الخميس", 31200.0),
        DailyActivity("الجمعة", 16800.0)
    )

    fun createDocument(
        title: String,
        customerName: String,
        customerEmail: String,
        amount: Double,
        method: PaymentMethod,
        gateway: String
    ): PaymentDocument {
        val now = dateFormat.format(Date())
        val docId = "DOC-" + (89300..99999).random()
        val newDoc = PaymentDocument(
            id = docId,
            title = title,
            customerName = customerName,
            customerEmail = customerEmail,
            amount = amount,
            method = method,
            gateway = gateway,
            status = "pending",
            createdAt = now,
            expiresAt = "بعد 7 أيام",
            gatewayUrl = "https://secure.oneshot.sa/pay/$docId"
        )
        _documents.value = listOf(newDoc) + _documents.value
        _metrics.value = _metrics.value.copy(pendingCount = _metrics.value.pendingCount + 1)
        return newDoc
    }

    fun createOpenLink(
        title: String,
        minimum: Double,
        maximum: Double,
        allowedMethods: List<String>
    ): OpenLink {
        val now = dateFormat.format(Date())
        val linkId = "LNK-" + (773..999).random()
        val newLink = OpenLink(
            id = linkId,
            title = title,
            minimum = minimum,
            maximum = maximum,
            allowedMethods = allowedMethods,
            enabled = true,
            createdAt = now
        )
        _openLinks.value = listOf(newLink) + _openLinks.value
        return newLink
    }

    fun cancelDocument(id: String) {
        _documents.value = _documents.value.map {
            if (it.id == id) it.copy(status = "cancelled") else it
        }
    }
}
