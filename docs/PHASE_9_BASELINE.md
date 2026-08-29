# AITOOLS — Phase 9 Baseline: AI Knowledge Engine & Semantic Search

## 1. Context & Forensic Baseline (Post Phase 8)

AITOOLS successfully completed and verified Phase 8 (AI Document Intelligence & RAG).

- **Backend Quality Gate**: PASS (97/97 tests passing across 24 test suites)
- **Frontend Production Build**: PASS (0 errors, 122.88 kB gzip JS)
- **Security Posture**: 0 server vulnerabilities, active Helmet, CORS allowlist, 4-tier rate limiters, strict JWT & RBAC, SSRF validator, ReDoS protection, sanitized error handler, user/vector isolation.
- **AI Providers**: Abstracted multi-provider registry (`EmbeddingProvider`, `ChatProvider`, `ImageProvider`, `TextProvider`, `TranslationProvider`) with safe unconfigured fallback behavior.

---

## 2. Capabilities Matrix (Phase 8 vs Phase 9)

| Capability Area | Phase 8 Foundation | Phase 9 Target | Status |
| :--- | :--- | :--- | :---: |
| **Document Ingestion & Chunking** | PDF/TXT parsing, SHA-256 integrity, deterministic sliding window chunking | Preserved intact; documents link to Knowledge Collections | **ACTIVE / REUSABLE** |
| **Vector Storage & Similarity** | Dense embedding arrays in MongoDB `DocumentChunk`, Cosine similarity scoring | Bounded candidate retrieval, compound index optimization | **ACTIVE / ENHANCING** |
| **Knowledge Collections** | Not implemented (flat user document list) | Hierarchical, user-owned `KnowledgeCollection` model, CRUD APIs, document linking | **PLANNED (Phase 9)** |
| **Semantic Search Engine** | RAG-only retrieval (`ragService.js`) | Standalone `POST /api/v1/knowledge/search` returning scored, ranked chunks | **PLANNED (Phase 9)** |
| **Keyword / Lexical Search** | Absent in search layer | Exact term matching, token frequency, case-insensitive substring scoring | **PLANNED (Phase 9)** |
| **Hybrid Ranking Engine** | Single cosine similarity score | Configurable weighted combination ($0.70 \times \text{semantic} + 0.30 \times \text{keyword}$) with min threshold | **PLANNED (Phase 9)** |
| **Query Normalization Layer** | Basic length check | Tokenization, whitespace normalization, punctuation stripping, length bounds | **PLANNED (Phase 9)** |
| **Result Explanations** | Not present | Human-readable explanation generation per result ("High semantic match", "Matched 2 terms") | **PLANNED (Phase 9)** |
| **Knowledge Search Cache** | Not present | In-memory LRU/TTL search cache with user-scoped isolation | **PLANNED (Phase 9)** |
| **Knowledge Search UI** | Basic document library & chat pages | Dedicated `/knowledge` search page with collections dropdown, hybrid score pills, explanation badges, and source preview modal | **PLANNED (Phase 9)** |
| **Multi-Document Reasoning & Citations** | Document name + page range | Enriched citations with document title, page numbers, chunk ID, relevance %, and passage preview | **ACTIVE / ENHANCING** |

---

## 3. Categorization Matrix

```text
IMPLEMENTED (Phases 0–8):
- User authentication, JWT tokens, session cookies, RBAC
- Document ingestion (PDF, TXT), validation, storage
- Deterministic chunking with page bounds & token estimation
- DocumentChunk model & document repository
- Vector store with cosine similarity & strict userId isolation
- Hugging Face Embedding & Chat adapter interfaces
- Grounded RAG answering with prompt injection defense
- Document Library (/documents), Detail (/documents/:id), and Chat (/documents/chat)

PLANNED FOR PHASE 9:
- KnowledgeCollection schema, repository, and controller (/api/v1/knowledge/collections)
- Query processor & normalization (queryProcessor.js)
- Hybrid retriever & ranking engine (hybridRetriever.js, rankingService.js)
- Standalone Knowledge Search Service (knowledgeSearchService.js)
- In-memory scoped caching abstraction (knowledgeSearchCache.js)
- Knowledge Search & Collection UI (/knowledge)
- Enriched citation inspector & result explanation generator
- Dedicated search rate limiter & scope ownership guards

NOT CONFIGURED (Honest Reporting):
- HF_TOKEN for live Hugging Face Inference API (handled gracefully via keyword/offline search mode without faking vectors or completions)

UNSUPPORTED:
- Scanned PDF OCR (detected & reported with DOCUMENT_CONTAINS_NO_EXTRACTABLE_TEXT)
- Heavyweight external vector database clusters (e.g. Pinecone/Milvus; lightweight, index-optimized MongoDB vector storage used instead)
```
