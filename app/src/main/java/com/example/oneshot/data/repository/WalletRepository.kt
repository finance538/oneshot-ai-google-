package com.example.oneshot.data.repository

import com.example.oneshot.data.model.LedgerEntry
import com.example.oneshot.data.model.ServiceProduct
import com.example.oneshot.data.model.WalletData
import com.example.oneshot.data.model.WalletOrder
import com.example.oneshot.data.model.WalletTopup
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

object WalletRepository {

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())

    private val initialOrders = listOf(
        WalletOrder(
            id = "ORD-94120",
            sku = "AUT-01",
            title = "تحليل وهندسة مسارات الأتمتة",
            amount = 1200.0,
            status = "completed",
            billingCycle = "one_time",
            customerName = "عبدالله التميمي",
            customerEmail = "a.tamimi@oneshot.sa",
            createdAt = "2026-10-08 14:20"
        ),
        WalletOrder(
            id = "ORD-94088",
            sku = "DIG-01",
            title = "حزمة قوالب الفواتير وأنظمة التشغيل الرقمية",
            amount = 450.0,
            status = "completed",
            billingCycle = "one_time",
            customerName = "عبدالله التميمي",
            customerEmail = "a.tamimi@oneshot.sa",
            createdAt = "2026-10-05 11:00"
        )
    )

    private val initialEntries = listOf(
        LedgerEntry(
            id = "LED-001",
            amount = 5000.0,
            description = "شحن رصيد المحفظة عبر PayTabs",
            createdAt = "2026-10-04 10:15",
            isCredit = true
        ),
        LedgerEntry(
            id = "LED-002",
            amount = 450.0,
            description = "شراء خدمة: حزمة قوالب الفواتير (DIG-01)",
            createdAt = "2026-10-05 11:00",
            isCredit = false
        ),
        LedgerEntry(
            id = "LED-003",
            amount = 1200.0,
            description = "شراء خدمة: تحليل فرص الأتمتة (AUT-01)",
            createdAt = "2026-10-08 14:20",
            isCredit = false
        )
    )

    private val initialTopups = listOf(
        WalletTopup(
            id = "TOP-781",
            amount = 5000.0,
            gateway = "paytabs",
            status = "paid",
            createdAt = "2026-10-04 10:15"
        )
    )

    private val _walletState = MutableStateFlow(
        WalletData(
            balance = 3350.0, // 5000 - 450 - 1200 = 3350
            gateways = listOf("paytabs", "telr"),
            paymentsEnabled = true,
            entries = initialEntries,
            topups = initialTopups,
            orders = initialOrders
        )
    )
    val walletState: StateFlow<WalletData> = _walletState.asStateFlow()

    // Process top-up
    fun topup(amount: Double, gateway: String): Result<String> {
        if (amount <= 0.0) return Result.failure(IllegalArgumentException("المبلغ يجب أن يكون أكبر من صفر"))
        if (amount > 10000.0) return Result.failure(IllegalArgumentException("الحد الأقصى للشحن هو 10,000 ريال"))

        val current = _walletState.value
        val now = dateFormat.format(Date())
        val topupId = "TOP-" + (100..999).random()
        val entryId = "LED-" + (100..999).random()

        val newTopup = WalletTopup(
            id = topupId,
            amount = amount,
            gateway = gateway,
            status = "paid",
            createdAt = now
        )

        val newEntry = LedgerEntry(
            id = entryId,
            amount = amount,
            description = "شحن رصيد المحفظة عبر " + if (gateway == "telr") "Telr" else "PayTabs",
            createdAt = now,
            isCredit = true
        )

        _walletState.value = current.copy(
            balance = current.balance + amount,
            topups = listOf(newTopup) + current.topups,
            entries = listOf(newEntry) + current.entries
        )

        return Result.success(topupId)
    }

    // Process service purchase from wallet balance
    fun purchase(product: ServiceProduct): Result<WalletOrder> {
        val current = _walletState.value
        if (current.balance < product.amount) {
            return Result.failure(IllegalStateException("رصيدك الحالي غير كافٍ. يرجى شحن المحفظة أولاً."))
        }

        val now = dateFormat.format(Date())
        val orderId = "ORD-" + (94200..99999).random()
        val entryId = "LED-" + (100..999).random()

        val newOrder = WalletOrder(
            id = orderId,
            sku = product.sku,
            title = product.nameAr,
            amount = product.amount,
            status = "processing",
            billingCycle = product.billingCycle,
            customerName = "عبدالله التميمي",
            customerEmail = "a.tamimi@oneshot.sa",
            createdAt = now
        )

        val newEntry = LedgerEntry(
            id = entryId,
            amount = product.amount,
            description = "شراء خدمة: ${product.nameAr} (${product.sku})",
            createdAt = now,
            isCredit = false
        )

        _walletState.value = current.copy(
            balance = current.balance - product.amount,
            orders = listOf(newOrder) + current.orders,
            entries = listOf(newEntry) + current.entries
        )

        return Result.success(newOrder)
    }
}
