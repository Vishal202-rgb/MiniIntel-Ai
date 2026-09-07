# MineIntel AI — Backend API Documentation for Flutter Client
**Platforms Supported:** Android, iOS, Windows Desktop  
**API Protocol:** REST (HTTP/1.1) with JSON Envelopes & Multipart Form-Data  
**Base Version:** REST API v1 (`/api/v1`)  
**Backend Framework:** Express.js 4.x / Node.js 20.x  
**Database:** MongoDB Atlas (Mongoose 8.x)  
**Authentication:** Stateless JSON Web Token (JWT) Bearer Authentication (HMAC SHA-256, 30-day expiry)  

---

## 1. Flutter Integration & Environment Setup

### 1.1 Base URL Configuration by Target Platform

The backend listens by default on port `5000` (or `process.env.PORT`). Flutter apps running on different platforms require specific host addresses to reach the local development server:

| Target Platform | Host Address / Base URL | Why? |
| :--- | :--- | :--- |
| **Android Emulator** | `http://10.0.2.2:5000/api/v1` | `127.0.0.1` inside the Android emulator points to the emulator itself. `10.0.2.2` bridges to the host development PC. (Use `10.0.3.2` if running Genymotion). |
| **iOS Simulator** | `http://127.0.0.1:5000/api/v1` or `http://localhost:5000/api/v1` | iOS Simulator shares the host network loopback adapter. |
| **Windows Desktop** | `http://127.0.0.1:5000/api/v1` or `http://localhost:5000/api/v1` | Native Windows executable connects directly to local loopback socket. |
| **Physical Devices (Android / iOS)** | `http://<YOUR_LAN_IP>:5000/api/v1` (e.g. `http://192.168.1.50:5000/api/v1`) | Physical mobile phones must be on the same Wi-Fi network and target your computer's local IP address. Ensure port 5000 is open in Windows Firewall. |
| **Production / Staging Server** | `https://api.mineintel.ai/api/v1` | Public HTTPS domain with valid SSL/TLS certificate. |

#### Static File / Document Download URL Root
The backend serves raw document uploads statically at `/uploads/<filename>`.
Example: `http://10.0.2.2:5000/uploads/doc-1725681234567.pdf`.  
However, for authenticated, access-controlled document downloads, always use `GET /api/v1/documents/:id/download`.

---

### 1.2 Platform-Specific Network Configurations

#### Android (`android/app/src/main/AndroidManifest.xml`)
For local development using plain `http://`, cleartext traffic must be explicitly enabled, and the `INTERNET` permission must be declared:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET"/>
    
    <application
        android:label="MineIntel AI"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher"
        android:usesCleartextTraffic="true">
        <!-- Activities -->
    </application>
</manifest>
```

#### iOS (`ios/Runner/Info.plist`)
For local testing over HTTP, configure App Transport Security (ATS) exceptions:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
    <!-- Or for non-local development servers over HTTP -->
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

#### Windows Desktop (`windows/runner/`)
No special cleartext permission required. If connecting to a remote staging server, ensure Windows Firewall permits outbound connections for the client application binary.

---

### 1.3 Recommended Flutter Packages

| Package | Version | Purpose |
| :--- | :--- | :--- |
| `dio` | `^5.4.0` | High-level HTTP client supporting Interceptors (JWT token injection & refresh), connection timeouts, and file upload/download progress callbacks. |
| `flutter_secure_storage` | `^9.0.0` | Secure token persistence using Android Keystore / EncryptedSharedPreferences, iOS Keychain, and Windows Credential Manager. |
| `file_picker` | `^8.0.0` | Cross-platform file selector for PDF, DOCX, XLSX, CSV, and image uploads. |
| `path_provider` | `^2.1.0` | Access device local directories (Application Documents, Downloads, Cache) across Android, iOS, and Windows. |
| `open_filex` | `^4.4.0` | Opens exported PDFs and DOCX reports in the default system viewer on Android, iOS, and Windows. |

---

## 2. Global Architectural Conventions

### 2.1 Standard Request Headers

For all authenticated requests:
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept: application/json
```

For multipart file uploads:
```http
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

---

### 2.2 Standard Response Envelopes

Every JSON endpoint in the `/api/v1` namespace returns a uniform response structure.

#### Success Envelope
```json
{
  "success": true,
  "data": { ... } | [ ... ],
  "message": "Descriptive success message",
  "meta": {
    "total": 142,
    "page": 1,
    "limit": 50,
    "pages": 3
  },
  "pagination": {
    "total": 142,
    "page": 1,
    "limit": 50,
    "pages": 3
  }
}
```
> **Note for Flutter Models:** Both `meta` and `pagination` hold identical objects when pagination is present. You can deserialize either field in your Dart models.

#### Error Envelope
```json
{
  "success": false,
  "message": "Human-readable error explanation",
  "error": "SPECIFIC_ERROR_CODE_OR_MESSAGE"
}
```

When an unhandled exception occurs or Multer/Mongoose triggers an error, the global error handler produces:
```json
{
  "success": false,
  "message": "Validation Error: Field 'email' must be valid",
  "error": "Validation Error: Field 'email' must be valid",
  "code": "MONGOOSE_VALIDATION_ERROR"
}
```

---

### 2.3 Standard HTTP Status Codes

| Code | Status | Meaning in MineIntel AI |
| :--- | :--- | :--- |
| **200** | `OK` | Request succeeded; payload returned in `data`. |
| **201** | `Created` | Entity created (user registered, document uploaded, report created, chunk indexed). |
| **307** | `Temporary Redirect` | Preserved on legacy aliases redirecting to canonical routes. |
| **400** | `Bad Request` | Validation failure, missing required body field, or malformed ObjectId. |
| **401** | `Unauthorized` | Missing Bearer token, invalid token signature, or expired JWT. |
| **403** | `Forbidden` | Insufficient role permissions or accessing another user's private entity. |
| **404** | `Not Found` | Entity (document, report, record, user, conversation) does not exist. |
| **409** | `Conflict` | Duplicate document upload (matching SHA-256 hash) or concurrent duplicate task. |
| **500** | `Internal Server Error` | Unhandled backend exception or AI model failure. |
| **503** | `Service Unavailable` | Database disconnected / degraded health status. |

---

## 3. Authentication & RBAC Governance

### 3.1 Authentication Lifecycle

1. **Client Login / Registration**:
   - Standard user: `POST /api/v1/auth/register` or `POST /api/v1/auth/login`.
   - Admin login: `POST /api/v1/auth/login` using credentials configured in `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
2. **Token Issuance**:
   - Backend signs an HMAC SHA-256 JWT containing `{ id: "<user_id>" }` with a **30-day lifetime**.
   - Client stores token securely via `flutter_secure_storage`.
3. **Authenticated Calls**:
   - Client attaches `Authorization: Bearer <token>` to every subsequent HTTP request.
4. **Token Refresh**:
   - When a token expires (`TOKEN_EXPIRED`), the client can call `POST /api/v1/auth/refresh` passing the existing token in the `Authorization: Bearer` header or in the JSON body `{ "token": "<token>" }`.
5. **Logout**:
   - Call `POST /api/v1/auth/logout` (Bearer optional for audit trail attribution) and delete the token from device storage.

### 3.2 User Roles & Permissions

The backend defines three roles:
1. `user` (Standard User):
   - Can upload, view, edit metadata, reprocess, and delete **their own documents**.
   - Can generate, view, edit, submit, and export **their own reports**.
   - Can query AI Assistant and view **their own conversation history**.
   - Can view and manage **their own settings and notifications**.
2. `reviewer` (Reviewer):
   - Possesses all `user` capabilities.
   - Can access the pending review queue (`GET /api/v1/reviews/pending`).
   - Can inspect and reject reports with mandatory review reasons (`POST /api/v1/reports/:id/reject`).
   - Can review and submit document validation decisions.
3. `admin` (Administrator):
   - Full platform governance.
   - Can inspect all documents, reports, and validation issues across all users.
   - Can approve reports (`POST /api/v1/reports/:id/approve` or `POST /api/v1/reviews/:id/approve`).
   - Can view all users, update user roles, and delete user accounts.
   - Can inspect system health and system-wide statistics.
   - **Crucial Security Constraint:** Only the user account whose username strictly matches `process.env.ADMIN_USERNAME` (default: `'admin'`) can hold the `admin` role. All role elevation attempts by other users are blocked and downgraded to `user`.

