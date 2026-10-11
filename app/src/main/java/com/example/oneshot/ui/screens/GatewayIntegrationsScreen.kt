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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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

@Composable
fun GatewayIntegrationsScreen(
    viewModel: OneShotViewModel,
    modifier: Modifier = Modifier
) {
    val config by viewModel.gatewayConfig.collectAsState()

    var ptProfileId by remember(config) { mutableStateOf(config.paytabsProfileId) }
    var ptServerKey by remember(config) { mutableStateOf(config.paytabsServerKey) }
    var ptClientKey by remember(config) { mutableStateOf(config.paytabsClientKey) }
    var ptApiBase by remember(config) { mutableStateOf(config.paytabsApiBase) }

    var telrStoreId by remember(config) { mutableStateOf(config.telrStoreId) }
    var telrApiKey by remember(config) { mutableStateOf(config.telrApiKey) }
    var telrTestMode by remember(config) { mutableStateOf(config.telrTestMode) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFFF6F7F8))
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "طرق الربط وبوابات الدفع",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = ObsidianBlack
            )
            Text(
                text = "إدارة بيانات الاعتماد وتكاملات PayTabs و Telr مع حماية المفاتيح السرية",
                fontSize = 11.sp,
                color = NeutralMuted
            )
        }

        // Security Architecture Info Banner
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF0F4F2)),
                border = CardDefaults.outlinedCardBorder().copy(width = 0.8.dp)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(SuccessGreen.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Security, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(18.dp))
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "عزل أمني كامل للمفاتيح (Server-Side Isolation)",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF2E4D38)
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "المفاتيح السرية الحية (Live Authentication Keys) لا تمر عبر متصفح العميل إطلاقاً. تمر العمليات عبر دوال وسيطة مشفرة مطابقة لمعايير SAQ A-EP و SAQ D.",
                            fontSize = 10.sp,
                            lineHeight = 15.sp,
                            color = Color(0xFF4A6854)
                        )
                    }
                }
            }
        }

        // PayTabs Gateway Card
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(text = "PayTabs", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = ObsidianBlack)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = "· المملكة العربية السعودية", fontSize = 11.sp, color = NeutralMuted)
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFFE8F5E9))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(SuccessGreen))
                                Text(text = "جاهز ومتصل", color = SuccessGreen, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "بوابة الدفع الرسمية المعتمدة لمدى و Apple Pay والبطاقات الائتمانية مع تحصيل فوري بالريال.",
                        fontSize = 11.sp,
                        color = Color(0xFF6B7275)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = ptProfileId,
                        onValueChange = { ptProfileId = it },
                        label = { Text("Profile ID") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("pt_profile_id_input"),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = FlameOrange)
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = ptServerKey,
                        onValueChange = { ptServerKey = it },
                        label = { Text("Server Key (مشفر على الخادم)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("pt_server_key_input"),
                        trailingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = NeutralMuted) },
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = FlameOrange)
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = ptClientKey,
                        onValueChange = { ptClientKey = it },
                        label = { Text("Client Key") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("pt_client_key_input"),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = FlameOrange)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = { viewModel.updatePaytabsKeys(ptProfileId, ptServerKey, ptClientKey, ptApiBase) },
                        colors = ButtonDefaults.buttonColors(containerColor = FlameOrange),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.align(Alignment.End).testTag("save_paytabs_button")
                    ) {
                        Text("حفظ إعدادات PayTabs", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Telr Gateway Card
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(text = "Telr", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = ObsidianBlack)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = "· الدفع المدمج Framed", fontSize = 11.sp, color = NeutralMuted)
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFFE8F5E9))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(SuccessGreen))
                                Text(text = "جاهز ومتصل", color = SuccessGreen, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "بوابة دفع دولية ومحلية متخصصة في الإطارات المدمجة (Embedded Framed Checkout) وإعادة التوجيه الآمن.",
                        fontSize = 11.sp,
                        color = Color(0xFF6B7275)
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = telrStoreId,
                        onValueChange = { telrStoreId = it },
                        label = { Text("Store ID (رقم المتجر)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("telr_store_id_input"),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = FlameOrange)
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = telrApiKey,
                        onValueChange = { telrApiKey = it },
                        label = { Text("API Authentication Key") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().testTag("telr_api_key_input"),
                        trailingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = NeutralMuted) },
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = FlameOrange)
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("وضع الاختبار التجريبي (Test Mode)", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            Text("محاكاة الدفع بدون خصم بطاقات بنكية حقيقية", fontSize = 10.sp, color = NeutralMuted)
                        }
                        Switch(
                            checked = telrTestMode,
                            onCheckedChange = { telrTestMode = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = FlameOrange, checkedTrackColor = FlameSoft)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = { viewModel.updateTelrKeys(telrStoreId, telrApiKey, telrTestMode) },
                        colors = ButtonDefaults.buttonColors(containerColor = FlameOrange),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.align(Alignment.End).testTag("save_telr_button")
                    ) {
                        Text("حفظ إعدادات Telr", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        item {
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
