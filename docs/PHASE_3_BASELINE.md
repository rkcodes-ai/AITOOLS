# AITOOLS — Phase 3 Baseline Architecture Analysis

This document details the backend structure, module boundaries, and decoupling opportunities prior to Phase 3 refactoring.

---

## 1. Current Module Boundary Assessment

```text
server/
├── index.js                     # Express setup, inline health endpoint, inline CORS, middleware mounting
├── config/
│   └── database.js              # Direct process.env access, Mongoose connection & status
├── controllers/
│   ├── aiController.js          # Direct orchestration of imageService & textService
│   └── postController.js        # Direct orchestration of postService
├── middleware/
│   ├── errorHandler.js          # Generic error handler (does not use typed error classes)
│   └── security.js              # Helmet & rate limiters
├── models/
│   └── post.js                  # Mongoose Post Schema
├── routes/
│   ├── aiRoutes.js              # AI route mapping
│   ├── postRoutes.js            # Post route mapping
│   └── dalleRoutes.js           # Legacy unused stub
├── services/
│   ├── imageService.js          # Hugging Face inference logic + direct process.env access
│   ├── textService.js           # RapidAPI logic + SSRF check + direct process.env access
│   └── postService.js           # Post business logic + direct Cloudinary SDK + direct Mongoose queries
└── utils/
    └── urlValidator.js          # SSRF URL and IP validation
```

---

## 2. Identified Architectural Deficiencies

1. **Scattered `process.env` Access**: `server/config/database.js`, `server/services/imageService.js`, `server/services/textService.js`, and `server/services/postService.js` all query `process.env` ad-hoc.
   - *Target*: Centralize all environment variables into a single validated module `server/config/env.js`.
2. **Coupled Storage & Database in `postService.js`**: `postService.js` contains direct Cloudinary SDK configuration, file uploads, and direct Mongoose model queries (`Post.find()`, `Post.create()`).
   - *Target*: Decouple into:
     - `server/services/storage/cloudinaryService.js` (Storage abstraction)
     - `server/repositories/postRepository.js` (Data access abstraction)
     - `server/services/posts/postService.js` (Pure business logic)
3. **No Dedicated Health Route/Service**: `/api/v1/health` and `/` root handlers are written inline inside `server/index.js`.
   - *Target*: Extract to `server/routes/healthRoutes.js`, `server/controllers/healthController.js`, and `server/services/health/healthService.js`.
4. **Ad-Hoc Error Objects**: Errors are created as ad-hoc literal objects `{ status: 400, message: '...' }` rather than typed application errors extending `Error`.
   - *Target*: Create `server/utils/errors.js` (`AppError`, `ValidationError`, `ProviderError`, `NotFoundError`, `ConfigurationError`).
5. **Missing Request Context / Tracing**: No request ID or correlation ID attached to incoming requests for observability.
   - *Target*: Implement `server/middleware/requestContext.js` assigning a unique `X-Request-Id` and tracking request latency.
6. **Legacy Dead Route**: `server/routes/dalleRoutes.js` remains in the tree.
   - *Target*: Remove `server/routes/dalleRoutes.js`.