---

## 4. Master Endpoint Inventory

| # | HTTP Method | Path | Auth / Role | Module | Purpose |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/api/v1/health` | Public | System Health | Database state, uptime, environment health |
| 2 | `POST` | `/api/v1/auth/register` | Public | Auth | Register standard user (`user` role) |
| 3 | `POST` | `/api/v1/auth/login` | Public | Auth | Authenticate user or admin; returns JWT |
| 4 | `POST` | `/api/v1/auth/logout` | Optional Bearer | Auth | Log out user and record audit event |
| 5 | `GET` | `/api/v1/auth/me` | Bearer (`Any`) | Auth | Retrieve authenticated user profile |
| 6 | `PUT` | `/api/v1/auth/profile` | Bearer (`Any`) | Auth | Update email and department |
| 7 | `PUT` | `/api/v1/auth/change-password`| Bearer (`Any`) | Auth | Change password (verifies current password) |
| 8 | `POST` | `/api/v1/auth/refresh` | Public / Token | Auth | Refresh active or expired JWT |
| 9 | `GET` | `/api/v1/admin/users` | Bearer (`admin`) | Admin | List all registered users (passwords excluded) |
| 10 | `PUT` | `/api/v1/admin/users/:id/role`| Bearer (`admin`) | Admin | Update user role (`user`, `reviewer`) |
| 11 | `DELETE`| `/api/v1/admin/users/:id` | Bearer (`admin`) | Admin | Delete user account (cannot self-delete) |
| 12 | `GET` | `/api/v1/admin/stats` | Bearer (`admin`) | Admin | Total users, docs, reports, validations |
| 13 | `GET` | `/api/v1/admin/system-health` | Bearer (`admin`) | Admin | MongoDB, Backend, AI Provider status |
| 14 | `GET` | `/api/v1/dashboard/overview` | Bearer (`Any`) | Dashboard | Role-scoped dashboard summary |
| 15 | `GET` | `/api/v1/dashboard/kpis` | Bearer (`Any`) | Dashboard | Key performance indicators |
| 16 | `GET` | `/api/v1/dashboard/activity` | Bearer (`Any`) | Dashboard | Activity audit stream (`limit` query) |
| 17 | `GET` | `/api/v1/dashboard/alerts` | Bearer (`Any`) | Dashboard | Pending issues and critical alerts |
| 18 | `GET` | `/api/v1/dashboard/recent-documents` | Bearer (`Any`) | Dashboard | Most recently uploaded documents |
| 19 | `GET` | `/api/v1/command-centre/overview` | Bearer (`Any`) | Command Centre | High-level operations overview |
| 20 | `GET` | `/api/v1/command-centre/pipeline` | Bearer (`Any`) | Command Centre | Ingestion pipeline throughput & status |
| 21 | `GET` | `/api/v1/command-centre/status` | Bearer (`Any`) | Command Centre | Real-time system services health |
| 22 | `GET` | `/api/v1/command-centre/attention-items` | Bearer (`Any`) | Command Centre | Critical items requiring immediate human review |
| 23 | `GET` | `/api/v1/command-centre/activity` | Bearer (`Any`) | Command Centre | Real-time operations feed |
| 24 | `GET` | `/api/v1/settings` | Bearer (`Any`) | Settings | Complete user settings tree |
| 25 | `PUT` | `/api/v1/settings` | Bearer (`Any`) | Settings | Bulk update user settings |
| 26 | `GET` | `/api/v1/settings/language` | Bearer (`Any`) | Settings | Language preference & supported languages |
| 27 | `PUT` | `/api/v1/settings/language` | Bearer (`Any`) | Settings | Update language preference (`en`, `hi`) |
| 28 | `GET` | `/api/v1/settings/appearance`| Bearer (`Any`) | Settings | Theme preferences (`light`, `dark`) |
| 29 | `PUT` | `/api/v1/settings/appearance`| Bearer (`Any`) | Settings | Update theme (`light`, `dark`) |
| 30 | `GET` | `/api/v1/settings/notifications` | Bearer (`Any`) | Settings | Notification preference flags |
| 31 | `PUT` | `/api/v1/settings/notifications` | Bearer (`Any`) | Settings | Update notification preferences |
| 32 | `GET` | `/api/v1/help` | Bearer (`Any`) | Help | Help overview and categories |
| 33 | `GET` | `/api/v1/help/faqs` | Bearer (`Any`) | Help | Frequently asked questions list |
| 34 | `GET` | `/api/v1/help/search` | Bearer (`Any`) | Help | Search FAQs and help articles |
| 35 | `GET` | `/api/v1/help/faqs/:id` | Bearer (`Any`) | Help | Specific FAQ item by ID |
| 36 | `POST` | `/api/v1/documents/upload` | Bearer (`Any`) | Documents | Upload document (`multipart/form-data`) |
| 37 | `GET` | `/api/v1/documents` | Bearer (`Any`) | Documents | Filter & paginate documents |
| 38 | `GET` | `/api/v1/documents/:id` | Bearer (`Owner/Admin`) | Documents | Document details and extracted pages |
| 39 | `DELETE`| `/api/v1/documents/:id` | Bearer (`Owner/Admin`) | Documents | Delete document, chunks, and disk file |
| 40 | `GET` | `/api/v1/documents/:id/download` | Bearer (`Owner/Admin`) | Documents | Download original document file binary |
| 41 | `GET` | `/api/v1/documents/:id/metadata` | Bearer (`Owner/Admin`) | Documents | Technical & GIS metadata |
| 42 | `PUT` | `/api/v1/documents/:id/metadata` | Bearer (`Owner/Admin`) | Documents | Update category, classification, GIS |
| 43 | `POST` | `/api/v1/documents/:id/reprocess` | Bearer (`Owner/Admin`) | Documents | Trigger re-ingestion & OCR |
| 44 | `GET` | `/api/v1/documents/:id/status` | Bearer (`Any`) | Documents | Ingestion job progress & steps |
| 45 | `POST` | `/api/v1/documents/:id/retry` | Bearer (`Owner/Admin`) | Documents | Redirects (307) to reprocess |
| 46 | `GET` | `/api/v1/documents/:id/validation` | Bearer (`Any`) | Documents | Validation results for document |
| 47 | `POST` | `/api/v1/extraction/run` | Bearer (`Any`) | Extraction | Run AI parameter extraction |
| 48 | `GET` | `/api/v1/extraction/:documentId` | Bearer (`Owner/Admin`) | Extraction | Extraction summary & confidence |
| 49 | `GET` | `/api/v1/extraction/:documentId/records` | Bearer (`Owner/Admin`) | Extraction | Extracted records with filters & paging |
| 50 | `PUT` | `/api/v1/extraction/:documentId/records/:recordId` | Bearer (`Owner/Admin`) | Extraction | Edit record value/unit with audit trail |
| 51 | `POST` | `/api/v1/extraction/:documentId/reprocess` | Bearer (`Owner/Admin`) | Extraction | Clear and re-run extraction |
| 52 | `PUT` | `/api/v1/extraction/records/:id` | Bearer (`Owner/Admin`) | Extraction | Legacy single record edit |
| 53 | `POST` | `/api/v1/extraction/records/:id/approve` | Bearer (`Owner/Admin`) | Extraction | Approve single extracted record |
| 54 | `POST` | `/api/v1/extraction/records/:id/reject` | Bearer (`Owner/Admin`) | Extraction | Reject single extracted record |
| 55 | `POST` | `/api/v1/extraction/records/bulk-approve` | Bearer (`Owner/Admin`) | Extraction | Bulk approve records by ID array |
| 56 | `POST` | `/api/v1/validation/run` | Bearer (`Any`) | Validation | Execute rules & calculate quality score |
| 57 | `GET` | `/api/v1/validation` | Bearer (`Any`) | Validation | Cross-document validation issues list |
| 58 | `GET` | `/api/v1/validation/summary` | Bearer (`Any`) | Validation | Validation summary KPIs |
| 59 | `GET` | `/api/v1/validation/:documentId` | Bearer (`Owner/Admin`) | Validation | Complete document validation report |
| 60 | `GET` | `/api/v1/validation/:documentId/issues` | Bearer (`Owner/Admin`) | Validation | Filtered issues for document |
| 61 | `PUT` | `/api/v1/validation/issues/:issueId` | Bearer (`Owner/Admin`) | Validation | Resolve issue & correct record value |
| 62 | `POST` | `/api/v1/validation/:documentId/approve` | Bearer (`Owner/Admin`) | Validation | Approve validation and finalize records |
| 63 | `POST` | `/api/v1/validation/:documentId/review` | Bearer (`Owner/Admin`) | Validation | Batch review decision & issue resolution |
| 64 | `POST` | `/api/v1/reports/generate` | Bearer (`Any`) | Reports | Generate report from document data |
| 65 | `GET` | `/api/v1/reports` | Bearer (`Any`) | Reports | List reports with filters & pagination |
| 66 | `GET` | `/api/v1/reports/:id` | Bearer (`Any`) | Reports | Report details, content & citations |
| 67 | `PUT` | `/api/v1/reports/:id` | Bearer (`Any`) | Reports | Update report title, content, markdown |
| 68 | `DELETE`| `/api/v1/reports/:id` | Bearer (`Any`) | Reports | Delete report |
| 69 | `POST` | `/api/v1/reports/:id/submit-review` | Bearer (`Any`) | Reports | Submit draft report for review |
| 70 | `POST` | `/api/v1/reports/:id/approve` | Bearer (`admin`) | Reports | Approve report (Admin only) |
| 71 | `POST` | `/api/v1/reports/:id/reject` | Bearer (`reviewer/admin`) | Reports | Reject report with mandatory reason |
| 72 | `GET` | `/api/v1/reports/:id/evidence` | Bearer (`Any`) | Reports | Evidence citations & source document links |
| 73 | `GET` | `/api/v1/reports/:id/version-history` | Bearer (`Any`) | Reports | Historical content revisions |
| 74 | `GET` | `/api/v1/reports/:id/changes` | Bearer (`Any`) | Reports | Version diffs |
| 75 | `GET` | `/api/v1/reports/:id/export/pdf` | Bearer (`Any`) | Reports | Download report as binary PDF |
| 76 | `GET` | `/api/v1/reports/:id/export/docx`| Bearer (`Any`) | Reports | Download report as binary Word (.docx) |
| 77 | `GET` | `/api/v1/reports/:id/export/csv` | Bearer (`Any`) | Reports | Download report data as CSV text |
| 78 | `GET` | `/api/v1/reports/:id/export/json`| Bearer (`Any`) | Reports | Download report payload as JSON file |
| 79 | `GET` | `/api/v1/reports/:id/export` | Bearer (`Any`) | Reports | Generic export via `?format=` query |
| 80 | `GET` | `/api/v1/reviews/pending` | Bearer (`Any`) | Reviews | Queue of reports awaiting approval |
| 81 | `GET` | `/api/v1/reviews/:id` | Bearer (`Any`) | Reviews | Specific review item details |
| 82 | `POST` | `/api/v1/reviews/:id/approve` | Bearer (`admin`) | Reviews | Dedicated approve endpoint (Admin only) |
| 83 | `POST` | `/api/v1/reviews/:id/reject` | Bearer (`reviewer/admin`) | Reviews | Dedicated reject endpoint |
| 84 | `GET` | `/api/v1/knowledge-base` | Bearer (`Any`) | Knowledge Base | List indexed docs & vector statistics |
| 85 | `POST` | `/api/v1/knowledge-base/index` | Bearer (`Any`) | Knowledge Base | Chunk & embed document into vector DB |
| 86 | `DELETE`| `/api/v1/knowledge-base/:documentId` | Bearer (`Any`) | Knowledge Base | Delete document vector chunks |
| 87 | `POST` | `/api/v1/knowledge-base/search`| Bearer (`Any`) | Knowledge Base | Vector semantic search with filters |
| 88 | `GET` | `/api/v1/knowledge-base/:documentId` | Bearer (`Any`) | Knowledge Base | Document vector chunks & metadata |
| 89 | `POST` | `/api/v1/rag/:documentId/index` | Bearer (`Any`) | RAG | Low-level RAG index endpoint |
| 90 | `POST` | `/api/v1/rag/search` | Bearer (`Any`) | RAG | Low-level vector similarity search |
| 91 | `POST` | `/api/v1/ai-assistant/query` | Bearer (`Any`) | AI Assistant | Ask AI question with RAG evidence |
| 92 | `POST` | `/api/v1/ai-assistant/ask` | Bearer (`Any`) | AI Assistant | Alias for AI Assistant query |
| 93 | `GET` | `/api/v1/ai-assistant/history` | Bearer (`Any`) | AI Assistant | List conversation sessions |
| 94 | `GET` | `/api/v1/ai-assistant/history/:id` | Bearer (`Any`) | AI Assistant | Get conversation messages & evidence |
| 95 | `DELETE`| `/api/v1/ai-assistant/history/:id` | Bearer (`Any`) | AI Assistant | Delete conversation history session |
| 96 | `GET` | `/api/v1/analytics/overview` | Bearer (`Any`) | Analytics | Production & dispatch summaries |
| 97 | `GET` | `/api/v1/analytics/kpis` | Bearer (`Any`) | Analytics | Mining KPIs (overburden, stripping ratio) |
| 98 | `GET` | `/api/v1/analytics/production` | Bearer (`Any`) | Analytics | Monthly/quarterly production metrics |
| 99 | `GET` | `/api/v1/analytics/dispatch` | Bearer (`Any`) | Analytics | Coal dispatch & transportation metrics |
| 100 | `GET` | `/api/v1/analytics/trends` | Bearer (`Any`) | Analytics | Production time-series trends |
| 101 | `GET` | `/api/v1/analytics/variance` | Bearer (`Any`) | Analytics | Target vs actual production variance |
| 102 | `GET` | `/api/v1/analytics/anomalies`| Bearer (`Any`) | Analytics | Statistical anomaly detection |
| 103 | `GET` | `/api/v1/topics` | Bearer (`Any`) | Topics | Discovered topic taxonomy list |
| 104 | `POST` | `/api/v1/topics/analyze` | Bearer (`Any`) | Topics | Discover topics across document corpus |
| 105 | `GET` | `/api/v1/topics/trends` | Bearer (`Any`) | Topics | Topic prominence over time |
| 106 | `GET` | `/api/v1/topics/clusters` | Bearer (`Any`) | Topics | Topic clusters and relationships |
| 107 | `GET` | `/api/v1/topics/entities` | Bearer (`Any`) | Topics | Named entity distribution |
| 108 | `GET` | `/api/v1/topics/emerging` | Bearer (`Any`) | Topics | Fast-rising topics |
| 109 | `GET` | `/api/v1/topics/changes` | Bearer (`Any`) | Topics | Topic shifts and delta |
| 110 | `POST` | `/api/v1/agents/orchestrate` | Bearer (`Any`) | Agents | Multi-agent autonomous task orchestration |
| 111 | `GET` | `/api/v1/audit` | Bearer (`Any`) | Audit Trail | System audit logs with filtering |
| 112 | `GET` | `/api/v1/audit/stats` | Bearer (`Any`) | Audit Trail | Audit statistics & top actions |
| 113 | `GET` | `/api/v1/audit/export` | Bearer (`Any`) | Audit Trail | Export audit trail (CSV / JSON) |
| 114 | `GET` | `/api/v1/audit/user/:userId` | Bearer (`Any`) | Audit Trail | Audit events generated by specific user |
| 115 | `GET` | `/api/v1/audit/document/:documentId` | Bearer (`Any`) | Audit Trail | Audit trail for specific document |
| 116 | `GET` | `/api/v1/audit/report/:reportId` | Bearer (`Any`) | Audit Trail | Audit trail for specific report |
| 117 | `GET` | `/api/v1/audit/:id` | Bearer (`Any`) | Audit Trail | Specific audit log detail |
| 118 | `GET` | `/api/v1/notifications` | Bearer (`Any`) | Notifications | In-app user notifications & unread count |
| 119 | `PUT` | `/api/v1/notifications/read-all` | Bearer (`Any`) | Notifications | Mark all notifications as read |
| 120 | `PUT` | `/api/v1/notifications/:id/read` | Bearer (`Any`) | Notifications | Mark single notification as read |
| 121 | `GET` | `/api/v1/intelligence` | Bearer (`Any`) | Intelligence | Document intelligence overview |
| 122 | `POST` | `/api/v1/intelligence/analyze` | Bearer (`Any`) | Intelligence | Cross-document semantic analysis |
| 123 | `GET` | `/api/v1/intelligence/trends` | Bearer (`Any`) | Intelligence | Cross-document intelligence trends |
| 124 | `GET` | `/api/v1/intelligence/entities` | Bearer (`Any`) | Intelligence | Consolidated mining entities |
| 125 | `GET` | `/api/v1/intelligence/clusters` | Bearer (`Any`) | Intelligence | Corpus clusters & semantic groups |
| 126 | `GET` | `/api/v1/intelligence/similarity` | Bearer (`Any`) | Intelligence | Cross-document similarity matrix |
| 127 | `GET` | `/api/v1/intelligence/changes` | Bearer (`Any`) | Intelligence | Temporal and operational shifts |
| 128 | `GET` | `/api/v1/intelligence/entities/:documentId` | Bearer (`Any`) | Intelligence | Entities for specific document |
| 129 | `GET` | `/api/v1/intelligence/similarity/:documentId` | Bearer (`Any`) | Intelligence | Similar documents for target document |
| 130 | `POST` | `/api/v1/intelligence/link-evidence/:documentId` | Bearer (`Any`) | Intelligence | Link extracted records to evidence snippets |
| 131 | `GET` | `/api/v1/integration/documents` | Bearer (`Any`) | Integration | DMS-compatible document catalog |
| 132 | `GET` | `/api/v1/integration/records` | Bearer (`Any`) | Integration | MIS-compatible tabular records |
| 133 | `GET` | `/api/v1/integration/gis` | Bearer (`Any`) | Integration | GIS geo-spatial document coordinates |

