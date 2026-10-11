package com.example.oneshot.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.oneshot.data.model.OpenLink
import com.example.oneshot.data.model.PaymentDocument
import com.example.oneshot.data.model.PaymentMethod
import com.example.oneshot.ui.components.StatusBadge
import com.example.oneshot.ui.theme.FlameOrange
import com.example.oneshot.ui.theme.NeutralBorder
import com.example.oneshot.ui.theme.NeutralMuted
import com.example.oneshot.ui.theme.NeutralWhite
import com.example.oneshot.ui.theme.ObsidianBlack
import com.example.oneshot.ui.viewmodel.OneShotViewModel

@Composable
fun PaymentLinksScreen(
    viewModel: OneShotViewModel,
    modifier: Modifier = Modifier
) {
    val documents by viewModel.documents.collectAsState()
    val openLinks by viewModel.openLinks.collectAsState()
    val showCreateDocDialog by viewModel.showCreateDocDialog.collectAsState()
    val showCreateOpenLinkDialog by viewModel.showCreateOpenLinkDialog.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFFF6F7F8))
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "روابط الدفع والفواتير",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = ObsidianBlack
                )
                Text(
                    text = "إنشاء ومشاركة روابط PayTabs و Telr مباشرة",
                    fontSize = 11.sp,
                    color = NeutralMuted
                )
            }

            Button(
                onClick = {
                    if (selectedTab == 0) viewModel.setCreateDocDialog(true)
                    else viewModel.setCreateOpenLinkDialog(true)
                },
                colors = ButtonDefaults.buttonColors(containerColor = FlameOrange),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.testTag("create_link_action_button")
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = if (selectedTab == 0) "طلب دفع" else "رابط مفتوح",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Tabs
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = Color.Transparent,
            contentColor = FlameOrange,
            divider = {},
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                    color = FlameOrange
                )
            }
        ) {
            Tab(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                text = {
                    Text(
                        text = "الطلبات والفواتير (${documents.size})",
                        fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Medium,
                        fontSize = 12.sp
                    )
                }
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = {
                    Text(
                        text = "الروابط المفتوحة (${openLinks.size})",
                        fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Medium,
                        fontSize = 12.sp
                    )
                }
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Content
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (selectedTab == 0) {
                items(documents, key = { it.id }) { doc ->
                    DocumentItemCard(
                        doc = doc,
                        onCopy = { viewModel.showNotice("تم نسخ الرابط: https://secure.oneshot.sa/pay/${doc.id}") },
                        onClick = { viewModel.openCheckout(doc) },
                        onCancel = { viewModel.cancelDocument(doc.id) }
                    )
                }
            } else {
                items(openLinks, key = { it.id }) { link ->
                    OpenLinkItemCard(
                        link = link,
                        onCopy = { viewModel.showNotice("تم نسخ الرابط المفتوح: https://secure.oneshot.sa/p/${link.id}") }
                    )
                }
            }
            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }

    // Create Document Dialog
    if (showCreateDocDialog) {
        CreatePaymentDocDialog(
            onDismiss = { viewModel.setCreateDocDialog(false) },
            onCreate = { title, customerName, customerEmail, amount, method, gateway ->
                viewModel.createPaymentDocument(title, customerName, customerEmail, amount, method, gateway)
            }
        )
    }

    // Create Open Link Dialog
    if (showCreateOpenLinkDialog) {
        CreateOpenLinkDialog(
            onDismiss = { viewModel.setCreateOpenLinkDialog(false) },
            onCreate = { title, min, max, methods ->
                viewModel.createOpenLink(title, min, max, methods)
            }
        )
    }
}

@Composable
fun DocumentItemCard(
    doc: PaymentDocument,
    onCopy: () -> Unit,
    onClick: () -> Unit,
    onCancel: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .testTag("doc_item_${doc.id}"),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = NeutralWhite),
        border = CardDefaults.outlinedCardBorder().copy(width = 0.8.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = doc.id, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = FlameOrange)
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFF222727))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = if (doc.gateway == "telr") "Telr" else "PayTabs",
                            color = NeutralWhite,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = doc.method.nameAr, fontSize = 10.sp, color = NeutralMuted)
                }
                StatusBadge(status = doc.status)
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(text = doc.title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ObsidianBlack)
            Spacer(modifier = Modifier.height(2.dp))
            Text(text = "العميل: ${doc.customerName} (${doc.customerEmail})", fontSize = 11.sp, color = Color(0xFF6B7275))

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${String.format(java.util.Locale.US, "%,.0f", doc.amount)} ر.س",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = ObsidianBlack
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = onCopy,
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.height(32.dp)
                    ) {
                        Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(13.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("نسخ الرابط", fontSize = 10.sp)
                    }

                    if (doc.status == "pending") {
                        OutlinedButton(
                            onClick = onCancel,
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            Text("إلغاء", fontSize = 10.sp, color = Color(0xFFD9483B))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun OpenLinkItemCard(
    link: OpenLink,
    onCopy: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .testTag("open_link_item_${link.id}"),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = NeutralWhite),
        border = CardDefaults.outlinedCardBorder().copy(width = 0.8.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Link, contentDescription = null, tint = FlameOrange, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = link.id, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = FlameOrange)
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(4.dp))
                        .background(Color(0xFFE8F5E9))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(text = "رابط نشط", color = Color(0xFF2E7D32), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(text = link.title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ObsidianBlack)
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = "الحد الأدنى: ${link.minimum} ر.س — الحد الأقصى: ${link.maximum} ر.س",
                fontSize = 11.sp,
                color = NeutralMuted
            )

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "طرق الدفع: مدى، Apple Pay، البطاقات", fontSize = 10.sp, color = NeutralMuted)

                Button(
                    onClick = onCopy,
                    colors = ButtonDefaults.buttonColors(containerColor = ObsidianBlack),
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.height(32.dp)
                ) {
                    Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(13.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("نسخ الرابط المفتوح", fontSize = 10.sp)
                }
            }
        }
    }
}

