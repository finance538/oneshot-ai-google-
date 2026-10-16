# OneShot Android Application

OneShot Brand Studio & Payment Platform rewritten natively for Android using Kotlin and Jetpack Compose. The application retains OneShot's signature brand identity—featuring Obsidian Black (`#141717`) and Flame Orange (`#F05B2B`), warm accents, Arabic RTL first-class layout, and modern Material Design 3 architecture.

## Overview & Ported Features

1. **Digital Services Storefront (متجر الخدمات)**:
   - Full 2026 OneShot service catalog organized by 8 key domains:
     - `AUT`: Business Process Automation & Systems
     - `AI`: Custom Enterprise AI Solutions & RAG Assistants
     - `WEB`: High-Converting Websites & Stores
     - `BRD`: Brand Identity Systems & Creative Direction
     - `MED`: Studio Photography, Video, & Creative Production
     - `SOC`: Google Ads Growth & Performance Marketing
     - `DIG`: Operating Frameworks & Invoice Toolkits
   - Dynamic search, interactive category filter chips, and comprehensive detail sheet with deliverables, scope, and pricing in Saudi Riyals (SAR).
   - Instant purchasing straight from the user's customer wallet.

2. **Customer Wallet (محفظتي)**:
   - Real-time SAR balance tracking with server-verified ledger consistency.
   - Secure top-up flow with preset quick-amounts (200, 500, 1000, 2500 SAR) and payment gateway selection (PayTabs / Telr).
   - Atomic debit service purchasing with idempotency protection against duplicate deductions.
   - Dual-tab views for active service orders and granular credit/debit ledger entries.

3. **Merchant Overview Dashboard (لوحة التاجر)**:
   - Comprehensive performance metrics: Total Collected (SAR), Completed Transactions, Pending Invoices, and Customer Base.
   - 7-day revenue activity bar chart visualization.
   - Quick reusable Open Link generator banner.
   - Recent payment documents table with real-time status badges (مكتمل, معلق, قيد المراجعة, ملغي) and link clipboard copying.

4. **Payment Requests & Open Links (روابط الدفع)**:
   - Segmented management of fixed payment documents and reusable Open Links.
   - Create Payment Request dialog (Title, Customer Name, Customer Email, Amount in SAR, Method, and Gateway).
   - Create Reusable Open Link dialog (Min/Max amount range, allowed payment methods).
   - Status tracking and cancellation workflows.

5. **Payment Gateway Integrations (طرق الربط)**:
   - PayTabs: Profile ID, Server Key, Client Key, API Base origin configuration.
   - Telr: Store ID, Service API Key, and Test Mode toggle.
   - Architecture note explaining PCI-DSS SAQ A-EP / SAQ D-Merchant compliance and server-side secret isolation.

6. **Merchant Executive Suite & AI Staff (مكتب الرئيس التنفيذي وكوادر الذكاء الاصطناعي)**:
   - AI Executive Suite with dedicated roles: CEO (الرئيس التنفيذي), CFO (المدير المالي), CMO (مدير التسويق), and COO (مدير العمليات).
   - Real-time executive KPIs (Growth rate, Net Margin, ROAS, SLA Fulfillment).
   - Task delegation to specialized AI staff with progress tracking and deliverable outputs.
   - Interactive multi-modal executive chat supporting attachments, file analysis, and voice prompt interactions.

7. **AI Operations Center & Platform Governance (مركز العمليات وحوكمة المنصة)**:
   - Real-time security telemetry and anomaly monitoring (rate limits, webhook verification confirmations, gateway health checks).
   - Read/unread status toggles for administrative alerts and one-click system diagnostics.
   - 100% full-power administrative policy toggles (Adaptive rate limiting, IP spoofing shields, strict gateway origin constraints).
   - Integrated AI Assistant chat for conversational querying of gateway statuses, wallet mechanisms, and zero-trust verification policies.

8. **Checkout Simulator & Demonstration (شاشة الدفع)**:
   - Interactive checkout experience demonstrating hosted PayTabs flow, Telr Framed embedded checkout, and Apple Pay / Mada.
   - Detailed billing and transaction breakdown with verified confirmation screen.

## Project Structure

```
├── app/
│   ├── build.gradle.kts
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/example/oneshot/
│       │   ├── MainActivity.kt
│       │   ├── data/
│       │   │   ├── model/Models.kt
│       │   │   └── repository/
│       │   │       ├── CatalogRepository.kt
│       │   │       ├── GatewayRepository.kt
│       │   │       ├── OperationsRepository.kt
│       │   │       ├── PaymentRepository.kt
│       │   │       └── WalletRepository.kt
│       │   └── ui/
│       │       ├── OneShotApp.kt
│       │       ├── components/CommonComponents.kt
│       │       ├── screens/
│       │       │   ├── CheckoutScreen.kt
│       │       │   ├── GatewayIntegrationsScreen.kt
│       │       │   ├── MerchantDashboardScreen.kt
│       │       │   ├── OperationsCenterScreen.kt
│       │       │   ├── PaymentLinksScreen.kt
│       │       │   ├── StorefrontScreen.kt
│       │       │   └── WalletScreen.kt
│       │       ├── theme/
│       │       │   ├── Color.kt
│       │       │   ├── Theme.kt
│       │       │   └── Type.kt
│       │       └── viewmodel/OneShotViewModel.kt
│       └── res/
│           ├── drawable/
│           ├── mipmap-anydpi-v26/
│           └── values/
│               ├── colors.xml
│               ├── strings.xml
│               └── themes.xml
├── gradle/libs.versions.toml
├── build.gradle.kts
├── settings.gradle.kts
└── metadata.json
```

## Build & Run

- Target Android SDK: 36 (minSdk 24, compileSdk 36)
- Language: Kotlin 2.0.21
- UI Toolkit: Jetpack Compose with Material Design 3
- Concurrency: Kotlin Coroutines & Flow
