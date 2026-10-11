package com.example.oneshot.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.ShieldCheck
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
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
import com.example.oneshot.data.model.LedgerEntry
import com.example.oneshot.data.model.WalletOrder
import com.example.oneshot.ui.components.StatusBadge
import com.example.oneshot.ui.theme.FlameOrange
import com.example.oneshot.ui.theme.FlameSoft
import com.example.oneshot.ui.theme.NeutralBorder
import com.example.oneshot.ui.theme.NeutralMuted
import com.example.oneshot.ui.theme.NeutralWhite
import com.example.oneshot.ui.theme.ObsidianBlack
import com.example.oneshot.ui.theme.SuccessGreen
import com.example.oneshot.ui.viewmodel.OneShotViewModel

@Composable
fun WalletScreen(
    viewModel: OneShotViewModel,
    modifier: Modifier = Modifier
) {
    val walletState by viewModel.walletState.collectAsState()
    val showTopupDialog by viewModel.showTopupDialog.collectAsState()
    var selectedTab by remember { mutableIntStateOf(0) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFFF6F7F8))
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(12.dp))

        // Large Obsidian Balance Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("wallet_balance_card"),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = ObsidianBlack)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "ONESHOT / WALLET",
                            color = FlameOrange,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "رصيد محفظة الخدمات",
                            color = NeutralWhite,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF242A2A)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.CreditCard,
                            contentDescription = null,
                            tint = FlameOrange,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(verticalAlignment = Alignment.Baseline) {
                    Text(
                        text = String.format(java.util.Locale.US, "%,.2f", walletState.balance),
                        color = NeutralWhite,
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "ريال سعودي",
                        color = Color(0xFFA5ADA8),
                        fontSize = 12.sp
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = { viewModel.setTopupDialog(true) },
                        colors = ButtonDefaults.buttonColors(containerColor = FlameOrange),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(42.dp)
                            .testTag("topup_button")
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("شحن المحفظة", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }

                    OutlinedButton(
                        onClick = { viewModel.setTab(com.example.oneshot.ui.viewmodel.ScreenTab.STOREFRONT) },
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = NeutralWhite),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF3B4444)),
                        modifier = Modifier
                            .weight(1f)
                            .height(42.dp)
                            .testTag("browse_services_button")
                    ) {
                        Text("تصفح الخدمات", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.ShieldCheck,
                        contentDescription = null,
                        tint = Color(0xFF6E866D),
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = "الرصيد مؤكد من طرف الخادم (Zero-Trust Ledger). عودة المتصفح لا تودع مبالغ.",
                        color = Color(0xFF8B9A93),
                        fontSize = 9.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Tabs: Orders vs Ledger
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
                        text = "الطلبات والمشتريات (${walletState.orders.size})",
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
                        text = "سجل القيود المالية (${walletState.entries.size})",
                        fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Medium,
                        fontSize = 12.sp
                    )
                }
            )
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Tab Content
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (selectedTab == 0) {
                if (walletState.orders.isEmpty()) {
                    item {
                        EmptyPlaceholder(message = "لا توجد طلبات سابقة مدفوعة من المحفظة.")
                    }
                } else {
                    items(walletState.orders, key = { it.id }) { order ->
                        WalletOrderCard(order = order)
                    }
                }
            } else {
                if (walletState.entries.isEmpty()) {
                    item {
                        EmptyPlaceholder(message = "لا توجد قيود مالية في المحفظة حالياً.")
                    }
                } else {
                    items(walletState.entries, key = { it.id }) { entry ->
                        LedgerEntryCard(entry = entry)
                    }
                }
            }
            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }

    // Top-up Dialog
    if (showTopupDialog) {
        var topupAmountText by remember { mutableStateOf("1000") }
        var selectedGateway by remember { mutableStateOf("paytabs") }

        AlertDialog(
            onDismissRequest = { viewModel.setTopupDialog(false) },
            containerColor = NeutralWhite,
            shape = RoundedCornerShape(16.dp),
            title = {
                Text(
                    text = "شحن رصيد المحفظة",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = ObsidianBlack
                )
            },
            text = {
                Column {
                    Text(
                        text = "أدخل المبلغ المراد إيداعه أو اختر من القيم السريعة:",
                        fontSize = 11.sp,
                        color = NeutralMuted
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = topupAmountText,
                        onValueChange = { topupAmountText = it },
                        label = { Text("المبلغ بالريال السعودي") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("topup_amount_input"),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = FlameOrange,
                            unfocusedBorderColor = NeutralBorder
                        )
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    // Preset Amount Chips
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf("200", "500", "1000", "2500").forEach { preset ->
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(6.dp))
                                    .border(
                                        1.dp,
                                        if (topupAmountText == preset) FlameOrange else NeutralBorder,
                                        RoundedCornerShape(6.dp)
                                    ),
                                color = if (topupAmountText == preset) FlameSoft else Color(0xFFF9FAFA),
                                onClick = { topupAmountText = preset }
                            ) {
                                Box(
                                    modifier = Modifier.padding(vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "$preset ر.س",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (topupAmountText == preset) FlameOrange else ObsidianBlack
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "بوابة الدفع المعتمدة:",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = ObsidianBlack
                    )

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(top = 4.dp)
                    ) {
                        RadioButton(
                            selected = selectedGateway == "paytabs",
                            onClick = { selectedGateway = "paytabs" },
                            colors = RadioButtonDefaults.colors(selectedColor = FlameOrange)
                        )
                        Text(text = "PayTabs (مدى و Apple Pay)", fontSize = 11.sp)
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedGateway == "telr",
                            onClick = { selectedGateway = "telr" },
                            colors = RadioButtonDefaults.colors(selectedColor = FlameOrange)
                        )
                        Text(text = "Telr (الدفع المدمج والبطاقات)", fontSize = 11.sp)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amount = topupAmountText.toDoubleOrNull() ?: 0.0
                        viewModel.topupWallet(amount, selectedGateway)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = FlameOrange),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.testTag("confirm_topup_button")
                ) {
                    Text("متابعة الدفع الآمن", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { viewModel.setTopupDialog(false) },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("إلغاء", fontSize = 12.sp)
                }
            }
        )
    }
}

