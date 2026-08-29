# AITOOLS — Complete API Inventory (Phase 9 Status)

This document catalogs all available REST endpoints in the AITOOLS backend.

---

## 1. System & Health Endpoints

| Method | Endpoint | Auth | Rate Limit | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/` | Public | General | Root API welcome message and system status. |
| `GET` | `/api/v1/health` | Public | General | System health, database connection state, and provider configuration status. |

---

## 2. Authentication & Identity Endpoints

| Method | Endpoint | Auth | Rate Limit | Description |
| :--- | :--- | :---: | :---: | :--- |
| `POST` | `/api/v1/auth/register` | Public | Auth (20/15m) | Register a new user with `name`, `email`, `password`. |
| `POST` | `/api/v1/auth/login` | Public | Auth (20/15m) | Sign in with `email`, `password` and receive JWT + session cookie. |
| `POST` | `/api/v1/auth/logout` | Public | General | Clear session cookie and invalidate client token. |
| `GET` | `/api/v1/auth/me` | **Bearer / Cookie** | General | Fetch authenticated user profile data. |
| `POST` | `/api/v1/auth/change-password` | **Bearer / Cookie** | Auth (20/15m) | Change password requiring `currentPassword` and `newPassword`. |

---

## 3. Community Posts & Gallery Endpoints

| Method | Endpoint | Auth | Rate Limit | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/v1/post` | Public | General | Retrieve paginated posts with optional search filter (`page`, `limit`, `search`, `userId`). |
| `POST` | `/api/v1/post` | **Optional** | Upload (30/15m) | Create a community post with multipart `photoFile`, `name`, `prompt`, `model`. |
| `DELETE` | `/api/v1/post/:id` | **Bearer (Owner/Admin)** | General | Delete a post (creator owner or admin only). |

---

## 4. AI Intelligence & Image Studio Endpoints

| Method | Endpoint | Auth | Rate Limit | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/v1/ai/config` | Public | General | Discover supported image models, embedding models, chat models, languages, and provider health. |
| `POST` | `/api/v1/ai/image` | **Optional** | AI (60/15m) | Generate AI image with aspect ratios, negative prompt, seed, steps, guidance scale. |
| `POST` | `/api/v1/ai/summarize` | **Optional** | AI (60/15m) | Summarize article URL or raw text. |
| `POST` | `/api/v1/ai/translate` | **Optional** | AI (60/15m) | Translate text to `targetLang`. |

---

## 5. Document Intelligence & RAG Endpoints

| Method | Endpoint | Auth | Rate Limit | Description |
| :--- | :--- | :---: | :---: | :--- |
| `POST` | `/api/v1/documents` | **Bearer / Cookie** | Upload (30/15m) | Upload PDF/TXT document (multipart `file`, optional `name`). Starts background extraction & vectorization. |
| `GET` | `/api/v1/documents` | **Bearer / Cookie** | General | List user's documents with `page`, `limit`, `search`, `status` filters. |
| `GET` | `/api/v1/documents/:id` | **Bearer / Cookie** | General | Fetch document metadata, processing stage, and vectorized chunks. |
| `POST` | `/api/v1/documents/:id/process` | **Bearer / Cookie** | Upload (30/15m) | Trigger idempotent reprocessing retry for a failed or updated document. |
| `DELETE` | `/api/v1/documents/:id` | **Bearer / Cookie** | General | Delete document file, database record, and all vector chunks. |
| `POST` | `/api/v1/documents/chat` | **Bearer / Cookie** | AI (60/15m) | Execute grounded RAG query across selected `documentIds` or `collectionId` with source citations. |

---

## 6. Document Conversations Endpoints

| Method | Endpoint | Auth | Rate Limit | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/v1/conversations` | **Bearer / Cookie** | General | List user's document chat conversations with pagination. |
| `GET` | `/api/v1/conversations/:id` | **Bearer / Cookie** | General | Fetch full conversation details and message history with citations. |
| `DELETE` | `/api/v1/conversations/:id` | **Bearer / Cookie** | General | Delete a conversation and all its messages. |

---

## 7. AI Workspace & Generation History Endpoints

| Method | Endpoint | Auth | Rate Limit | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/v1/generations/stats` | **Bearer / Cookie** | General | Fetch aggregated user generation metrics (`total`, `images`, `summaries`, `translations`, `failed`). |
| `GET` | `/api/v1/generations` | **Bearer / Cookie** | General | Query user history with `page`, `limit`, `type`, `status`, `search`. |
| `GET` | `/api/v1/generations/:id` | **Bearer / Cookie** | General | Fetch detailed generation record. |
| `DELETE` | `/api/v1/generations/:id` | **Bearer / Cookie** | General | Delete single generation record. |

---

## 8. Image Presets Endpoints

| Method | Endpoint | Auth | Rate Limit | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/v1/image-presets` | **Bearer / Cookie** | General | List user's saved image studio presets. |
| `POST` | `/api/v1/image-presets` | **Bearer / Cookie** | General | Create a new user preset with `name` and `configuration`. |
| `PATCH` | `/api/v1/image-presets/:id` | **Bearer / Cookie** | General | Update preset name or configuration. |
| `DELETE` | `/api/v1/image-presets/:id` | **Bearer / Cookie** | General | Delete preset. |

---

## 9. AI Knowledge Engine & Semantic Search Endpoints (Phase 9)

| Method | Endpoint | Auth | Rate Limit | Description |
| :--- | :--- | :---: | :---: | :--- |
| `POST` | `/api/v1/knowledge/search` | **Bearer / Cookie** | Search (60/15m) | Execute hybrid semantic + keyword search across documents or collections with explanations and scores. |
| `POST` | `/api/v1/knowledge/collections` | **Bearer / Cookie** | General | Create a new knowledge collection container (`name`, `description`, `documentIds`). |
| `GET` | `/api/v1/knowledge/collections` | **Bearer / Cookie** | General | List authenticated user's knowledge collections with pagination & search filter. |
| `GET` | `/api/v1/knowledge/collections/:id` | **Bearer / Cookie** | General | Fetch collection details and populated document references. |
| `PATCH` | `/api/v1/knowledge/collections/:id` | **Bearer / Cookie** | General | Update collection metadata (`name`, `description`, `documentIds`, `status`). |
| `DELETE` | `/api/v1/knowledge/collections/:id` | **Bearer / Cookie** | General | Delete collection (preserves underlying documents). |
