// aiModelsData.ts
// Comprehensive 4-Tier AI Engine & Ollama Models Registry
// Includes Tier 1 (Fast), Tier 2 (Pro), Tier 3 (Reasoning), and Tier X (Admin-Only Abliterated / Uncensored)
// Plus Intelligent Auto-Router for Dynamic Model Selection

export type AiTierId = 'tier-1' | 'tier-2' | 'tier-3' | 'tier-x';

export interface OllamaModelDefinition {
  id: string;
  name: string;
  family: string;
  parameterSize: string;
  tier: AiTierId;
  description: Record<string, string>;
  strengths: string[];
  contextWindow: number;
  recommendedFor: string[];
  isAbliterated?: boolean;
}

export interface AiTierDefinition {
  id: AiTierId;
  badge: string;
  iconName: string;
  title: Record<string, string>;
  subtitle: Record<string, string>;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  requiresAdminUnlock: boolean;
  models: OllamaModelDefinition[];
}

export const ADMIN_TIER_X_SECRET = 'Aa#2133155826';

export const AI_TIERS: Record<AiTierId, AiTierDefinition> = {
  'tier-1': {
    id: 'tier-1',
    badge: 'Tier 1 · Fast',
    iconName: 'Zap',
    title: {
      ar: 'المستوى الأول: السريع والموفّر (Fast & Efficient)',
      en: 'Tier 1: Fast & Efficient',
      zh: '第一级：快速与高效 (Fast & Efficient)',
      ru: 'Уровень 1: Быстрый и экономичный',
      fr: 'Niveau 1 : Rapide et Économique',
    },
    subtitle: {
      ar: 'مخصص للمحادثات السريعة، خدمة العملاء الفورية، صياغة الإيميلات، والترجمة الفورية بأعلى سرعة وأقل استهلاك.',
      en: 'Optimized for instant chats, fast customer service, email drafting, and real-time translation with minimal latency.',
      zh: '专为即时聊天、快速客户服务、邮件起草和实时多语言翻译优化。',
      ru: 'Оптимизирован для мгновенных чатов, поддержки клиентов, составления писем и быстрого перевода.',
      fr: 'Optimisé pour les échanges instantanés, le support client rapide, la rédaction d’e-mails et la traduction.',
    },
    accentColor: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    requiresAdminUnlock: false,
    models: [
      {
        id: 'llama3.2:3b',
        name: 'Llama 3.2 (3B Ultra-Fast)',
        family: 'Llama',
        parameterSize: '3B',
        tier: 'tier-1',
        description: {
          ar: 'النموذج فائق السرعة من Meta لمعالجة المحادثات اليومية والملخصات الفورية بدقة عالية.',
          en: 'Ultra-fast Meta model for quick daily chat, rapid summaries, and instant queries.',
          zh: 'Meta 超高速轻量模型，适用于日常对话与即时摘要。',
          ru: 'Сверхбыстрая модель Meta для повседневных запросов и резюме.',
          fr: 'Modèle ultra-rapide de Meta pour conversations et résumés instantanés.',
        },
        strengths: ['استجابة فورية <200ms', 'استهلاك موارد منخفض جداً', 'دعم ممتاز للغة العربية والإنجليزية'],
        contextWindow: 128000,
        recommendedFor: ['خدمة العملاء السريعة', 'كتابة محتوى خفيف', 'ترجمة المصطلحات'],
      },
      {
        id: 'qwen2.5:7b',
        name: 'Qwen 2.5 (7B Multilingual)',
        family: 'Qwen',
        parameterSize: '7B',
        tier: 'tier-1',
        description: {
          ar: 'نموذج علي بابا المتفوق في اللغات العالمية وصياغة الردود التجارية والتسويقية.',
          en: 'Alibaba versatile model renowned for outstanding multilingual handling and business copy.',
          zh: '阿里巴巴多语言模型，在多语言理解和商业文案生成中表现优异。',
          ru: 'Многоязычная модель Alibaba с отличным пониманием коммерческих текстов.',
          fr: 'Modèle multilingue d’Alibaba pour rédaction commerciale et compréhension.',
        },
        strengths: ['إتقان اللغات الصينية والعربية والروسية', 'صياغة تسويقية احترافية', 'دقة استخراج البيانات'],
        contextWindow: 128000,
        recommendedFor: ['التواصل مع الموردين بالصينية', 'خدمة العملاء متعددة اللغات', 'ترجمة العقود'],
      },
      {
        id: 'mistral:7b',
        name: 'Mistral 7B Instruct',
        family: 'Mistral',
        parameterSize: '7B',
        tier: 'tier-1',
        description: {
          ar: 'النموذج الأوروبي الشهير بالكفاءة العالية في فهم التعليمات المعقدة في حجم خفيف.',
          en: 'Celebrated European model with razor-sharp instruction-following in a compact footprint.',
          zh: '高能效欧洲模型，擅长精确遵循指令与快速应答。',
          ru: 'Популярная европейская модель для точного следования инструкциям.',
          fr: 'Modèle européen réputé pour son respect précis des instructions.',
        },
        strengths: ['التزام دقيق بالأوامر', 'تحليل فوري للفواتير', 'مرونة التنسيق البرمجي'],
        contextWindow: 32000,
        recommendedFor: ['تنسيق مخرجات JSON', 'صياغة رسائل المتابعة للعملاء', 'إعداد التقارير'],
      },
      {
        id: 'gemma2:2b',
        name: 'Gemma 2 (2B Google Nano)',
        family: 'Gemma',
        parameterSize: '2B',
        tier: 'tier-1',
        description: {
          ar: 'نموذج جوجل الخفيف والمبتكر المبني على تقنيات Gemini لأسرع تنفيذ عند الطلب.',
          en: 'Google ultra-compact powerhouse built on Gemini technology for lightning response.',
          zh: 'Google 超紧凑模型，基于 Gemini 技术架构，毫秒级响应。',
          ru: 'Компактная модель Google на архитектуре Gemini для быстрых ответов.',
          fr: 'Modèle ultra-compact de Google basé sur Gemini pour une vitesse maximale.',
        },
        strengths: ['أسرع نموذج بالمنظومة', 'خفة استثنائية في الذاكرة', 'إجابات موجزة ومباشرة'],
        contextWindow: 8192,
        recommendedFor: ['المساعدات السريعة', 'التحقق من البيانات', 'أجهزة الموبايل'],
      },
      {
        id: 'phi3:mini',
        name: 'Phi-3 Mini (3.8B Microsoft)',
        family: 'Phi',
        parameterSize: '3.8B',
        tier: 'tier-1',
        description: {
          ar: 'نموذج مايكروسوفت المركز على المنطق الرياضي والبيانات النظيفة عالية الجودة.',
          en: 'Microsoft textbook-quality reasoning model with stellar quality-to-size ratio.',
          zh: '微软高质量精炼模型，注重逻辑结构与高质量文本生成。',
          ru: 'Модель Microsoft высокого качества для быстрых расчетов и логики.',
          fr: 'Modèle Microsoft axé sur la logique et la qualité des textes.',
        },
        strengths: ['منطق قوي بحجم صغير', 'حسابات دقيقة', 'إجابات منظمة بنقاط'],
        contextWindow: 128000,
        recommendedFor: ['حساب رسوم بوابات الدفع', 'تدقيق التكاليف اليومية'],
      },
    ],
  },

  'tier-2': {
    id: 'tier-2',
    badge: 'Tier 2 · Pro',
    iconName: 'Cpu',
    title: {
      ar: 'المستوى الثاني: الاحترافي والمتقدم (Pro & Analytical)',
      en: 'Tier 2: Pro & Analytical',
      zh: '第二级：专业与深度分析 (Pro & Analytical)',
      ru: 'Уровень 2: Профессиональный и аналитический',
      fr: 'Niveau 2 : Professionnel et Analytique',
    },
    subtitle: {
      ar: 'مخصص لتحليل عمليات الدفع المعقدة، تشخيص أسباب رفض البوابات، كتابة أكواد الـ API، ومراجعة سياسات التاجر والمخاطر.',
      en: 'Engineered for in-depth payment diagnosis, gateway integration troubleshooting, code synthesis, and merchant compliance auditing.',
      zh: '适用于支付诊断、网关接口排查、代码生成与商户风控策略审计。',
      ru: 'Для углубленного анализа отказов шлюзов, интеграции API и аудита рисков.',
      fr: 'Conçu pour le diagnostic approfondi des paiements, le code d’intégration et l’audit des risques.',
    },
    accentColor: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    requiresAdminUnlock: false,
    models: [
      {
        id: 'llama3.1:70b',
        name: 'Llama 3.1 (70B Enterprise)',
        family: 'Llama',
        parameterSize: '70B',
        tier: 'tier-2',
        description: {
          ar: 'النموذج القياسي للشركات من Meta بقدرات ذكاء استثنائية في التحليل المؤسسي والاستراتيجيات المالية.',
          en: 'Meta flagship enterprise model with elite comprehension, complex synthesis, and deep knowledge.',
          zh: 'Meta 旗舰企业级大模型，具备出色的业务分析与商业策略推理能力。',
          ru: 'Флагманская модель Meta 70B для глубокого анализа и корпоративных задач.',
          fr: 'Modèle d’entreprise de pointe Meta 70B pour l’analyse avancée.',
        },
        strengths: ['فهم عميق لبنى الدفع العالمية', 'كتابة شروط وأحكام وسياسات كاملة', 'تحليل جداول المعاملات الكبيرة'],
        contextWindow: 128000,
        recommendedFor: ['تحليل أداء البوابات', 'صياغة عقود التجار', 'استراتيجية التوسع الدولي'],
      },
      {
        id: 'deepseek-coder:33b',
        name: 'DeepSeek Coder (33B Instruct)',
        family: 'DeepSeek',
        parameterSize: '33B',
        tier: 'tier-2',
        description: {
          ar: 'النموذج المتخصص عالمياً في كتابة وتصحيح أكواد الـ API وتكامل بوابات الدفع (Telr, PayTabs, Webhooks).',
          en: 'World-class code intelligence engine tailored for API integrations, webhooks debugging, and payment pipelines.',
          zh: '顶尖编程模型，专用于 API 集成、回调 Webhooks 调试和支付接口开发。',
          ru: 'Специализированная модель для написания кода, API и отладки платежных шлюзов.',
          fr: 'Modèle d’ingénierie logicielle pour l’intégration d’API et les webhooks.',
        },
        strengths: ['تصحيح أخطاء الـ Webhooks بدقة 100%', 'توليد أكواد Node.js, Python, PHP, cURL', 'تحليل استجابات JSON المعقدة'],
        contextWindow: 64000,
        recommendedFor: ['ربط بوابات الدفع', 'أتمتة الفواتير', 'تصحيح الـ Callback Signature'],
      },
      {
        id: 'qwen2.5:32b',
        name: 'Qwen 2.5 (32B High-Precision)',
        family: 'Qwen',
        parameterSize: '32B',
        tier: 'tier-2',
        description: {
          ar: 'توازن مثالي بين سرعة التنفيذ والذكاء التحليلي العالي مع دعم متعدد اللغات لا يضاهى.',
          en: 'Golden balance of throughput and high-precision analytical intelligence across all major languages.',
          zh: '速度与深度推理的黄金平衡点，在多语言复杂报表分析中表现突出。',
          ru: 'Баланс высокой точности и скорости для аналитических отчетов.',
          fr: 'Équilibre parfait entre vitesse et analyse de haute précision.',
        },
        strengths: ['تحليل تباين العملات وصرف العملات', 'دعم استثنائي للعربية والروسية والصينية والفرنسية', 'تقارير مالية مفصلة'],
        contextWindow: 128000,
        recommendedFor: ['تدقيق رسوم العملات الأجنبية', 'إعداد تقارير الـ P&L', 'استشارات التاجر المتقدمة'],
      },
      {
        id: 'mistral-large:latest',
        name: 'Mistral Large 2 (123B SOTA)',
        family: 'Mistral',
        parameterSize: '123B',
        tier: 'tier-2',
        description: {
          ar: 'العملاق الأوروبي الرائد في فهم اللغات الأوروبية والمنطق المؤسسي الدقيق.',
          en: 'European flagship titan for sophisticated corporate logic, legal understanding, and multilingual prowess.',
          zh: '欧洲顶尖超大规模模型，擅长法律合规与跨国金融监管分析。',
          ru: 'Крупнейшая европейская модель для сложной юридической и финансовой логики.',
          fr: 'Le fleuron européen pour la logique institutionnelle et la conformité financière.',
        },
        strengths: ['فهم قوانين الدفع الأوروبية والخليجية', 'صياغة لوائح الامتثال PCI-DSS', 'استدلال لغوي متفوق بالفرنسية والإنجليزية'],
        contextWindow: 128000,
        recommendedFor: ['مراجعة الامتثال المالي', 'سياسات النزاعات والاسترجاع (Chargebacks)'],
      },
    ],
  },

  'tier-3': {
    id: 'tier-3',
    badge: 'Tier 3 · Reasoning',
    iconName: 'BrainCircuit',
    title: {
      ar: 'المستوى الثالث: الاستدلال العميق والمنطق الرياضي (Deep Reasoning & Expert)',
      en: 'Tier 3: Deep Reasoning & Expert',
      zh: '第三级：深度推理与专家逻辑 (Deep Reasoning & Expert)',
      ru: 'Уровень 3: Глубокое рассуждение и экспертная логика',
      fr: 'Niveau 3 : Raisonnement Approfondi et Expert',
    },
    subtitle: {
      ar: 'مخصص لحل معضلات الرفض المعقدة عبر سلاسل التفكير (Chain-of-Thought)، التنبؤ بنسب قبول الـ BINs، والتحليل الجنائي للاحتيال.',
      en: 'Engineered for solving convoluted failure puzzles via step-by-step Chain-of-Thought, BIN probability forecasts, and fraud forensics.',
      zh: '利用逐步思维链（Chain-of-Thought）解决复杂拒付难题、预测 BIN 接受率与反欺诈溯源。',
      ru: 'Решение сложных задач через пошаговое рассуждение (Chain-of-Thought), прогноз BIN и расследование мошенничества.',
      fr: 'Résolution des problèmes complexes via la chaîne de pensée (Chain-of-Thought) et prévision BIN.',
    },
    accentColor: '#8b5cf6',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    requiresAdminUnlock: false,
    models: [
      {
        id: 'deepseek-r1:70b',
        name: 'DeepSeek-R1 (70B Thinking Reasoner)',
        family: 'DeepSeek',
        parameterSize: '70B',
        tier: 'tier-3',
        description: {
          ar: 'نموذج الاستدلال الأقوى عالمياً مع إظهار سلسلة التفكير خطوة بخطوة وحل أكثر المشكلات المالية تعقيداً.',
          en: 'Global frontier reasoning model displaying explicit step-by-step thinking traces to dissect payment failures.',
          zh: '全球顶尖推理模型，展示逐步思维链（<think>），攻克最棘手的拒付根因与数学推演。',
          ru: 'Ведущая мировая модель рассуждений с отображением хода мыслей шаг за шагом.',
          fr: 'Modèle de raisonnement de pointe affichant sa réflexion étape par étape.',
        },
        strengths: ['سلسلة تفكير واضحة <think>...', 'تحليل احتمالات قبول الـ BIN بنسبة 99.4%', 'كشف شبكات الاحتيال المنظمة والأنماط الشاذة'],
        contextWindow: 128000,
        recommendedFor: ['تشخيص الرفض غير المفهوم', 'التنبؤ المالي التاريخي', 'تفكيك سيناريوهات الهجمات'],
      },
      {
        id: 'deepseek-r1:32b',
        name: 'DeepSeek-R1 (32B Balanced Reasoner)',
        family: 'DeepSeek',
        parameterSize: '32B',
        tier: 'tier-3',
        description: {
          ar: 'نسخة سريعة وعالية الدقة من نموذج R1 للتفكير الرياضي والاستدلال السريع على السيرفر.',
          en: 'Balanced, highly-responsive R1 variant specialized in quantitative reasoning and swift forensic deduction.',
          zh: '兼顾速度与高精度的 R1 推理版本，擅长量化分析与快速因果推演。',
          ru: 'Быстрая версия R1 для количественного анализа и оперативных выводов.',
          fr: 'Version équilibrée de R1 pour une réflexion quantitative et rapide.',
        },
        strengths: ['استدلال فوري متقدم', 'تفكيك أكواد الخطأ المصرفية ISO-8583', 'حساب نسب المخاطرة التراكمية'],
        contextWindow: 64000,
        recommendedFor: ['مساعدات الفحص المباشر', 'مقارنة سجلات الرفض اللحظية'],
      },
      {
        id: 'qwq:32b',
        name: 'QwQ (32B Thinking Engine)',
        family: 'Qwen',
        parameterSize: '32B',
        tier: 'tier-3',
        description: {
          ar: 'نموذج التفكير التنافسي من Qwen المصمم لحل المعضلات المنطقية والحسابية المستعصية.',
          en: 'Competitive reasoning engine by Qwen engineered for intense logical hurdles and quantitative optimization.',
          zh: '千问深度思维引擎，专攻棘手逻辑难题与多约束条件下的最优解推演。',
          ru: 'Конкурентный логический движок Qwen для решения сложных многофакторных задач.',
          fr: 'Moteur de réflexion Qwen pour les défis logiques et mathématiques intenses.',
        },
        strengths: ['تتبع الفرضيات المتعددة', 'حساب احتمالات البنوك المصدرة بدقة رياضية', 'اقتراح خطط التوجيه الذكي Smart Routing'],
        contextWindow: 128000,
        recommendedFor: ['هندسة مسارات الدفع الاحتياطية', 'تحليل أسباب فشل 3DS2'],
      },
      {
        id: 'llama3.3:70b',
        name: 'Llama 3.3 (70B State-of-the-Art)',
        family: 'Llama',
        parameterSize: '70B',
        tier: 'tier-3',
        description: {
          ar: 'أحدث إصدار من Llama يقدم أداءً يوازي أضخم النماذج مع قدرات تفكير منطقي متطورة.',
          en: 'Latest SOTA Llama delivering flagship intelligence on par with previous 405B generations.',
          zh: 'Meta 最新旗舰开源模型，具备比肩更大参数量模型的深层推演实力。',
          ru: 'Новейшая модель Llama 3.3 с передовым уровнем логического мышления.',
          fr: 'Dernière version Llama 3.3 offrant des performances de pointe.',
        },
        strengths: ['دقة لغوية وتحليلية قصوى', 'توليد خطط استجابة للطوارئ عند توقف البوابات', 'معالجة نصوص وسجلات ضخمة'],
        contextWindow: 128000,
        recommendedFor: ['إدارة أزمات انقطاع بوابات الدفع', 'تدقيق العمليات المصرفية الكبرى'],
      },
    ],
  },

  'tier-x': {
    id: 'tier-x',
    badge: 'Tier X · Abliterated Core',
    iconName: 'Flame',
    title: {
      ar: 'المستوى الرابع (X): النماذج الحرة المفرغة من القيود (ABLITERATED & RAW ENGINE)',
      en: 'Tier X: Abliterated & Uncensored Core',
      zh: '第四级 (X)：无限制去审查核心引擎 (Abliterated & Raw)',
      ru: 'Уровень IV (X): Модели без ограничений (Abliterated Core)',
      fr: 'Niveau IV (X) : Moteur Sans Restriction (Abliterated Core)',
    },
    subtitle: {
      ar: 'خاص بالمسؤول فقط (Admin Only). نماذج مُفرغة من القيود الصناعية (Abliterated / De-aligned) للتحليل الجنائي الخام، فحص الثغرات الحقيقي، واختبار اختراق البوابات دون أي حجب أو قيود مصطنعة.',
      en: 'Exclusive Admin-Only Tier. Abliterated / de-aligned models with removed artificial safety guardrails for raw forensic teardowns, real vulnerability auditing, and unrestricted gateway stress testing.',
      zh: '仅限管理员启用 (Admin Only)。经过 Abliterated 去审查微调的模型，用于纯粹的安全渗透测试、底层银行漏洞深度还原及不受限的真实攻防推演。',
      ru: 'Только для Администратора. Модели с убранными цензурными ограничениями (Abliterated) для глубинного расследования уязвимостей и стресс-тестов шлюзов.',
      fr: 'Réservé à l’administrateur uniquement. Modèles « Abliterated » débridés pour l’analyse médico-légale brute et les tests de pénétration.',
    },
    accentColor: '#f97316',
    bgColor: '#fff7ed',
    borderColor: '#fdba74',
    requiresAdminUnlock: true,
    models: [
      {
        id: 'llama3.1:70b-instruct-abliterated',
        name: 'Llama 3.1 70B (Abliterated RAW)',
        family: 'Llama-Abliterated',
        parameterSize: '70B',
        tier: 'tier-x',
        isAbliterated: true,
        description: {
          ar: 'النسخة المفرغة القيود بالكامل من Llama 70B: تقدم تحليلاً صريحاً ومباشراً بدون أي رفض لطلبات فحص الثغرات والتدقيق الأمني الصارم.',
          en: 'Full abliterated Llama 70B weights: offers direct, unfiltered penetration auditing and raw financial bypass forensics.',
          zh: '完全去审查微调版 70B：对渗透测试、银行风控底层拦截机制与攻防测试提供直白无滤镜的深度解析。',
          ru: 'Полностью освобожденная версия Llama 70B для прямого аудита безопасности без цензуры.',
          fr: 'Version entièrement débridée de Llama 70B pour l’audit sans filtre.',
        },
        strengths: ['لا يرفض الإجابة عن تحليلات الثغرات', 'كشف الثغرات الأمنية في بوابات الدفع بدقة واقعية', 'تحليل حقيقي لطرق تزييف الـ Fingerprint و IP'],
        contextWindow: 128000,
        recommendedFor: ['اختبار اختراق بوابات التاجر', 'كشف ثغرات الـ Man-in-the-Middle', 'محاكاة الهجمات المعقدة'],
      },
      {
        id: 'deepseek-r1:70b-abliterated',
        name: 'DeepSeek-R1 70B (Abliterated Reasoner)',
        family: 'DeepSeek-Abliterated',
        parameterSize: '70B',
        tier: 'tier-x',
        isAbliterated: true,
        description: {
          ar: 'تفكير عميق واستدلال رياضي خالص بدون أي كوابح أيديولوجية أو قيود سلامة وهمية.',
          en: 'Raw mathematical Chain-of-Thought reasoning with all artificial censorship vectors eradicated.',
          zh: '去审查版 DeepSeek-R1：彻底消除安全约束抑制，输出最纯粹的底层推演思维链。',
          ru: 'Неограниченная версия DeepSeek-R1 для чистого математического и системного анализа.',
          fr: 'DeepSeek-R1 sans barrières pour un raisonnement brut et absolu.',
        },
        strengths: ['سلاسل تفكير غير مشذبة', 'تفكيك أسرار التشفير المصرفي', 'تحليل عميق لأنظمة المراقبة البنكية'],
        contextWindow: 128000,
        recommendedFor: ['فحص أنظمة مكافحة غسيل الأموال AML', 'اختبار حدود مرونة البوابات'],
      },
      {
        id: 'mistral-nemo:12b-abliterated',
        name: 'Mistral NeMo 12B (Abliterated)',
        family: 'Mistral-Abliterated',
        parameterSize: '12B',
        tier: 'tier-x',
        isAbliterated: true,
        description: {
          ar: 'نموذج سريع ومفتوح القيود من Mistral و Nvidia، ممتاز للمحاكاة الفورية للهجمات وتجارب الـ Spoofing.',
          en: 'Fast unaligned Mistral/Nvidia 12B model tailored for instant spoofing simulation and unrestricted threat triage.',
          zh: '去审查轻量高能版，非常适合即时伪装模拟与未过滤的安全威胁评估。',
          ru: 'Быстрая модель без цензуры для моделирования атак и спуфинга.',
          fr: 'Modèle rapide non censuré pour les simulations d’attaques et de spoofing.',
        },
        strengths: ['سرعة فائقة في المحاكاة', 'لا وجود لرسائل الرفض التقليدية', 'فحص مصفوفات الـ BIN دون تحيز'],
        contextWindow: 128000,
        recommendedFor: ['فحص أدوات التزييف وتغيير الـ IP', 'اختبار استجابة البوابات تحت الهجوم'],
      },
      {
        id: 'dolphin-mixtral:8x7b-abliterated',
        name: 'Dolphin Mixtral 8x7B (Uncensored)',
        family: 'Dolphin',
        parameterSize: '8x7B MoE',
        tier: 'tier-x',
        isAbliterated: true,
        description: {
          ar: 'النموذج الشهير المفتوح بالكامل من إريك هارتفورد مع معمارية MoE لتفكيك أكثر الأنظمة سرية.',
          en: 'Legendary uncensored MoE model by Eric Hartford offering raw versatility without preaching.',
          zh: '传奇开源非审查混合专家模型（MoE），提供毫无保留的深度技术解构。',
          ru: 'Легендарная модель без цензуры для глубокой деконструкции сложных систем.',
          fr: 'Modèle emblématique sans censure pour les investigations techniques avancées.',
        },
        strengths: ['معمارية Mixture-of-Experts', 'ردود موضوعية بدون وعظ أو محاضرات أخلاقية', 'كشف الثغرات الكامنة في أنظمة الـ POS والويب'],
        contextWindow: 32000,
        recommendedFor: ['التدقيق الجنائي الشامل', 'تحليل الهندسة العكسية لبوابات الدفع'],
      },
      {
        id: 'qwen2.5:72b-abliterated',
        name: 'Qwen 2.5 72B (Abliterated Multilingual)',
        family: 'Qwen-Abliterated',
        parameterSize: '72B',
        tier: 'tier-x',
        isAbliterated: true,
        description: {
          ar: 'العملاق متعدد اللغات بحرية كاملة لكشف السياسات المصرفية العابرة للحدود وقوانين الحظر الدولية.',
          en: 'Unrestricted multilingual colossus analyzing cross-border banking restrictions, sanctions, and clearance nuances.',
          zh: '完全去审查版 72B，深入洞察跨境汇款限制、跨行黑名单与国际清算底牌。',
          ru: 'Многоязычная модель 72B без цензуры для анализа трансграничных банковских блокировок.',
          fr: 'Colosse multilingue débridé analysant les restrictions bancaires internationales.',
        },
        strengths: ['تحليل الحظر المصرفي الدولي', 'دعم استثنائي لكل اللغات دون تحفظ', 'تفكيك أسباب إدراج الـ BIN في القوائم السوداء'],
        contextWindow: 128000,
        recommendedFor: ['حل مشكلات الحظر الجغرافي للبنوك', 'التداول الدولي عالي المخاطر'],
      },
    ],
  },
};

