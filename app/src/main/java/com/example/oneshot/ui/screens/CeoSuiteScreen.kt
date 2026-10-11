package com.example.oneshot.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AssignmentTurnedIn
import androidx.compose.material.icons.filled.AttachFile
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.BusinessCenter
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.ZoomIn
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import com.example.oneshot.data.model.AgentRole
import com.example.oneshot.data.model.CeoAgent
import com.example.oneshot.data.model.ChatMessage
import com.example.oneshot.data.model.DelegatedTask
import com.example.oneshot.ui.theme.FlameOrange
import com.example.oneshot.ui.theme.FlameSoft
import com.example.oneshot.ui.theme.NeutralBorder
import com.example.oneshot.ui.theme.NeutralMuted
import com.example.oneshot.ui.theme.NeutralWhite
import com.example.oneshot.ui.theme.ObsidianBlack
import com.example.oneshot.ui.theme.SuccessGreen
import com.example.oneshot.ui.viewmodel.OneShotViewModel
import kotlinx.coroutines.delay

@Composable
fun CeoSuiteScreen(
    viewModel: OneShotViewModel,
    modifier: Modifier = Modifier
) {
    val selectedAgentId by viewModel.selectedAgentId.collectAsState()
    val agents = viewModel.ceoAgents
    val kpis = viewModel.executiveKpis
    val tasks by viewModel.delegatedTasks.collectAsState()
    val agentChats by viewModel.agentChats.collectAsState()

    val currentAgent = agents.find { it.id == selectedAgentId } ?: agents[0]
    val currentChatMessages = agentChats[selectedAgentId] ?: emptyList()

    var selectedTab by remember { mutableIntStateOf(0) } // 0: Chat, 1: Tasks
    var chatInputText by remember { mutableStateOf("") }
    var showDelegateDialog by remember { mutableStateOf(false) }
    var showAttachDialog by remember { mutableStateOf(false) }
    var previewImageDialog by remember { mutableStateOf<String?>(null) }
    var isRecordingVoice by remember { mutableStateOf(false) }
    var recordingSeconds by remember { mutableIntStateOf(0) }

    LaunchedEffect(isRecordingVoice) {
        if (isRecordingVoice) {
            recordingSeconds = 0
            while (isRecordingVoice) {
                delay(1000)
                recordingSeconds++
            }
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFFF6F7F8))
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(8.dp))

        // Executive CEO Header Banner
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .testTag("ceo_suite_header_card"),
            shape = RoundedCornerShape(14.dp),
            colors = CardDefaults.cardColors(containerColor = ObsidianBlack)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(FlameOrange),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.BusinessCenter,
                                contentDescription = null,
                                tint = NeutralWhite,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "مكتب الرئيس التنفيذي",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = NeutralWhite
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(FlameOrange.copy(alpha = 0.2f))
                                        .padding(horizontal = 5.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        text = "MERCHANT AS CEO",
                                        color = FlameOrange,
                                        fontSize = 8.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                            Text(
                                text = "فريقك القيادي الذكي لإدارة الاستراتيجية، المالية، التسويق، والعمليات",
                                fontSize = 10.sp,
                                color = Color(0xFFA5ADA8)
                            )
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        IconButton(
                            onClick = {
                                viewModel.sendAgentChatMessage(
                                    selectedAgentId,
                                    "تصدير تقرير الجلسة التنفيذية",
                                    null,
                                    null,
                                    "export_report"
                                )
                                viewModel.showNotice("تم تجهيز وتحميل التقرير التنفيذي لـ ${currentAgent.role.titleAr}.")
                            },
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF242A2A))
                                .testTag("export_chat_report_button")
                        ) {
                            Icon(Icons.Default.Download, contentDescription = "تحميل التقرير", tint = FlameOrange, modifier = Modifier.size(17.dp))
                        }

                        Button(
                            onClick = { showDelegateDialog = true },
                            colors = ButtonDefaults.buttonColors(containerColor = FlameOrange),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.testTag("delegate_task_button")
                        ) {
                            Icon(Icons.Default.ElectricBolt, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("تفويض مهمة", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Executive KPIs Horizontal Scroll
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            kpis.forEach { kpi ->
                Surface(
                    modifier = Modifier
                        .width(170.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .border(0.8.dp, NeutralBorder, RoundedCornerShape(10.dp)),
                    color = NeutralWhite
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(text = kpi.title, fontSize = 10.sp, color = NeutralMuted, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(text = kpi.value, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = ObsidianBlack)
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(text = kpi.subtitle, fontSize = 9.sp, color = if (kpi.isPositive) SuccessGreen else FlameOrange)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Executive Agent Selector Row (CEO, CFO, CMO, COO)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            agents.forEach { agent ->
                val isSelected = agent.id == selectedAgentId
                Surface(
                    modifier = Modifier
                        .width(180.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .clickable { viewModel.selectAgent(agent.id) }
                        .border(
                            1.dp,
                            if (isSelected) FlameOrange else NeutralBorder,
                            RoundedCornerShape(10.dp)
                        )
                        .testTag("agent_card_${agent.id}"),
                    color = if (isSelected) FlameSoft else NeutralWhite
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = agent.role.titleAr,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) FlameOrange else ObsidianBlack
                            )
                            Box(
                                modifier = Modifier
                                    .size(7.dp)
                                    .clip(CircleShape)
                                    .background(
                                        when (agent.status) {
                                            "active" -> SuccessGreen
                                            "analyzing" -> FlameOrange
                                            else -> NeutralMuted
                                        }
                                    )
                            )
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = agent.nameAr,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = ObsidianBlack
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = agent.description,
                            fontSize = 9.sp,
                            color = Color(0xFF6B7275),
                            lineHeight = 13.sp,
                            maxLines = 2
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Tabs: Interactive Agent Chat vs Delegated Tasks
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
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.AutoAwesome, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "محادثة ${currentAgent.role.titleAr}",
                            fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Medium,
                            fontSize = 11.sp
                        )
                    }
                }
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.AssignmentTurnedIn, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "المهام المفوضة (${tasks.size})",
                            fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Medium,
                            fontSize = 11.sp
                        )
                    }
                }
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        if (selectedTab == 0) {
            // Interactive Chat with Selected Agent
            Column(modifier = Modifier.fillMaxSize()) {
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(currentChatMessages, key = { it.id }) { msg ->
                        CeoChatBubble(
                            message = msg,
                            agentName = currentAgent.nameAr,
                            onImageClick = { previewImageDialog = it }
                        )
                    }
                }

                // In-Chat Interactive Tools Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    // Tool 1: Quote Generator
                    Surface(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .clickable {
                                viewModel.sendAgentChatMessage(
                                    selectedAgentId,
                                    "توليد مسودة عرض سعر B2B",
                                    null,
                                    null,
                                    "generate_quote"
                                )
                            }
                            .border(0.8.dp, FlameOrange.copy(alpha = 0.4f), RoundedCornerShape(12.dp)),
                        color = FlameSoft
                    ) {
                        Row(modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Build, contentDescription = null, tint = FlameOrange, modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("💼 مسودة عرض سعر", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = FlameOrange)
                        }
                    }

                    // Tool 2: Fee Analyzer
                    Surface(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .clickable {
                                viewModel.sendAgentChatMessage(selectedAgentId, "قارن رسوم PayTabs و Telr")
                            }
                            .border(0.8.dp, NeutralBorder, RoundedCornerShape(12.dp)),
                        color = NeutralWhite
                    ) {
                        Row(modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.TrendingUp, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("📊 تدقيق العمولات", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = ObsidianBlack)
                        }
                    }

                    // Tool 3: Export Report
                    Surface(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .clickable {
                                viewModel.sendAgentChatMessage(
                                    selectedAgentId,
                                    "تصدير تقرير أداء ونشوت",
                                    null,
                                    null,
                                    "export_report"
                                )
                            }
                            .border(0.8.dp, NeutralBorder, RoundedCornerShape(12.dp)),
                        color = NeutralWhite
                    ) {
                        Row(modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.PictureAsPdf, contentDescription = null, tint = Color(0xFFD9483B), modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("📥 تحميل تقرير PDF", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = ObsidianBlack)
                        }
                    }
                }

                // Voice Recording Live State Indicator
                AnimatedVisibility(visible = isRecordingVoice) {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clip(RoundedCornerShape(8.dp)),
                        color = Color(0xFFFFECE6)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(FlameOrange))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "جارٍ الاستماع والتسجيل الصوتي... 00:0$recordingSeconds",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = FlameOrange
                                )
                            }
                            Icon(Icons.Default.GraphicEq, contentDescription = null, tint = FlameOrange, modifier = Modifier.size(18.dp))
                        }
                    }
                }

                // Input Bar with Attachment, Voice, and Send Icons
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    // Attachment Icon (Images/Files)
                    IconButton(
                        onClick = { showAttachDialog = true },
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(NeutralWhite)
                            .border(1.dp, NeutralBorder, CircleShape)
                            .testTag("attach_file_button")
                    ) {
                        Icon(Icons.Default.AttachFile, contentDescription = "إرفاق ملف أو صورة", tint = NeutralMuted, modifier = Modifier.size(18.dp))
                    }

                    // Voice Recording Mic Icon
                    IconButton(
                        onClick = {
                            if (!isRecordingVoice) {
                                isRecordingVoice = true
                            } else {
                                isRecordingVoice = false
                                viewModel.sendAgentChatMessage(
                                    selectedAgentId,
                                    "تسجيل صوتي تنفيذي: تم توجيه الفريق للبدء في تجهيز الحملة.",
                                    "voice",
                                    "voice_note_ceo.wav",
                                    null
                                )
                                viewModel.showNotice("تم إرسال التسجيل الصوتي ومعالجته عبر الذكاء الاصطناعي.")
                            }
                        },
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(if (isRecordingVoice) FlameOrange else NeutralWhite)
                            .border(1.dp, if (isRecordingVoice) FlameOrange else NeutralBorder, CircleShape)
                            .testTag("voice_recording_button")
                    ) {
                        Icon(
                            imageVector = if (isRecordingVoice) Icons.Default.MicOff else Icons.Default.Mic,
                            contentDescription = "تسجيل صوتي",
                            tint = if (isRecordingVoice) NeutralWhite else FlameOrange,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    OutlinedTextField(
                        value = chatInputText,
                        onValueChange = { chatInputText = it },
                        placeholder = { Text("وجه أمراً لـ ${currentAgent.role.titleAr}...", fontSize = 11.sp) },
                        modifier = Modifier
                            .weight(1f)
                            .testTag("ceo_chat_input"),
                        singleLine = true,
                        shape = RoundedCornerShape(20.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = FlameOrange,
                            unfocusedBorderColor = NeutralBorder
                        )
                    )

                    IconButton(
                        onClick = {
                            if (chatInputText.isNotBlank()) {
                                viewModel.sendAgentChatMessage(selectedAgentId, chatInputText)
                                chatInputText = ""
                            }
                        },
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(FlameOrange)
                            .testTag("send_ceo_chat_button")
                    ) {
                        Icon(Icons.Default.Send, contentDescription = "إرسال", tint = NeutralWhite, modifier = Modifier.size(16.dp))
                    }
                }
            }
        } else {
            // Delegated Tasks Board
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(tasks, key = { it.id }) { task ->
                    val assignedAgent = agents.find { it.id == task.agentId }
                    DelegatedTaskCard(task = task, agentName = assignedAgent?.nameAr ?: "مساعد تنفيذي")
                }
                item {
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }

    // Attach File / Image Dialog
    if (showAttachDialog) {
        AlertDialog(
            onDismissRequest = { showAttachDialog = false },
            containerColor = NeutralWhite,
            shape = RoundedCornerShape(16.dp),
            title = {
                Text("إرفاق ملف أو صورة للاستوديو", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = ObsidianBlack)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("اختر المرفق ليقوم وكيل الذكاء الاصطناعي بتحليله فوراً:", fontSize = 11.sp, color = NeutralMuted)

                    // Option 1: Product Photo
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .clickable {
                                showAttachDialog = false
                                viewModel.sendAgentChatMessage(
                                    selectedAgentId,
                                    "تم إرفاق صورة منتج / هوية للاستوديو للتحليل البصري.",
                                    "image",
                                    "oneshot_product_sample.jpg",
                                    null
                                )
                                viewModel.showNotice("تم إرفاق الصورة وجاري تحليلها بواسطة رؤية AI.")
                            }
                            .border(0.8.dp, NeutralBorder, RoundedCornerShape(8.dp)),
                        color = Color(0xFFF9FAFA)
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Image, contentDescription = null, tint = FlameOrange, modifier = Modifier.size(24.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("صورة منتج / حملة إعلانية (Photo Asset)", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Text("تحليل جودة الإضاءة والألوان لتصوير ونشوت", fontSize = 9.sp, color = NeutralMuted)
                            }
                        }
                    }

                    // Option 2: Business Document
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .clickable {
                                showAttachDialog = false
                                viewModel.sendAgentChatMessage(
                                    selectedAgentId,
                                    "تم إرفاق مستند كشف حساب / فاتورة للتدقيق المالي.",
                                    "document",
                                    "invoice_reconciliation_oct2026.pdf",
                                    null
                                )
                                viewModel.showNotice("تم إرفاق المستند وجاري تدقيقه.")
                            }
                            .border(0.8.dp, NeutralBorder, RoundedCornerShape(8.dp)),
                        color = Color(0xFFF9FAFA)
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.PictureAsPdf, contentDescription = null, tint = Color(0xFFD9483B), modifier = Modifier.size(24.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("مستند فاتورة أو عقد (PDF Document)", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Text("تدقيق البيانات المالية وشروط الخدمة", fontSize = 9.sp, color = NeutralMuted)
                            }
                        }
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                OutlinedButton(onClick = { showAttachDialog = false }) {
                    Text("إلغاء", fontSize = 11.sp)
                }
            }
        )
    }

    // Image Zoom / Viewer Dialog
    if (previewImageDialog != null) {
        AlertDialog(
            onDismissRequest = { previewImageDialog = null },
            containerColor = ObsidianBlack,
            shape = RoundedCornerShape(16.dp),
            title = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("معاينة الصورة المرفقة", color = NeutralWhite, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    IconButton(onClick = { previewImageDialog = null }) {
                        Icon(Icons.Default.Close, contentDescription = "إغلاق", tint = NeutralWhite)
                    }
                }
            },
            text = {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(220.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF222727)),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.Image, contentDescription = null, tint = FlameOrange, modifier = Modifier.size(64.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = previewImageDialog ?: "صورة ونشوت الاستوديو بدقة 4K",
                                color = NeutralWhite,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "دقة العرض: 3840x2160 · ملف معتمد",
                                color = Color(0xFFA5ADA8),
                                fontSize = 10.sp
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.showNotice("تم تحميل الصورة بدقة عالية إلى المعرض.")
                        previewImageDialog = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = FlameOrange)
                ) {
                    Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("حفظ الصورة", fontSize = 11.sp)
                }
            }
        )
    }

    // Delegate Task Dialog
    if (showDelegateDialog) {
        var taskTitle by remember { mutableStateOf("") }
        var targetAgentId by remember { mutableStateOf(selectedAgentId) }

        AlertDialog(
            onDismissRequest = { showDelegateDialog = false },
            containerColor = NeutralWhite,
            shape = RoundedCornerShape(16.dp),
            title = {
                Text(
                    text = "تفويض مهمة تنفيذية جديدة",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = ObsidianBlack
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "بصفتك الرئيس التنفيذي، يمكنك توجيه مهام التدقيق المالي، التخطيط التسويقي، أو ضبط العمليات لأعضاء فريقك الذكي.",
                        fontSize = 11.sp,
                        color = NeutralMuted
                    )

                    OutlinedTextField(
                        value = taskTitle,
                        onValueChange = { taskTitle = it },
                        label = { Text("عنوان أو تفاصيل المهمة") },
                        placeholder = { Text("مثال: دراسة تسعير باقة هوية ونشوت الجديدة...") },
                        modifier = Modifier.fillMaxWidth().testTag("delegate_task_input")
                    )

                    Text("اختر المسؤول عن التنفيذ:", fontSize = 11.sp, fontWeight = FontWeight.Bold)

                    agents.forEach { agent ->
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { targetAgentId = agent.id }
                                .padding(vertical = 3.dp)
                        ) {
                            androidx.compose.material3.RadioButton(
                                selected = targetAgentId == agent.id,
                                onClick = { targetAgentId = agent.id },
                                colors = androidx.compose.material3.RadioButtonDefaults.colors(selectedColor = FlameOrange)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Column {
                                Text(text = agent.nameAr, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Text(text = agent.role.titleAr, fontSize = 9.sp, color = NeutralMuted)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (taskTitle.isNotBlank()) {
                            viewModel.delegateTaskToAgent(targetAgentId, taskTitle)
                            showDelegateDialog = false
                            selectedTab = 1
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = FlameOrange),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.testTag("confirm_delegate_button")
                ) {
                    Text("تفويض المهمة فوراً", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showDelegateDialog = false }, shape = RoundedCornerShape(8.dp)) {
                    Text("إلغاء", fontSize = 11.sp)
                }
            }
        )
    }
}

@Composable
fun CeoChatBubble(
    message: ChatMessage,
    agentName: String,
    onImageClick: (String) -> Unit
) {
    val isUser = message.sender == "user"
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        Box(
            modifier = Modifier
                .clip(
                    RoundedCornerShape(
                        topStart = 12.dp,
                        topEnd = 12.dp,
                        bottomStart = if (isUser) 12.dp else 2.dp,
                        bottomEnd = if (isUser) 2.dp else 12.dp
                    )
                )
                .background(if (isUser) FlameOrange else NeutralWhite)
                .border(if (isUser) 0.dp else 0.8.dp, NeutralBorder, RoundedCornerShape(12.dp))
                .padding(12.dp)
                .fillMaxWidth(0.85f)
        ) {
            Column {
                Text(
                    text = if (isUser) "الرئيس التنفيذي (أنت)" else agentName,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isUser) NeutralWhite.copy(alpha = 0.85f) else FlameOrange
                )
                Spacer(modifier = Modifier.height(3.dp))

                // Attached Image Thumbnail Card (if message has image)
                if (message.attachmentType == "image") {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { onImageClick(message.attachmentName ?: "صورة ونشوت") },
                        color = if (isUser) Color(0xFFDF4F21) else Color(0xFFF1F3F4)
                    ) {
                        Row(
                            modifier = Modifier.padding(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Image, contentDescription = null, tint = if (isUser) NeutralWhite else FlameOrange, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Column {
                                    Text(
                                        text = message.attachmentName ?: "صورة مرفقة",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (isUser) NeutralWhite else ObsidianBlack
                                    )
                                    Text(
                                        text = "اضغط للمعاينة الكاملة",
                                        fontSize = 9.sp,
                                        color = if (isUser) NeutralWhite.copy(alpha = 0.8f) else NeutralMuted
                                    )
                                }
                            }
                            Icon(Icons.Default.ZoomIn, contentDescription = "تكبير", tint = if (isUser) NeutralWhite else NeutralMuted, modifier = Modifier.size(16.dp))
                        }
                    }
                }

                // Attached Document / Voice Pill
                if (message.attachmentType == "document") {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clip(RoundedCornerShape(8.dp)),
                        color = if (isUser) Color(0xFFDF4F21) else Color(0xFFF1F3F4)
                    ) {
                        Row(modifier = Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.PictureAsPdf, contentDescription = null, tint = if (isUser) NeutralWhite else Color(0xFFD9483B), modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = message.attachmentName ?: "مستند PDF", fontSize = 10.sp, color = if (isUser) NeutralWhite else ObsidianBlack, fontWeight = FontWeight.Bold)
                        }
                    }
                } else if (message.attachmentType == "voice") {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clip(RoundedCornerShape(8.dp)),
                        color = if (isUser) Color(0xFFDF4F21) else Color(0xFFF1F3F4)
                    ) {
                        Row(modifier = Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Mic, contentDescription = null, tint = if (isUser) NeutralWhite else FlameOrange, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = "تسجيل صوتي معتمد (0:03)", fontSize = 10.sp, color = if (isUser) NeutralWhite else ObsidianBlack, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // In-Chat Tool Execution Result
                if (message.toolResult != null) {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clip(RoundedCornerShape(6.dp)),
                        color = Color(0xFFE8F5E9)
                    ) {
                        Row(modifier = Modifier.padding(6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Build, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = message.toolResult, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32))
                        }
                    }
                }

                Text(
                    text = message.text,
                    fontSize = 12.sp,
                    lineHeight = 17.sp,
                    color = if (isUser) NeutralWhite else ObsidianBlack
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = message.timestamp,
                    fontSize = 8.sp,
                    color = if (isUser) NeutralWhite.copy(alpha = 0.7f) else NeutralMuted,
                    modifier = Modifier.align(Alignment.End)
                )
            }
        }
    }
}

@Composable
fun DelegatedTaskCard(task: DelegatedTask, agentName: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
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
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(FlameSoft)
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(text = task.id, color = FlameOrange, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = "المفوض: $agentName", fontSize = 10.sp, color = NeutralMuted)
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "مكتملة وموثقة", color = SuccessGreen, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(text = task.title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ObsidianBlack)

            Spacer(modifier = Modifier.height(6.dp))

            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp)),
                color = Color(0xFFF9FAFA)
            ) {
                Column(modifier = Modifier.padding(10.dp)) {
                    Text(text = "مخرجات التحليل التنفيذي:", fontSize = 9.sp, color = FlameOrange, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(text = task.output, fontSize = 11.sp, color = Color(0xFF4A4E50), lineHeight = 16.sp)
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
            Text(text = task.createdAt, fontSize = 9.sp, color = NeutralMuted, modifier = Modifier.align(Alignment.End))
        }
    }
}
