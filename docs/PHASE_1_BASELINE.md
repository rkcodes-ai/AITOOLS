# AITOOLS — Phase 1 Baseline Status & Verification

This document establishes the operational baseline of the AITOOLS platform prior to Phase 1 Stabilization.

---

## 1. Operational Baseline Verification Matrix

| Component / Subsystem | Verified Status | Details & Observations |
| :--- | :---: | :--- |
| **Frontend Runtime** | **Operational** | React 18 SPA compiles on port 3000 (`http://localhost:3000`). Webpack compiles with 1 warning (`==` vs `===` in JSX). |
| **Backend Runtime** | **Operational** | Express server listens on port 8080 (`http://localhost:8080`). Endpoint `GET /` returns `200 OK` (`{"message": "Hello from DALL.E!"}`). |
| **Database (MongoDB)** | **Degraded / Disconnected** | `ECONNREFUSED 127.0.0.1:27017` logged when local MongoDB service is not started. Server remains up due to non-blocking catch handler, but database writes/reads fail without connection string. |
| **Media Cloud (Cloudinary)** | **Unconfigured in .env** | Cloudinary credentials not configured in `.env` (`CLOUD_NAME`, `API_KEY`, `API_SECRET` empty). |
| **Image Generation** | **Failed / Insecure** | Direct browser call from `CreatePost.jsx` with exposed Bearer token. Hugging Face SD 2.1 returns intermittent 503 errors and lacks backend proxying. |
| **Summarization** | **Direct / Insecure** | Directly calls RapidAPI from `Summarize.jsx` with client environment variable or exposed key. |
| **Translation** | **Direct / Insecure** | Directly calls RapidAPI from `Summarize.jsx` using hardcoded API key (`c9fb3c3e32mshd163e...`). |
| **Community Gallery** | **Operational (Pending DB)** | Component renders correctly; fetches `/api/v1/post` on mount. |
| **CORS Policy** | **Insecure** | `origin: "*"` with credentials enabled. |

---

## 2. Identified Baseline Action Plan

1. **Security Remediation**: Remove all API keys and bearer tokens from `client/src/pages/CreatePost.jsx` and `client/src/pages/Summarize.jsx`.
2. **Backend API Proxying**:
   - Build `POST /api/v1/ai/image` with Hugging Face server-side inference, retry with backoff on 503, and fallback model support.
   - Build `POST /api/v1/ai/summarize` for URL extraction and raw text summarization.
   - Build `POST /api/v1/ai/translate` for multi-language translation.
3. **Architecture Decoupling**:
   - Refactor `server/routes/postRoutes.js` into clean `controllers/`, `services/`, and `validators/`.
   - Add input validation, file MIME/size checks, and pagination (`page`, `limit`).
4. **Client API Layer**:
   - Create `client/src/services/api/` with unified Axios client.
   - Update `CreatePost.jsx`, `Summarize.jsx`, and `Home.jsx` to call internal Express endpoints.
5. **CORS & Resilience**:
   - Restrict CORS to `CLIENT_URL` / allowlist.
   - Add graceful database state detection on `GET /api/v1/health`.
6. **Code Cleanup**:
   - Delete `client/src/pages/temp.txt`.
   - Remove obsolete `bardapi` from `server/package.json`.
