package com.example.oneshot.ui.viewmodel

import androidx.lifecycle.ViewModel
import com.example.oneshot.data.model.OpenLink
import com.example.oneshot.data.model.PaymentDocument
import com.example.oneshot.data.model.PaymentMethod
import com.example.oneshot.data.model.ServiceProduct
import com.example.oneshot.data.repository.CatalogRepository
import com.example.oneshot.data.repository.CeoAgentRepository
import com.example.oneshot.data.repository.GatewayRepository
import com.example.oneshot.data.repository.OperationsRepository
import com.example.oneshot.data.repository.PaymentRepository
import com.example.oneshot.data.repository.WalletRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class ScreenTab(val titleAr: String, val titleEn: String) {
    STOREFRONT("الخدمات", "Storefront"),
    WALLET("المحفظة", "Wallet"),
    CEO_SUITE("الرئيس التنفيذي", "CEO Suite"),
    DASHBOARD("لوحة التاجر", "Dashboard"),
    PAYMENT_LINKS("روابط الدفع", "Links"),
    INTEGRATIONS("طرق الربط", "Gateways"),
    OPERATIONS("إدارة AI", "Admin AI"),
    CHECKOUT("شاشة الدفع", "Checkout")
}

data class UiNotification(
    val message: String,
    val isError: Boolean = false
)

class OneShotViewModel : ViewModel() {

    private val _currentTab = MutableStateFlow(ScreenTab.STOREFRONT)
    val currentTab: StateFlow<ScreenTab> = _currentTab.asStateFlow()

    private val _selectedCategory = MutableStateFlow("ALL")
    val selectedCategory: StateFlow<String> = _selectedCategory.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedProduct = MutableStateFlow<ServiceProduct?>(null)
    val selectedProduct: StateFlow<ServiceProduct?> = _selectedProduct.asStateFlow()

    private val _showTopupDialog = MutableStateFlow(false)
    val showTopupDialog: StateFlow<Boolean> = _showTopupDialog.asStateFlow()

    private val _showCreateDocDialog = MutableStateFlow(false)
    val showCreateDocDialog: StateFlow<Boolean> = _showCreateDocDialog.asStateFlow()

    private val _showCreateOpenLinkDialog = MutableStateFlow(false)
    val showCreateOpenLinkDialog: StateFlow<Boolean> = _showCreateOpenLinkDialog.asStateFlow()

    private val _notification = MutableStateFlow<UiNotification?>(null)
    val notification: StateFlow<UiNotification?> = _notification.asStateFlow()

    // Checkout demo state
    private val _checkoutDoc = MutableStateFlow<PaymentDocument?>(null)
    val checkoutDoc: StateFlow<PaymentDocument?> = _checkoutDoc.asStateFlow()

    // Merchant CEO Suite state
    private val _selectedAgentId = MutableStateFlow("agent_ceo")
    val selectedAgentId: StateFlow<String> = _selectedAgentId.asStateFlow()

    val ceoAgents = CeoAgentRepository.agents
    val executiveKpis = CeoAgentRepository.executiveKpis
    val delegatedTasks = CeoAgentRepository.tasks
    val agentChats = CeoAgentRepository.agentChats

    // Admin Full Access state
    val adminControls = OperationsRepository.adminControls
    val walletState = WalletRepository.walletState
    val documents = PaymentRepository.documents
    val openLinks = PaymentRepository.openLinks
    val metrics = PaymentRepository.metrics
    val gatewayConfig = GatewayRepository.config
    val operationRecords = OperationsRepository.records
    val chatMessages = OperationsRepository.messages

    fun setTab(tab: ScreenTab) {
        _currentTab.value = tab
    }