---

## 5. Detailed Endpoint Specifications

---

### Module 01: System Health & Info
**Base Path:** `/api/v1/health`

#### 01.1 System Health Check
- **Method & Path:** `GET /api/v1/health`
- **Auth:** None (Public)
- **Response Headers:** `Content-Type: application/json`
- **Success Response (200 OK or 503 Service Unavailable):**
```json
{
  "success": true,
  "data": {
    "api": "healthy",
    "server": "online",
    "database": "connected",
    "timestamp": "2026-09-07T12:00:00.000Z",
    "version": "v1",
    "uptime": 1423,
    "environment": "development"
  },
  "message": "MineIntel AI API v1 is operational"
}
```
- **Flutter Note:** Call this during app startup or network reconnection to verify API reachability before showing the login screen.

---

### Module 02: Authentication & User Profile
**Base Path:** `/api/v1/auth`

#### 02.1 Register Standard User
- **Method & Path:** `POST /api/v1/auth/register`
- **Auth:** None (Public)
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "username": "mining_engineer",
  "password": "SecurePassword123!",
  "email": "engineer@mineintel.ai"
}
```
  - `username`: Required, string, minimum 3 characters. Cannot match reserved admin identity (e.g. `'admin'`).
  - `password`: Required, string, minimum 6 characters.
  - `email`: Optional, string, valid email format.
- **Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "66db1e8a946320509a25b123",
    "username": "mining_engineer",
    "email": "engineer@mineintel.ai",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```