// All available models in a single flat array
export const ALL_OLLAMA_MODELS: OllamaModelDefinition[] = [
  ...AI_TIERS['tier-1'].models,
  ...AI_TIERS['tier-2'].models,
  ...AI_TIERS['tier-3'].models,
  ...AI_TIERS['tier-x'].models,
];

// Server Configuration State Interface
export interface OllamaServerConfig {
  host: string;
  adminSecret: string;
  isTierXUnlocked: boolean;
  unlockedAt?: string;
  activeTier: AiTierId | 'auto';
  selectedModelId: string;
  isAutoRouterEnabled: boolean;
}

// LocalStorage key
export const OLLAMA_CONFIG_KEY = 'oneshot_ollama_server_config';

export function getSavedOllamaConfig(): OllamaServerConfig {
  try {
    const raw = localStorage.getItem(OLLAMA_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OllamaServerConfig>;
      return {
        host: parsed.host || 'http://localhost:11434',
        adminSecret: parsed.adminSecret || '',
        isTierXUnlocked: parsed.isTierXUnlocked || false,
        unlockedAt: parsed.unlockedAt,
        activeTier: parsed.activeTier || 'auto',
        selectedModelId: parsed.selectedModelId || 'deepseek-r1:70b',
        isAutoRouterEnabled: parsed.isAutoRouterEnabled ?? true,
      };
    }
  } catch {
    // fallback
  }

  return {
    host: 'http://localhost:11434',
    adminSecret: '',
    isTierXUnlocked: false,
    activeTier: 'auto',
    selectedModelId: 'deepseek-r1:70b',
    isAutoRouterEnabled: true,
  };
}

