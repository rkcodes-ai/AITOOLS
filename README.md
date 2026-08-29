# AITOOLS — AI-Powered Intelligence Workspace

[![CI](https://github.com/rkcodes-ai/AITOOLS/actions/workflows/ci.yml/badge.svg)](https://github.com/rkcodes-ai/AITOOLS/actions/workflows/ci.yml)

A full-stack MERN AI workspace platform with multi-modal AI capabilities: image generation, text summarization & translation, document intelligence with RAG, and a semantic knowledge search engine.

---

## Features

| Feature | Description |
|---------|-------------|
| **AI Image Studio** | Generate images via Hugging Face diffusion models with aspect ratios, negative prompts, seeds, guidance scale, and user presets |
| **Text Summarizer** | Summarize articles from URLs or raw text paragraphs |
| **Translator** | Translate text across 13+ supported languages |
| **Document Intelligence & RAG** | Upload PDF/TXT documents, extract and chunk text, ask grounded questions with verifiable source citations |
| **Knowledge Engine** | Hybrid semantic + keyword search across multi-document knowledge collections |
| **Authentication & RBAC** | JWT + HTTP-only cookie auth, bcrypt password hashing, per-user data isolation, IDOR protection |
| **Community Gallery** | Share AI-generated images with the community |
| **Generation History** | Searchable workspace with 1-click prompt reuse |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Tailwind CSS, React Router v6 |
| **Backend** | Node.js, Express.js (ES Modules) |
| **Database** | MongoDB (Mongoose ODM) |
| **AI Providers** | Hugging Face Inference API (images, embeddings, chat), RapidAPI (summarization, translation) |
| **Storage** | Cloudinary (images), S3-compatible (documents), local filesystem fallback |
| **Security** | Helmet, CORS allowlist, tiered rate limiting, SSRF protection, prompt injection defense |
| **DevOps** | Docker, Docker Compose, GitHub Actions CI |

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/rkcodes-ai/AITOOLS.git
cd AITOOLS
```

### 2. Install Dependencies

```bash
# Root (concurrent dev runner)
npm install

# Backend
cd server && npm install && cd ..

# Frontend
cd client && npm install && cd ..
```

### 3. Configure Environment

Copy the example environment file and fill in your credentials:

```bash
cp .env.example server/.env
```

**Required for basic operation:**
- `MONGODB_URL` — MongoDB connection string (default: `mongodb://127.0.0.1:27017/aitools`)

**Optional (enable AI features):**
- `HF_TOKEN` — Hugging Face API token (image generation, embeddings, RAG chat)
- `RAPID_API_KEY` — RapidAPI key (article summarization & translation)
- `CLOUD_NAME`, `API_KEY`, `API_SECRET` — Cloudinary credentials (cloud image hosting)
- `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` — S3-compatible storage

### 4. Start Development Servers

```bash
npm run dev
```

This starts both the backend (port 8080) and frontend (port 3000) concurrently.

---

## Docker Deployment

```bash
# Build and run production containers
docker compose -f docker-compose.prod.yml up --build -d
```

The production stack includes:
- **Backend**: Node.js API server on port 8080
- **Frontend**: Nginx serving React production bundle on port 80

See [docker-compose.prod.yml](docker-compose.prod.yml) for full configuration.

---

## API Reference

The backend exposes a comprehensive REST API covering:

- **System & Health** — `/api/v1/health`
- **Authentication** — `/api/v1/auth/*`
- **AI Intelligence** — `/api/v1/ai/*` (image, summarize, translate)
- **Documents & RAG** — `/api/v1/documents/*`
- **Knowledge Engine** — `/api/v1/knowledge/*`
- **Conversations** — `/api/v1/conversations/*`
- **Generations** — `/api/v1/generations/*`
- **Image Presets** — `/api/v1/image-presets/*`
- **Community Posts** — `/api/v1/post/*`

Full endpoint documentation: [docs/API_INVENTORY.md](docs/API_INVENTORY.md)

---

## Architecture

AITOOLS follows a 5-tier decoupled backend architecture:

```
Routes → Controllers → Validators → Services → Repositories
                                        ↓
                                  AI Provider Abstraction Layer
                                  (Adapters, Registry, Model Catalog)
```

Full architecture documentation: [docs/CURRENT_ARCHITECTURE.md](docs/CURRENT_ARCHITECTURE.md)

---

## Testing

```bash
# Backend unit & integration tests (180+ tests)
cd server && npm test

# Security & multi-tenant authorization tests (34+ tests)
cd server && npm run test:security

# Frontend React tests (70+ tests)
cd client && npm test -- --watchAll=false

# Frontend production build validation
cd client && npm run build
```

---

## Project Structure

```
AITOOLS/
├── client/                  # React 18 SPA frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level page components
│   │   ├── services/api/    # Backend API client modules
│   │   ├── context/         # React context providers
│   │   └── tests/           # Frontend test suites
│   └── Dockerfile           # Frontend production container
├── server/                  # Express.js API backend
│   ├── config/              # Environment & database configuration
│   ├── controllers/         # HTTP request handlers
│   ├── middleware/           # Auth, security, error handling
│   ├── models/              # Mongoose schemas
│   ├── providers/           # AI provider abstraction layer
│   ├── repositories/        # Data access layer
│   ├── routes/              # Express route definitions
│   ├── services/            # Business logic & orchestration
│   ├── validators/          # Input validation
│   ├── tests/               # Backend test suites
│   └── Dockerfile           # Backend production container
├── docs/                    # Architecture & API documentation
├── .github/workflows/       # GitHub Actions CI
└── docker-compose.prod.yml  # Production deployment config
```

---

## License

ISC