- **Error Responses:**
  - `400 Bad Request`: Validation failure (short password/username) or username/email already exists (`USER_EXISTS`, `EMAIL_EXISTS`).
  - `403 Forbidden`: Attempting to register the predefined admin name (`FORBIDDEN_IDENTITY`).

#### 02.2 Login User or Admin
- **Method & Path:** `POST /api/v1/auth/login`
- **Auth:** None (Public)
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "username": "mining_engineer",
  "password": "SecurePassword123!"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "66db1e8a946320509a25b123",
    "username": "mining_engineer",
    "email": "engineer@mineintel.ai",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User authentication successful"
}
```
- **Error Responses:**
  - `400 Bad Request`: Missing username or password.
  - `401 Unauthorized`: Invalid username or password (`INVALID_CREDENTIALS`).
  - `403 Forbidden`: Account is suspended or inactive (`ACCOUNT_INACTIVE`).

#### 02.3 Get Current User Profile (`me`)
- **Method & Path:** `GET /api/v1/auth/me`
- **Auth:** `Authorization: Bearer <token>` (Any authenticated role)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "66db1e8a946320509a25b123",
    "username": "mining_engineer",
    "email": "engineer@mineintel.ai",
    "role": "user",
    "department": "Mining Technology Unit",
    "status": "active",
    "lastLogin": "2026-09-07T08:30:00.000Z",
    "createdAt": "2026-09-01T10:00:00.000Z"
  },
  "message": "User profile retrieved"
}
```

#### 02.4 Update Profile
- **Method & Path:** `PUT /api/v1/auth/profile`
- **Auth:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "email": "new_email@mineintel.ai",
  "department": "Safety & Compliance Directorate"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "66db1e8a946320509a25b123",
    "username": "mining_engineer",
    "email": "new_email@mineintel.ai",
    "department": "Safety & Compliance Directorate",
    "role": "user",
    "status": "active"
  },
  "message": "Profile updated successfully"
}
```

#### 02.5 Change Password
- **Method & Path:** `PUT /api/v1/auth/change-password`
- **Auth:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "currentPassword": "SecurePassword123!",
  "newPassword": "NewStrongPassword2026!"
}
```
  - `newPassword`: Minimum 6 characters, must differ from `currentPassword`.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {},
  "message": "Password changed successfully"
}
```

#### 02.6 Refresh Token
- **Method & Path:** `POST /api/v1/auth/refresh`
- **Auth:** None required (Token passed in Bearer header OR in request body)
- **Request Body (if Bearer header not used):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_NEW_REFRESHED_TOKEN...",
    "user": {
      "_id": "66db1e8a946320509a25b123",
      "username": "mining_engineer",
      "role": "user"
    }
  },
  "message": "Token refreshed successfully"
}
```

#### 02.7 Logout
- **Method & Path:** `POST /api/v1/auth/logout`
- **Auth:** Optional Bearer (if present, logs an audit log entry for the user)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {},
  "message": "Logged out successfully"
}
```

---

### Module 03: Administration & User Governance
**Base Path:** `/api/v1/admin`  
**Required Role:** `admin` (Strictly enforced. Returns `403 Forbidden` for non-admin users)

#### 03.1 List All Users
- **Method & Path:** `GET /api/v1/admin/users`
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "66db1e8a946320509a25b123",
      "username": "mining_engineer",
      "email": "engineer@mineintel.ai",
      "role": "user",
      "status": "active",
      "department": "Mining Operations",
      "createdAt": "2026-09-01T10:00:00.000Z"
    }
  ],
  "message": "Users retrieved successfully"
}
```

#### 03.2 Update User Role
- **Method & Path:** `PUT /api/v1/admin/users/:id/role`
- **Request Body:**
```json
{
  "role": "reviewer"
}
```
  - Allowed values for `role`: `'user'`, `'reviewer'`.
  - Passing `'admin'` returns `403 Forbidden` (`FORBIDDEN_ROLE_ASSIGNMENT`). Only the configured system admin identity can hold `'admin'`.
- **Success Response (200 OK):** Updated user object.

#### 03.3 Delete User
- **Method & Path:** `DELETE /api/v1/admin/users/:id`
- **Rules:** Admin cannot delete their own account (`SELF_DELETE_FORBIDDEN`) or the designated system admin account (`ADMIN_DELETE_FORBIDDEN`).
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": { "deletedUserId": "66db1e8a946320509a25b123" },
  "message": "User deleted successfully"
}
```

#### 03.4 Admin Platform Statistics
- **Method & Path:** `GET /api/v1/admin/stats`
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 26,
    "totalDocuments": 48,
    "indexedDocuments": 42,
    "reportsGenerated": 15,
    "totalValidations": 89,
    "openValidations": 4
  },
  "message": "Admin statistics retrieved"
}
```