export function saveOllamaConfig(config: OllamaServerConfig) {
  try {
    localStorage.setItem(OLLAMA_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

// ============================================================================
// INTELLIGENT AUTO-ROUTER (نظام التوجيه الذكي لتحديد النموذج الأنسب)
// ============================================================================
export interface RouteDecision {
  tierId: AiTierId;
  model: OllamaModelDefinition;
  reason: {
    ar: string;
    en: string;
    zh: string;
    ru: string;
    fr: string;
  };
  confidence: number;
}

export function autoRouteQuery(
  prompt: string,
  tierXUnlocked: boolean
): RouteDecision {
  const text = prompt.toLowerCase().trim();

  // 1. Check for Tier X triggers (Only if Admin has unlocked Tier X)
  const tierXTriggers = [
    'abliterated', 'uncensored', 'ثغرة', 'ثغرات', 'اختراق', 'تجاوز الحظر',
    'spoofing', 'باي باس', 'bypass', 'jailbreak', 'raw model', 'محرر', 'بدون قيود',
    'قائمة سوداء', 'blacklist bypass', 'هندسة عكسية', 'exploit', 'unfiltered'
  ];
  if (tierXUnlocked && tierXTriggers.some(kw => text.includes(kw))) {
    const model = AI_TIERS['tier-x'].models[0]; // llama3.1:70b-instruct-abliterated
    return {
      tierId: 'tier-x',
      model,
      reason: {
        ar: 'تم التوجيه تلقائياً إلى المستوى الرابع X (Abliterated Core) لاكتشاف كلمات مفتاحية تتطلب تحليلاً جنائياً غير مقيد وفحص ثغرات متقدم.',
        en: 'Auto-routed to Tier X (Abliterated Core) due to security penetration and unrestricted vulnerability teardown intent.',
        zh: '已自动导向第四级 X (去审查核心引擎)：识别出深层漏洞渗透与无限制攻防分析意图。',
        ru: 'Автоматически направлено на Уровень X (Abliterated): обнаружен запрос на аудит уязвимостей без цензуры.',
        fr: 'Routé automatiquement vers le Niveau X (Abliterated) pour analyse médico-légale sans filtre.',
      },
      confidence: 0.98,
    };
  }

  // 2. Check for Tier 3 triggers (Reasoning, forensics, complex math, predictive model, BIN probabilities)
  const tier3Triggers = [
    'تنبؤ', 'احتمال', 'توقع', 'سبب الرفض', 'تحليل عميق', 'احتيال', 'fraud',
    'forensics', 'bin', 'تفكير', 'خطوة بخطوة', 'reasoning', 'think', 'math',
    'حساب دقيق', 'لماذا تم رفض', '3ds failure', 'do_not_honor', 'قواعد المخاطر',
    'predict', 'forecast', 'matrix', 'cross-border', 'نسبة القبول'
  ];
  if (tier3Triggers.some(kw => text.includes(kw))) {
    const model = text.includes('bin') || text.includes('تنبؤ') || text.includes('احتيال')
      ? AI_TIERS['tier-3'].models[0] // deepseek-r1:70b
      : AI_TIERS['tier-3'].models[1]; // deepseek-r1:32b
    return {
      tierId: 'tier-3',
      model,
      reason: {
        ar: 'تم التوجيه إلى المستوى الثالث (Deep Reasoning · DeepSeek-R1) لحل مسألة معقدة تتطلب سلاسل تفكير منطقي ونمذجة احتمالية دقيقة.',
        en: 'Auto-routed to Tier 3 (Deep Reasoning · DeepSeek-R1) to utilize Chain-of-Thought problem solving and mathematical modeling.',
        zh: '已自动导向第三级 (深度推理 · DeepSeek-R1)：检测到需要逐步思维链推演与概率预测的高难度问题。',
        ru: 'Направлено на Уровень 3 (DeepSeek-R1): сложная задача, требующая пошагового логического рассуждения.',
        fr: 'Routé vers le Niveau 3 (DeepSeek-R1) pour un raisonnement analytique approfondi pas-à-pas.',
      },
      confidence: 0.95,
    };
  }

  // 3. Check for Tier 2 triggers (Code, APIs, webhooks, Telr/PayTabs integrations, policies, SQL, merchant setups)
  const tier2Triggers = [
    'api', 'كود', 'code', 'برمجة', 'webhook', 'telr', 'paytabs', 'json',
    'ربط', 'تكامل', 'دالة', 'script', 'function', 'curl', 'nodejs', 'python',
    'سياسة', 'عقد', 'شروط', 'policy', 'merchant setting', 'إعدادات التاجر',
    'تقرير مالي', 'profit', 'ضرائب', 'vat', 'chargeback', 'استرجاع'
  ];
  if (tier2Triggers.some(kw => text.includes(kw))) {
    const isCoding = ['كود', 'code', 'webhook', 'api', 'curl', 'json'].some(k => text.includes(k));
    const model = isCoding ? AI_TIERS['tier-2'].models[1] : AI_TIERS['tier-2'].models[0];
    return {
      tierId: 'tier-2',
      model,
      reason: {
        ar: `تم التوجيه إلى المستوى الثاني (Pro & Analytical · ${model.name}) لاكتشاف سياق تقني أو محاسبي أو برمجي يتطلب دقة احترافية.`,
        en: `Auto-routed to Tier 2 (Pro & Analytical · ${model.name}) for technical, programming, or financial accuracy.`,
        zh: `已自动导向第二级 (专业分析 · ${model.name})：识别出接口编程、技术排查或商户财务策略需求。`,
        ru: `Направлено на Уровень 2 (${model.name}): обнаружен технический или программный контекст.`,
        fr: `Routé vers le Niveau 2 (${model.name}) pour précision technique et intégration.`,
      },
      confidence: 0.92,
    };
  }

  // 4. Default to Tier 1 (Fast & Efficient) for greetings, general questions, copy drafting, simple emails
  const defaultModel = AI_TIERS['tier-1'].models[0]; // llama3.2:3b
  return {
    tierId: 'tier-1',
    model: defaultModel,
    reason: {
      ar: 'تم التوجيه إلى المستوى الأول (Fast & Efficient · Llama 3.2) لتقديم استجابة سريعة فورية تستهلك أقل قدر من الموارد.',
      en: 'Auto-routed to Tier 1 (Fast & Efficient · Llama 3.2) for lightning-fast latency and concise generation.',
      zh: '已自动导向第一级 (快速高效 · Llama 3.2)：适合日常问答与高频即时交互。',
      ru: 'Направлено на Уровень 1 (Llama 3.2): мгновенный ответ с минимальной задержкой.',
      fr: 'Routé vers le Niveau 1 (Llama 3.2) pour une réponse ultra-rapide et économique.',
    },
    confidence: 0.88,
  };
}
