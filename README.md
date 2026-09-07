# ⛏️ MineIntel AI

### AI-Powered Mining Intelligence, Document Ingestion & Automated Compliance Platform

MineIntel AI is an enterprise-grade artificial intelligence platform engineered for the mining and mineral extraction sector (specifically tailored for Coal India Limited, CMPDI, and regional mining directorates). The platform transforms complex, unstructured operational reports, statutory returns, environmental audits, and production spreadsheets into structured, validated, searchable, and actionable business intelligence.

Combining multimodal document extraction, rule-based and algorithmic data validation, semantic vector search, Retrieval-Augmented Generation (RAG), autonomous multi-agent orchestration, interactive conversational reasoning, and automated regulatory report generation, MineIntel AI delivers an end-to-end intelligence pipeline with verifiable provenance and institutional governance.

---

## 🚀 Live Deployments & Documentation

| Resource | URL / Location | Description |
| :--- | :--- | :--- |
| **Live Web Application** | [https://mini-intel-ai-sih.vercel.app](https://mini-intel-ai-sih.vercel.app) | Production web portal (React + Vite SPA on Vercel) |
| **Web Portal Login** | [https://mini-intel-ai-sih.vercel.app/login](https://mini-intel-ai-sih.vercel.app/login) | Authenticated entry point for Users, Reviewers & Administrators |
| **Live REST API (v1)** | `https://mini-intel-ai-sih.vercel.app/api/v1` | Production REST API layer supporting Web & Mobile clients |
| **Flutter Client API Guide** | [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Complete guide for Flutter developers (Android, iOS, Windows) |
| **OpenAPI 3.0 Specification** | [openapi.yaml](./openapi.yaml) | Validated OpenAPI 3.0.3 specification (118 paths, 16 schemas) |
| **End-to-End Test Report** | [API_TEST_REPORT.md](./API_TEST_REPORT.md) | 100% pass verification audit across 122 automated test scenarios |

---

## 🎯 Problem Statement

Mining corporations generate high volumes of operational, geological, environmental, and statutory documents across multiple production sites and subsidiaries. These documents arrive as scanned PDFs, signed physical forms, Word documents, Excel workbooks, and CSV logs.

### Key Operational Challenges:
- **Manual Data Entry Bottlenecks**: Significant engineering hours wasted manually transcribing tabular data from daily and monthly production returns.
- **Data Quality & Inconsistencies**: Discrepancies between overburden removal volumes, raw coal extraction figures, and weighbridge dispatch tallies often go unnoticed.
- **Information Silos**: Critical compliance mandates and DGMS safety directives remain buried inside nested filing directories and scanned attachments.
- **Slow Regulatory Reporting**: Generating consolidated monthly statutory summaries for regulatory bodies requires tedious multi-document reconciliation.
- **Audit & Provenance Gaps**: Difficulty demonstrating exact chain-of-custody for figures cited in executive and compliance disclosures.

---

## 💡 The MineIntel AI Solution

MineIntel AI automates the end-to-end data lifecycle through an autonomous 8-stage intelligence pipeline:

```text
  [ Raw Mining Documents ] (PDF, Word, Excel, CSV, Scanned TIFF/PNG, PPTX)
             │
             ▼
  ┌────────────────────────────────────────────────────────┐
  │  Stage 1: Multi-Format Ingestion & Tesseract OCR       │
  │  • SHA-256 Checksum Deduplication                     │
  │  • Multi-engine parsing (pdf-parse, mammoth, xlsx)     │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │  Stage 2: AI Parameter & Entity Extraction             │
  │  • Mining entities (Mines, Subsidiaries, Equipment)    │
  │  • Tabular parameter extraction with confidence score  │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │  Stage 3: Automated Validation & Quality Scoring       │
  │  • 7 Validation categories (unit mismatch, anomalies)  │
  │  • Human-in-the-Loop (HITL) corrections & audit log    │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │  Stage 4: Knowledge Base Chunking & Vector Embeddings  │
  │  • 768-dimensional Google Gemini Embeddings            │
  │  • MongoDB vector storage with multi-attribute filters │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │  Stage 5: RAG Semantic Search & Evidence Linking       │
  │  • Grounded citations and exact page-level provenance  │
  │  • In-memory caching for sub-millisecond retrieval     │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │  Stage 6: AI Conversational Assistant & Reasoning     │
  │  • Google Gemini Pro (`gemini-3.6-flash`) LLM          │
  │  • Mathematical calculations & multi-step synthesis    │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │  Stage 7: Automated Report Generation & Review Flow    │
  │  • Statutory summaries, variance & safety audits       │
  │  • Maker-Checker review queue & Admin approval barrier │
  └──────────────────────────┬─────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │  Stage 8: Multi-Format Export & Enterprise Feeds       │
  │  • PDF, DOCX, CSV, and JSON downloads                  │
  │  • DMS, MIS, and GIS geo-spatial API endpoints         │
  └────────────────────────────────────────────────────────┘
```

---

## 🌟 Core Features & Modules

### 1. Document Lifecycle Management (`/api/v1/documents`)
- **Multi-Format Ingestion**: Supports `.pdf`, `.docx`, `.xlsx`, `.csv`, `.pptx`, and image files (`png`, `jpg`, `tiff`).
- **Cryptographic Deduplication**: Calculates a SHA-256 checksum on upload; detects and rejects duplicates (`409 Conflict`), conserving cloud storage and compute.
- **Asynchronous Processing Pipeline**: Queues document parsing via `ProcessingJob` state machine (`queued` &rarr; `processing` &rarr; `completed` / `failed`) with step-level telemetry.
- **Secure File Download**: Streams raw documents with content-disposition and authorization guards (`GET /api/v1/documents/:id/download`).
- **Metadata Management**: Supports technical categorization, security classification (`public`, `internal`, `confidential`, `restricted`), GIS coordinates, and document retention schedules.

### 2. Data Extraction & Human-in-the-Loop (HITL) (`/api/v1/extraction`)
- **Automated Parameter Extraction**: Extracts operational metrics (Coal Production, Overburden Removal, Rail Dispatch, Road Dispatch, Explosive Consumption, Diesel Usage).
- **Confidence Scoring**: Computes a normalized confidence score (0.0 to 1.0) for every extracted data cell.
- **HITL Review & Edit History**: Allows operators to review, edit, approve, or reject extracted records. Every correction automatically preserves an immutable `editHistory` capturing `oldValue`, `newValue`, `field`, and editor identity.
- **Bulk Operations**: Bulk-approve pending records across documents in a single operation.

### 3. Rule-Based & Algorithmic Validation (`/api/v1/validation`)
- **Comprehensive Error Categories**:
  - `missing_data`: Mandatory parameters omitted in returns.
  - `duplicate`: Repeated records across the same operating period.
  - `conflict`: Contradicting figures for the same parameter and date.
  - `unit_mismatch`: Detection of conflicting units (e.g., metric tonnes vs cubic meters).
  - `invalid_value` & `suspicious_value`: Out-of-bounds metrics exceeding historical variance thresholds.
  - `cross_document_mismatch`: Discrepancies between field reports and dispatch registers.
- **Dynamic Quality Score**:
  $$\text{Quality Score} = \max(0, 100 - (\text{critical} \times 5 + \text{error} \times 3 + \text{warning} \times 1))$$
- **Issue Resolution & Record Syncing**: Resolving an issue with a `correctedValue` automatically cascades to update the underlying `ExtractedRecord` and records an audit trail.

### 4. Knowledge Base & Vector Indexing (`/api/v1/knowledge-base`)
- **Sliding-Window Chunking**: Splits extracted document text into semantic chunks with overlapping boundaries to preserve context.
- **Vector Embeddings**: Generates 768-dimensional embeddings using Google's embedding model (`gemini-embedding-2`).
- **Filtered Semantic Search**: Allows vector similarity queries filtered by document category, classification, and metadata.
- **Cache Invalidation**: Automatic cache invalidation ensures newly indexed documents are immediately discoverable.

### 5. AI Conversational Assistant (`/api/v1/ai-assistant`)
- **Context-Aware Reasoning**: Answers natural language mining queries using grounded RAG evidence.
- **Verifiable Citations**: Every response cites the exact source document, page number, and snippet.
- **Autonomous Calculations**: Performs multi-step mathematical calculations (e.g., stripping ratios, percentage growth, modal dispatch share) with transparent formulas.
- **Session Continuity**: Multi-turn conversation history preserved with thread management.

### 6. Mining Analytics & Variance Intelligence (`/api/v1/analytics`)
- **Executive KPIs**: Stripping Ratio (OB:Coal), Equipment Utilization (HEMM availability), Dispatch Realization.
- **Modal Transport Breakdown**: Real-time distribution across Merry-Go-Round (MGR), Indian Railways, Road transport, and Belt Conveyors.
- **Planned vs Actual Variance**: Statistical deviation analysis tracking production deficits against annual targets.
- **Anomaly Detection**: Flags statistically abnormal operational patterns and production drops.

### 7. Statutory Reports & Review Workflow (`/api/v1/reports`, `/api/v1/reviews`)
- **Automated Draft Generation**: Compiles statutory summaries and compliance reports directly from validated database records in English (`en`) and Hindi (`hi`).
- **Maker-Checker Governance**:
  - `draft`: Author drafts or edits report.
  - `review`: Submitted for reviewer evaluation.
  - `approved`: **Admin-only barrier** ensures reports can only be finalized by designated administrative authorities.
  - `rejected`: Reviewers or Admins can reject reports with mandatory rejection reasons.
- **Multi-Format Export Engine**: Downloads finalized reports natively as formatted **PDF**, editable **DOCX**, tabular **CSV**, or structured **JSON**.

### 8. Topic Discovery & Taxonomy Discovery (`/api/v1/topics`)
- **Corpus-Wide Topic Modeling**: Unsupervised semantic discovery of emerging operational, environmental, and statutory topics.
- **Topic Co-occurrence Graphs**: Graph-based cluster visualization mapping relationships between mining operations and statutory compliance.
- **Trend Detection**: Tracks topic prominence across operational quarters.

### 9. Multi-Agent Autonomous Orchestration (`/api/v1/agents`)
- **Autonomous Sub-Agents**: Orchestrates complex compliance tasks (e.g., verifying DGMS monsoon guidelines across multiple subsidiary returns).
- **Concurrency Locks**: In-memory task tracking prevents duplicate concurrent execution of identical agent tasks (`409 Conflict`).

### 10. Audit Trail & Provenance (`/api/v1/audit`)
- **Immutable Provenance**: Logs every authentication event, document ingestion, HITL edit, review decision, and report export.
- **Granular Filtering**: Query logs by user, action, status (`SUCCESS`, `FAILED`), document ID, or report ID.
- **Audit Export**: Export regulatory audit logs as CSV spreadsheets or JSON dumps.

### 11. Command Centre & Dashboards (`/api/v1/command-centre`, `/api/v1/dashboard`)
- **Operational Command Centre**: Centralized visibility into pipeline throughput, system status, and items requiring immediate attention.
- **Role-Scoped Dashboards**: Users see personalized metrics; Admins see system-wide health and cross-tenant indicators.

### 12. External Integration Feeds (`/api/v1/integration`)
- **DMS Feed**: Document Management System endpoint for external catalog sync.
- **MIS Feed**: Tabular metric stream for enterprise Management Information Systems.
- **GIS Geo-Spatial Feed**: Geo-tagged document coordinates (latitude, longitude, region) ready for rendering on interactive maps (Google Maps, Leaflet, Flutter Map).

---

## 🔐 Security & RBAC Governance

MineIntel AI enforces strict security and role-based access control:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        ROLE-BASED ACCESS CONTROL                       │
├─────────────────┬──────────────────────────────────────────────────────┤
│ Public          │ System health, login, standard user registration     │
├─────────────────┼──────────────────────────────────────────────────────┤
│ User            │ Upload, view, and manage own documents, reports,     │
│                 │ extraction records, and conversational queries       │
├─────────────────┼──────────────────────────────────────────────────────┤
│ Reviewer        │ All User rights + access to Pending Review Queue,    │
│                 │ document review decisions, and report rejection      │
├─────────────────┼──────────────────────────────────────────────────────┤
│ Admin           │ Full governance: user management, role modification, │
│                 │ report approvals, system health, and audit export    │
└─────────────────┴──────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Strict Admin Identity Isolation:**
> Only the account matching the pre-configured system administrator username (`ADMIN_USERNAME`) can hold the `admin` role. All attempts to elevate standard users to `admin` through the API are strictly rejected and downgraded to `user`.

---

## 🏗️ System Architecture

```
                          ┌─────────────────────────┐
                          │   Cross-Platform Users  │
                          │ Web / Android / iOS / Win│
                          └────────────┬────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
                    ▼                                     ▼
         ┌─────────────────────┐               ┌─────────────────────┐
         │   React + Vite SPA  │               │    Flutter Client   │
         │   Tailwind CSS UI   │               │   Mobile & Desktop  │
         └──────────┬──────────┘               └──────────┬──────────┘
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       │ HTTPS / REST (v1)
                                       │ (Bearer JWT Token)
                                       ▼
                    ┌─────────────────────────────────────┐
                    │      Express.js Backend Server      │
                    │   Node.js 20 / Multer / API v1      │
                    └──────────────────┬──────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────┐              ┌───────────────┐              ┌───────────────┐
│ Ingestion &   │              │ Validation &  │              │ Agent         │
│ OCR Pipeline  │              │ Quality Engine│              │ Orchestrator  │
└───────┬───────┘              └───────┬───────┘              └───────┬───────┘
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────┐              ┌───────────────┐              ┌───────────────┐
│ MongoDB Atlas │◄─────────────┤ Gemini Pro &  │◄─────────────┤ Knowledge Base│
│ Database      │              │ Vector Embed  │              │ (Vector Store)│
└───────────────┘              └───────────────┘              └───────────────┘
```

---

## 💻 Technology Stack

### Frontend Application
- **Framework**: React 18 SPA via Vite
- **Styling**: Tailwind CSS, PostCSS, Custom Design System
- **Icons & Visuals**: Lucide React Icons
- **HTTP Client**: Axios with Centralized Interceptors
- **Charts & Telemetry**: Recharts & Custom KPI Widgets

### Cross-Platform Mobile / Desktop Support
- **Client Technology**: Flutter (Dart) targeting Android, iOS, and Windows Desktop
- **Networking**: Dio with Automatic Token Refresh Interceptors
- **Secure Persistence**: `flutter_secure_storage` (Android Keystore, iOS Keychain, Windows DPAPI)
- **File Management**: `file_picker`, `path_provider`, `open_filex`

### Backend Architecture
- **Runtime**: Node.js `20.x` LTS
- **Framework**: Express.js `^4.21.0`
- **Database / ODM**: MongoDB Atlas via Mongoose `^8.6.0`
- **Authentication**: Stateless JSON Web Tokens (`jsonwebtoken` `^9.0.3`) & `bcryptjs` `^3.0.3`
- **File Uploads**: Multer `^1.4.5-lts.1` (with SHA-256 deduplication)
- **Document Extractors**:
  - `pdf-parse-new` `^2.1.0` (Native PDF text parsing)
  - `mammoth` `^1.8.0` & `docx` `^9.7.1` (Microsoft Word documents)
  - `xlsx` `^0.18.5` & `exceljs` `^4.4.0` (Excel spreadsheets)
  - `officeparser` `^7.8.0` (PowerPoint `.pptx` presentations)
  - `tesseract.js` `^7.0.0` (Optical Character Recognition for scanned images/PDFs)
  - `pdfkit` `^0.20.1` (High-fidelity PDF report generation)

### Artificial Intelligence & Vector Search
- **LLM Engine**: Google Gemini Pro (`gemini-3.6-flash`) via `@google/generative-ai`
- **Vector Embeddings**: Google Gemini Embedding (`gemini-embedding-2`, 768 Dimensions)
- **RAG Engine**: Cosine similarity retrieval with sliding chunk windows, metadata filters, and in-memory query cache

---

## 📁 Repository Structure

```
MineIntel-AI-SIH26023/
├── client/                               # React 18 + Vite Frontend
│   ├── src/
│   │   ├── api/                          # Centralized REST API Service Modules
│   │   │   ├── client.js                 # Axios instance with JWT Interceptor
│   │   │   ├── authApi.js                # Authentication API
│   │   │   ├── documentApi.js            # Document upload & management
│   │   │   ├── extractionApi.js          # Extraction & HITL
│   │   │   ├── validationApi.js          # Validation & Quality Control
│   │   │   ├── reportsApi.js             # Reports & Review Workflow
│   │   │   ├── knowledgeBaseApi.js       # Vector Search & Indexing
│   │   │   ├── aiAssistantApi.js         # Conversational Assistant
│   │   │   ├── analyticsApi.js           # Analytics & Production KPIs
│   │   │   ├── settingsApi.js            # User Settings & Language
│   │   │   └── ...                       # All 22 Module API Connectors
│   │   ├── components/                   # UI Components & Layouts
│   │   ├── context/                      # AuthContext & State Stores
│   │   └── pages/                        # App Pages (Dashboard, Review, etc.)
│   ├── package.json
│   └── vite.config.js
│
├── server/                               # Express.js REST API Backend
│   ├── config/                           # Database & CORS configuration
│   ├── controllers/                      # Business logic controllers (16 controllers)
│   ├── middleware/                       # Auth, Upload, Error & Response handlers
│   ├── models/                           # Mongoose database models (12 schemas)
│   ├── routes/
│   │   ├── api/v1/                       # Modern REST API v1 (22 router modules)
│   │   └── ...                           # Legacy backward-compatible routes
│   ├── services/                         # LLM, OCR, RAG, Ingestion, Reports (25 services)
│   ├── validators/                       # Input validators for all v1 endpoints
│   ├── package.json
│   └── server.js                         # Application entry point
│
├── scratch/                              # Verification test suites & scripts
│   ├── run_full_api_verification.js      # Complete 122-scenario test runner
│   └── ...
│
├── API_DOCUMENTATION.md                  # Comprehensive Flutter Integration Guide
├── openapi.yaml                          # Complete OpenAPI 3.0.3 Specification
├── API_TEST_REPORT.md                    # End-to-End API Verification Report
├── MineIntel_AI_API_Endpoint_Reference.txt# Master 4,300+ line endpoint directory
├── vercel.json                           # Vercel deployment configuration
└── README.md                             # Project Documentation
```

---

## 🛠️ Local Installation & Setup

### Prerequisites
- **Node.js**: v20.x or later installed
- **MongoDB**: MongoDB Atlas connection URI or local MongoDB instance (v6.0+)
- **Google AI API Key**: Gemini API key for LLM and embedding services

### 1. Clone the Repository
```bash
git clone https://github.com/Vishal202-rgb/MiniIntel-Ai.git
cd MiniIntel-Ai
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `server/.env` file with the following configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/mineintel?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password
GEMINI_API_KEY=your_google_gemini_api_key
CLIENT_URL=http://localhost:5173
```

Start the backend development server:
```bash
npm run dev
# Server running on http://127.0.0.1:5000
# REST v1 available at http://127.0.0.1:5000/api/v1
```

### 3. Frontend Setup
In a new terminal window:
```bash
cd client
npm install
npm run dev
# Client running on http://localhost:5173
```

---

## 🧪 Testing & Verification

The repository contains automated verification test suites covering all REST v1 modules, backward compatibility, and error handling:

```bash
# Execute the comprehensive 122-scenario API verification test suite
node scratch/run_full_api_verification.js
```

### Test Coverage Highlights:
- ✅ **122/122 Test Scenarios Passed (100% Pass Rate)**
- ✅ JWT Authentication, Token Refresh & Role-Based Access Control
- ✅ Multi-format Multipart Document Uploads & SHA-256 Deduplication
- ✅ Automated Extraction & Human-in-the-Loop Field Auditing
- ✅ Rule Validation, Severity Penalties & Quality Score Algorithms
- ✅ RAG Vector Similarity Search & Evidence Citations
- ✅ Report Review Workflows & Multi-Format Exports (PDF, DOCX, CSV, JSON)
- ✅ DMS, MIS, and GIS Spatial Integration Endpoints

---

## 📱 Mobile Client Integration (Flutter)

For developers integrating the backend into a Flutter mobile or desktop application:

1. **Read the Complete Guide**: Follow [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for step-by-step setup on Android, iOS, and Windows.
2. **API Specification**: Import [openapi.yaml](./openapi.yaml) into Swagger Editor, Postman, or `openapi_generator` to generate type-safe Dart models and API clients.
3. **Primary Live Base URL**:
   ```dart
   static const String baseUrl = 'https://mini-intel-ai-sih.vercel.app/api/v1';
   ```
4. **Android Cleartext**: If testing locally against an offline development server (`http://10.0.2.2:5000`), enable `android:usesCleartextTraffic="true"` in your `AndroidManifest.xml`.
5. **Authenticated File Downloads**: Always stream documents from `GET /api/v1/documents/:id/download` rather than static URLs.

---

## 📄 License

This project is developed as an intelligent mining operations and regulatory compliance solution for the **Smart India Hackathon (SIH 2024)**.  
All rights reserved © 2026 MineIntel AI Engineering Team.