#### 03.5 Admin System Health
- **Method & Path:** `GET /api/v1/admin/system-health`
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "backend": "Online",
    "mongoDB": "Connected",
    "aiProvider": "Online",
    "vectorDB": "Online"
  },
  "message": "System health status retrieved"
}
```

---

### Module 04: Dashboard Analytics
**Base Path:** `/api/v1/dashboard`  
**Auth:** Bearer (`user`, `reviewer`, `admin`)

#### 04.1 Dashboard Overview
- **Method & Path:** `GET /api/v1/dashboard/overview`
- **Returns:** Aggregated metrics scoped to the user (or platform-wide for admin):
  - Total documents, pending extractions, active reports, quality score, and monthly throughput.

#### 04.2 Dashboard KPIs
- **Method & Path:** `GET /api/v1/dashboard/kpis`
- **Returns:** Numerical KPI cards (e.g. Ingestion Success Rate, Average Confidence, Unresolved Validation Issues, Pending Reviews).

#### 04.3 Activity Feed
- **Method & Path:** `GET /api/v1/dashboard/activity?limit=15`
- **Query Parameters:** `limit` (optional integer, default `15`, max `100`).
- **Returns:** Array of recent audit/activity items with timestamps and user identifiers.

#### 04.4 Alerts
- **Method & Path:** `GET /api/v1/dashboard/alerts`
- **Returns:** Urgent action items (failed ingestion jobs, critical validation errors, pending review deadlines).

#### 04.5 Recent Documents
- **Method & Path:** `GET /api/v1/dashboard/recent-documents?limit=10`
- **Query Parameters:** `limit` (optional integer, default `10`, max `50`).
- **Returns:** List of latest documents uploaded by the user with processing status.

---

### Module 05: Command Centre
**Base Path:** `/api/v1/command-centre` (also aliased as `/api/v1/command-center`)  
**Auth:** Bearer

- `GET /api/v1/command-centre/overview`: Multi-tenant pipeline status, throughput rates, and system alerts.
- `GET /api/v1/command-centre/pipeline`: Active extraction and OCR processing queues.
- `GET /api/v1/command-centre/status`: Real-time backend service statuses (OCR, LLM, Vector Engine).
- `GET /api/v1/command-centre/attention-items`: Documents or reports requiring manual human intervention.
- `GET /api/v1/command-centre/activity?limit=20`: Real-time operational activity log.

---

### Module 06: User Settings & Preferences
**Base Path:** `/api/v1/settings`  
**Auth:** Bearer

#### 06.1 Get All Settings
- **Method & Path:** `GET /api/v1/settings`
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "language": {
      "language": "en",
      "timezone": "Asia/Kolkata (IST)",
      "supportedLanguages": [
        { "code": "en", "name": "English (US)", "native": "English" },
        { "code": "hi", "name": "Hindi", "native": "हिन्दी" }
      ]
    },
    "appearance": {
      "theme": "light",
      "supportedThemes": ["light", "dark"]
    },
    "notifications": {
      "emailNotif": true,
      "pushNotif": true,
      "reportAlerts": false
    },
    "account": {
      "username": "mining_engineer",
      "email": "engineer@mineintel.ai",
      "role": "user",
      "department": "Mining Operations",
      "organization": "CMPDI / Coal India Limited"
    },
    "adminSettings": null
  },
  "message": "Settings retrieved successfully"
}
```

#### 06.2 Update Complete Settings
- **Method & Path:** `PUT /api/v1/settings`
- **Request Body:**
```json
{
  "language": { "language": "hi" },
  "appearance": { "theme": "dark" },
  "notifications": { "emailNotif": true, "pushNotif": false, "reportAlerts": true }
}
```

#### 06.3 Update Specific Settings Sub-Sections
- `PUT /api/v1/settings/language` &rarr; Body: `{ "language": "en" | "hi" }`
- `PUT /api/v1/settings/appearance` &rarr; Body: `{ "theme": "light" | "dark" }`
- `PUT /api/v1/settings/notifications` &rarr; Body: `{ "emailNotif": true, "pushNotif": false, "reportAlerts": true }`

---

### Module 07: Help & Knowledge FAQs
**Base Path:** `/api/v1/help`  
**Auth:** Bearer

- `GET /api/v1/help`: Returns category overview, contact information, and documentation links.
- `GET /api/v1/help/faqs?category=Validation&search=OCR`: Returns filtered FAQs.
- `GET /api/v1/help/search?q=statutory+report`: Full-text search across all help guides.
- `GET /api/v1/help/faqs/:id`: Details for a specific FAQ.

---

### Module 08: Document Lifecycle Management
**Base Path:** `/api/v1/documents`  
**Auth:** Bearer

#### 08.1 Upload Document (Multipart)
- **Method & Path:** `POST /api/v1/documents/upload`
- **Request Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: multipart/form-data`
- **Form Data Field:**
  - `file`: The binary document file (**Required**).
- **Supported File Types / MIME Types:**
  - PDF: `application/pdf`
  - Word: `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`)
  - Excel: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`)
  - CSV: `text/csv`
  - PowerPoint: `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`)
  - Images: `image/png`, `image/jpeg`, `image/tiff`
- **Deduplication:** The server generates a SHA-256 checksum of the uploaded file. If an identical document exists, it deletes the uploaded file and responds with `409 Conflict`.
- **Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "66db24fa946320509a25b456",
    "filename": "file-1725682938123.pdf",
    "originalName": "Monthly_Coal_Production_July2026.pdf",
    "mimeType": "application/pdf",
    "fileSize": 142058,
    "fileType": "pdf",
    "hash": "a1b2c3d4e5f6...",
    "category": "Uncategorized",
    "classification": "internal",
    "status": "pending",
    "totalPages": 0,
    "uploadedAt": "2026-09-07T04:22:18.123Z",
    "userId": "66db1e8a946320509a25b123"
  },
  "message": "Document uploaded successfully and queued for processing"
}
```
- **Error Responses:**
  - `400 Bad Request`: `NO_FILE_UPLOADED` or `INVALID_FILE_TYPE`.
  - `409 Conflict`: `DUPLICATE_DOCUMENT` ("Duplicate document detected (checksum matched an existing document)").

#### 08.2 List Documents (Filtered & Paginated)
- **Method & Path:** `GET /api/v1/documents`
- **Query Parameters:**
  - `search`: Case-insensitive name filter (e.g. `?search=Production`)
  - `type`: File type (`pdf`, `docx`, `xlsx`, `csv`, `image`, `pptx`)
  - `status`: Processing status (`pending`, `processing`, `completed`, `failed`, `extracted`)
  - `category`: Document category string
  - `classification`: Security tier (`public`, `internal`, `confidential`, `restricted`)
  - `dateFrom`: ISO 8601 date string (e.g. `2026-01-01`)
  - `dateTo`: ISO 8601 date string (e.g. `2026-12-31`)
  - `page`: Integer, default `1`
  - `limit`: Integer, default `50` (max `100`)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "66db24fa946320509a25b456",
      "filename": "file-1725682938123.pdf",
      "originalName": "Monthly_Coal_Production_July2026.pdf",
      "fileType": "pdf",
      "status": "completed",
      "category": "Production Report",
      "classification": "internal",
      "totalPages": 12,
      "uploadedAt": "2026-09-07T04:22:18.123Z"
    }
  ],
  "message": "Documents retrieved successfully",
  "meta": {
    "total": 48,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

#### 08.3 Get Document Details & Pages
- **Method & Path:** `GET /api/v1/documents/:id`
- **Auth:** Private (Owner or Admin)
- **Returns:** Full document metadata plus the array of extracted pages (`DocumentPage`) containing OCR/parsed text for each page.

#### 08.4 Download Original File
- **Method & Path:** `GET /api/v1/documents/:id/download`
- **Auth:** Private (Owner or Admin)
- **Response Type:** Binary octet-stream with headers:
  - `Content-Type: <mimeType>`
  - `Content-Disposition: attachment; filename="<originalName>"`
- **Flutter Note:** Use `Dio().download(url, savePath, onReceiveProgress: ...)` to stream to the device's storage.

#### 08.5 Check Ingestion Processing Status
- **Method & Path:** `GET /api/v1/documents/:id/status`
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "66db24fb946320509a25b789",
    "documentId": "66db24fa946320509a25b456",
    "status": "processing",
    "progress": 65,
    "currentStep": "Extracting tabular data from pages",
    "steps": [
      { "name": "File Ingestion", "status": "completed" },
      { "name": "OCR & Text Parsing", "status": "completed" },
      { "name": "Information Extraction", "status": "processing" },
      { "name": "Vector Indexing", "status": "pending" }
    ],
    "startedAt": "2026-09-07T04:22:20.000Z",
    "error": ""
  },
  "message": "Processing job status retrieved"
}
```
- **Flutter Note:** Poll this endpoint every 2–3 seconds until `status == "completed"` or `status == "failed"` to display progress bars during document ingestion.

