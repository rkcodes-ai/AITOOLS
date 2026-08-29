# AITOOLS — Current System Architecture (Post Phase 9)

## 1. High-Level Architecture Overview

AITOOLS is a unified, multi-modal MERN AI workspace platform with modular Express services, capability-aware AI provider abstraction, user identity and ownership isolation, advanced image studio, personal AI Document Intelligence & RAG, and an AI Knowledge Engine & Semantic Search Hub.

```text
Browser (React 18 SPA on Port 3000)
    │  - Navigation & App Header (Workspace, Knowledge Engine, Documents & RAG, History, Image AI, Summarize, Profile)
    │  - AuthContext (Session state, JWT access token, refresh cookie)
    │  - Dashboard (/dashboard - Real metrics, quick tools, recent activity)
    │  - AI Knowledge Engine (/knowledge - Hybrid search, collections, scoring pills, explanation badges, source inspection modal)
    │  - Document Library (/documents - Upload, status monitoring, deletion, retry)
    │  - Document Detail (/documents/:id - Technical inspection, chunk viewer)
    │  - Document Chat (/documents/chat - Multi-document/collection RAG Q&A, citations viewer)
    │  - AI Image Studio 2.0 (/create-post - Aspect ratios, presets, prompt builder)
    │  - Summarizer & Translator (/summarize - URL and text processing)
    │  - Generation History (/history - Search, filter, inspect, reuse, delete)
    ▼
Express API Server (Port 8080)
    ├── Request Context Middleware (X-Request-Id correlation)
    ├── Helmet Security Headers & CORS Allowlist
    ├── Tiered Rate Limiters (General / AI / Upload / Auth / Search)
    ├── Authentication Middleware (authenticateUser / optionalAuthenticateUser / requireRole)
    ├── Routes Layer (/auth, /post, /ai, /generations, /image-presets, /documents, /conversations, /knowledge, /health)
    ├── Controllers Layer (HTTP Concerns & Parameter Extraction)
    ├── Validators Layer (authValidators, aiValidators, postValidators, documentValidators, knowledgeValidators, urlValidator)
    ├── Services Layer (Business Logic & Orchestration)
    │   ├── services/knowledge/knowledgeSearchService.js (Search orchestration, collection management, caching)
    │   ├── services/knowledge/hybridRetriever.js (Multi-document vector + keyword retrieval)
    │   ├── services/knowledge/queryProcessor.js (Whitespace normalization, length limits, stop words, safe regex)
    │   ├── services/knowledge/rankingService.js (Weighted scoring: 0.70 semantic + 0.30 keyword, human explanations)
    │   ├── services/knowledge/knowledgeSearchCache.js (User-scoped in-memory LRU cache with TTL)
    │   ├── services/auth/authService.js (Registration, Login, Password, Profile)
    │   ├── services/documents/documentService.js (Lifecycle, extraction, chunking, collection cleanup)
    │   ├── services/documents/ragService.js (Top-K retrieval, prompt injection defense, grounded answering)
    │   ├── services/documents/vectorStore.js (User-isolated vector indexing & cosine search)
    │   ├── services/documents/documentTextExtractor.js (PDF/TXT parser, scanned PDF detection)
    │   ├── services/documents/chunkingService.js (Deterministic sliding window chunking)
    │   ├── services/ai/imageService.js (Resolution & Quality translation, Fallbacks)
    │   ├── services/ai/imagePresetService.js (User-owned Studio Presets)
    │   ├── services/ai/textService.js (Summarization & Translation orchestration)
    │   ├── services/ai/generationHistoryService.js (Per-user AI activity, history, stats)
    │   ├── services/posts/postService.js (Community posts & ownership management)
    │   ├── services/storage/documentStorage.js (Safe local/object document storage)
    │   └── services/health/healthService.js (System & Provider Health)
    ├── AI Provider Abstraction (ImageProvider, TextProvider, TranslationProvider, EmbeddingProvider, ChatProvider)
    ├── Repository Layer (userRepository, knowledgeCollectionRepository, documentRepository, documentChunkRepository, conversationRepository, generationRepository, imagePresetRepository, postRepository)
    └── Centralized Error Sanitizer (middleware/errorHandler.js)
        │
        ├── Cloudinary Media CDN (Image hosting)
        ├── MongoDB Database (Users, KnowledgeCollections, Documents, DocumentChunks, Conversations, Messages, Posts, Generations, ImagePresets)
        ├── Hugging Face Inference API (Image Generation, Feature Extraction Embeddings, Instruct/Chat LLMs)
        └── RapidAPI (Text/URL Summarization & Translation)
```

---

## 2. Document Intelligence, Knowledge Engine & RAG Architectural Rules

1. **Strict Multi-Tenant & Vector Isolation**:
   - Collections, documents, chunks, vectors, search queries, and cache entries are strictly isolated to `userId`.
   - User A can never retrieve, search, view, or delete User B's documents, collections, or vector chunks.
2. **Hybrid Semantic + Lexical Fusion**:
   - Query ranking applies configurable weights ($0.70 \times \text{semantic} + 0.30 \times \text{keyword}$) with graceful pure-lexical fallback if embeddings are unavailable.
3. **Grounded Answering & Zero Hallucination**:
   - Prompts strictly constrain the LLM to answer using only supplied document context.
   - If retrieved context is insufficient, returns honest "I couldn't find enough relevant information in the selected documents".
4. **Prompt Injection Defense**:
   - Retrieved document text is treated strictly as data within delimited context tags, preventing malicious document contents from overriding system instructions.
5. **Honest Provider Gating**:
   - If embedding or chat providers are unconfigured, operations report clear blocked/unconfigured state without fabricating fake completions.
