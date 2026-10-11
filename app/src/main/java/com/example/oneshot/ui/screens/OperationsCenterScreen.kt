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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MarkEmailRead
import androidx.compose.material.icons.filled.MarkEmailUnread
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.oneshot.data.model.AdminPolicyControl
import com.example.oneshot.data.model.ChatMessage
import com.example.oneshot.data.model.OperationRecord
import com.example.oneshot.ui.theme.ErrorBg
import com.example.oneshot.ui.theme.ErrorRed
import com.example.oneshot.ui.theme.FlameOrange
import com.example.oneshot.ui.theme.FlameSoft
import com.example.oneshot.ui.theme.NeutralBorder
import com.example.oneshot.ui.theme.NeutralMuted
import com.example.oneshot.ui.theme.NeutralWhite
import com.example.oneshot.ui.theme.ObsidianBlack
import com.example.oneshot.ui.theme.SuccessBg
import com.example.oneshot.ui.theme.SuccessGreen
import com.example.oneshot.ui.theme.WarningBg
import com.example.oneshot.ui.theme.WarningAmber
import com.example.oneshot.ui.viewmodel.OneShotViewModel

@Composable
fun OperationsCenterScreen(
    viewModel: OneShotViewModel,
    modifier: Modifier = Modifier
) {
    val records by viewModel.operationRecords.collectAsState()
    val messages by viewModel.chatMessages.collectAsState()
    val adminControls by viewModel.adminControls.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) } // 0: Admin AI Chat, 1: Full Policies, 2: Telemetry
    var inputChatText by remember { mutableStateOf("") }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFFF6F7F8))
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(8.dp))

        // Full Access Administrator Header
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("admin_full_access_header"),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = ObsidianBlack)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF2C3434)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.AdminPanelSettings, contentDescription = null, tint = FlameOrange, modifier = Modifier.size(20.dp))
                        }
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "مركز تحكم المسؤول الشامل",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = NeutralWhite
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(SuccessGreen.copy(alpha = 0.2f))
                                        .padding(horizontal = 5.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = "ROOT ACCESS · FULL ASSESS",
                                        color = SuccessGreen,
                                        fontSize = 8.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                            Text(
                                text = "التحكم الكامل في سياسات الأمان، توجيه البوابات، والفحص الذكي",
                                fontSize = 10.sp,
                                color = Color(0xFFA5ADA8)
                            )
                        }
                    }

                    Button(
                        onClick = { viewModel.runAdminDiagnostic() },
                        colors = ButtonDefaults.buttonColors(containerColor = FlameOrange),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.testTag("run_diagnostic_button")
                    ) {
                        Icon(Icons.Default.ElectricBolt, contentDescription = null, modifier = Modifier.size(13.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("فحص شامل", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Tabs: 0: Admin AI Chat, 1: Full Policies Controls, 2: Telemetry
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
                        text = "مساعد المسؤول AI",
                        fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Medium,
                        fontSize = 11.sp
                    )
                }
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = {
                    Text(
                        text = "سياسات النظام (${adminControls.count { it.enabled }} مفعلة)",
                        fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Medium,
                        fontSize = 11.sp
                    )
                }
            )
            Tab(
                selected = selectedTab == 2,
                onClick = { selectedTab = 2 },
                text = {
                    Text(
                        text = "سجل الأمان (${records.count { it.unread }})",
                        fontWeight = if (selectedTab == 2) FontWeight.Bold else FontWeight.Medium,
                        fontSize = 11.sp
                    )
                }
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        when (selectedTab) {
            0 -> {
                // Admin AI Chat View
                Column(modifier = Modifier.fillMaxSize()) {
                    LazyColumn(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(messages, key = { it.id }) { msg ->
                            ChatBubble(message = msg)
                        }
                    }

                    // Admin Quick Command Chips
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf("فحص النظام الشامل", "حالة التوجيه الذكي", "تدقيق بوابات PayTabs و Telr", "حالة جدار الحماية").forEach { prompt ->
                            Surface(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .border(1.dp, FlameOrange.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                    .clickable { viewModel.sendChatMessage(prompt) },
                                color = FlameSoft
                            ) {
                                Text(
                                    text = prompt,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = FlameOrange,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }

                    // Input Bar
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = inputChatText,
                            onValueChange = { inputChatText = it },
                            placeholder = { Text("أمر إداري: اسأل عن السيرفرات، المخاطر، أو العمولات...", fontSize = 11.sp) },
                            modifier = Modifier
                                .weight(1f)
                                .testTag("admin_chat_input_field"),
                            singleLine = true,
                            shape = RoundedCornerShape(20.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = FlameOrange,
                                unfocusedBorderColor = NeutralBorder
                            )
                        )

                        IconButton(
                            onClick = {
                                if (inputChatText.isNotBlank()) {
                                    viewModel.sendChatMessage(inputChatText)
                                    inputChatText = ""
                                }
                            },
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(FlameOrange)
                                .testTag("send_admin_chat_button")
                        ) {
                            Icon(Icons.Default.Send, contentDescription = "إرسال", tint = NeutralWhite, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }

            1 -> {
                // System Policy Controls (Root Access)
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    item {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(10.dp)),
                            color = Color(0xFFF0F4F2)
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.Security, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(18.dp))
                                Text(
                                    text = "صلاحيات التعديل اللحظي نشطة: التغييرات تطبق فوراً وتُسجل في سجل التدقيق الإداري المشفر.",
                                    fontSize = 10.sp,
                                    color = Color(0xFF2E4D38),
                                    lineHeight = 15.sp
                                )
                            }
                        }
                    }

                    items(adminControls, key = { it.id }) { control ->
                        AdminControlCard(
                            control = control,
                            onToggle = { viewModel.toggleAdminControl(control.id) }
                        )
                    }

                    item {
                        Spacer(modifier = Modifier.height(24.dp))
                    }
                }
            }

            2 -> {
                // Telemetry Events List
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(records, key = { it.id }) { record ->
                        OperationRecordCard(
                            record = record,
                            onToggleRead = { viewModel.toggleOperationRead(record.id) }
                        )
                    }
                    item {
                        Spacer(modifier = Modifier.height(24.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun AdminControlCard(
    control: AdminPolicyControl,
    onToggle: () -> Unit
) {
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
                    Text(
                        text = control.title,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = ObsidianBlack
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(if (control.riskLevel == "high") ErrorBg else WarningBg)
                            .padding(horizontal = 5.dp, vertical = 1.dp)
                    ) {
                        Text(
                            text = if (control.riskLevel == "high") "حرج" else "أمان",
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (control.riskLevel == "high") ErrorRed else WarningAmber
                        )
                    }
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = control.description,
                    fontSize = 10.sp,
                    color = Color(0xFF6B7275),
                    lineHeight = 15.sp
                )
            }

            Switch(
                checked = control.enabled,
                onCheckedChange = { onToggle() },
                colors = SwitchDefaults.colors(
                    checkedThumbColor = FlameOrange,
                    checkedTrackColor = FlameSoft
                ),
                modifier = Modifier.testTag("admin_switch_${control.id}")
            )
        }
    }
}