#### 08.6 Update Document Metadata
- **Method & Path:** `PUT /api/v1/documents/:id/metadata`
- **Request Body:**
```json
{
  "category": "Environmental Audit",
  "classification": "confidential",
  "gisMetadata": {
    "latitude": 23.7957,
    "longitude": 86.4304,
    "region": "Jharia Coalfield, Dhanbad"
  },
  "retentionDate": "2031-12-31T23:59:59.000Z"
}
```

#### 08.7 Reprocess Document
- **Method & Path:** `POST /api/v1/documents/:id/reprocess`
- **Purpose:** Clears existing processing errors, resets status to `'pending'`, and re-triggers OCR and parsing.

#### 08.8 Delete Document
- **Method & Path:** `DELETE /api/v1/documents/:id`
- **Deletes:** Document record, page extractions, vector chunks, processing jobs, extracted records, and physical disk file.

---

### Module 09: Data Extraction & HITL (Human-in-the-Loop)
**Base Path:** `/api/v1/extraction`  
**Auth:** Bearer

#### 09.1 Trigger Extraction
- **Method & Path:** `POST /api/v1/extraction/run`
- **Request Body:** `{ "documentId": "66db24fa946320509a25b456" }`
- **Returns:** Array of extracted entities/records with confidence scores.

#### 09.2 Get Document Extraction Summary
- **Method & Path:** `GET /api/v1/extraction/:documentId`
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "documentId": "66db24fa946320509a25b456",
    "summary": {
      "total": 24,
      "approved": 20,
      "pending": 4,
      "rejected": 0,
      "avgConfidence": 0.94,
      "parameters": ["Overburden Removal", "Coal Production", "Dispatch (Rail)", "Diesel Consumption"]
    },
    "records": [ ... ]
  },
  "message": "Extraction summary retrieved successfully"
}
```

#### 09.3 List Extracted Records (Filtered & Paginated)
- **Method & Path:** `GET /api/v1/extraction/:documentId/records`
- **Query Parameters:**
  - `status`: `'pending'`, `'approved'`, or `'rejected'`
  - `parameter`: Filter by parameter name string (e.g. `'Coal Production'`)
  - `mineName`: Filter by mine name
  - `page`: Integer (default `1`)
  - `limit`: Integer (default `50`)
- **Record Object Structure:**
```json
{
  "_id": "66db2500946320509a25c111",
  "documentId": "66db24fa946320509a25b456",
  "pageNumber": 3,
  "parameter": "Coal Production",
  "value": "142500",
  "unit": "Metric Tonnes",
  "period": "July 2026",
  "mineName": "Rajmahal OCP",
  "subsidiary": "ECL",
  "confidenceScore": 0.96,
  "sourceText": "Total raw coal production for Rajmahal OCP during July 2026 stood at 142,500 MT.",
  "status": "pending",
  "originalValue": "142500",
  "editHistory": [],
  "linkedEvidence": [
    {
      "pageNumber": 3,
      "snippet": "Rajmahal OCP during July 2026 stood at 142,500 MT",
      "similarity": 0.98
    }
  ]
}
```

#### 09.4 Update Extracted Record (HITL Correction)
- **Method & Path:** `PUT /api/v1/extraction/:documentId/records/:recordId`
- **Request Body:**
```json
{
  "value": "145000",
  "unit": "Metric Tonnes",
  "parameter": "Coal Production",
  "status": "approved"
}
```
  - When modified, the server automatically appends an entry to `editHistory` capturing `oldValue`, `newValue`, `field`, and `editedAt`.

#### 09.5 Bulk Approve Records
- **Method & Path:** `POST /api/v1/extraction/records/bulk-approve`
- **Request Body:**
```json
{
  "ids": ["66db2500946320509a25c111", "66db2500946320509a25c112"]
}
```

---

### Module 10: Validation & Quality Control
**Base Path:** `/api/v1/validation`  
**Auth:** Bearer

#### 10.1 Run Validation
- **Method & Path:** `POST /api/v1/validation/run`
- **Request Body:** `{ "documentId": "66db24fa946320509a25b456" }`
- **Returns (200 OK):**
```json
{
  "success": true,
  "data": {
    "documentId": "66db24fa946320509a25b456",
    "documentName": "Monthly_Coal_Production_July2026.pdf",
    "qualityScore": 92,
    "avgConfidence": 0.94,
    "totalIssues": 3,
    "openIssues": 2,
    "resolvedIssues": 1,
    "bySeverity": { "info": 1, "warning": 1, "error": 1, "critical": 0 },
    "byType": { "unit_mismatch": 1, "suspicious_value": 1, "duplicate": 1 },
    "issues": [ ... ]
  },
  "message": "Document validation completed successfully"
}
```

#### 10.2 Quality Score Formula
The backend calculates `qualityScore` dynamically based on open issue severities:
$$\text{Quality Score} = \max(0, 100 - (\text{critical} \times 5 + \text{error} \times 3 + \text{warning} \times 1))$$

#### 10.3 Resolve Validation Issue
- **Method & Path:** `PUT /api/v1/validation/issues/:issueId`
- **Request Body:**
```json
{
  "status": "resolved",
  "correctedValue": "142500",
  "resolution": "Confirmed from original signed table in Annexure 2",
  "notes": "Typo in OCR fixed manually"
}
```
  - If `correctedValue` is supplied, the backend automatically updates the associated `ExtractedRecord` and records an audit log.

#### 10.4 Document Review & Decision Submission
- **Method & Path:** `POST /api/v1/validation/:documentId/review`
- **Request Body:**
```json
{
  "decision": "approved",
  "comments": "All production numbers verified against Weighbridge telemetry.",
  "issueResolutions": [
    {
      "issueId": "66db2510946320509a25c333",
      "status": "resolved",
      "resolution": "Approved override"
    }
  ]
}
```
  - Allowed values for `decision`: `'approved'`, `'rejected'`.
  - On `'approved'`, all pending records transition to `'approved'` and the document status becomes `'completed'`.

---

### Module 11: Automated Reports & Review Workflow
**Base Path:** `/api/v1/reports`  
**Auth:** Bearer

#### 11.1 Generate Report
- **Method & Path:** `POST /api/v1/reports/generate`
- **Request Body:**
```json
{
  "type": "production_summary",
  "title": "Monthly Statutory Production Summary - July 2026",
  "documentIds": ["66db24fa946320509a25b456"],
  "language": "en"
}
```
  - `type`: Required string (e.g. `'production_summary'`, `'variance_analysis'`, `'compliance_audit'`, `'environmental_safeguards'`).
  - `language`: `'en'` or `'hi'`.

#### 11.2 List Reports
- **Method & Path:** `GET /api/v1/reports?type=production_summary&status=review&page=1&limit=20`
- **Statuses:** `'draft'`, `'review'`, `'approved'`, `'rejected'`.

#### 11.3 Submit for Review
- **Method & Path:** `POST /api/v1/reports/:id/submit-review`
- **Transitions:** Report status changes from `'draft'` to `'review'`.

#### 11.4 Approve Report
- **Method & Path:** `POST /api/v1/reports/:id/approve`
- **Role Required:** `admin` only (`403` for standard users or reviewers).
- **Transitions:** Report status changes to `'approved'`, timestamping `approvedAt` and `approvedBy`.

#### 11.5 Reject Report
- **Method & Path:** `POST /api/v1/reports/:id/reject`
- **Role Required:** `reviewer` or `admin`.
- **Request Body:**
```json
{
  "reason": "Overburden variance calculation does not match weighbridge records."
}
```

#### 11.6 Export Report (PDF, Word, CSV, JSON)
- **PDF:** `GET /api/v1/reports/:id/export/pdf` &rarr; `application/pdf` binary stream.
- **Word:** `GET /api/v1/reports/:id/export/docx` &rarr; `application/vnd.openxmlformats...` binary stream.
- **CSV:** `GET /api/v1/reports/:id/export/csv` &rarr; `text/csv` tabular text.
- **JSON:** `GET /api/v1/reports/:id/export/json` &rarr; `application/json` download.
- **Generic fallback:** `GET /api/v1/reports/:id/export?format=pdf` (supports `pdf`, `docx`, `csv`, `json`).

---

### Module 12: Dedicated Review Governance
**Base Path:** `/api/v1/reviews`  
**Auth:** Bearer

- `GET /api/v1/reviews/pending`: Returns all reports currently in `'review'` status.
- `GET /api/v1/reviews/:id`: Detailed view of a report awaiting review, including confidence scores and evidence coverage.
- `POST /api/v1/reviews/:id/approve`: Admin-only approval action.
- `POST /api/v1/reviews/:id/reject`: Reviewer/Admin rejection action with required reason.

---

### Module 13: Knowledge Base & Vector Indexing
**Base Path:** `/api/v1/knowledge-base`  
**Auth:** Bearer

#### 13.1 Index Document into Vector Collection
- **Method & Path:** `POST /api/v1/knowledge-base/index`
- **Request Body:** `{ "documentId": "66db24fa946320509a25b456" }`
- **Pipeline:** Retrieves parsed text pages, breaks them into contextual chunks with sliding windows, computes 768-dimensional embeddings via Google Gemini Embedding, and saves them to `DocumentChunk`.

#### 13.2 Semantic Vector Search
- **Method & Path:** `POST /api/v1/knowledge-base/search`
- **Request Body:**
```json
{
  "query": "What was the total overburden removed at Rajmahal OCP?",
  "topK": 5,
  "filters": {
    "fileType": "pdf",
    "category": "Production Report"
  }
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "query": "What was the total overburden removed at Rajmahal OCP?",
    "topK": 5,
    "totalResults": 3,
    "results": [
      {
        "documentId": "66db24fa946320509a25b456",
        "documentName": "Monthly_Coal_Production_July2026.pdf",
        "pageNumber": 4,
        "content": "Composite overburden removal reached 582,000 cubic meters for the period...",
        "similarity": 0.892,
        "metadata": { "mineName": "Rajmahal OCP" }
      }
    ]
  },
  "message": "Knowledge base search completed successfully"
}
```

---

### Module 14: RAG Vector Engine
**Base Path:** `/api/v1/rag`  
**Auth:** Bearer

- `POST /api/v1/rag/:documentId/index`: Direct trigger to chunk and embed document.
- `POST /api/v1/rag/search`: Low-level semantic search `{ "query": "...", "topK": 5 }`.

---

### Module 15: AI Conversational Assistant
**Base Path:** `/api/v1/ai-assistant`  
**Auth:** Bearer

#### 15.1 Ask Question / Submit Query
- **Method & Path:** `POST /api/v1/ai-assistant/query` (or `/ask`)
- **Request Body:**
```json
{
  "query": "Compare coal dispatch by rail vs road for ECL in Q1 2026.",
  "conversationId": "66db2600946320509a25d999",
  "topK": 5
}
```
  - `conversationId`: Optional. If omitted, the server creates a new conversation session.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "answer": "According to the verified production reports, Eastern Coalfields Limited (ECL) dispatched 4.2 million tonnes by rail and 1.8 million tonnes by road during Q1 2026, indicating a 70% rail dispatch share.",
    "confidence": 0.94,
    "citations": [
      {
        "documentId": "66db24fa946320509a25b456",
        "documentName": "Monthly_Coal_Production_July2026.pdf",
        "pageNumber": 6,
        "snippet": "Rail dispatch accounted for 4.2 MT out of 6.0 MT total dispatch."
      }
    ],
    "evidence": [ ... ],
    "calculation": {
      "railShare": "4.2 / 6.0 = 70.0%"
    },
    "insufficientEvidence": false,
    "conversationId": "66db2600946320509a25d999"
  },
  "message": "Query processed successfully"
}
```

