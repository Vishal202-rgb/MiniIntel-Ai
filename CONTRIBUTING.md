# Contributing to MineIntel AI

Thank you for your interest in contributing to **MineIntel AI**! We welcome contributions from developers, researchers, mining engineers, and open-source enthusiasts. This document outlines the guidelines and workflow for contributing to the platform safely, efficiently, and professionally.

---

## Table of Contents

- [1. Welcome / Introduction](#1-welcome--introduction)
- [2. Before You Start](#2-before-you-start)
- [3. Development Environment](#3-development-environment)
- [4. Project Structure](#4-project-structure)
- [5. How to Add Code](#5-how-to-add-code)
- [6. Branching Strategy](#6-branching-strategy)
- [7. Commit Message Format](#7-commit-message-format)
- [8. Code Quality Guidelines](#8-code-quality-guidelines)
- [9. API Contribution Guidelines](#9-api-contribution-guidelines)
- [10. Database Guidelines](#10-database-guidelines)
- [11. AI / RAG Contribution Guidelines](#11-ai--rag-contribution-guidelines)
- [12. Testing Guidelines](#12-testing-guidelines)
- [13. Documentation Guidelines](#13-documentation-guidelines)
- [14. Pull Request Guidelines](#14-pull-request-guidelines)
- [15. Pull Request Review Process](#15-pull-request-review-process)
- [16. What Should NOT Be Committed](#16-what-should-not-be-committed)
- [17. Security Guidelines](#17-security-guidelines)
- [18. UI/UX Contribution Guidelines](#18-uiux-contribution-guidelines)
- [19. Backward Compatibility](#19-backward-compatibility)
- [20. Issue Reporting](#20-issue-reporting)
- [21. Feature Requests](#21-feature-requests)
- [22. Contribution Checklist](#22-contribution-checklist)
- [23. Maintainer / Reviewer Expectations](#23-maintainer--reviewer-expectations)
- [24. Final Note](#24-final-note)

---

## 1. Welcome / Introduction

**MineIntel AI** is an enterprise-grade artificial intelligence platform engineered for the mining and mineral extraction sector (tailored for Coal India Limited, CMPDI, and regional mining directorates). The platform transforms complex, unstructured operational reports, statutory returns, environmental audits, and production spreadsheets into structured, validated, searchable, and actionable business intelligence.

Contributions are essential to:
- Expand multimodal parsing capabilities across varied mining documentation.
- Refine rule-based and algorithmic data validation logic.
- Enhance Retrieval-Augmented Generation (RAG) grounding and citation accuracy.
- Build domain-specific analytics, KPIs, and compliance reporting engines.
- Improve system security, performance, accessibility, and UI responsiveness.

Whether you are fixing a bug, adding an analytical KPI, refining an AI prompt, improving documentation, or optimizing an API endpoint, your contribution makes a difference. We expect all contributors to uphold enterprise-grade code quality, reproducibility, and professional conduct.

---

## 2. Before You Start

Before writing code or submitting contributions, please ensure you:

1. **Read the Documentation**: Familiarize yourself with the system by reading the [README.md](./README.md), the Flutter client integration guide in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md), and the OpenAPI specification in [openapi.yaml](./openapi.yaml).
2. **Understand the Architecture**: Understand how the React/Vite frontend communicates with the Express.js REST API layer (`/api/v1`), MongoDB Atlas database, and the Google Gemini LLM/embedding services.
3. **Check Existing Issues**: Search the GitHub Issues and Pull Requests to confirm someone else is not already working on the same problem.
4. **Discuss Major Changes**: For significant architectural changes, schema alterations, or new modules, open an issue to discuss your proposal with the maintainers before investing substantial development time.
5. **Protect Sensitive Information**: Never commit secrets, API keys, credentials, local `.env` files, production data dumps, or confidential mining operational returns.

---

## 3. Development Environment

### Prerequisites

| Component | Requirement | Description |
| :--- | :--- | :--- |
| **Node.js** | `v20.x` LTS (Recommended) | Runtime environment specified in root, client, and server `package.json` (`engines.node: "20.x"`). |
| **Package Manager** | `npm` (v10.x+) | Default package manager bundled with Node.js. |
| **Database** | MongoDB Atlas or Local MongoDB `v6.0+` | Document database for entities, extracted records, chunks, validation results, and users. |
| **AI Services** | Google Gemini API Key | Required for LLM reasoning (`gemini-3.6-flash`) and vector embeddings (`gemini-embedding-2`). |
| **Operating System** | Windows, Linux, or macOS | Cross-platform development supported. |

### Repository Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Vishal202-rgb/MiniIntel-Ai.git
cd MiniIntel-Ai
```

#### 2. Backend Setup
```bash
cd server
npm install
```

Configure your environment variables by creating a `.env` file in the `server/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/mineintel?retryWrites=true&w=majority

# Authentication & Security
JWT_SECRET=your_secure_development_jwt_secret_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password

# Artificial Intelligence (Google Gemini)
GEMINI_API_KEY=your_google_gemini_api_key
# Optional: LLM provider overrides if routing through proxy
# LLM_API_KEY=your_api_key
# LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/

# Client CORS Origin
CLIENT_URL=http://localhost:5173
```

Start the backend development server:
```bash
npm run dev
# Server running at http://127.0.0.1:5000
# REST API v1 available at http://127.0.0.1:5000/api/v1
```

#### 3. Frontend Setup
In a separate terminal window:
```bash
cd client
npm install
npm run dev
# Vite client running at http://localhost:5173
```

#### 4. Verification Scripts
Verify that your local backend environment and endpoints function properly:
```bash
# Run the end-to-end API verification suite
node scratch/run_full_api_verification.js
```

---

## 4. Project Structure

The MineIntel AI repository is organized as a monorepo containing the frontend client, backend server, verification suites, and API contracts.

```text
MineIntel-AI-SIH26023/
├── client/                               # Frontend Single Page Application (React 18 + Vite)
│   ├── src/
│   │   ├── api/                          # Centralized Axios API services with JWT interceptors
│   │   │   ├── client.js                 # Base Axios instance, auth headers, error handlers
│   │   │   ├── authApi.js                # Authentication, profile, token refresh
│   │   │   ├── documentApi.js            # Document upload, listing, parsing, download
│   │   │   ├── extractionApi.js          # Extracted parameter review and HITL edits
│   │   │   ├── validationApi.js          # Validation issues, quality scoring, resolutions
│   │   │   ├── reportsApi.js             # Statutory reports, Maker-Checker review queue
│   │   │   ├── knowledgeBaseApi.js       # Semantic search, vector chunks, indexing
│   │   │   ├── aiAssistantApi.js         # Conversational assistant & math reasoning
│   │   │   ├── analyticsApi.js           # Production variance, KPIs, transport modes
│   │   │   └── ...                       # Additional module client services
│   │   ├── components/                   # Reusable UI components organized by domain
│   │   │   ├── layout/                   # Sidebar, Navbar, AppLayout, PageContainer
│   │   │   ├── upload/                   # Dropzone, upload progress modal
│   │   │   ├── documents/                # Document preview, metadata cards, table
│   │   │   ├── extraction/               # Extracted field tables, inline editor
│   │   │   ├── validation/               # Quality score gauge, error badges
│   │   │   ├── assistant/                # Chat container, message bubble, citations
│   │   │   └── common/                   # Buttons, badges, modals, loaders
│   │   ├── context/                      # React context providers (e.g., AuthContext.jsx)
│   │   ├── hooks/                        # Custom React hooks
│   │   ├── pages/                        # Top-level view routes (Dashboard, AIAssistant, etc.)
│   │   ├── App.jsx                       # Client route definitions and layout structure
│   │   └── main.jsx                      # Client React entrypoint
│   ├── package.json                      # Client dependencies and Vite scripts
│   ├── tailwind.config.js                # Tailwind styling theme and enterprise palette
│   └── vite.config.js                    # Vite bundler configuration
│
├── server/                               # Backend REST API Server (Node.js 20.x + Express.js)
│   ├── config/                           # Database connection (db.js) and CORS (cors.js)
│   ├── controllers/                      # Request handling & HTTP response mapping (16 controllers)
│   │   ├── documentController.js         # Ingestion, processing status, file download
│   │   ├── extractionController.js       # HITL parameter review, approval, edits
│   │   ├── validationController.js       # Issue querying, resolution cascading
│   │   ├── reportController.js           # Report creation, review flow, file export
│   │   ├── aiAssistantController.js      # Natural language querying, multi-turn chat
│   │   └── ...
│   ├── middleware/                       # Express middleware functions
│   │   ├── auth.js                       # JWT authentication and role authorization
│   │   ├── apiResponseMiddleware.js      # Standard res.apiSuccess & res.apiError bindings
│   │   ├── errorHandler.js               # Centralized exception catching & formatting
│   │   └── upload.js                     # Multer disk upload with extension filtering
│   ├── models/                           # Mongoose database models (12 schemas)
│   │   ├── User.js                       # User authentication, roles, account status
│   │   ├── Document.js                   # Document metadata, SHA-256 hash, lifecycle
│   │   ├── DocumentChunk.js              # Vector chunk embeddings (768d) for RAG
│   │   ├── ExtractedRecord.js            # Tabular parameters, units, confidence scores
│   │   ├── ValidationResult.js           # Validation rules, severities, issue status
│   │   ├── Report.js                     # Statutory reports, review decisions, signoffs
│   │   └── AuditLog.js                   # Immutable provenance trail of user actions
│   ├── routes/
│   │   ├── api/v1/                       # Versioned REST API endpoints (22 route modules)
│   │   └── ...                           # Preserved backward-compatible root routes
│   ├── services/                         # Core business logic, OCR, RAG, and AI (25 services)
│   │   ├── llmService.js                 # Gemini Pro orchestration, rate limit backoff
│   │   ├── embeddingService.js           # Vector embedding generation (768 dimensions)
│   │   ├── ragService.js                 # Semantic search, cosine similarity, cache
│   │   ├── ocrService.js                 # Tesseract OCR engine for scanned files
│   │   ├── processingService.js          # Ingestion state machine and text chunking
│   │   ├── validationService.js          # Algorithmic and rule-based validation checks
│   │   ├── reportService.js              # PDF/DOCX/CSV/JSON report generation engine
│   │   └── analyticsService.js           # Stripping ratios, transport split, variance KPIs
│   ├── utils/                            # Shared utilities (apiResponse.js, logger)
│   ├── validators/                       # Input validation schemas for API v1 requests
│   ├── package.json                      # Server dependencies and lifecycle scripts
│   └── server.js                         # Express application entrypoint
│
├── scratch/                              # Automated test suites and verification tools
│   ├── run_full_api_verification.js      # Comprehensive 122-scenario API test runner
│   └── ...
│
├── API_DOCUMENTATION.md                  # Detailed Flutter client integration guide
├── openapi.yaml                          # OpenAPI 3.0.3 specification covering all v1 endpoints
├── API_TEST_REPORT.md                    # Verification test report across 122 scenarios
├── MineIntel_AI_API_Endpoint_Reference.txt # Master text index of all REST endpoints
├── vercel.json                           # Vercel deployment routing configuration
├── README.md                             # Primary project documentation
└── CONTRIBUTING.md                       # This contribution guide
```

---

## 5. How to Add Code

Follow this standard step-by-step contribution lifecycle:

```text
[ Identify Task ] ──▶ [ Create Branch ] ──▶ [ Make Focused Changes ] ──▶ [ Test Locally ]
                                                                                │
[ Merge to main ] ◀── [ Code Review & Approval ] ◀── [ Open Pull Request ] ◀────┘
```

1. **Understand the Issue / Feature**: Check the problem statement, affected modules, and edge cases. If needed, request clarification in the issue tracker.
2. **Create a Dedicated Branch**: Branch off an up-to-date `main` branch with a descriptive name:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/production-variance-kpi
   ```
3. **Make the Changes**: Implement the code adhering to project conventions.
4. **Keep Changes Focused**: Confine edits strictly to the issue or feature at hand. Avoid mixing unrelated formatting changes or feature additions in a single branch.
5. **Follow Coding Style**: Match existing style conventions (ES modules in frontend, CommonJS in backend, uniform indentation).
6. **Update Documentation**: Update relevant documentation files whenever you modify endpoints, configuration, models, or workflows.
7. **Test Your Changes**: Verify both positive flows and failure paths. Run automated verification scripts where available.
8. **Review Your Diff**: Inspect your changes before staging:
   ```bash
   git diff
   git status
   ```
9. **Commit and Open a Pull Request**: Write descriptive commit messages using Conventional Commits and submit a clean PR against `main`.

---

## 6. Branching Strategy

MineIntel AI follows a clean, branch-based collaboration workflow:

- **`main`**: Represents stable, production-ready code. Direct pushes to `main` are restricted.
- **Branch Naming Conventions**:
  - `feature/<feature-name>`: New capabilities or functional extensions.
    - *Example*: `feature/production-variance-kpi`
    - *Example*: `feature/hindi-report-templates`
  - `fix/<issue-name>`: Bug fixes and error resolutions.
    - *Example*: `fix/gemini-rate-limit-backoff`
    - *Example*: `fix/ocr-bounding-box-offset`
  - `docs/<doc-name>`: Documentation additions or updates.
    - *Example*: `docs/update-contributing-guide`
    - *Example*: `docs/add-openapi-schemas`
  - `refactor/<refactor-name>`: Restructuring code without changing user-facing behavior.
    - *Example*: `refactor/chunking-service-sliding-window`
  - `test/<test-name>`: Test suites, verification runners, or test data.
    - *Example*: `test/validation-severity-scoring`

### Branch Management Rules:
- Never push unfinished, non-working code directly to `main`.
- Keep branches small and short-lived.
- Rebase or merge `main` into your working branch before opening a PR:
  ```bash
  git checkout main
  git pull origin main
  git checkout feature/your-branch-name
  git merge main
  ```
- Delete branches after they have been reviewed and successfully merged.

---

## 7. Commit Message Format

We enforce the **Conventional Commits** specification to ensure automated changelog compatibility, clear history, and professional presentation.

### Structure:
```text
<type>: <short description in imperative mood>

[optional body explaining context, rationale, and impact]

[optional footer referencing issues, e.g., Resolves #42]
```

### Supported Types:
- `feat`: A new feature or capability.
- `fix`: A bug fix.
- `docs`: Documentation-only changes.
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Changes to build processes, auxiliary tools, or dependencies.
- `perf`: A code change that improves execution performance.
- `style`: Changes that do not affect the meaning of the code (white-space, formatting).

### Practical Examples:
- `feat: add production variance analysis to analytics service`
- `fix: handle Gemini API 429 rate limits with exponential backoff`
- `docs: update API documentation for statutory report export`
- `refactor: extract sliding window logic into chunkingService`
- `test: add verification test for validation quality scoring`

### Rules:
- Use the imperative mood in the subject ("add" not "added", "fix" not "fixes").
- Keep the subject line under 72 characters.
- Do **not** use vague commit messages such as `update`, `changes`, `fixed bug`, `final`, or `done`.

---

## 8. Code Quality Guidelines

1. **Consistent Coding Style**:
   - Backend (`server/`): CommonJS (`const x = require('x')`), standard Node.js patterns.
   - Frontend (`client/`): Modern JavaScript/React with ES Modules (`import/export`), functional components, and hooks.
2. **Readability & Maintainability**:
   - Write self-documenting code with clear variable and function names reflecting mining domain concepts (`overburdenRemoval`, `strippingRatio`, `statutoryReturn`, `weighbridgeDispatch`).
   - Keep functions and components short and focused on a single responsibility.
3. **DRY Principle**: Avoid code duplication. Reuse existing helper functions in `server/utils/` and common components in `client/src/components/common/`.
4. **Input Validation**: Validate all external inputs at the boundary using schemas in `server/validators/`. Never trust raw client input.
5. **Robust Error Handling**:
   - Always catch asynchronous promises with `try/catch` blocks.
   - Forward unhandled server exceptions to the central error handler using `next(error)` or respond with standard envelope `res.apiError(...)`.
   - Never let an unhandled rejection crash the server.
6. **No Leaked Secrets**: Never hardcode credentials, tokens, or encryption keys in source files.
7. **Minimal Dependencies**: Do not introduce heavy third-party packages without a clear justification. Prefer native Node.js and web platform features where available.
8. **Preserve Existing Functionality**: Maintain backward compatibility and ensure existing modules continue to operate properly after your changes.

---

## 9. API Contribution Guidelines

MineIntel AI exposes a structured, RESTful API layer. All new or modified endpoints must adhere to these standards:

### 1. Base URL & Routing
- New REST endpoints must be placed under `/api/v1` in `server/routes/api/v1/`.
- Maintain existing alias routes under `/api/*` for full backward compatibility.
- Use plural nouns for resources (e.g., `/api/v1/documents`, `/api/v1/reports`, `/api/v1/validation/issues`).

### 2. HTTP Verbs & Status Codes
- `GET`: Retrieve resources (`200 OK`).
- `POST`: Create resources (`201 Created` or `200 OK` for complex actions).
- `PUT` / `PATCH`: Update resources (`200 OK`).
- `DELETE`: Remove resources (`200 OK`).
- `400 Bad Request`: Validation failure.
- `401 Unauthorized`: Missing or invalid Bearer JWT.
- `403 Forbidden`: Insufficient role permissions.
- `404 Not Found`: Resource does not exist.
- `409 Conflict`: Duplicate file checksum (SHA-256) or concurrent agent lock.
- `429 Too Many Requests`: AI rate limit exceeded (with `retryAfterSeconds`).
- `500 Internal Server Error`: Unexpected server error.

### 3. Standard Response Format
Always use the built-in response helpers provided by `server/middleware/apiResponseMiddleware.js` and `server/utils/apiResponse.js`:

```javascript
// Success response
res.apiSuccess(data, 'Documents retrieved successfully', 200, meta);

// Resulting JSON structure:
// {
//   "success": true,
//   "data": { ... },
//   "message": "Documents retrieved successfully",
//   "meta": { "page": 1, "limit": 20, "total": 150 }
// }

// Error response
res.apiError('Document not found', 'DOCUMENT_NOT_FOUND', 404);

// Resulting JSON structure:
// {
//   "success": false,
//   "message": "Document not found",
//   "error": "DOCUMENT_NOT_FOUND"
// }
```

### 4. Separation of Concerns
- **Routes (`server/routes/api/v1/`)**: Define HTTP method, URL path, middleware pipeline (validation, auth), and map to controller methods. Keep business logic out of route files.
- **Controllers (`server/controllers/`)**: Extract request parameters, invoke services, and formulate standard HTTP responses.
- **Services (`server/services/`)**: Implement business logic, database queries, OCR, LLM prompts, and file generation.
- **Validators (`server/validators/`)**: Validate request bodies, query params, and route parameters.

### 5. Authentication & Authorization
Protect endpoints using the `authenticate` and `authorize` middleware from `server/middleware/auth.js`:

```javascript
const { authenticate, authorize } = require('../../middleware/auth');

// Protected for any authenticated user
router.get('/my-data', authenticate, controller.getMyData);

// Protected for Admin only
router.post('/approve-report', authenticate, authorize('admin'), controller.approveReport);

// Protected for Reviewer or Admin
router.get('/review-queue', authenticate, authorize('admin', 'reviewer'), controller.getReviewQueue);
```

> [!IMPORTANT]
> **Strict Admin Identity Isolation**:  
> Only the designated username matching `ADMIN_USERNAME` is granted the `admin` role. Standard users cannot elevate themselves through the API. Always verify this isolation remains intact.

---

## 10. Database Guidelines

MineIntel AI utilizes **MongoDB** via **Mongoose**. When contributing database changes:

1. **Schema Definitions**:
   - Define schemas in `server/models/`.
   - Use Mongoose timestamps (`{ timestamps: true }`).
   - Define strict types, default values, and enums for constrained fields (e.g., status, role, category).
   - Index fields that are frequently queried (e.g., `documentId`, `status`, `createdAt`, `sha256Checksum`).
2. **Safe Schema Evolutions**:
   - Make additive changes (e.g., adding an optional field with a default value).
   - Never rename or drop existing fields in production models without a migration strategy.
3. **Data Integrity & Validation**:
   - Add Mongoose schema-level validators alongside API request validators.
   - Use cascading updates responsibly (e.g., resolving a validation issue automatically updates the corresponding `ExtractedRecord`).
4. **No Real or Sensitive Data in Commits**:
   - Never commit local database connection strings containing live passwords.
   - Never commit real operational mining logs, employee records, or government communications.
5. **Connection Management**: Always use `MONGODB_URI` from the environment. Connection configuration is maintained in `server/config/db.js`.

---

## 11. AI / RAG Contribution Guidelines

MineIntel AI's intelligence pipeline is built upon Google Gemini (`gemini-3.6-flash`), vector embeddings (`gemini-embedding-2`), and an autonomous RAG architecture.

1. **Zero Hardcoded Secrets**: Always read API keys from `process.env.GEMINI_API_KEY` or `process.env.LLM_API_KEY`.
2. **Grounded Outputs & Zero Fabrication**:
   - AI outputs must be strictly grounded in parsed document chunks and validated extracted records.
   - Prompts must instruct models to avoid guessing or fabricating operational figures (e.g., coal extraction tonnage, stripping ratios).
3. **Preserve Verifiable Provenance & Citations**:
   - RAG query responses must preserve source attribution, including `documentId`, `fileName`, `pageNumber`, and `snippet`.
   - Do not strip or bypass citation metadata in service layers.
4. **Handling Low Confidence & Out-of-Context Cases**:
   - When vector retrieval returns no relevant chunks or confidence scores fall below threshold, return an explicit "insufficient context" response rather than allowing the model to hallucinate.
5. **Centralized Prompt Engineering**:
   - Maintain system and user prompts within dedicated service modules (`server/services/llmService.js`, `aiAssistantService.js`, `reportService.js`).
   - Clearly document the expected JSON structure when requesting structured output (`format: 'json'`).
6. **Rate Limit Resilience**:
   - Always utilize the built-in retry and backoff mechanisms (`withRetry`, exponential backoff for HTTP 503, and handling HTTP 429 rate limits).

---

## 12. Testing Guidelines

Quality and verification are essential for a reliable mining intelligence platform.

### Verification Principles:
- **Test Before Submitting**: Test every modified endpoint, component, or service before opening a PR.
- **Test Happy & Unhappy Paths**: Verify both successful operations and expected failure modes (e.g., missing mandatory parameters, expired tokens, duplicate checksums, out-of-range values).
- **Test RBAC Boundaries**: Ensure protected routes reject unauthenticated requests (`401`) and standard users cannot perform admin actions (`403`).
- **Test File Uploads**: Verify that document processing handles all supported file types (`.pdf`, `.docx`, `.xlsx`, `.csv`, `.pptx`, images) and gracefully rejects unsupported formats.

### Automated Test Suites:
Run the comprehensive verification runner from the repository root:
```bash
# Full 122-scenario verification across all API v1 endpoints
node scratch/run_full_api_verification.js
```

Targeted test scripts are available in the `scratch/` directory:
- `scratch/verify_documents_extraction.js`: Tests document lifecycle and OCR.
- `scratch/verify_validation.js`: Tests validation error detection and quality scoring.
- `scratch/verify_reports_workflow.js`: Tests Maker-Checker review transitions.
- `scratch/verify_ai_assistant.js`: Tests RAG retrieval and citation grounding.

Never mark untested features as complete in PR descriptions.

---

## 13. Documentation Guidelines

Documentation is a first-class citizen in MineIntel AI. Whenever code is updated, corresponding documentation must be kept in sync.

### When to Update Documentation:
- **New Feature / Module**: Document purpose, architectural design, and usage instructions.
- **New or Modified Endpoints**: Update [openapi.yaml](./openapi.yaml), [API_DOCUMENTATION.md](./API_DOCUMENTATION.md), and [MineIntel_AI_API_Endpoint_Reference.txt](./MineIntel_AI_API_Endpoint_Reference.txt).
- **Configuration & Environment**: If introducing a new `.env` key, document it in `server/.env.example` (or README) with an explanation and safe default.
- **Workflow / Policy Changes**: Document any changes to report generation, review procedures, or validation scoring rules.

### Key Documentation Files:
- [README.md](./README.md): Main overview, setup instructions, architectural diagram.
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md): Comprehensive guide for mobile (Flutter) and REST API consumers.
- [openapi.yaml](./openapi.yaml): OpenAPI 3.0.3 machine-readable API specification.
- [API_TEST_REPORT.md](./API_TEST_REPORT.md): Comprehensive 122-scenario verification results.

---

## 14. Pull Request Guidelines

To ensure smooth and timely reviews, every Pull Request must meet these criteria:

1. **Clear, Conventional Title**: Follow the Conventional Commits format:
   - *Example*: `feat: add topic intelligence co-occurrence graph`
   - *Example*: `fix: resolve report export authorization failure`
2. **Comprehensive Description**: Use the following structure in your PR description:
   - **Summary**: Concise summary of what was changed.
   - **Motivation / Rationale**: Why the change was made and what problem it solves.
   - **Related Issues**: Reference any linked issues (e.g., `Closes #15`).
   - **API / Database Changes**: List any new endpoints, modified payloads, or Mongoose schema adjustments.
   - **Breaking Changes**: Highlight any breaking changes or backward-incompatibility risks.
   - **Testing Performed**: Detail the manual steps or automated scripts used to verify the change.
   - **Visual Proof**: Attach screenshots or short recordings for any visible UI modifications.
3. **Keep PRs Focused**: A PR should address a single logical change. Do not bundle unrelated refactoring, styling, and feature work into one PR.

---

## 15. Pull Request Review Process

Once a Pull Request is submitted:

```text
1. PR Submitted ──▶ 2. Automated Checks ──▶ 3. Peer Review ──▶ 4. Revisions ──▶ 5. Approved & Merged
```

1. **Automated Verification**: Automated checks and verification scripts validate that the codebase compiles and tests pass.
2. **Reviewer Evaluation**: Maintainers and peer reviewers examine the diff for:
   - Correctness, logic flaws, and edge-case handling.
   - Security practices (RBAC checks, sanitization, secret leakage).
   - Enterprise UI consistency and responsiveness.
   - Data and calculation integrity.
   - Adherence to API conventions and standard response structures.
3. **Addressing Feedback**: If reviewers request changes, push new commits to your branch. Discuss any feedback openly and constructively in the PR thread.
4. **Final Approval & Merge**: Once all reviewer approvals are obtained, a project maintainer will merge your branch into `main`.

---

## 16. What Should NOT Be Committed

The following files and assets must **never** be committed to the repository:

- ❌ **Environment Files**: `.env`, `.env.local`, `.env.production`
- ❌ **API Keys & Credentials**: Gemini API keys, OpenAI keys, AWS/cloud credentials
- ❌ **Authentication Secrets**: `JWT_SECRET`, database passwords, private encryption keys
- ❌ **Live Operational Data**: Proprietary mining company returns, confidential coal extraction spreadsheets, unredacted regulatory communications
- ❌ **Uploaded Documents**: Files in `server/uploads/*` (except `server/uploads/.gitkeep`)
- ❌ **Dependencies**: `node_modules/` (in root, `client/`, or `server/`)
- ❌ **Build Artifacts**: `client/dist/`, compiled distribution bundles
- ❌ **OCR Language Data**: Downloaded `*.traineddata` binary files (handled automatically by Tesseract)
- ❌ **Debug & System Files**: `*.log`, `npm-debug.log*`, `.DS_Store`, `Thumbs.db`, `.vscode/`, `.idea/`

Always review git status before staging files:
```bash
git status
```
Inspect `.gitignore` to ensure new temporary files are properly excluded.

---

## 17. Security Guidelines

Security and data confidentiality are critical in industrial and government mining software.

1. **Responsible Disclosure**:
   - If you discover a security vulnerability, do **not** open a public issue.
   - Privately report the vulnerability to the project maintainers through private channels.
2. **Authentication & Authorization**:
   - Ensure all sensitive endpoints enforce JWT Bearer token authentication.
   - Never bypass or disable role checks (`admin`, `reviewer`, `user`).
   - Ensure standard users cannot escalate permissions or alter roles.
3. **File Upload Security**:
   - Verify that file uploads are restricted to supported formats (PDF, DOCX, XLSX, CSV, PPTX, PNG, JPG, TIFF).
   - Prevent path traversal by utilizing sanitized filenames and unique UUID identifiers.
4. **Data Sanitization**:
   - Sanitize all inputs to protect against NoSQL injection, Cross-Site Scripting (XSS), and prototype pollution.
   - Avoid dumping internal stack traces or database connection strings in API error responses.

---

## 18. UI/UX Contribution Guidelines

When developing or modifying pages and components in `client/`:

1. **Enterprise Design Aesthetic**: Maintain the professional, high-contrast industrial/mining design system (dark slate panels, gold/amber accents for mining themes, clean typography).
2. **Consistent Component Patterns**:
   - Use reusable components in `client/src/components/common/` (buttons, badges, inputs, cards).
   - Maintain consistent padding, margins, and border-radius tokens across all dashboard views.
3. **Responsive Design**: Ensure interfaces display seamlessly across desktop monitors (1920×1080), laptops (1366×768), and tablets/mobile viewports.
4. **No Non-Functional Elements**: Every button, dropdown, search bar, and action card must perform a real action (API call, filter, modal trigger, or view transition). Avoid placeholder buttons with no functionality.
5. **Clear State Indicators**: Provide loading states, skeleton placeholders, empty-state illustrations, and error banners for asynchronous data operations.
6. **Accessibility**: Ensure sufficient color contrast for status indicators (success, warning, critical error), proper semantic HTML structure, and keyboard accessibility.

---

## 19. Backward Compatibility

MineIntel AI is designed to support both web and external clients (such as the Flutter mobile app and enterprise DMS/MIS integrations). Contributors must prioritize backward compatibility:

1. **API Contracts**:
   - Never remove or alter existing fields in `/api/v1` responses without explicit deprecation notices.
   - Maintain the legacy route aliases (`/api/documents`, `/api/reports`, etc.) alongside `/api/v1/*`.
   - Prefer adding optional response fields rather than mutating existing data structures.
2. **Authentication Flow**: Maintain standard Bearer JWT header authentication (`Authorization: Bearer <token>`).
3. **Database Schema Continuity**: Ensure changes to Mongoose models do not invalidate previously ingested documents, extracted records, or validation results.
4. **Documenting Incompatibilities**: If a breaking change is strictly required, it must be prominently flagged in the PR title, description, and documentation.

---

## 20. Issue Reporting

Clear and reproducible issue reports help us diagnose and fix problems quickly.

### How to File an Issue:
1. **Search First**: Verify that the issue has not already been reported.
2. **Descriptive Title**: Use a concise summary (e.g., `[Bug] PDF parser fails on multi-column tables in CMPDI monthly returns`).
3. **Provide Context**:
   - **Description**: Clear explanation of the problem.
   - **Steps to Reproduce**: Numbered, deterministic steps to trigger the bug.
   - **Expected Behavior**: What should have happened.
   - **Actual Behavior**: What actually happened (include error messages or response payloads).
   - **Environment**: OS, Node.js version, browser type/version, client platform.
   - **Relevant Logs**: Attach sanitized terminal logs, browser console errors, or network payloads.
   - **Affected Module**: Specify the file or endpoint (e.g., `server/services/ocrService.js`).

---

## 21. Feature Requests

We welcome proposals for new features that align with MineIntel AI's mission.

### How to Propose a Feature:
1. Open an issue with the prefix `[Feature Request]: <Feature Title>`.
2. Clearly explain:
   - **Problem Statement**: What operational mining challenge does this solve?
   - **Proposed Solution**: How should the feature work?
   - **User Benefit**: How does this improve productivity, compliance, or decision-making for mining corporations?
   - **Affected Modules**: Which frontend views, backend endpoints, or database models are involved?
   - **Feasibility & Security**: Any potential performance, quota, or data security implications.

---

## 22. Contribution Checklist

Before submitting your Pull Request, complete this verification checklist:

- [ ] **Module Understanding**: I have read the relevant documentation and understand the affected component.
- [ ] **Branch Created**: I created a dedicated, appropriately named branch from an up-to-date `main` (`feature/...`, `fix/...`, `docs/...`).
- [ ] **Code Quality**: My code matches existing project conventions (ESM frontend, CommonJS backend) and is clean and readable.
- [ ] **No Committed Secrets**: I have verified that no `.env` files, API keys, credentials, or sensitive documents are staged.
- [ ] **Tested Locally**: I have verified both success and failure scenarios for my changes.
- [ ] **Automated Tests**: I have run relevant verification suites (`scratch/run_full_api_verification.js` or targeted scripts).
- [ ] **Error Handling**: I have handled edge cases, null checks, and error responses properly.
- [ ] **Documentation**: I have updated relevant documentation (`README.md`, `openapi.yaml`, `API_DOCUMENTATION.md`) if APIs, schemas, or configurations changed.
- [ ] **Screenshots Attached**: I have attached visual evidence (screenshots/recordings) for meaningful UI adjustments.
- [ ] **Conventional Commits**: My commit messages follow the Conventional Commits format (`feat: ...`, `fix: ...`).
- [ ] **Diff Reviewed**: I have reviewed my own git diff to eliminate extraneous files or whitespace changes.
- [ ] **Clear PR Description**: My PR includes a comprehensive description of the changes, motivation, and verification steps.

---

## 23. Maintainer / Reviewer Expectations

To maintain high standards across the codebase, project maintainers and reviewers evaluate contributions against the following criteria:

- **Correctness & Reliability**: Does the code perform its intended function without regression?
- **Security & RBAC Enforcement**: Are authorization checks rigorous? Are inputs sanitized?
- **Data & Domain Integrity**: Are mining figures, units, stripping ratios, and calculations scientifically and statistically accurate?
- **API Consistency**: Does the endpoint follow REST conventions and return standard response envelopes?
- **Provenancing**: Are citations, source documents, and audit trails properly recorded?
- **User Experience**: Is the frontend intuitive, accessible, and responsive?
- **Documentation Completeness**: Are all public interfaces, models, and configuration flags clearly documented?
- **Minimal Complexity**: Is the implementation as straightforward as possible without unnecessary third-party overhead?

---

## 24. Final Note

MineIntel AI is engineered to bring cutting-edge artificial intelligence, rigorous regulatory governance, and operational transparency to the mining and mineral extraction industry. Every improvement you contribute—whether a subtle UI enhancement, an optimized parser, a resilient AI prompt, or an automated test—helps build a more robust, reliable platform.

We appreciate your time, effort, and dedication to high engineering standards. Happy contributing!
