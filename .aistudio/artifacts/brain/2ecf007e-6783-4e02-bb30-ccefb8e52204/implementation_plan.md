# OneShot Cross-Account AI Matrix, CEO Suite & Admin Governance

Deploy an omnipresent, role-tailored AI architecture across all OneShot control panels: delivering 100% unrestricted full-power AI capabilities for Administrators, a dedicated CEO Suite with AI employee staff dispatching for Merchants, and a centralized AI Permissions Governance panel inside Admin to control AI models, grounding, and audio quotas for all account types.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following role-tailored division of AI capabilities is specified:
> - **Administrator (100% Full Power)**: Unrestricted access to all Gemini models (`gemini-4-argon`, `gemini-3.8-flash`, `gemini-3.1-flash-lite`, and `gemini-3.5-transcribe`), simultaneous Search & Maps Grounding, full system instruction editing, raw audit logs, and global telemetry.
> - **Merchants (CEO Suite & AI Employee Roster)**: Purpose-built executive command center where merchants hire and dispatch specialized AI staff (Creative Director, FinTech Officer, Campaign Strategist, Customer Success) to generate production contracts, formulate payment links, and handle client communications.
> - **Admin AI Governance Matrix (تحديد صلاحيات الـ AI)**: A new control panel within the Admin suite allowing the administrator to toggle which models, grounding features, and audio transcription tools are permitted for Merchants, Marketers, and Loaders.

- **Confirmed Decision 1**: Store role-based AI permission rules in Firestore `/ai_role_permissions` with real-time sync, so changes made by the administrator immediately take effect across all merchant and staff sessions.
- **Confirmed Decision 2**: Ensure Marketer and Loader dashboards also receive role-appropriate AI assistance (Campaign optimization for Marketers, payment gateway testing simulation for Loaders) subject to the Admin's configured permissions.
- **Confirmed Decision 3**: The unified topbar and overview dashboards will feature a quick-access AI badge indicating active model status and quick-prompt capabilities tailored to the logged-in role.

---

## 1. Overview & Core Concept

- **What It Delivers**:
  1. **Admin Master Console (100% AI Power)**: Direct access to deep-reasoning `gemini-4-argon`, real-time Google Search and Maps verification, microphone voice command transcription via `gemini-3.5-transcribe`, and a live prompt console.
  2. **Merchant CEO Suite & AI Staff**: An executive workspace (`/ceo` & `/staff`) where merchants interact with specialized digital employees to run their brand studio, draft commercial proposals, calculate pricing packages, and initiate instant payment links.
  3. **Admin AI Permissions Matrix**: An interactive table in the Admin dashboard allowing administrators to grant or restrict specific AI models (`gemini-4-argon`, `gemini-3.8-flash`, `gemini-3.1-flash-lite`), live audio transcription, and grounding tools per account role.
  4. **Universal AI Dashboard Section**: An embedded AI Assistant quick-card rendered directly in the Overview dashboard for all accounts, adapting its persona and suggestions to the current user's role.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Administrator Flow (100% Power)**:
   - Admin enters the dashboard and sees the **مركز الذكاء الاصطناعي الشامل (100% Power)** badge.
   - Admin navigates to **"إدارة صلاحيات الذكاء الاصطناعي (AI Governance)"** inside the Admin suite.
   - Admin views the matrix of roles (Merchants, Marketers, Loaders) and toggles checkboxes for:
     - Flagship Model (`gemini-4-argon`)
     - Standard Flash (`gemini-3.8-flash`)
     - Fast Lite (`gemini-3.1-flash-lite`)
     - Audio Transcription (`gemini-3.5-transcribe`)
     - Google Search & Maps Grounding
   - Admin clicks **"حفظ الصلاحيات"**; policies sync instantly via Firestore.

2. **Merchant Flow (CEO Suite & Employee Roster)**:
   - Merchant logs into their workspace and navigates to **"مكتب الرئيس التنفيذي (CEO Suite)"** or **"استوديو الذكاء الاصطناعي"**.
   - Merchant sees their active AI employees (e.g. *Sarah - Creative Producer*, *Tariq - FinTech Architect*, *Noura - Growth Marketer*).
   - Merchant speaks via microphone or types a studio briefing; the assigned AI employee processes the brief, creates the proposal, and generates an invoice or payment link with one click.

