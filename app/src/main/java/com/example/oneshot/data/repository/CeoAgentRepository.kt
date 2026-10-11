package com.example.oneshot.data.repository

import com.example.oneshot.data.model.AgentRole
import com.example.oneshot.data.model.CeoAgent
import com.example.oneshot.data.model.ChatMessage
import com.example.oneshot.data.model.DelegatedTask
import com.example.oneshot.data.model.ExecutiveKpi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object CeoAgentRepository {

    private val dateFormat = SimpleDateFormat("HH:mm", Locale.getDefault())

    val agents = listOf(
        CeoAgent(
            id = "agent_ceo",
            role = AgentRole.CEO,
            nameAr = "سلطان الموجه (CEO Copilot)",
            titleAr = "المستشار الاستراتيجي والتنفيذي للتاجر",
            description = "شريكك القيادي في صياغة رؤية المتجر، توسيع باقات ونشوت، واقتناص فرص الصفقات الكبرى في السوق السعودي.",
            status = "active",
            capabilities = listOf(
                "تحليل الربحية واستراتيجيات التسعير",
                "صياغة خطط التوسع الربعي 2026",
                "اتخاذ القرارات التنفيذية وتفويض المهام"
            )
        ),
        CeoAgent(
            id = "agent_cfo",
            role = AgentRole.CFO,
            nameAr = "فهد المالي (CFO Treasury)",
            titleAr = "المدير المالي وإدارة الخزينة والسيولة",
            description = "تحليل التدفقات النقدية اللحظية، تدقيق هوامش الربح الصافية، ومقارنة رسوم بوابات PayTabs و Telr لتعظيم العائد.",
            status = "active",
            capabilities = listOf(
                "تدقيق رسوم البوابات (PayTabs مقابل Telr)",
                "حساب صافي الأرباح وهوامش الخدمات",
                "توقع السيولة وإدارة رصيد المحفظة"
            )
        ),
        CeoAgent(
            id = "agent_cmo",
            role = AgentRole.CMO,
            nameAr = "ريما النمو (CMO Performance)",
            titleAr = "مديرة التسويق والحملات والنمو الإعلاني",
            description = "تحسين عائد الإعلانات (ROAS)، توجيه ميزانيات Google Ads Diamond، وتصميم استراتيجيات انتشار مقاطع الريلز.",
            status = "analyzing",
            capabilities = listOf(
                "تحليل أداء إعلانات Google Ads",
                "استراتيجيات الريلز والمحتوى الفيروسي",
                "خفض تكلفة اكتساب العميل (CAC)"
            )
        ),
        CeoAgent(
            id = "agent_coo",
            role = AgentRole.COO,
            nameAr = "خالد العمليات (COO Delivery)",
            titleAr = "مدير التشغيل وضمان سلاسل التسليم",
            description = "متابعة إنجاز خدمات الأتمتة والتصوير، الالتزام بمواعيد التسليم (SLA)، وضمان رضا العملاء وجودة المخرجات.",
            status = "standby",
            capabilities = listOf(
                "تتبع مراحل تسليم الطلبات والخدمات",
                "مراقبة مؤشرات جودة المخرجات SLA",
                "أتمتة التواصل وإشعارات العقود"
            )
        )
    )

    val executiveKpis = listOf(
        ExecutiveKpi(
            title = "صافي الإيراد المتوقع (Q4)",
            value = "184,500 ر.س",
            subtitle = "+24.8% مقارنة بالشهر الماضي",
            isPositive = true
        ),
        ExecutiveKpi(
            title = "متوسط قيمة الطلب (AOV)",
            value = "3,250 ر.س",
            subtitle = "أعلى طلب: هوية متكاملة 5,500 ر.س",
            isPositive = true
        ),
        ExecutiveKpi(
            title = "هامش الربح الإجمالي",
            value = "68.4%",
            subtitle = "أعلى هوامش: باقات الأتمتة والـ AI",
            isPositive = true
        ),
        ExecutiveKpi(
            title = "عائد الإنفاق الإعلاني (ROAS)",
            value = "4.6x",
            subtitle = "حملات البحث المباشر في الرياض",
            isPositive = true
        )
    )

    private val initialTasks = listOf(
        DelegatedTask(
            id = "TASK-01",
            agentId = "agent_cfo",
            title = "مقارنة تكلفة رسوم بوابات الدفع PayTabs مقابل Telr لطلبات الشهر",
            status = "completed",
            output = "بوابة Telr حققت وفراً قدره 420 ر.س في العمليات الكبرى (+5000 ر.س)، بينما PayTabs تفوقت في تحويلات مدى و Apple Pay السريعة بنسبة نجاح 98.7%. التوصية: توجيه الطلبات فوق 3000 ر.س نحو Telr Framed.",
            createdAt = "اليوم 14:30"
        ),
        DelegatedTask(
            id = "TASK-02",
            agentId = "agent_cmo",
            title = "خطة إطلاق باقة ريلز التصوير التجاري للمطاعم والكافيهات بالرياض",
            status = "completed",
            output = "تم تصميم خطة محتوى من 5 مقاطع تبرز جودة إضاءات الاستوديو. المتوقع: جذب 18 عميل جديد بتكلفة اكتساب 110 ر.س لكل عميل.",
            createdAt = "أمس 18:00"
        ),
        DelegatedTask(
            id = "TASK-03",
            agentId = "agent_coo",
            title = "تدقيق مواعيد تسليم طلبات الأتمتة (AUT-01 و AUT-02)",
            status = "in_progress",
            output = "جاري مراجعة مخططات سير العمل مع مهندس التكاملات. معدل التسليم الحالي 3.8 أيام عمل مقارنة بالهدف 4 أيام.",
            createdAt = "اليوم 11:15"
        )
    )

    private val _tasks = MutableStateFlow(initialTasks)
    val tasks: StateFlow<List<DelegatedTask>> = _tasks.asStateFlow()

    // Agent chat message threads mapped by agentId
    private val _agentChats = MutableStateFlow<Map<String, List<ChatMessage>>>(
        mapOf(
            "agent_ceo" to listOf(
                ChatMessage(
                    id = "CEO-INIT",
                    sender = "assistant",
                    text = "أهلاً بك سعادة الرئيس التنفيذي. بصفتي مساعدك الاستراتيجي التنفيذي، استعرضت مؤشرات المتجر اليوم: إجمالي المدفوعات 148,500 ر.س بنمو 24.8%. أنا جاهز لدراسة أي قرار استثماري، أو تفويض مهام للمدير المالي ومديرة التسويق ومدير التشغيل.",
                    timestamp = "09:00"
                )
            ),
            "agent_cfo" to listOf(
                ChatMessage(
                    id = "CFO-INIT",
                    sender = "assistant",
                    text = "مرحباً يا قائد. خزينة المتجر مستقرة ورصيد المحفظة المتاح 3,350 ر.س مع سيولة متدفقة عبر PayTabs و Telr. هل ترغب في إجراء فحص لهوامش أرباح الباقات أو تدقيق رسوم التحصيل؟",
                    timestamp = "09:00"
                )
            ),
            "agent_cmo" to listOf(
                ChatMessage(
                    id = "CMO-INIT",
                    sender = "assistant",
                    text = "سعادة الرئيس التنفيذي، حملة Google Ads Diamond حققت ROAS بمعدل 4.6x هذا الأسبوع. الطلب على جلسات التصوير الفوتوغرافي مرتفع بنسبة 40%. دعنا نوجه حملة إعادة استهداف لعملاء الروابط المفتوحة.",
                    timestamp = "09:00"
                )
            ),
            "agent_coo" to listOf(
                ChatMessage(
                    id = "COO-INIT",
                    sender = "assistant",
                    text = "تحياتي سعادة الرئيس. العمليات التشغيلية تعمل بنسبة التزام SLA تفوق 96%. لا توجد أي شكاوى معلقة على طلبات الفواتير أو تسليم ملفات التصوير. ما المهمة التي تود تفويضها لي الآن؟",
                    timestamp = "09:00"
                )
            )
        )
    )
    val agentChats: StateFlow<Map<String, List<ChatMessage>>> = _agentChats.asStateFlow()

    fun delegateTask(agentId: String, title: String) {
        val now = "الآن"
        val agent = agents.find { it.id == agentId } ?: agents[0]
        val taskId = "TASK-" + (10..99).random()

        val outputSimulation = when (agent.role) {
            AgentRole.CEO -> "تم تحليل الموقف التنفيذي وصياغة توصية متكاملة لزيادة مبيعات الخدمات ذات الهامش المرتفع (+35% نمو متوقع)."
            AgentRole.CFO -> "تم استكمال التدقيق المالي وإعادة حساب هوامش الربح. تم توفير 3.2% من تكاليف التحصيل عبر توجيه وسائل الدفع."
            AgentRole.CMO -> "تم توليد نصوص الحملة الإعلانية وتحديد الفئات المستهدفة بدقة في قطاع الأعمال بالرياض وجدة."
            AgentRole.COO -> "تم التحقق من جدول تسليم الطلبات وتحديث سير العمل في لوحة المتابعة بدون أي تأخير."
        }

        val newTask = DelegatedTask(
            id = taskId,
            agentId = agentId,
            title = title,
            status = "completed",
            output = outputSimulation,
            createdAt = now
        )

        _tasks.value = listOf(newTask) + _tasks.value

        // Also append to the agent's chat
        sendAgentMessage(
            agentId = agentId,
            userMessage = "أفوض إليك المهمة التنفيذية: $title",
            agentReply = "علم سعادة الرئيس التنفيذي. لقد قمت بدراسة المهمة فوراً:\n$outputSimulation"
        )
    }

    fun sendAgentMessage(
        agentId: String,
        userMessage: String,
        agentReply: String? = null,
        attachmentType: String? = null,
        attachmentName: String? = null,
        toolAction: String? = null
    ) {
        val now = dateFormat.format(Date())
        val userMsg = ChatMessage(
            id = "MSG-U-${System.currentTimeMillis()}",
            sender = "user",
            text = userMessage,
            timestamp = now,
            attachmentType = attachmentType,
            attachmentName = attachmentName,
            toolAction = toolAction
        )

        val reply = agentReply ?: generateAgentReply(agentId, userMessage, attachmentType, toolAction)
        val assistantMsg = ChatMessage(
            id = "MSG-A-${System.currentTimeMillis()}",
            sender = "assistant",
            text = reply,
            timestamp = now,
            toolAction = toolAction,
            toolResult = if (toolAction != null) "✓ تم تنفيذ الأداة بنجاح وتوثيق النتائج في سجل العمليات." else null
        )

        val currentMap = _agentChats.value.toMutableMap()
        val currentList = currentMap[agentId] ?: emptyList()
        currentMap[agentId] = currentList + listOf(userMsg, assistantMsg)
        _agentChats.value = currentMap
    }

    private fun generateAgentReply(
        agentId: String,
        prompt: String,
        attachmentType: String? = null,
        toolAction: String? = null
    ): String {
        if (attachmentType == "image") {
            return "📸 تم استلام الصورة وتحليلها عبر رؤية الذكاء الاصطناعي (AI Vision). الملاحظات البصرية:\n• جودة الإضاءة والزوايا متناسقة مع الهوية البصرية الفاخرة.\n• مناسبة للاستخدام في كتالوج ونشوت وباقات ريلز الإنتاج MED-02.\n• التوصية: اعتماد الصورة ضمن معرض الحملات وتجهيزها للنشر الفوري."
        }
        if (attachmentType == "voice") {
            return "🎙️ تم تحويل التسجيل الصوتي إلى نص وتدقيقه: تم استيعاب التوجيه الصوتي وفهمه بدقة، وتم توجيه الأمر التنفيذي للفريق فوراً."
        }
        if (toolAction == "export_report") {
            return "📄 تم تجهيز التقرير التنفيذي الشامل للتحميل. يتضمن ملخص الأرباح، أداء البوابات، ومعدلات تسليم الخدمات لشهر أكتوبر 2026."
        }
        if (toolAction == "generate_quote") {
            return "💼 تم إنشاء مسودة عرض سعر رقمي متكامل (Quote Draft) بقيمة 9,500 ر.س شاملة خدمات الأتمتة والهوية والتصوير التجاري، جاهزة للإرسال للعميل."
        }

        val agent = agents.find { it.id == agentId }
        val role = agent?.role ?: AgentRole.CEO
        val q = prompt.lowercase()

        return when (role) {
            AgentRole.CEO -> {
                when {
                    "تسعير" in q || "سعر" in q || "price" in q ->
                        "كرئيس تنفيذي، أرى أن باقة 'تكامل بوابة الدفع AUT-02' مسعرة بـ 2,800 ر.س بينما القيمة السوقية في قطاع B2B تتجاوز 4,500 ر.س. أقترح إطلاق باقة مدمجة تضم (الربط + التصوير + الهوية) بقيمة 9,500 ر.س لتحقيق قفزة في الإيراد الصافي."
                    "هدف" in q || "target" in q || "خطة" in q ->
                        "خطتنا التنفيذية تستهدف إغلاق Q4 بإيرادات تتخطى 250,000 ر.س. الرافعة الأساسية هي: تعزيز المبيعات المتكررة لخدمات الاستوديو وإتاحة الشحن الفوري للمحفظة للعملاء الموثوقين."
                    else ->
                        "توجيهك في محله سعادة الرئيس التنفيذي. قمت بتحليل استفسارك بخصوص '$prompt'. توصيتي هي تفعيل دور مدراء الفريق (CFO و CMO و COO) لتنفيذ الإجراء خلال 24 ساعة لضمان أقصى كفاءة."
                }
            }
            AgentRole.CFO -> {
                when {
                    "رسوم" in q || "fee" in q || "عمولة" in q ->
                        "بوابة PayTabs تقتطع 2.7% + 1 ريال لكل عملية مدى/بطاقة، في حين أن Telr تقتطع 2.69%. في المبيعات الكبيرة (مثل باقة الهوية 5,500 ر.س)، استخدام Telr يوفر عليك مبالغ تشغيلية ملحوظة، بينما في العمليات السريعة الصغرى يفضل تفعيل Apple Pay عبر PayTabs لرفع نسبة الإتمام."
                    "أرباح" in q || "هامش" in q || "margin" in q ->
                        "هامش الربح الإجمالي الحالي 68.4%. الباقات الرقمية وقوالب التشغيل DIG-01 تحقق هامش ربح 94%، تليها خدمات أتمتة الأنظمة AUT-01 بهامش 78%. الاستوديو والتصوير يحقق هامش 52% نظراً للتجهيزات والإضاءات."
                    else ->
                        "تقرير مالي سريع: التدفقات النقدية الداخلة للمتجر تغطي الالتزامات التشغيلية بـ 3.8 أضعاف. لا توجد أي مطالبات معلقة أو نزاعات مالية في سجلات الدفع."
                }
            }
            AgentRole.CMO -> {
                when {
                    "إعلان" in q || "ads" in q || "google" in q ->
                        "حملات Google Ads Diamond الموجهة لكلمات (استوديو تصوير الرياض، ربط بوابات الدفع، تصميم هوية فاخرة) تحقق معدل تحويل 6.2%. أنصح بزيادة الميزانية بنسبة 15% خلال عطلة نهاية الأسبوع لاقتناص طلبات أصحاب الأعمال."
                    "ريلز" in q || "تيك توك" in q || "social" in q ->
                        "مقاطع 'كواليس الإنتاج والتصوير السينمائي' حصدت تفاعلاً أعلى بـ 3 أضعاف من المنشورات الثابتة. باقة الريلز MED-02 تمنحنا أداة تسويقية جذابة يمكن تقديمها كعينة للشركات الكبرى."
                    else ->
                        "رؤية تسويقية: علامتنا التجارية oneShot تتمتع بمكانة مرموقة بلونها الأسود الملكي والبرتقالي الملهم. يمكننا استقطاب 25 عميل إضافي من خلال تقديم استشارة أتمتة مجانية لأول 10 مستخدمين."
                }
            }
            AgentRole.COO -> {
                when {
                    "تسليم" in q || "delivery" in q || "وقت" in q ->
                        "معدل التسليم الزمني الحالي هو 3.8 أيام، وهو أفضل من معيار السوق (5 أيام). جميع طلبات اليوم في مسار التنفيذ الصحيح دون أي تأخير في أي من مراحل الإنتاج."
                    "فريق" in q || "جودة" in q || "quality" in q ->
                        "نطبق فحص الجودة المزدوج (Double QA) على كل ملف تسليم: مراجعة المخرجات، تدقيق التوافق مع الهوية، وفحص الروابط التقنية قبل إرسال الفاتورة النهائية للعميل."
                    else ->
                        "الموقف التشغيلي ممتاز: جميع قنوات الاتصال والـ Webhooks تعمل بكفاءة 100% والطلبات تسير وفق خطة العمل المتفق عليها."
                }
            }
        }
    }
}
