import type { Product } from './catalog.js';

export interface ProductEnglishCopy {
  subCategory: string;
  shortDescription: string;
  detailedDescription: string;
  deliverables: string[];
  exclusions: string[];
  revisionsScope: string;
  ctaButton: string;
}

export const catalogEnglishBySku: Record<string, ProductEnglishCopy> = {
  'AUT-01': {
    subCategory: 'Consulting & Process Engineering',
    shortDescription:
      'Audit and analyze 3 manual business workflows in your organization and design an automated workflow blueprint that eliminates wasted hours.',
    detailedDescription:
      'An operational consulting study designed to free your team from repetitive manual tasks. We inspect 3 manual processes consuming staff time (such as copying order data to shipping sheets, sending contract notifications, or sorting invoices and attachments), map detailed digital workflow architecture diagrams, select the most cost-effective automation tools (Make, n8n, or custom scripts), and calculate expected time savings and implementation costs.',
    deliverables: [
      '60-minute discovery and diagnostic session',
      'Digital workflow architecture diagrams for 3 business processes',
      'Prioritized automation recommendations and ROI report (PDF)',
    ],
    exclusions: [
      'Hands-on coding and live execution of automation flows (available via AUT-02 and AUT-03)',
    ],
    revisionsScope: 'Review of workflow diagrams to verify operational edge cases and exceptions',
    ctaButton: 'Request Automation Discovery',
  },
  'AUT-02': {
    subCategory: 'Rapid Workflow Automations',
    shortDescription:
      'Connect two digital apps in a single automated workflow (Trigger + up to 3 Actions) to move data and alerts instantly without human intervention.',
    detailedDescription:
      'Turn repetitive daily actions into an automatic background process. We connect two apps you already use (e.g., website form to Google Sheets with a Telegram/Slack alert) in a tested workflow with up to 3 sequential actions, error logging, and an operational handover guide.',
    deliverables: [
      'One active, tested automation workflow connecting 2 apps (up to 3 actions)',
      'Automated error monitoring log',
      'Operational walkthrough and handover guide',
    ],
    exclusions: [
      'Third-party automation platform subscription fees (Make or Zapier if usage exceeds free tiers)',
      'Custom API development for unsupported legacy systems',
    ],
    revisionsScope: 'Adjusting filter conditions or refining automated message templates',
    ctaButton: 'Request Simple Workflow Automation',
  },
  'AUT-03': {
    subCategory: 'Advanced Multi-System Automation',
    shortDescription:
      'Build an advanced multi-step automation scenario connecting up to 3 systems and 8 actions with conditional routing, data formatting, and error recovery.',
    detailedDescription:
      'End-to-end orchestration for complex operational workflows across up to 3 applications and 8 steps. Includes conditional branching logic, data transformation, automatic retry handling on failure, and a complete architectural map of the scenario.',
    deliverables: [
      'Advanced automation scenario (up to 3 apps and 8 steps)',
      'Smart conditional routing and branching logic',
      'Automated retry and failure recovery handling',
      'Complete workflow documentation map',
    ],
    exclusions: [
      'Middleware platform subscription costs for high-volume enterprise usage (>10,000 operations/month)',
    ],
    revisionsScope: 'Refining branching conditions and payload data formatting',
    ctaButton: 'Request Advanced Automation',
  },
  'AUT-04': {
    subCategory: 'Sales Systems & CRM Pipelines',
    shortDescription:
      'Automatically capture leads from ad campaigns and forms, deduplicate and enrich records, and route prospects into your CRM with instant sales alerts.',
    detailedDescription:
      'Stop losing leads in scattered spreadsheets. We connect your landing pages and lead forms directly to your CRM, apply automatic deduplication and lead scoring/tagging rules, and trigger instant WhatsApp/Slack alerts to your sales reps.',
    deliverables: [
      'Integration of lead forms and ad channels with one CRM system',
      'Automated lead tagging, filtering, and deduplication pipeline',
      'Instant notification trigger for the assigned sales representative',
      'Data flow verification report',
    ],
    exclusions: [
      'Paid CRM platform seat subscriptions',
    ],
    revisionsScope: 'Adjusting lead assignment rules and custom CRM classification fields',
    ctaButton: 'Build Your CRM Lead Pipeline',
  },
  'AUT-05': {
    subCategory: 'Sales & Document Automation',
    shortDescription:
      'Generate branded PDF quotations automatically from a structured input form and deliver them to clients via email or WhatsApp in seconds.',
    detailedDescription:
      'Accelerate your sales cycle with instant, error-free proposals. Your team fills out a simple mobile-ready form, and the system automatically calculates totals, populates a branded PDF quotation template, archives the record, and dispatches it to the client.',
    deliverables: [
      'Responsive data entry form for sales reps',
      'Dynamic PDF quotation template styled with your brand identity',
      'Automated generation and delivery workflow',
      'Centralized log of issued quotations',
    ],
    exclusions: [
      'Paid third-party cryptographic legal e-signature platform fees',
    ],
    revisionsScope: 'Formatting PDF layout margins and form input fields',
    ctaButton: 'Automate Your Quotations',
  },
  'AUT-06': {
    subCategory: 'Digital Document Workflows',
    shortDescription:
      'Automate the creation of contracts, certificates, or operational letters by merging live database rows into 2 branded document templates.',
    detailedDescription:
      'Eliminate manual copy-pasting into Word files. We design two dynamic document templates matched to your brand, connect them to your data source, map up to 10 merge fields per template, and validate batch generation across 20 test documents.',
    deliverables: [
      '2 dynamic document templates aligned with your brand identity',
      'Automation connection to one structured data source',
      'Mapping of up to 10 dynamic fields per template',
      'Live test run generating 20 verified documents',
    ],
    exclusions: [
      'Legal drafting or counsel review of contract clauses',
    ],
    revisionsScope: 'Adjusting document margins and merged field placement',
    ctaButton: 'Automate Business Documents',
  },
  'AUT-07': {
    subCategory: 'Business Intelligence & Reporting',
    shortDescription:
      'A live, interactive cloud dashboard displaying 8 core KPIs and visual charts connected directly to your operational or sales data source.',
    detailedDescription:
      'Replace static weekly spreadsheets with real-time executive visibility. We connect your primary data source to an interactive cloud dashboard featuring 8 key performance indicators, date and category filters, and secure manager access.',
    deliverables: [
      'Interactive cloud dashboard featuring 8 KPIs and visual charts',
      'Dynamic date-range and category filters',
      'Live connection to one primary data source',
      'Secure access link for management',
    ],
    exclusions: [
      'Manual cleaning of unstructured historical legacy data',
      'Paid third-party BI tool licenses if selected by the client',
    ],
    revisionsScope: 'Refining chart types and KPI card arrangement',
    ctaButton: 'Request Live Business Dashboard',
  },
  'AUT-08': {
    subCategory: 'Custom Systems & Control Panels',
    shortDescription:
      'A custom web-based internal operations portal with 3 functional modules, role-based access control, database storage, and Excel exports.',
    detailedDescription:
      'A tailored web application built for your internal operations team. Includes 3 core operational modules (such as orders, inventory, or task tracking), two user permission roles, searchable data tables with Excel export, and full source code delivery.',
    deliverables: [
      'Full web administration portal application',
      '3 custom operational modules',
      '2 user roles with role-based access control',
      'One-click Excel data export feature',
      'Complete source code and database schema',
    ],
    exclusions: [
      'Ongoing cloud server and database hosting fees',
      'Native iOS/Android mobile store applications',
    ],
    revisionsScope: 'Adjusting table columns and data entry screen fields',
    ctaButton: 'Build Custom Operations Portal',
  },
  'AUT-09': {
    subCategory: 'Direct API Engineering',
    shortDescription:
      'Custom REST API and Webhook integration synchronizing 3 core operations between two software platforms with full logging and technical documentation.',
    detailedDescription:
      'When off-the-shelf connectors fall short, we engineer a reliable custom API bridge between two systems. Supports 3 core data synchronization operations, webhook signature validation, error monitoring logs, and concise API documentation.',
    deliverables: [
      'Stable programmatic integration between 2 systems executing 3 core operations',
      'Webhook monitoring and error logging setup',
      'Technical API integration documentation (API Docs)',
    ],
    exclusions: [
      'Refactoring legacy source code inside third-party client systems',
    ],
    revisionsScope: 'Adjusting mapped payload fields and sync frequency',
    ctaButton: 'Request Custom API Integration',
  },
  'AUT-10': {
    subCategory: 'Electronic Payment Gateways',
    shortDescription:
      'End-to-end live integration of one payment gateway (PayTabs, Telr, Tap, or N-Genius) with server-side webhook verification and dashboard logging.',
    detailedDescription:
      'Accept online payments safely and reliably. We integrate one approved payment gateway in live mode, configure hosted checkout redirects, enforce cryptographic server-side webhook verification, log payment statuses in your dashboard, and verify end-to-end settlement.',
    deliverables: [
      'Live integration of one electronic payment gateway',
      'Hosted checkout page configuration',
      'Server-side webhook and cryptographic signature verification',
      'Payment transaction status logging in your control panel',
      'Verified live payment test run',
    ],
    exclusions: [
      'Opening commercial bank accounts or obtaining KYC approval from the gateway provider',
      'Acting as a payment aggregator or holding merchant funds',
    ],
    revisionsScope: 'Refining redirect return pages and payment status messages',
    ctaButton: 'Integrate Payment Gateway',
  },
  'AUT-11': {
    subCategory: 'Self-Service Portals',
    shortDescription:
      'A branded self-service client portal with secure login, order and milestone tracking, document downloads, and revision request submission.',
    detailedDescription:
      'Elevate your client experience with a dedicated self-service web portal under your brand. Clients can sign in securely, track active orders and transaction history, download contracts and invoices, and submit inquiries, while your team manages updates from an admin view.',
    deliverables: [
      'Branded client portal web application',
      'Secure authentication and login system',
      'Client dashboard for order tracking and file downloads',
      'Internal staff admin view for publishing updates',
    ],
    exclusions: [
      'Complex automated recurring billing engines',
      'Financial trading or brokerage features',
    ],
    revisionsScope: 'Adjusting portal screen layouts and field arrangement',
    ctaButton: 'Request Client Portal',
  },
  'AUT-12': {
    subCategory: 'Digital Product Development (SaaS & Apps)',
    shortDescription:
      'Turn your digital product idea into a functional, deployed web MVP featuring up to 5 core screens, user authentication, and a live database.',
    detailedDescription:
      'Validate your startup or internal product idea with real users in weeks instead of months. We design and engineer a working web MVP with up to 5 core functional screens, database persistence, and cloud staging deployment, complete with source code handover.',
    deliverables: [
      'Functional interactive web application deployed on a staging server',
      'Up to 5 core functional screens',
      'Structured operational database',
      'Full source code handover and performance check report',
    ],
    exclusions: [
      'Secondary features outside the core MVP user journey',
      'Native App Store / Google Play submission (built as a responsive Web App)',
    ],
    revisionsScope: 'Refining core user journey flow and screen interactions',
    ctaButton: 'Launch Your MVP Prototype',
  },
  'DIG-01': {
    subCategory: 'Office & Finance Templates',
    shortDescription:
      'Official, editable invoice and quotation templates in Word and Excel formats tailored to your brand colors, logo, and automatic tax calculations.',
    detailedDescription:
      'Issue polished commercial documents that reflect your brand credibility. We customize an official invoice template and quotation template with your logo, typography, and color palette in open Word and Excel formats with built-in VAT and total formulas.',
    deliverables: [
      'Official branded invoice template',
      'Official branded quotation template (editable Word & Excel formats for lifetime use)',
    ],
    exclusions: [
      'Direct cryptographic API integration with ZATCA e-invoicing portals',
    ],
    revisionsScope: 'Adjusting table layout and typography alignment',
    ctaButton: 'Order Branded Templates',
  },
  'DIG-02': {
    subCategory: 'Digital Publishing & E-Books',
    shortDescription:
      'Design and layout of an interactive digital PDF guide or e-book up to 15 pages with clickable navigation, WhatsApp-optimized size, and a 3D cover mockup.',
    detailedDescription:
      'Transform your educational content, company profile, or service guide into an engaging digital publication up to 15 pages. Includes custom editorial layout, clickable table of contents and links, a compressed version for instant WhatsApp sharing, and a 3D book mockup.',
    deliverables: [
      'Interactive digital PDF guide/e-book up to 15 pages',
      'Clickable table of contents and active hyperlinks',
      'Lightweight version optimized for WhatsApp sharing',
      '3D digital cover mockup',
    ],
    exclusions: [
      'Ghostwriting the guide manuscript from scratch',
    ],
    revisionsScope: 'Formatting text blocks, fonts, and visual placement',
    ctaButton: 'Order Digital PDF Guide',
  },
  'DIG-03': {
    subCategory: 'Smart Forms & Documents',
    shortDescription:
      'A branded, fillable interactive PDF form (up to 3 pages and 20 fields) allowing clients to type, select checkboxes, and save directly on phone or desktop.',
    detailedDescription:
      'Replace awkward print-and-scan paperwork with a smart fillable PDF form up to 3 pages and 20 interactive fields (text inputs, checkboxes, date pickers, and dropdowns). Styled with your brand identity and tested across mobile and desktop PDF readers.',
    deliverables: [
      'Interactive fillable PDF form (up to 3 pages and 20 fillable fields)',
      'Official layout styled with your brand identity',
      'Cross-device compatibility testing',
    ],
    exclusions: [
      'Backend cloud database integration',
    ],
    revisionsScope: 'Field sizing and terms copy proofreading',
    ctaButton: 'Order Fillable PDF Form',
  },
  'DIG-04': {
    subCategory: 'Productivity & Spreadsheet Systems',
    shortDescription:
      'A custom automated Google Sheets or Excel tracker with 4 worksheets, protected formulas, conditional formatting, and 6 visual summary charts.',
    detailedDescription:
      'Organize your sales, expenses, or operational tasks in a smart spreadsheet system built for clarity. Includes 4 structured tabs (data entry, reference settings, automated calculations, and an executive summary dashboard with 6 charts) plus a 10-minute video walkthrough.',
    deliverables: [
      'Interactive Excel file / Google Sheets system with 4 worksheets',
      'Protected automated formulas and conditional formatting',
      'Executive summary tab with 6 visual indicators and charts',
      '10-minute recorded video tutorial for your team',
    ],
    exclusions: [
      'Manual entry of historical legacy records',
    ],
    revisionsScope: 'Adding columns or adjusting conditional formatting rules',
    ctaButton: 'Order Automated Tracker',
  },
  'DIG-05': {
    subCategory: 'Operations & Project Management',
    shortDescription:
      'A complete kit of 5 branded operational templates (Project Charter, Kickoff Brief, Status Report, Change Request, and Handover Sign-Off).',
    detailedDescription:
      'Standardize how your agency or company manages client projects from day one to final delivery. You receive 5 cohesive, brand-styled templates in Word and Google Docs covering requirement gathering, weekly progress reporting, scope change control, and formal project sign-off.',
    deliverables: [
      '5 comprehensive branded operational templates in Word & Google Docs formats',
      'Practical implementation guide for each template',
    ],
    exclusions: [
      'Specialized legal drafting of penalty clauses',
    ],
    revisionsScope: 'Adapting template sections and fields to your industry sector',
    ctaButton: 'Order Project Operations Kit',
  },
  'DIG-06': {
    subCategory: 'Enterprise Documentation',
    shortDescription:
      'A comprehensive Standard Operating Procedures (SOP) manual (15–25 pages PDF) documenting 3 core department workflows with actionable checklists.',
    detailedDescription:
      'Turn tribal knowledge into a scalable institutional asset. We interview your subject-matter owner, structure step-by-step procedures, define role responsibilities, and deliver a 15–25 page branded SOP manual covering 3 core operational workflows alongside quick-reference checklists.',
    deliverables: [
      'Polished 15–25 page PDF Standard Operating Procedures manual documenting 3 workflows',
      'Quick-execution checklists for each documented process',
    ],
    exclusions: [
      'Formal ISO certification auditing and external regulatory accreditation',
    ],
    revisionsScope: 'Refining procedural steps and role responsibility matrices',
    ctaButton: 'Order SOP Manual',
  },
  'DIG-07': {
    subCategory: 'Workshops & Training',
    shortDescription:
      'A live 120-minute remote hands-on workshop for up to 5 team members on practical AI productivity, prompt engineering, and daily workflow acceleration.',
    detailedDescription:
      'Empower your team to save hours every week using modern AI tools safely and effectively. This live 120-minute interactive session covers practical prompt engineering, drafting business communications, summarizing reports, and includes a 20-prompt playbook and full session recording.',
    deliverables: [
      'Live 120-minute remote interactive workshop (fully recorded) for up to 5 participants',
      'Comprehensive PDF training workbook',
      'Curated bank of 20 practical business prompts',
    ],
    exclusions: [
      'Paid AI platform seat subscriptions for attendees',
    ],
    revisionsScope: 'Live interactive training session with real-time Q&A throughout the workshop',
    ctaButton: 'Book AI Productivity Workshop',
  },
  'DIG-08': {
    subCategory: 'Enterprise Training Programs',
    shortDescription:
      'An intensive 4-hour remote enterprise AI training program for up to 10 staff members tailored to your department workflows with digital certificates.',
    detailedDescription:
      'A customized corporate AI enablement program delivered over 4 live interactive hours for up to 10 employees. We tailor exercises to your actual marketing, operations, or customer support tasks, review participant outputs live, and provide recordings, reference manuals, and completion certificates.',
    deliverables: [
      '4 hours of live remote training for up to 10 participants',
      'Full video recordings of all training modules',
      'Advanced training manual and reference guide (PDF)',
      'Digital completion certificates for attendees',
    ],
    exclusions: [
      'On-site travel outside Riyadh',
      'Third-party software license fees',
    ],
    revisionsScope: 'Live interactive program with individual review of participant exercises',
    ctaButton: 'Book Enterprise AI Program',
  },
  'DIG-09': {
    subCategory: 'Enablement & Technical Support',
    shortDescription:
      'A live 90-minute training session teaching you or your team (up to 3 people) how to update pages, products, and settings on your website or online store.',
    detailedDescription:
      'Take full control of your website or e-commerce store without waiting on developers for everyday edits. In a live 90-minute screen-sharing session, we walk your team through managing products, updating banners and text, handling orders, and provide both the recording and an illustrated PDF cheat sheet.',
    deliverables: [
      '90-minute live interactive video training session (1-on-1 or up to 3 team members)',
      'Full video recording of the session',
      'Illustrated step-by-step quick reference guide (PDF)',
    ],
    exclusions: [
      'Custom coding or bug fixing on broken websites (focused on CMS operation and training)',
    ],
    revisionsScope: 'Live session with open Q&A throughout the 90 minutes',
    ctaButton: 'Book CMS Training Session',
  },
  'DIG-10': {
    subCategory: 'Ready-to-Use Digital Products',
    shortDescription:
      'A digital pack of 30 modern Canva social media templates (post and story sizes) ready for instant text and color customization (under creation & testing).',
    detailedDescription:
      'Designed for business owners and content creators who want a cohesive visual feed in minutes. Includes 30 editable Canva templates across educational, promotional, and engagement layouts in both 1:1 and 9:16 formats, with a quick brand customization guide. Currently under final creation and QA testing.',
    deliverables: [
      'Permanent digital access link to 30 editable Canva templates',
      'Quick PDF guide for swapping brand colors and typography',
    ],
    exclusions: [
      'Manual graphic customization by the oneShot team',
      'Custom copywriting',
    ],
    revisionsScope: 'Standard digital product sold as-is',
    ctaButton: 'Notify Me / Inquire About Pack',
  },
  'DIG-11': {
    subCategory: 'Ready-to-Use Digital Products',
    shortDescription:
      'An interactive digital vault (PDF + Notion workspace) containing 50 battle-tested business prompts for marketing, sales, and operations (under creation & testing).',
    detailedDescription:
      'Stop guessing how to prompt AI models. This structured vault provides 50 categorized, fill-in-the-blank prompts engineered for Saudi and GCC business contexts across marketing copy, sales outreach, and operational planning, complete with real output examples. Currently under creation and testing.',
    deliverables: [
      'Interactive digital document (PDF + Notion workspace) with 50 categorized prompts',
      'Live examples and practical application guide',
    ],
    exclusions: [
      'Bespoke prompt engineering tailored to a single company voice',
    ],
    revisionsScope: 'Standard digital product sold as-is',
    ctaButton: 'Notify Me / Inquire About Vault',
  },
  'DIG-12': {
    subCategory: 'Freelancer Enablement',
    shortDescription:
      'A 5-template commercial starter kit for freelancers covering quotations, client onboarding briefs, service contracts, and delivery sign-offs (under creation & testing).',
    detailedDescription:
      'The essential commercial toolkit for independent consultants and freelancers to manage clients professionally. Includes 5 editable Word and Google Docs templates: financial proposal, freelance service agreement, client communication scripts, creative brief questionnaire, and final delivery sign-off form. Currently under creation and testing.',
    deliverables: [
      '5 editable digital document templates in Word & Google Docs formats',
      'Practical guide on pricing freelance services and managing client expectations',
    ],
    exclusions: [
      'Manual branding customization with an individual freelancer logo',
    ],
    revisionsScope: 'Standard digital product sold as-is',
    ctaButton: 'Notify Me / Inquire About Kit',
  },
  'MKT-01': {
    subCategory: 'Consulting & Diagnostics',
    shortDescription:
      'A focused 90-minute consulting session to audit your current marketing funnel, uncover conversion leaks, and prioritize rapid growth actions.',
    detailedDescription:
      'An intensive, hands-on 90-minute marketing diagnostic session with a senior strategist to review your digital channels, analyze your customer journey and offers, and pinpoint conversion bottlenecks. You leave with a recorded session and a clear 30-day executive priority roadmap.',
    deliverables: [
      'Recorded 90-minute live video diagnostic session',
      '2–3 page executive priority action report (PDF)',
    ],
    exclusions: [
      'Paid ad campaign execution',
      'Ongoing social media account management',
      'Copywriting production',
    ],
    revisionsScope: 'Clarifying and refining the executive priority document and action steps',
    ctaButton: 'Book Diagnostic Session',
  },
  'MKT-05': {
    subCategory: 'Content Strategy',
    shortDescription:
      'A 30-day content strategy calendar for two social platforms featuring 20 creative post angles and sales hooks tailored to the Saudi market.',
    detailedDescription:
      'A comprehensive 30-day strategic content calendar built for two social media channels and tailored to Saudi and GCC audience behavior. Includes 20 structured content concepts balancing educational, trust-building, and direct sales angles, complete with hooks, filming directions, posting times, and hashtag sets.',
    deliverables: [
      'Interactive 30-day content calendar',
      '20 content concepts with hooks and visual/filming angles',
      'Recommended posting schedule and curated hashtag groups',
    ],
    exclusions: [
      'Graphic design and video editing production',
    ],
    revisionsScope: 'Refining content concepts and messaging angles',
    ctaButton: 'Order Monthly Content Calendar',
  },
  'MKT-06': {
    subCategory: 'Advertising Copywriting',
    shortDescription:
      'Creative, conversion-focused ad copy and captions for 10 social media posts written in your brand voice with clear calls to action.',
    detailedDescription:
      'Professional copywriting for 10 promotional and engagement social media posts that capture your brand voice and speak directly to your target customer. Each post includes on-graphic headline copy, an engaging caption, a strategic call to action (CTA), and relevant hashtags.',
    deliverables: [
      'Copywriting for 10 visual social media posts (on-design text + caption)',
      'Tailored Call-to-Action (CTA) for each post',
      'Targeted hashtag sets',
    ],
    exclusions: [
      'Graphic design artwork',
    ],
    revisionsScope: 'Fine-tuning tone of voice and target keywords',
    ctaButton: 'Order Social Copywriting Pack',
  },
  'MKT-10': {
    subCategory: 'E-Commerce Copywriting',
    shortDescription:
      'Persuasive, SEO-friendly product descriptions for 20 e-commerce items engineered to highlight benefits and boost store conversion rates.',
    detailedDescription:
      'Upgrade your online store with persuasive, SEO-optimized product copy for 20 catalog items. We translate technical specs into clear customer benefits that answer buyer objections, improve search visibility, and increase add-to-cart conversion rates.',
    deliverables: [
      'Persuasive sales descriptions for 20 store products',
      'Structured bullet points highlighting key benefits and specifications',
      'Integrated SEO search keywords',
    ],
    exclusions: [
      'Manual product upload into the store dashboard (available as an add-on)',
    ],
    revisionsScope: 'Refining wording and benefit emphasis',
    ctaButton: 'Order Product Descriptions',
  },
  'MED-01': {
    subCategory: 'Graphic Design',
    shortDescription:
      'A premium custom social media graphic for a single post delivered in two sizes (1:1 square and 9:16 story) aligned with your brand identity.',
    detailedDescription:
      'High-impact graphic design for a single promotional or social media post crafted to match your brand guidelines. Delivered in both standard feed (1:1) and vertical story (9:16) dimensions in high resolution, complete with the editable PSD/Figma source file.',
    deliverables: [
      'High-resolution artwork in 1:1 and 9:16 formats',
      'Editable open source file (PSD or Figma)',
    ],
    exclusions: [
      'Writing post copy from scratch',
    ],
    revisionsScope: 'Adjusting colors, typography, or layout balance',
    ctaButton: 'Order Single Graphic',
  },
  'MED-02': {
    subCategory: 'Graphic Design',
    shortDescription:
      'A cohesive pack of 10 premium social media graphics (each in post and story sizes) designed to elevate your brand presence all month.',
    detailedDescription:
      'A unified visual campaign pack of 10 custom social media graphics art-directed to 2026 brand standards. Keeps your social channels looking consistent, authoritative, and thumb-stopping throughout the month, with every design exported in both feed and story aspect ratios.',
    deliverables: [
      '10 unique creative designs, each delivered in 2 aspect ratios',
      'Publish-ready high-resolution export files',
    ],
    exclusions: [
      'Social account management or manual scheduling',
    ],
    revisionsScope: 'Consolidated review and refinement across the design pack',
    ctaButton: 'Order 10-Graphic Design Pack',
  },
  'MED-05': {
    subCategory: 'Video Production',
    shortDescription:
      'Professional editing for a short-form vertical video (Reels / TikTok / Shorts up to 60 seconds) with dynamic captions, sound design, and pacing.',
    detailedDescription:
      'High-retention vertical video editing (Reels, TikTok, or YouTube Shorts up to 60 seconds) engineered to hook viewers in the first 3 seconds. Includes tight rhythmic cuts, color grading, sound effects, and animated on-screen captions styled to your brand.',
    deliverables: [
      'Edited full-HD vertical video (1080x1920, up to 60s)',
      'Animated motion captions and attention-grabbing hooks',
    ],
    exclusions: [
      'On-location camera filming',
    ],
    revisionsScope: 'Adjusting visual effects, caption styling, or cut pacing',
    ctaButton: 'Order Short-Form Video Edit',
  },
  'BRD-04': {
    subCategory: 'Logo Design',
    shortDescription:
      'Original commercial logo design featuring 3 distinct creative concepts, iterative refinement of the chosen mark, and full vector master files.',
    detailedDescription:
      'Create a distinctive, memorable visual mark that anchors your brand identity. We research your positioning, present 3 original logo concepts, refine your selected direction across 3 revision rounds, and deliver the complete vector and raster master package with usage notes.',
    deliverables: [
      '3 original logo concepts and full refinement of the selected mark',
      'Complete master vector and raster files (SVG, AI, PDF, PNG)',
      'Mini logo usage specification sheet',
    ],
    exclusions: [
      'Full brand identity system and stationery collateral',
    ],
    revisionsScope: 'Refining and perfecting the selected logo concept',
    ctaButton: 'Order Professional Logo',
  },
  'BRD-05': {
    subCategory: 'Brand Identity Systems',
    shortDescription:
      'Complete essential brand identity system: original logo, color palette, Arabic/English typography, business card, letterhead, and a 15-page brand guide.',
    detailedDescription:
      'Establish a cohesive, professional visual foundation across every customer touchpoint. Includes original logo design, official color and bilingual typography systems, essential corporate stationery (business card, letterhead, email signature), and a 15-page brand guidelines book.',
    deliverables: [
      'Original logo with a 15-page brand guidelines manual',
      'Official color palette and Arabic/English typography system',
      'Business card, letterhead, and email signature designs',
    ],
    exclusions: [
      'Physical print production costs',
    ],
    revisionsScope: 'Refining collateral layouts and color/type harmony',
    ctaButton: 'Order Essential Brand Identity',
  },
  'BRD-06': {
    subCategory: 'Brand Identity Systems',
    shortDescription:
      'Comprehensive enterprise brand identity system with advanced logo architecture, 6 commercial collateral applications, and a 25-page brand book.',
    detailedDescription:
      'A flagship enterprise brand identity system built for ambitious organizations seeking an unmistakable market presence. Includes advanced logo lockups, custom visual patterns and iconography, a detailed 25-page brand book, and 6 production-ready physical and digital brand applications.',
    deliverables: [
      'Advanced enterprise logo system with clear-space and lockup rules',
      'Comprehensive 25-page brand identity manual',
      '6 collateral applications (staff uniforms, envelopes, vehicle wrap, signage, packaging/social)',
    ],
    exclusions: [
      'Physical manufacturing and printing costs',
    ],
    revisionsScope: 'Refining brand applications and the 25-page identity manual',
    ctaButton: 'Order Enterprise Brand Identity',
  },
  'WEB-01': {
    subCategory: 'Landing Pages',
    shortDescription:
      'A fast, mobile-first conversion landing page (up to 7 sections) integrated with lead capture forms, WhatsApp handoff, and ad tracking pixels.',
    detailedDescription:
      'Design and development of a high-converting promotional landing page (up to 7 structured sections) purpose-built for paid ad campaigns and product launches. Engineered for sub-1.5s load times, mobile responsiveness, and direct integration with email/WhatsApp lead forms.',
    deliverables: [
      'Responsive conversion landing page (up to 7 sections)',
      'Lead form integration with email or WhatsApp',
      'Performance optimization targeting <1.5s load time',
    ],
    exclusions: [
      'Cloud hosting subscription and custom domain registration fees',
    ],
    revisionsScope: 'Adjusting copy placement and visual section styling',
    ctaButton: 'Request Landing Page',
  },
  'WEB-02': {
    subCategory: 'Corporate Websites',
    shortDescription:
      'An executive corporate website (up to 5 pages) with an easy Arabic/English content management dashboard and foundational technical SEO.',
    detailedDescription:
      'Design and development of a polished corporate website (up to 5 core pages: Home, About, Services, Portfolio/Gallery, Contact) that reflects institutional trust. Features a responsive modern layout, an intuitive CMS dashboard for code-free content edits, and core on-page SEO setup.',
    deliverables: [
      'Complete responsive website up to 5 pages (Home, About, Services, Gallery, Contact)',
      'Content management control panel (CMS)',
      'Foundational on-page technical SEO setup',
    ],
    exclusions: [
      'Full copywriting from scratch (available as an add-on)',
    ],
    revisionsScope: 'Reviewing page layouts and navigation structure',
    ctaButton: 'Request Corporate Website',
  },
  'WEB-04': {
    subCategory: 'E-Commerce Stores',
    shortDescription:
      'Turnkey e-commerce store setup on Salla, Zid, or Shopify including theme customization, payment and shipping integration, 3 promotional banners, and 15 products.',
    detailedDescription:
      'Launch a ready-to-sell online store on Salla, Zid, or Shopify without technical headaches. We customize your storefront theme, design 3 promotional hero banners, connect electronic payment gateways and shipping carriers, and upload your first 15 products organized by category.',
    deliverables: [
      'Complete store configuration and theme customization',
      'Integration of electronic payment gateways and shipping carriers',
      'Design of 3 promotional store banners',
      'Initial upload and formatting of 15 products',
    ],
    exclusions: [
      'Annual or monthly e-commerce platform subscription fees',
    ],
    revisionsScope: 'Refining homepage layout and product category arrangement',
    ctaButton: 'Request E-Commerce Store',
  },
  'AI-02': {
    subCategory: 'Prompt Engineering & Brand AI',
    shortDescription:
      '15 custom-engineered AI prompt templates calibrated to your exact brand voice and terminology across 3 core marketing and communication workflows.',
    detailedDescription:
      'Build a reusable AI prompt library tailored to your brand tone so every team member generates on-brand content consistently. We engineer and test 15 advanced prompt templates covering ad copy, customer replies, and executive summaries, complete with a ChatGPT & Gemini usage guide.',
    deliverables: [
      '15 advanced custom prompt templates across 3 core business workflows',
      'Implementation and usage guide for ChatGPT and Google Gemini',
    ],
    exclusions: [
      'Third-party AI model subscription fees',
    ],
    revisionsScope: 'Calibrating tone of voice and prompt test outputs',
    ctaButton: 'Order Brand Prompt Kit',
  },
  'AI-04': {
    subCategory: 'Knowledge Retrieval Systems (RAG)',
    shortDescription:
      'An enterprise RAG document assistant connected to up to 50 internal files (500 pages) that answers staff questions instantly with exact page citations.',
    detailedDescription:
      'Deploy a private Retrieval-Augmented Generation (RAG) knowledge assistant connected to your company policies, manuals, and contracts (up to 50 documents / 500 pages). Staff can ask questions in Arabic or English through a protected web interface and receive cited answers referencing the exact source file and page.',
    deliverables: [
      'Intelligent RAG query system indexed on up to 50 files / 500 pages',
      'Password-protected web interface',
      'Source document and page number citation on every answer',
    ],
    exclusions: [
      'Manual re-typing of poorly scanned handwritten documents',
      'Ongoing cloud LLM API token consumption',
    ],
    revisionsScope: 'Tuning retrieval accuracy and document indexing filters',
    ctaButton: 'Request Enterprise RAG Assistant',
  },
  'AI-05': {
    subCategory: 'Web Assistants & Lead Qualification',
    shortDescription:
      'An embedded AI website chat widget trained on 30 FAQs that answers visitor questions 24/7, qualifies leads, and hands off warm prospects to WhatsApp.',
    detailedDescription:
      'Convert website visitors around the clock with a smart AI chat widget embedded directly on your site. Trained on a 30-question knowledge base about your services and pricing, the assistant answers inquiries instantly, captures lead details, and routes qualified buyers to your WhatsApp sales team with a conversation summary.',
    deliverables: [
      'Responsive chat widget embedded on your website',
      'Curated knowledge base covering 30 frequently asked questions',
      'Instant WhatsApp handoff button with structured lead summary',
    ],
    exclusions: [
      'Ongoing cloud AI API token usage costs',
    ],
    revisionsScope: 'Refining response scripts and lead handoff triggers',
    ctaButton: 'Request AI Website Chatbot',
  },
  'AI-06': {
    subCategory: 'Private Branded AI Portals',
    shortDescription:
      'A standalone, custom-branded AI workspace on your company domain featuring encrypted employee login, conversation history, and an admin control panel.',
    detailedDescription:
      'Provide your organization with a dedicated, company-branded AI portal hosted on your own domain. Includes encrypted staff authentication, pre-configured department assistants, centralized conversation history storage, and an administrative dashboard for managing team access.',
    deliverables: [
      'Full-featured AI chat platform styled with your brand identity',
      'Encrypted employee authentication and login system',
      'Centralized conversation history storage',
      'Administrative management dashboard',
    ],
    exclusions: [
      'Dedicated cloud server hosting and external API token usage fees',
    ],
    revisionsScope: 'Customizing portal UI branding and authentication flow',
    ctaButton: 'Request Branded AI Portal',
  },
  'AI-08': {
    subCategory: 'Privacy & Air-Gapped AI Systems',
    shortDescription:
      'On-premise installation of a local open-weight LLM running 100% offline on your company hardware for maximum data privacy, complete with a local web chat UI.',
    detailedDescription:
      'Keep sensitive corporate data strictly inside your local network. We configure an offline local LLM environment (Ollama / LM Studio) on your company workstation or server, optimize an Arabic-capable model for your hardware specs, and connect a fast local web chat interface with zero external cloud telemetry.',
    deliverables: [
      'Installation and tuning of Ollama / LM Studio local runtime',
      'Deployment of a high-performing Arabic-capable local LLM',
      'Fast local web chat user interface',
    ],
    exclusions: [
      'Provisioning physical server or GPU workstation hardware (client must have compatible hardware)',
    ],
    revisionsScope: 'Verifying hardware compatibility and token generation speed',
    ctaButton: 'Request Local LLM Setup',
  },
  'AI-18': {
    subCategory: 'AI QA & Hallucination Auditing',
    shortDescription:
      'Systematic quality, safety, and hallucination audit of your existing AI bot across 50 adversarial and real-world test queries with prompt hardening fixes.',
    detailedDescription:
      'Ensure your customer-facing or internal AI assistant never fabricates policies or leaks instructions. We benchmark your bot across 50 structured edge-case and adversarial scenarios, score factual accuracy, identify hallucination triggers, and deliver hardened system prompt upgrades.',
    deliverables: [
      '50-scenario factual accuracy and adversarial stress test',
      'Detailed audit report scoring response accuracy and vulnerabilities',
      'Hardened system prompt and guardrail upgrade package',
    ],
    exclusions: [
      'Rebuilding a broken software architecture from scratch',
    ],
    revisionsScope: 'Reviewing the evaluation audit report and guardrail recommendations',
    ctaButton: 'Order AI Quality Audit',
  },
  'SOC-01': {
    subCategory: 'Account Setup & Optimization',
    shortDescription:
      'Professional setup and optimization of 2 social media accounts including custom profile/cover artwork, SEO-friendly bio copy, and highlight structure.',
    detailedDescription:
      'Make a strong first impression across two social media platforms. We design cohesive profile avatars and cover banners, write keyword-optimized bio copy that clearly states your value proposition, and configure action links and story highlight covers.',
    deliverables: [
      'Custom avatar and cover banner artwork for 2 social platforms',
      'Conversion-focused, SEO-friendly bio copywriting',
      'Configuration of bio links and core story highlight covers',
    ],
    exclusions: [
      'Ongoing daily content posting',
    ],
    revisionsScope: 'Refining bio copy and cover banner layouts',
    ctaButton: 'Order Social Account Setup',
  },
  'SOC-02': {
    subCategory: 'Monthly Social Management',
    shortDescription:
      'Monthly management for 2 social platforms: 8 original designed & written posts, 8 interactive stories, automated peak-time scheduling, and a monthly report.',
    detailedDescription:
      'Maintain a consistent, polished brand presence across two social networks all month. We handle copywriting and graphic design for 8 original feed posts and 8 stories per month, schedule publications at peak audience hours, and deliver a monthly performance summary.',
    deliverables: [
      '8 original designed and written feed posts per month',
      '8 interactive story adaptations',
      'Automated peak-hour publishing schedule',
      'Monthly reach and engagement performance report',
    ],
    exclusions: [
      '24/7 community inbox/comment moderation',
      'Paid advertising campaign management',
    ],
    revisionsScope: 'Weekly pre-publication approval of scheduled posts',
    ctaButton: 'Subscribe to Essential Social',
  },
  'SOC-03': {
    subCategory: 'Monthly Social Management',
    shortDescription:
      'Expanded monthly growth management for 2 platforms: 12 feed posts, 12 stories, 2 edited short-form Reels videos, and bi-weekly growth reporting.',
    detailedDescription:
      'Accelerate organic reach and audience engagement across two social channels. Combines high-frequency publishing (12 custom posts and 12 stories monthly) with short-form video production (2 edited Reels/TikToks) and continuous content angle optimization.',
    deliverables: [
      '12 custom designed and written feed posts per month',
      '12 interactive stories',
      '2 professionally edited short-form Reels videos',
      'Weekly monitoring and monthly growth analytics report',
    ],
    exclusions: [
      'Paid media ad spend budget',
    ],
    revisionsScope: 'Bi-weekly content batch approval',
    ctaButton: 'Subscribe to Growth Social',
  },
  'SOC-07': {
    subCategory: 'Paid Media Advertising',
    shortDescription:
      'Monthly management and ROAS optimization of up to 2 paid ad campaigns on one platform (for ad budgets up to 10,000 SAR/month) with A/B testing.',
    detailedDescription:
      'Maximize your return on ad spend (ROAS) with dedicated monthly campaign management covering up to 2 active campaigns on one ad platform (Meta, TikTok, Snapchat, or Google) for media budgets up to 10,000 SAR/month. Includes audience targeting, A/B creative testing, daily bid monitoring, and weekly/monthly conversion reports.',
    deliverables: [
      'Daily campaign monitoring and bid/budget optimization',
      'Audience segmentation and A/B creative testing',
      'Weekly and monthly conversion & ROAS performance reports',
    ],
    exclusions: [
      'Direct media ad spend paid to the advertising platform',
    ],
    revisionsScope: 'Adjusting target audience segments and ad creative variations',
    ctaButton: 'Order Paid Ads Management',
  },
  'WEB-14': {
    subCategory: 'Maintenance & Technical Support',
    shortDescription:
      'Monthly website care plan including weekly off-site backups, security & plugin updates, uptime monitoring, and 2 hours of dedicated developer support.',
    detailedDescription:
      'Keep your website fast, secure, and up to date every month. Our care plan provides automated weekly backups, core CMS and security patching, performance checks, and up to 2 hours of hands-on developer time each month for content updates or layout tweaks.',
    deliverables: [
      'Secure weekly website and database backups',
      'Regular security patches, theme, and plugin updates',
      '2 dedicated hours of developer support for monthly edits',
    ],
    exclusions: [
      'Full website redesigns or major new custom software modules',
    ],
    revisionsScope: 'Scheduled monthly maintenance updates and up to 2 hours of technical support',
    ctaButton: 'Subscribe to Website Care',
  },
};

export function getLocalizedProductContent(product: Product, isArabic: boolean): ProductEnglishCopy {
  const fallbackDetailedAr =
    (product.publicContent as { detailedDescription?: string }).detailedDescription ||
    product.publicContent.shortDescription;
  if (isArabic) {
    return {
      subCategory: product.subCategory,
      shortDescription: product.publicContent.shortDescription,
      detailedDescription: fallbackDetailedAr,
      deliverables: product.publicContent.deliverables,
      exclusions: product.publicContent.exclusions,
      revisionsScope: product.revisions.scope,
      ctaButton: product.publicContent.ctaButton,
    };
  }
  const en = catalogEnglishBySku[product.sku];
  if (en) return en;
  return {
    subCategory: product.subCategory,
    shortDescription: product.publicContent.shortDescription,
    detailedDescription: fallbackDetailedAr,
    deliverables: product.publicContent.deliverables,
    exclusions: product.publicContent.exclusions,
    revisionsScope: product.revisions.scope,
    ctaButton: product.publicContent.ctaButton,
  };
}
