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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.People
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.oneshot.data.model.PaymentDocument
import com.example.oneshot.data.repository.PaymentRepository
import com.example.oneshot.ui.components.MetricCard
import com.example.oneshot.ui.components.StatusBadge
import com.example.oneshot.ui.theme.FlameOrange
import com.example.oneshot.ui.theme.FlameSoft
import com.example.oneshot.ui.theme.NeutralBorder
import com.example.oneshot.ui.theme.NeutralMuted
import com.example.oneshot.ui.theme.NeutralWhite
import com.example.oneshot.ui.theme.ObsidianBlack
import com.example.oneshot.ui.viewmodel.OneShotViewModel
import com.example.oneshot.ui.viewmodel.ScreenTab

@Composable
fun MerchantDashboardScreen(
    viewModel: OneShotViewModel,
    modifier: Modifier = Modifier
) {
    val metrics by viewModel.metrics.collectAsState()
    val documents by viewModel.documents.collectAsState()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFFF6F7F8))
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(6.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "نظرة عامة على المدفوعات",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = ObsidianBlack
                    )
                    Text(
                        text = "المبالغ مؤكدة من بوابات PayTabs و Telr مباشرة",
                        fontSize = 11.sp,
                        color = NeutralMuted
                    )
                }

                Button(
                    onClick = { viewModel.setCreateDocDialog(true) },
                    colors = ButtonDefaults.buttonColors(containerColor = FlameOrange),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.testTag("create_payment_request_top_button")
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("طلب دفع جديد", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // 4 Metrics Grid (2 rows of 2 cards)
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricCard(
                        modifier = Modifier.weight(1f),
                        title = "إجمالي المدفوعات",
                        value = String.format(java.util.Locale.US, "%,.0f", metrics.totalPaid),
                        suffix = "ر.س",
                        icon = Icons.Default.CreditCard,
                        featured = true
                    )
                    MetricCard(
                        modifier = Modifier.weight(1f),
                        title = "عمليات مكتملة",
                        value = "${metrics.paidCount}",
                        icon = Icons.Default.CheckCircle
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricCard(
                        modifier = Modifier.weight(1f),
                        title = "طلبات معلقة",
                        value = "${metrics.pendingCount}",
                        icon = Icons.Default.Description
                    )
                    MetricCard(
                        modifier = Modifier.weight(1f),
                        title = "إجمالي العملاء",
                        value = "${metrics.customersCount}",
                        icon = Icons.Default.People
                    )
                }
            }
        }

        // 7-Day Activity Chart Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = NeutralWhite),
                border = CardDefaults.outlinedCardBorder().copy(width = 0.8.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "نشاط التحصيل آخر 7 أيام",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = ObsidianBlack
                        )
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(Color(0xFFF2F4F5))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(text = "SAR بالريال", fontSize = 9.sp, color = NeutralMuted)
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Simple Bar Chart
                    val maxAmount = PaymentRepository.dailyActivity.maxOf { it.amount }
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        PaymentRepository.dailyActivity.forEach { item ->
                            val heightFraction = (item.amount / maxAmount).toFloat().coerceIn(0.1f, 1f)
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Bottom,
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = "${(item.amount / 1000).toInt()}k",
                                    fontSize = 8.sp,
                                    color = FlameOrange,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Box(
                                    modifier = Modifier
                                        .width(22.dp)
                                        .height((80 * heightFraction).dp)
                                        .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                                        .background(FlameOrange)
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = item.day.take(2),
                                    fontSize = 9.sp,
                                    color = NeutralMuted
                                )
                            }
                        }
                    }
                }
            }
        }

        // Quick Open Link Banner
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = ObsidianBlack)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "CREATE · SHARE · COLLECT",
                            fontSize = 9.sp,
                            color = FlameOrange,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "الروابط المفتوحة القابلة للتكرار",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = NeutralWhite
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "رابط واحد تشاركه مراراً؛ يحدد العميل المبلغ وطريقة الدفع.",
                            fontSize = 10.sp,
                            color = Color(0xFFA5ADA8)
                        )
                    }

                    Button(
                        onClick = { viewModel.setCreateOpenLinkDialog(true) },
                        colors = ButtonDefaults.buttonColors(containerColor = FlameOrange),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.testTag("create_open_link_banner_button")
                    ) {
                        Text("رابط جديد", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Latest Payment Documents
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "آخر المعاملات والطلبات",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = ObsidianBlack
                )
                Text(
                    text = "عرض الكل",
                    fontSize = 11.sp,
                    color = FlameOrange,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable { viewModel.setTab(ScreenTab.PAYMENT_LINKS) }
                )
            }
        }

        items(documents.take(5), key = { it.id }) { doc ->
            PaymentDocumentRow(
                document = doc,
                onCopy = { viewModel.showNotice("تم نسخ رابط الدفع: https://secure.oneshot.sa/pay/${doc.id}") },
                onClick = { viewModel.openCheckout(doc) },
                onCancel = { viewModel.cancelDocument(doc.id) }
            )
        }

        item {
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun PaymentDocumentRow(
    document: PaymentDocument,
    onCopy: () -> Unit,
    onClick: () -> Unit,
    onCancel: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .testTag("doc_row_${document.id}"),
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
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = document.id, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = FlameOrange)
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(3.dp))
                            .background(Color(0xFFF1F3F4))
                            .padding(horizontal = 4.dp, vertical = 1.dp)
                    ) {
                        Text(text = if (document.gateway == "telr") "Telr" else "PayTabs", fontSize = 9.sp, color = NeutralMuted)
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = document.method.nameAr, fontSize = 9.sp, color = NeutralMuted)
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = document.title, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ObsidianBlack)
                Spacer(modifier = Modifier.height(2.dp))
                Text(text = "${document.customerName} · ${document.customerEmail}", fontSize = 10.sp, color = NeutralMuted)
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "${String.format(java.util.Locale.US, "%,.0f", document.amount)} ر.س",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = ObsidianBlack
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    StatusBadge(status = document.status)
                    IconButton(
                        onClick = onCopy,
                        modifier = Modifier.size(28.dp)
                    ) {
                        Icon(Icons.Default.ContentCopy, contentDescription = "نسخ الرابط", tint = NeutralMuted, modifier = Modifier.size(15.dp))
                    }
                }
            }
        }
    }
}
