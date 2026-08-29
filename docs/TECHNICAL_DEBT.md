# AITOOLS — Technical Debt & Code Smell Catalog (Phase 9 Status)

This document tracks technical debt resolution progress across project phases.

---

## 1. Resolved Technical Debt Items

- [x] **TD-01 (Dead Code)**: Removed `client/src/pages/temp.txt`.
- [x] **TD-02 (Obsolete Package)**: Removed `bardapi` from `server/package.json`.
- [x] **TD-03 (Direct Third-Party API Calls)**: Refactored `CreatePost.jsx` and `Summarize.jsx` to call internal Express endpoints via `client/src/services/api/`.
- [x] **TD-04 (Loose Equality & Lint Warnings)**: Replaced loose `==` with strict `===` across client components; fixed regex escapes and cleaned up unused imports.
- [x] **TD-05 (Server Route Monolith)**: Decomposed routes into thin routing files (`routes/`), HTTP controllers (`controllers/`), domain services (`services/`), and data repositories (`repositories/`).
- [x] **TD-06 (Database Disconnection Handling)**: Implemented non-blocking database readiness detection in `server/config/database.js` with client notices.
- [x] **TD-07 (Hardcoded Personal Toast)**: Removed hardcoded personal portrait and hosting notice popup from `App.jsx`.
- [x] **TD-08 (Unused Redux Dependencies)**: Safely removed `@reduxjs/toolkit` and `react-redux` from `client/package.json` and deleted unused `Store.js`.
- [x] **TD-09 (Missing Security Headers & Rate Limits)**: Integrated `helmet` and `express-rate-limit`.
- [x] **TD-10 (SSRF Vulnerability in URL Summarization)**: Built `server/utils/urlValidator.js` with private IP and DNS rebinding protection.
- [x] **TD-11 (Regex Injection in Search)**: Built `escapeRegex` in `server/utils/sanitize.js`.
- [x] **TD-12 (Scattered `process.env` & Config)**: Centralized all environment variables and default thresholds into `server/config/env.js`.
- [x] **TD-13 (Coupled Cloudinary Storage)**: Created decoupled storage service in `server/services/storage/cloudinaryService.js`.
- [x] **TD-14 (Cloudinary Legacy SDK Vulnerability)**: Upgraded `cloudinary` package to `^2.10.1`, achieving **0 server vulnerabilities**.
- [x] **TD-15 (Legacy Dead Route)**: Removed unused `server/routes/dalleRoutes.js`.
- [x] **TD-16 (Request Tracing)**: Implemented `requestContextMiddleware` with `X-Request-Id` correlation.
- [x] **TD-17 (Multi-Provider AI Abstraction Layer)**: Built `server/providers/` with abstract interfaces, adapter classes, normalized errors, model catalog, and provider registry.
- [x] **TD-18 (Authentication & Per-User Data Isolation)**: Implemented User model, bcrypt salted password hashing, JWT access & refresh cookies, IDOR protection, and generation history tracking.
- [x] **TD-19 (Advanced Image Generation Parameters & Presets)**: Built aspect ratios, negative prompt validation, seed, steps, guidance scale, and user-owned `ImagePreset` management.
- [x] **TD-20 (AI Document Intelligence & RAG Subsystem)**: Built document upload, extraction, deterministic chunking, user-isolated vector store, grounded RAG Q&A, and citation preview.
- [x] **TD-23 (AI Knowledge Engine & Semantic Search Subsystem)**: Built multi-document Knowledge Collections, hybrid semantic + keyword retrieval, query normalizer, ranking engine with human explanations, user-scoped search cache, and Knowledge Search UI.

---

## 2. Open Technical Debt Items for Subsequent Phases

- **TD-21 (CRA Migration to Vite)**: React 18 frontend uses `react-scripts` (Create React App); migration to Vite planned for advanced build optimizations in a later phase.
- **TD-22 (Password Reset via Email)**: Deferred until dedicated email/notification infrastructure is provisioned.