#### 15.2 Get Conversation History List
- **Method & Path:** `GET /api/v1/ai-assistant/history`
- **Returns:** List of conversation threads with `id`, `title`, `messageCount`, and `updatedAt`.

#### 15.3 Get Specific Conversation Thread
- **Method & Path:** `GET /api/v1/ai-assistant/history/:id`
- **Returns:** Full chronological message history with user prompts, assistant answers, confidence scores, and citations.

#### 15.4 Delete Conversation Thread
- **Method & Path:** `DELETE /api/v1/ai-assistant/history/:id`

---

### Module 16: Analytics & Variance
**Base Path:** `/api/v1/analytics`  
**Auth:** Bearer

- `GET /api/v1/analytics/overview`: High-level summary of coal production, dispatch volumes, and top performing mines.
- `GET /api/v1/analytics/kpis`: Stripping ratio, equipment availability, specific energy consumption.
- `GET /api/v1/analytics/production`: Monthly and quarterly raw coal production metrics.
- `GET /api/v1/analytics/dispatch`: Modal dispatch breakdown (MGR, Indian Railways, Road, Conveyor).
- `GET /api/v1/analytics/trends`: Historical production and dispatch time-series trends.
- `GET /api/v1/analytics/variance`: Planned vs Actual production variance with percentage deviations.
- `GET /api/v1/analytics/anomalies`: Machine-learning detected anomalies (sudden production dips, extreme stripping ratio fluctuations).

---

### Module 17: Topic Modeling & Taxonomy
**Base Path:** `/api/v1/topics`  
**Auth:** Bearer

- `GET /api/v1/topics`: Discovered taxonomy clusters and keywords.
- `POST /api/v1/topics/analyze`: Body: `{ "documentIds": [...] }` &rarr; Re-computes topic groupings.
- `GET /api/v1/topics/trends`: Prominence trends of statutory, safety, and operational topics over time.
- `GET /api/v1/topics/clusters`: Graph representation of topic nodes and co-occurrence edges.
- `GET /api/v1/topics/entities`: Named entities extracted across mining documents.
- `GET /api/v1/topics/emerging`: Fast-rising topics (e.g. "Slope Stability Alert", "DGMS Directive").
- `GET /api/v1/topics/changes`: Topic shifts across successive quarters.

---

### Module 18: Multi-Agent Orchestration
**Base Path:** `/api/v1/agents`  
**Auth:** Bearer

#### 18.1 Orchestrate Autonomous Agent Task
- **Method & Path:** `POST /api/v1/agents/orchestrate`
- **Request Body:**
```json
{
  "task": "Perform compliance check for DGMS monsoon safety guidelines across all July 2026 reports.",
  "context": {
    "subsidiary": "ECL",
    "strictMode": true
  }
}
```
- **Concurrency Guard:** The server tracks active tasks in memory. If the exact same task string is submitted while still in progress, it immediately returns `409 Conflict` (`"This exact task is currently being processed. Please wait."`).
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "task": "Perform compliance check...",
    "plan": [ ... ],
    "execution": [ ... ],
    "summary": "Compliance check completed with 94% safety checklist adherence."
  }
}
```

---

### Module 19: Audit Trail & Provenance
**Base Path:** `/api/v1/audit`  
**Auth:** Bearer

- `GET /api/v1/audit`: Paginated system audit logs. Query params: `action`, `user`, `status` (`SUCCESS`, `FAILED`), `page`, `limit`.
- `GET /api/v1/audit/stats`: Top actions, user activity distribution, failure rates.
- `GET /api/v1/audit/export?format=csv`: Download full audit log as a CSV spreadsheet.
- `GET /api/v1/audit/user/:userId`: Events triggered by a specific user.
- `GET /api/v1/audit/document/:documentId`: Lifecycle audit history for a document.
- `GET /api/v1/audit/report/:reportId`: Approval, edit, and export history for a report.
- `GET /api/v1/audit/:id`: Details of a specific audit log record.

---

### Module 20: Notification Center
**Base Path:** `/api/v1/notifications`  
**Auth:** Bearer

#### 20.1 Get Notifications
- **Method & Path:** `GET /api/v1/notifications?unread=true&limit=20`
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "66db2700946320509a25e111",
      "userId": "66db1e8a946320509a25b123",
      "message": "Report 'Monthly Statutory Summary' was approved by Administrator.",
      "type": "report_approved",
      "category": "approval",
      "relatedId": "66db2600946320509a25d555",
      "read": false,
      "createdAt": "2026-09-07T05:10:00.000Z"
    }
  ],
  "unreadCount": 1
}
```