3. **Overview Quick-Card (All Accounts)**:
   - Every logged-in user sees a sleek obsidian AI companion card at the top of their Overview panel:
     - For **Merchants**: Quick brief transcription & CEO agent task dispatch.
     - For **Marketers**: Commission calculation & promotional campaign copy generation.
     - For **Loaders**: Gateway stress testing & simulated webhook payload analysis.
     - For **Admins**: System anomaly detection & platform risk assessment.

### Visual Identity & Theme

- **Design System**: Obsidian Black (`#141717`) canvas with Flame Orange (`#f05b2b`) accents, conforming to `public/brand/BRAND-SPECIFICATIONS.txt` and anti-slop guidelines.
- **Zero-Pill Discipline**: Metadata displayed as unboxed text with typographic separators (`·`).
- **Interactive Matrix**: High-density permissions grid with explicit toggle switches, tabular numerals for quotas, and clear status indicators.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Centralized Firestore Permission Store
- **Chosen Approach**: Store global role permissions in a singleton document `/ai_role_permissions/global_matrix` in Firestore, protected by admin-only write rules in `firestore.rules`.
- **Why**: Allows instant, cloud-synchronized governance without requiring code redeployment or server restarts.
- **Alternatives Considered**: Hardcoded in-memory permissions were rejected because the prompt explicitly demands dynamic role configuration inside the admin account.

### Decision 2: Contextual Role Adaptation
- **Chosen Approach**: Detect the user's role (`admin`, `merchant`, `marketer`, `loader`) dynamically and mount the corresponding AI persona, available models, and suggested prompts automatically.
- **Why**: Eliminates friction and ensures each user receives domain-relevant assistance immediately.

---

## 4. Technical Architecture & Data Strategy

### Component Hierarchy & Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OneShot Universal UI Layout                        │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Dashboard Overview Quick AI Card (Contextual to Logged-in Role)      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │   ADMIN WORKSPACE     │  │          MERCHANT WORKSPACE                │  │
│  │                       │  │                                            │  │
│  │  - 100% Unrestricted  │  │  - CEO Suite (Executive Command)           │  │
│  │    Gemini AI Console  │  │  - AI Staff Marketplace (Employees)        │  │
│  │  - AI Permissions     │  │  - Audio Voice Briefings                   │  │
│  │    Governance Matrix  │  │  - Direct Invoicing & Links Generation     │  │
│  └───────────┬───────────┘  └─────────────────────┬──────────────────────┘  │
└──────────────┼────────────────────────────────────┼─────────────────────────┘
               │                                    │
               ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Firestore Security & Data Store                       │
│                                                                             │
│  - /ai_role_permissions/global_matrix (Admin-only write, all-roles read)    │
│  - /users/{userId} (Role verification)                                      │
│  - /voice_transcripts/{transcriptId} (Audio archives)                       │
│  - /ai_chat_sessions/{sessionId} (History & memory)                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Server-Side Gemini API Proxy Routing                     │
│                                                                             │
│  - POST /.netlify/functions/gemini-studio                                   │
│    -> Enforces role permissions against requested model & tools             │
│    -> Routes to:                                                            │
│       * gemini-4-argon (Flagship deep reasoning)                            │
│       * gemini-3.8-flash (General balance + Search/Maps)                    │
│       * gemini-3.1-flash-lite (Fast turnarounds)                            │
│       * gemini-3.5-transcribe (Speech to text)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Firestore Schema Addition

```json
{
  "entities": {
    "AiRolePermission": {
      "title": "AiRolePermission",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "role": { "type": "string", "enum": ["merchant", "marketer", "loader", "admin"] },
        "allowedModels": { "type": "array", "items": { "type": "string" } },
        "allowTranscription": { "type": "boolean" },
        "allowSearchGrounding": { "type": "boolean" },
        "allowMapsGrounding": { "type": "boolean" },
        "allowAiStaffHiring": { "type": "boolean" },
        "updatedAt": { "type": "string", "format": "date-time" }
      },
      "required": ["id", "role", "allowedModels", "allowTranscription", "updatedAt"]
    }
  }
}
```
