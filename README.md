# MineIntel AI — Document Intelligence Platform

> **Smart India Hackathon 2026 | Problem Statement: PS 26023**
>
> AI-powered document intelligence system for the Indian mining sector — automating document ingestion, OCR, data extraction, and compliance analysis.

## Part 1: Document Ingestion & OCR

This module provides a complete document management system with:

- **Multi-format upload**: PDF, scanned PDF, DOCX, XLSX, CSV, JPG/PNG
- **Drag & drop** file upload with validation
- **Text extraction**: PDF parsing, DOCX parsing, Excel/CSV parsing
- **OCR**: Automatic OCR for scanned PDFs and images (Tesseract.js)
- **Processing pipeline**: Async processing with real-time status tracking
- **Document management**: List, search, filter, preview, delete, retry
- **Dark/Light theme**: Professional enterprise UI

## Tech Stack

| Layer     | Technology                       |
|-----------|----------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS   |
| Backend   | Node.js + Express.js             |
| Database  | MongoDB + Mongoose               |
| OCR       | Tesseract.js                     |
| Parsing   | pdf-parse, mammoth, xlsx         |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas URI

### 1. Clone & Configure

```bash
cp .env.example server/.env
```

Edit `server/.env` and set your `MONGODB_URI`:

```
MONGODB_URI=mongodb://localhost:27017/mineintel-ai
PORT=5000
```

### 2. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000](http://localhost:5000)

## API Endpoints

| Method | Endpoint                     | Description                |
|--------|------------------------------|----------------------------|
| POST   | `/api/documents/upload`      | Upload a document          |
| GET    | `/api/documents`             | List documents (with filters) |
| GET    | `/api/documents/:id`         | Get document + extracted pages |
| GET    | `/api/documents/:id/status`  | Get processing status      |
| DELETE | `/api/documents/:id`         | Delete a document          |
| POST   | `/api/documents/:id/retry`   | Retry failed processing    |

### Query Parameters (GET /api/documents)

| Param    | Description               | Example          |
|----------|---------------------------|------------------|
| `search` | Search by filename        | `?search=report` |
| `type`   | Filter by file type       | `?type=pdf`      |
| `status` | Filter by processing status | `?status=completed` |

## MongoDB Models

- **Document** — File metadata, status, extracted text
- **DocumentPage** — Per-page content and word count
- **ProcessingJob** — Processing progress and step tracking

## Project Structure

```
mineintel-ai/
├── server/                # Express.js backend
│   ├── config/            # Database configuration
│   ├── models/            # Mongoose schemas
│   ├── controllers/       # Route handlers
│   ├── services/          # Processing & extraction logic
│   ├── middleware/         # Upload & error handling
│   ├── routes/            # API routes
│   ├── uploads/           # Uploaded files (gitignored)
│   └── server.js          # Entry point
├── client/                # React + Vite frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── context/       # Theme context
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API client
│   │   └── pages/         # Page components
│   └── index.html
├── .env.example           # Environment template
├── .gitignore
└── README.md
```

## Supported File Types

| Type | Extensions | Processing Method |
|------|-----------|-------------------|
| PDF  | .pdf      | pdf-parse (text) → Tesseract.js (OCR fallback) |
| DOCX | .docx     | mammoth (raw text extraction) |
| XLSX | .xlsx     | xlsx (sheet-by-sheet conversion) |
| CSV  | .csv      | xlsx (CSV parsing) |
| Image| .jpg, .png | Tesseract.js (OCR) |

## Roadmap

- [x] Part 1: Document Ingestion & OCR
- [ ] Part 2: AI Data Extraction
- [ ] Part 3: RAG Knowledge Base
- [ ] Part 4: AI Chatbot
- [ ] Part 5: Analytics Dashboard
- [ ] Part 6: Compliance Engine
- [ ] Part 7: Report Generation
- [ ] Part 8: Multi-Agent System

## License

Built for Smart India Hackathon 2026. All rights reserved.