#### 20.2 Mark Single Notification Read
- **Method & Path:** `PUT /api/v1/notifications/:id/read`

#### 20.3 Mark All Notifications Read
- **Method & Path:** `PUT /api/v1/notifications/read-all`

---

### Module 21: Document Intelligence & Cross-Document Reasoning
**Base Path:** `/api/v1/intelligence`  
**Auth:** Bearer

- `GET /api/v1/intelligence`: Overview of document intelligence, entity counts, and cross-reference links.
- `POST /api/v1/intelligence/analyze`: Body: `{ "documentIds": [...] }` &rarr; Re-evaluates cross-document correlations.
- `GET /api/v1/intelligence/trends`: Multi-document production/dispatch trends.
- `GET /api/v1/intelligence/entities`: Consolidated entity registry (Mines, Subsidiaries, Equipment, Locations).
- `GET /api/v1/intelligence/clusters`: Corpus clusters & semantic groups.
- `GET /api/v1/intelligence/similarity`: Cross-document cosine similarity matrix.
- `GET /api/v1/intelligence/changes`: Operational variations detected between documents.
- `GET /api/v1/intelligence/entities/:documentId`: Entities detected within a single document.
- `GET /api/v1/intelligence/similarity/:documentId`: Documents similar to the target document.
- `POST /api/v1/intelligence/link-evidence/:documentId`: Links extracted records in this document to source chunks in other documents.

---

### Module 22: External DMS/MIS & GIS Integration
**Base Path:** `/api/v1/integration`  
**Auth:** Bearer

- `GET /api/v1/integration/documents`: Clean DMS (Document Management System) catalog. Supports `page`, `limit`, `category`, `fileType`, `status`, `classification`, `search`.
- `GET /api/v1/integration/records`: MIS-compatible tabular feed. Supports `parameter`, `period`, `documentId`, `page`, `limit`.
- `GET /api/v1/integration/gis`: Documents with geographic coordinates. Returns array of `{ _id, originalName, gisMetadata: { latitude, longitude, region }, category, status }`. Ideal for rendering on a Flutter map widget (e.g. `flutter_map` or Google Maps).

---

## 6. Real-Time, Push Notifications & Payment Status

> [!IMPORTANT]
> **Source-of-Truth Architectural Verification:**
> 1. **WebSockets / Socket.IO**: **Not implemented** in the Express backend.
>    - **Flutter Strategy**: Poll `GET /api/v1/documents/:id/status` at a 2–3 second interval during document ingestion, and poll `GET /api/v1/notifications` periodically for in-app alert badges.
> 2. **Push Notifications (FCM / APNs)**: **Not implemented**.
>    - The backend contains a notification database model and in-app endpoints (`/api/v1/notifications`), plus user preference flags (`pushNotif`, `emailNotif`) in Settings, but does not connect to Firebase Cloud Messaging (FCM) or Apple Push Notification service (APNs). Device token registration endpoints do not exist.
> 3. **Payment APIs (Stripe, Razorpay, etc.)**: **Not implemented**.
>    - The system is an enterprise internal platform for mining intelligence; there are no billing, cart, or payment gateway routes.

---

## 7. Common Cross-Platform Flutter Workflows & Recipes

### 7.1 Centralized Dio Client with Automatic JWT Injection & Refresh

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;
  final _storage = const FlutterSecureStorage();
  
  // Platform-aware base URL
  static String get baseUrl {
    // Check your environment / platform:
    // Android Emulator: 'http://10.0.2.2:5000/api/v1'
    // iOS Simulator / Windows: 'http://127.0.0.1:5000/api/v1'
    return 'http://10.0.2.2:5000/api/v1';
  }

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'jwt_token');
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            final errorCode = error.response?.data['error'];
            if (errorCode == 'TOKEN_EXPIRED') {
              final newToken = await _refreshToken();
              if (newToken != null) {
                // Retry original request with new token
                final opts = error.requestOptions;
                opts.headers['Authorization'] = 'Bearer $newToken';
                final cloneReq = await dio.request(
                  opts.path,
                  options: Options(method: opts.method, headers: opts.headers),
                  data: opts.data,
                  queryParameters: opts.queryParameters,
                );
                return handler.resolve(cloneReq);
              }
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<String?> _refreshToken() async {
    try {
      final oldToken = await _storage.read(key: 'jwt_token');
      if (oldToken == null) return null;

      final res = await Dio().post(
        '$baseUrl/auth/refresh',
        data: {'token': oldToken},
      );

      if (res.statusCode == 200 && res.data['success'] == true) {
        final newToken = res.data['data']['token'] as String;
        await _storage.write(key: 'jwt_token', value: newToken);
        return newToken;
      }
    } catch (_) {
      // Clear token on refresh failure to force re-login
      await _storage.delete(key: 'jwt_token');
    }
    return null;
  }
}
```

---

### 7.2 File Upload Recipe (`POST /api/v1/documents/upload`)

```dart
import 'dart:io';
import 'package:dio/dio.dart';

Future<Map<String, dynamic>> uploadDocument(File file, Function(int, int)? onProgress) async {
  final fileName = file.path.split(Platform.pathSeparator).last;
  
  final formData = FormData.fromMap({
    'file': await MultipartFile.fromFile(
      file.path,
      filename: fileName,
    ),
  });

  final response = await ApiClient().dio.post(
    '/documents/upload',
    data: formData,
    options: Options(contentType: 'multipart/form-data'),
    onSendProgress: onProgress,
  );

  return response.data['data'];
}
```

---

### 7.3 File Download Recipe (`GET /api/v1/documents/:id/download`)

```dart
import 'dart:io';
import 'package:path_provider/path_provider.dart';

Future<String> downloadDocument(String documentId, String originalFileName) async {
  Directory dir;
  if (Platform.isAndroid) {
    dir = (await getExternalStorageDirectory()) ?? await getApplicationDocumentsDirectory();
  } else {
    dir = await getApplicationDocumentsDirectory();
  }

  final savePath = '${dir.path}/$originalFileName';

  await ApiClient().dio.download(
    '/documents/$documentId/download',
    savePath,
    onReceiveProgress: (received, total) {
      if (total != -1) {
        print('Download progress: ${(received / total * 100).toStringAsFixed(0)}%');
      }
    },
  );

  return savePath;
}
```

---

### 7.4 Document Processing Status Polling Recipe

```dart
Future<bool> waitForDocumentProcessing(String documentId, {Duration timeout = const Duration(minutes: 3)}) async {
  final startTime = DateTime.now();

  while (DateTime.now().difference(startTime) < timeout) {
    final response = await ApiClient().dio.get('/documents/$documentId/status');
    final job = response.data['data'];
    final status = job['status']; // 'queued', 'processing', 'completed', 'failed'

    if (status == 'completed') {
      return true;
    } else if (status == 'failed') {
      throw Exception('Document processing failed: ${job['error']}');
    }

    await Future.delayed(const Duration(seconds: 3));
  }

  throw Exception('Processing timed out');
}
```

---

## 8. Gaps, Ambiguities & Technical Clarifications

The following observations were verified directly against the backend source code:

1. **Deduplication Behavior (409 Conflict):**
   - If an uploaded document produces a SHA-256 checksum that already exists in the database, the server returns `409 Conflict` with `error: "DUPLICATE_DOCUMENT"`. The Flutter app must catch `DioException` with status `409` and inform the user that this file has already been ingested.
2. **Predefined Admin Account:**
   - Registration of the username matching `ADMIN_USERNAME` (default `'admin'`) is blocked via public registration.
   - Admin logins auto-provision the admin document in MongoDB if it does not yet exist.
3. **Agent Orchestration Concurrency:**
   - Submitting the identical task string to `POST /api/v1/agents/orchestrate` while an earlier request is active returns `409 Conflict`.
4. **Report Approvals:**
   - Approving reports (`POST /api/v1/reports/:id/approve` or `POST /api/v1/reviews/:id/approve`) is strictly restricted to `admin`. Technical `reviewer` accounts can only reject or submit reviews.
5. **No Direct WebSockets or Push Services:**
   - All asynchronous updates must be handled via HTTP polling. No webhooks or push gateways exist.
