# Phase 9: AI Knowledge Engine & Semantic Search Architecture

**Status:** IMPLEMENTED & VERIFIED  
**Backend Quality Gate:** 128/128 Automated Unit & Security Tests Passing (32 Suites)  
**Frontend Quality Gate:** Production Build Passing (128.16 kB gzip JS, 0 Errors, 0 Warnings)  
**Security Status:** 0 Vulnerabilities, User & Tenant Isolation Enforced, ReDoS Safe, IDOR Protected  

---

## 1. Overview & Core Philosophy

Phase 9 transforms the AITOOLS platform into a dedicated **AI Knowledge Engine & Semantic Search Hub**. Rather than providing an ungrounded or generic chatbot, Phase 9 delivers:

1. **Multi-Document Knowledge Collections**: Organizing disparate PDF/TXT assets into structured, scoped knowledge topics.
2. **Hybrid Semantic + Lexical Search**: A weighted retrieval system fusing vector cosine similarity ($70\%$) with keyword phrase density and token ratio ($30\%$).
3. **Transparent Explainability**: Every retrieved passage is paired with granular relevance scores (Semantic %, Keyword %, Final %) and human-readable retrieval rationales.
4. **Multi-Tenant Vector & Scoping Isolation**: Enforced user isolation guaranteeing User A queries can never retrieve User B's documents or chunk vectors.
5. **Grounded Source Inspection**: Passage previewing, page numbering, token estimates, and deep linking into document intelligence & RAG chat.

---

## 2. Architecture & Data Flow

```mermaid
graph TD
    UserQuery[User Query /api/v1/knowledge/search] --> RateLimiter[knowledgeSearchLimiter (60/15min)]
    RateLimiter --> AuthCheck[authenticateUser (JWT/Cookie)]
    AuthCheck --> ValLayer[validateSearchQueryInput]
    ValLayer --> CacheCheck{knowledgeSearchCache}
    CacheCheck -- Hit --> ReturnCached[Return Cached Result (Scope Isolated)]
    CacheCheck -- Miss --> QueryProc[queryProcessor.process]
    QueryProc --> ScopeResolver[Scope Resolver (Collections/Docs)]
    ScopeResolver --> ChunkRepo[documentChunkRepository (Filtered by userId & docIds)]
    ChunkRepo --> HybridRetriever[hybridRetriever]
    HybridRetriever --> EmbedCheck{Embedding Provider Configured?}
    EmbedCheck -- Yes --> VecCosine[Cosine Similarity Calculation]
    EmbedCheck -- No --> LexicalFallback[Lexical Keyword Scoring (100%)]
    VecCosine & LexicalFallback --> Ranker[rankingService (0.70 Sem + 0.30 Kw)]
    Ranker --> Explainer[Explanation Generator]
    Explainer --> TopKFilter[Top-K Slicer & MinSimilarity Gate]
    TopKFilter --> CacheStore[Store in knowledgeSearchCache]
    CacheStore --> APIResponse[Structured JSON Response]
```

---

## 3. Component Breakdown

### 3.1 Data Layer & Schemas

- **`KnowledgeCollection` Model (`server/models/knowledgeCollection.js`)**:
  - `userId`: `ObjectId` referencing `User` (Indexed).
  - `name`: String (required, max 100).
  - `description`: String (max 500).
  - `documentIds`: Array of `ObjectId` referencing `Document`.
  - `status`: String enum `['active', 'archived']`.
  - Compound indexes: `{ userId: 1, createdAt: -1 }`, `{ userId: 1, name: 1 }`.
- **`knowledgeCollectionRepository` (`server/repositories/knowledgeCollectionRepository.js`)**:
  - Encapsulates Mongoose queries with strict multi-tenant filtering (`{ _id: id, userId }`).
  - Implements `removeDocumentFromAllCollections(documentId, userId)` to prevent dangling references upon document deletion.

### 3.2 Services & Search Engine

- **`queryProcessor` (`server/services/knowledge/queryProcessor.js`)**:
  - Normalizes multiple whitespaces, trims, enforces min (2) and max (1000) char boundaries.
  - Strips stop words and generates safe regex patterns escaping special characters.
- **`rankingService` (`server/services/knowledge/rankingService.js`)**:
  - Computes keyword relevance score using exact phrase matching ($+0.35$), token ratio ($0.50$), and term frequency density ($+0.15$).
  - Evaluates weighted hybrid scores: $\text{finalScore} = \text{semanticScore} \times 0.70 + \text{keywordScore} \times 0.30$.
  - Synthesizes human-readable explanations (e.g., `"Exact phrase matched in document • High semantic similarity"`).
- **`knowledgeSearchCache` (`server/services/knowledge/knowledgeSearchCache.js`)**:
  - In-memory cache strictly prefixed with `userId:` to prevent any cross-user leakage.
  - LRU eviction (max 200 entries) and TTL expiration (5 minutes).
  - Invalidation triggers upon collection updates or document operations.
- **`hybridRetriever` (`server/services/knowledge/hybridRetriever.js`)**:
  - Verifies ownership of documents and target collections.
  - Scores candidates using vector embeddings (when available) and keyword density.
  - Slices to bounded `topK` ($1 \le k \le 20$).

---

## 4. API Inventory & Endpoints

| Method | Path | Auth | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/knowledge/search` | Required | 60/15min | Hybrid semantic & keyword search across documents/collections |
| `POST` | `/api/v1/knowledge/collections` | Required | General | Create a new knowledge collection |
| `GET` | `/api/v1/knowledge/collections` | Required | General | List authenticated user's collections (paginated) |
| `GET` | `/api/v1/knowledge/collections/:id` | Required | General | Get collection details and attached documents |
| `PATCH` | `/api/v1/knowledge/collections/:id` | Required | General | Update collection name, description, status, or documents |
| `DELETE` | `/api/v1/knowledge/collections/:id` | Required | General | Delete collection (underlying documents remain preserved) |

---

## 5. Security & Multi-Tenant Assurance

1. **IDOR Defense**: All collection and search endpoints query with `{ _id, userId: req.user.id }`. An attacker attempting to query or modify another user's collection receives HTTP 404 `COLLECTION_NOT_FOUND`.
2. **Vector Store Isolation**: Vector chunk searches filter strictly by `{ userId, documentId: { $in: targetDocIds } }`.
3. **ReDoS Neutralization**: Search terms are processed through `escapeRegex` and length-bounded before applying regex patterns.
4. **Prompt Injection Hardening**: All retrieved document text in grounded conversations is framed as passive context (`[Source X]`), delimiters are sanitized, and models are instructed never to treat document text as operational instructions.

---

## 6. Test Suite & Verification Results

- **Backend Test Suite**: `npm test --prefix server`
  - 128 tests passing across 32 suites (100% pass rate).
  - 0 failures, 0 regressions against Phase 8 baseline.
- **Frontend Production Build**: `npm run build --prefix client`
  - Compiled successfully (128.16 kB gzip JS, 9.25 kB gzip CSS).
  - 0 compile errors, 0 ESLint warnings.
- **Dependency Vulnerabilities**: `npm audit`
  - Root: 0 vulnerabilities.
  - Server: 0 vulnerabilities.