@Composable
fun WalletOrderCard(order: WalletOrder) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = NeutralWhite),
        border = CardDefaults.outlinedCardBorder().copy(width = 0.8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = order.id, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = FlameOrange)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = order.createdAt, fontSize = 10.sp, color = NeutralMuted)
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = order.title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ObsidianBlack)
                Spacer(modifier = Modifier.height(2.dp))
                Text(text = "كود الخدمة: ${order.sku}", fontSize = 10.sp, color = NeutralMuted)
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "${String.format(java.util.Locale.US, "%,.0f", order.amount)} ر.س",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = ObsidianBlack
                )
                Spacer(modifier = Modifier.height(6.dp))
                StatusBadge(status = order.status)
            }
        }
    }
}

@Composable
fun LedgerEntryCard(entry: LedgerEntry) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = NeutralWhite),
        border = CardDefaults.outlinedCardBorder().copy(width = 0.8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.weight(1f)
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(if (entry.isCredit) SuccessGreen.copy(alpha = 0.12f) else FlameOrange.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (entry.isCredit) Icons.Default.ArrowDownward else Icons.Default.ArrowUpward,
                        contentDescription = null,
                        tint = if (entry.isCredit) SuccessGreen else FlameOrange,
                        modifier = Modifier.size(16.dp)
                    )
                }

                Column {
                    Text(
                        text = entry.description,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = ObsidianBlack
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${entry.id} · ${entry.createdAt}",
                        fontSize = 10.sp,
                        color = NeutralMuted
                    )
                }
            }

            Text(
                text = "${if (entry.isCredit) "+" else "-"}${String.format(java.util.Locale.US, "%,.0f", entry.amount)} ر.س",
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                color = if (entry.isCredit) SuccessGreen else FlameOrange
            )
        }
    }
}

@Composable
fun EmptyPlaceholder(message: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 32.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(text = message, fontSize = 12.sp, color = NeutralMuted)
    }
}