@Composable
fun CreatePaymentDocDialog(
    onDismiss: () -> Unit,
    onCreate: (title: String, name: String, email: String, amount: Double, method: PaymentMethod, gateway: String) -> Unit
) {
    var title by remember { mutableStateOf("خدمة إنتاج وتكامل رقمي") }
    var customerName by remember { mutableStateOf("عبدالعزيز الشمري") }
    var customerEmail by remember { mutableStateOf("client@business.sa") }
    var amountText by remember { mutableStateOf("1500") }
    var selectedMethod by remember { mutableStateOf(PaymentMethod.HOSTED) }
    var selectedGateway by remember { mutableStateOf("paytabs") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = NeutralWhite,
        shape = RoundedCornerShape(16.dp),
        title = {
            Text("طلب دفع أو فاتورة جديدة", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = ObsidianBlack)
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("عنوان الطلب أو الخدمة") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("doc_title_input")
                )
                OutlinedTextField(
                    value = customerName,
                    onValueChange = { customerName = it },
                    label = { Text("اسم العميل") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("doc_customer_name_input")
                )
                OutlinedTextField(
                    value = customerEmail,
                    onValueChange = { customerEmail = it },
                    label = { Text("بريد العميل") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("doc_customer_email_input")
                )
                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it },
                    label = { Text("المبلغ بالريال السعودي") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("doc_amount_input")
                )

                Text("بوابة الدفع:", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(
                        selected = selectedGateway == "paytabs",
                        onClick = { selectedGateway = "paytabs" },
                        colors = RadioButtonDefaults.colors(selectedColor = FlameOrange)
                    )
                    Text("PayTabs", fontSize = 11.sp)
                    Spacer(modifier = Modifier.width(16.dp))
                    RadioButton(
                        selected = selectedGateway == "telr",
                        onClick = { selectedGateway = "telr" },
                        colors = RadioButtonDefaults.colors(selectedColor = FlameOrange)
                    )
                    Text("Telr", fontSize = 11.sp)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val amount = amountText.toDoubleOrNull() ?: 100.0
                    onCreate(title, customerName, customerEmail, amount, selectedMethod, selectedGateway)
                },
                colors = ButtonDefaults.buttonColors(containerColor = FlameOrange),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.testTag("submit_create_doc_button")
            ) {
                Text("إنشاء الطلب", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss, shape = RoundedCornerShape(8.dp)) {
                Text("إلغاء", fontSize = 12.sp)
            }
        }
    )
}

@Composable
fun CreateOpenLinkDialog(
    onDismiss: () -> Unit,
    onCreate: (title: String, min: Double, max: Double, methods: List<String>) -> Unit
) {
    var title by remember { mutableStateOf("دفعة حجز استوديو مفتوحة") }
    var minAmountText by remember { mutableStateOf("100") }
    var maxAmountText by remember { mutableStateOf("10000") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = NeutralWhite,
        shape = RoundedCornerShape(16.dp),
        title = {
            Text("إنشاء رابط دفع مفتوح", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = ObsidianBlack)
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "رابط قابل للاستخدام المتكرر. يحدد كل عميل مبلغه ضمن النطاق المسموح.",
                    fontSize = 11.sp,
                    color = NeutralMuted
                )
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("عنوان الرابط") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("open_link_title_input")
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = minAmountText,
                        onValueChange = { minAmountText = it },
                        label = { Text("الحد الأدنى (ر.س)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = maxAmountText,
                        onValueChange = { maxAmountText = it },
                        label = { Text("الحد الأقصى (ر.س)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val min = minAmountText.toDoubleOrNull() ?: 50.0
                    val max = maxAmountText.toDoubleOrNull() ?: 5000.0
                    onCreate(title, min, max, listOf("hosted", "mada_applepay"))
                },
                colors = ButtonDefaults.buttonColors(containerColor = FlameOrange),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.testTag("submit_create_open_link_button")
            ) {
                Text("حفظ وتوليد الرابط", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss, shape = RoundedCornerShape(8.dp)) {
                Text("إلغاء", fontSize = 12.sp)
            }
        }
    )
}
