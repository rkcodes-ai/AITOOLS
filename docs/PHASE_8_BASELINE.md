# AITOOLS — Phase 8 Baseline: AI Document Intelligence & RAG

## 1. Context & Forensic State Prior to Phase 8

Prior to Phase 8, AITOOLS had completed:

- Phase 0: Forensic Audit
- Phase 1: Stabilization & Server AI Proxying
- Phase 2: Security Hardening & Rate Limiting
- Phase 3: Backend 5-Tier Architecture & Decoupling
- Phase 4: AI Provider Abstraction (Image, Text Summarization, Translation)
- Phase 5: Authentication, Authorization & User Identity (JWT, Sessions, RBAC)
- Phase 6: AI Workspace & Generation History (Persisted activity timeline)
- Phase 7: Advanced AI Image Studio 2.0 (Diffusion capabilities, Aspect ratios, Presets)

---

## 2. Inventory of Document & Vector Capabilities

| Capability Area | Status | Notes |
| :--- | :---: | :--- |
| Document Upload & Validation | **PLANNED (Phase 8)** | To support PDF and TXT with MIME, size, and checksum validation. |
| Text Extraction (PDF / TXT) | **PLANNED (Phase 8)** | `pdf-parse` installed for PDF page extraction; UTF-8 buffer decoding for TXT. |
| Scanned PDF (OCR) Detection | **SUPPORTED (Detection)** | Detects 0 extractable text and marks status `failed` with `DOCUMENT_CONTAINS_NO_EXTRACTABLE_TEXT` (honest detection, no fake OCR). |
| Intelligent Chunking | **PLANNED (Phase 8)** | Deterministic chunking with page bounds, token estimation, and overlap. |
| Embedding Provider Abstraction | **PLANNED (Phase 8)** | `EmbeddingProvider` interface with Hugging Face feature extraction adapter. |
| Chat / Answering Provider | **PLANNED (Phase 8)** | `ChatProvider` interface with Hugging Face chat/instruct adapter. |
| Vector Store & User Isolation | **PLANNED (Phase 8)** | Vector store abstraction with strict `userId` isolation and cosine similarity retrieval. |
| Grounded RAG Pipeline | **PLANNED (Phase 8)** | Strict prompt instructing LLM to answer only using retrieved context; "I don't know" fallback. |
| Source Citations & Preview | **PLANNED (Phase 8)** | Document name, page number, and snippet citations attached to AI answers. |
| Multi-Document Chat | **PLANNED (Phase 8)** | Scoped multi-document selection with server-side ownership revalidation. |
| Document Conversations | **PLANNED (Phase 8)** | `Conversation` and `Message` models with pagination and IDOR protection. |
| Provider Configuration Status | **NOT CONFIGURED** | Offline/unconfigured fallback mode verified; genuine RAG execution gated behind real provider tokens. |

---

## 3. Categorization Matrix

```text
IMPLEMENTED:
- Authentication & RBAC (User, JWT, session cookie)
- Generation History & Statistics
- AI Image Studio 2.0 & Presets
- Summarization & Translation

PLANNED FOR PHASE 8:
- Document, DocumentChunk, Conversation, Message schemas
- PDF and TXT text extraction
- Deterministic document chunking
- Embedding & Chat Provider interfaces
- User-isolated Vector Store
- RAG service with source citations and prompt injection defense
- Document Library, Detail, and Chat UI

NOT CONFIGURED:
- External Hugging Face token for real online embedding & LLM generation (tested in public/offline mode with honest fallbacks)

UNSUPPORTED:
- Scanned PDF OCR (detected and reported honestly without fake text)
- Image-to-Image / Inpainting
- Autonomous multi-step agents (deferred to Phase 10)
```
