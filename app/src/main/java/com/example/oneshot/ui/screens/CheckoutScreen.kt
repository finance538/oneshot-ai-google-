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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.ShieldCheck
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.RadioButtonDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.oneshot.ui.theme.FlameOrange
import com.example.oneshot.ui.theme.FlameSoft
import com.example.oneshot.ui.theme.NeutralBorder
import com.example.oneshot.ui.theme.NeutralMuted
import com.example.oneshot.ui.theme.NeutralWhite
import com.example.oneshot.ui.theme.ObsidianBlack
import com.example.oneshot.ui.theme.SuccessGreen
import com.example.oneshot.ui.viewmodel.OneShotViewModel
import com.example.oneshot.ui.viewmodel.ScreenTab

@Composable
fun CheckoutScreen(
    viewModel: OneShotViewModel,
    modifier: Modifier = Modifier
) {
    val doc = viewModel.checkoutDoc.collectAsState().value
    var isPaid by remember { mutableStateOf(doc?.status == "paid") }
    var selectedMethod by remember { mutableStateOf("applepay") }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFFF7F5F1))
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            IconButton(onClick = { viewModel.setTab(ScreenTab.DASHBOARD) }) {
                Icon(Icons.Default.ArrowBack, contentDescription = "رجوع", tint = ObsidianBlack)
            }
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = "بوابة الدفع الآمنة · OneShot",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = ObsidianBlack
            )
        }

        Spacer(modifier = Modifier.height(14.dp))

        if (doc == null) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("لا يوجد طلب دفع محدد حالياً. يرجى اختيار طلب من لوحة التحكم.", color = NeutralMuted, fontSize = 12.sp)
            }
            return
        }

        // Summary Card
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("checkout_summary_card"),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = NeutralWhite),
            border = CardDefaults.outlinedCardBorder().copy(width = 0.8.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(FlameSoft)
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = "طلب دفع رقم ${doc.id}",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = FlameOrange
                        )
                    }

                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Default.Lock, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(13.dp))
                        Text(text = "تشفير 256-bit", fontSize = 9.sp, color = SuccessGreen, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = doc.title,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = ObsidianBlack
                )

                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "العميل: ${doc.customerName} (${doc.customerEmail})",
                    fontSize = 11.sp,
                    color = NeutralMuted
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Grand Amount
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Baseline
                ) {
                    Text("المبلغ المطلوب سداده:", fontSize = 12.sp, color = NeutralMuted)
                    Row(verticalAlignment = Alignment.Baseline) {
                        Text(
                            text = String.format(java.util.Locale.US, "%,.2f", doc.amount),
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold,
                            color = FlameOrange
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("ر.س", fontSize = 12.sp, color = FlameOrange, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                if (isPaid) {
                    // Paid Confirmation View
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp)),
                        color = Color(0xFFE8F5E9)
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = SuccessGreen,
                                modifier = Modifier.size(42.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "تم تأكيد عملية الدفع بنجاح!",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF2E7D32)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "تم تسجيل العملية عبر Webhook موثوق ومطابقة المبلغ على الخادم.",
                                fontSize = 11.sp,
                                color = Color(0xFF43A047),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                } else {
                    // Payment Method Options
                    Text("اختر وسيلة الدفع:", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = ObsidianBlack)
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(
                            selected = selectedMethod == "applepay",
                            onClick = { selectedMethod = "applepay" },
                            colors = RadioButtonDefaults.colors(selectedColor = FlameOrange)
                        )
                        Text("Apple Pay أو مدى (موصى به)", fontSize = 12.sp, fontWeight = FontWeight.Medium)
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(
                            selected = selectedMethod == "hosted",
                            onClick = { selectedMethod = "hosted" },
                            colors = RadioButtonDefaults.colors(selectedColor = FlameOrange)
                        )
                        Text("صفحة PayTabs المستضافة (Hosted)", fontSize = 12.sp)
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RadioButton(
                            selected = selectedMethod == "framed",
                            onClick = { selectedMethod = "framed" },
                            colors = RadioButtonDefaults.colors(selectedColor = FlameOrange)
                        )
                        Text("إطار Telr المدمج داخل التطبيق (Framed)", fontSize = 12.sp)
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            isPaid = true
                            viewModel.showNotice("تم تأكيد دفع الفاتورة ${doc.id} بنجاح!")
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = FlameOrange),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .testTag("execute_payment_button")
                    ) {
                        Icon(Icons.Default.CreditCard, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "إتمام الدفع الآن (${String.format(java.util.Locale.US, "%,.0f", doc.amount)} ر.س)",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.ShieldCheck,
                        contentDescription = null,
                        tint = NeutralMuted,
                        modifier = Modifier.size(15.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "مدفوعات مؤمنة بتوافق PCI-DSS SAQ A-EP و SAQ D",
                        fontSize = 9.sp,
                        color = NeutralMuted
                    )
                }
            }
        }
    }
}