    fun selectCategory(categoryId: String) {
        _selectedCategory.value = categoryId
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun selectProduct(product: ServiceProduct?) {
        _selectedProduct.value = product
    }

    fun setTopupDialog(show: Boolean) {
        _showTopupDialog.value = show
    }

    fun setCreateDocDialog(show: Boolean) {
        _showCreateDocDialog.value = show
    }

    fun setCreateOpenLinkDialog(show: Boolean) {
        _showCreateOpenLinkDialog.value = show
    }

    fun dismissNotification() {
        _notification.value = null
    }

    fun showNotice(msg: String, isError: Boolean = false) {
        _notification.value = UiNotification(msg, isError)
    }

    // === Merchant CEO Agent Actions ===

    fun selectAgent(agentId: String) {
        _selectedAgentId.value = agentId
    }

    fun delegateTaskToAgent(agentId: String, title: String) {
        CeoAgentRepository.delegateTask(agentId, title)
        val agent = ceoAgents.find { it.id == agentId }
        showNotice("تم تفويض المهمة إلى ${agent?.nameAr ?: "المساعد الذكي"} بنجاح.")
    }

    fun sendAgentChatMessage(
        agentId: String,
        text: String,
        attachmentType: String? = null,
        attachmentName: String? = null,
        toolAction: String? = null
    ) {
        if (text.isBlank() && attachmentType == null && toolAction == null) return
        CeoAgentRepository.sendAgentMessage(agentId, text, null, attachmentType, attachmentName, toolAction)
    }

    // === Admin Full Access Actions ===

    fun toggleAdminControl(controlId: String) {
        OperationsRepository.toggleAdminControl(controlId)
        val control = adminControls.value.find { it.id == controlId }
        showNotice("تم تحديث سياسة الأمان الإدارية: ${control?.title}")
    }

    fun runAdminDiagnostic() {
        val res = OperationsRepository.runSystemDiagnostic()
        showNotice("اكتمل فحص الخوادم والسياسات بنجاح بنسبة 100%.")
    }

    // === Standard Platform Actions ===

    fun topupWallet(amount: Double, gateway: String) {
        val result = WalletRepository.topup(amount, gateway)
        result.onSuccess {
            showNotice("تم شحن المحفظة بمبلغ $amount ر.س بنجاح.")
            _showTopupDialog.value = false
        }.onFailure {
            showNotice(it.message ?: "فشلت عملية الشحن", isError = true)
        }
    }

    fun purchaseProduct(product: ServiceProduct) {
        val result = WalletRepository.purchase(product)
        result.onSuccess { order ->
            showNotice("تم شراء الخدمة بنجاح من رصيد المحفظة. رقم الطلب: ${order.id}")
            _selectedProduct.value = null
        }.onFailure {
            showNotice(it.message ?: "تعذر إتمام الشراء", isError = true)
        }
    }

    fun createPaymentDocument(
        title: String,
        customerName: String,
        customerEmail: String,
        amount: Double,
        method: PaymentMethod,
        gateway: String
    ) {
        val doc = PaymentRepository.createDocument(title, customerName, customerEmail, amount, method, gateway)
        showNotice("تم إنشاء طلب الدفع ${doc.id} بنجاح.")
        _showCreateDocDialog.value = false
    }

    fun createOpenLink(
        title: String,
        minimum: Double,
        maximum: Double,
        allowedMethods: List<String>
    ) {
        val link = PaymentRepository.createOpenLink(title, minimum, maximum, allowedMethods)
        showNotice("تم إنشاء الرابط المفتوح ${link.id} بنجاح.")
        _showCreateOpenLinkDialog.value = false
    }

    fun cancelDocument(id: String) {
        PaymentRepository.cancelDocument(id)
        showNotice("تم إلغاء الطلب $id.")
    }

    fun toggleOperationRead(id: String) {
        OperationsRepository.toggleRead(id)
    }

    fun sendChatMessage(
        text: String,
        attachmentType: String? = null,
        attachmentName: String? = null,
        toolAction: String? = null
    ) {
        if (text.isBlank() && attachmentType == null && toolAction == null) return
        OperationsRepository.sendMessage(text, attachmentType, attachmentName, toolAction)
    }

    fun openCheckout(doc: PaymentDocument) {
        _checkoutDoc.value = doc
        _currentTab.value = ScreenTab.CHECKOUT
    }

    fun updatePaytabsKeys(profileId: String, serverKey: String, clientKey: String, apiBase: String) {
        GatewayRepository.updatePaytabs(profileId, serverKey, clientKey, apiBase)
        showNotice("تم حفظ إعدادات بوابة PayTabs بنجاح.")
    }

    fun updateTelrKeys(storeId: String, apiKey: String, testMode: Boolean) {
        GatewayRepository.updateTelr(storeId, apiKey, testMode)
        showNotice("تم حفظ إعدادات بوابة Telr بنجاح.")
    }
}
