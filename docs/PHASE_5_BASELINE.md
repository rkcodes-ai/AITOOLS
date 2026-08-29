# AITOOLS — Phase 5 Baseline: Authentication, Authorization & User Identity

This document records the data model, route accessibility, and identity state prior to Phase 5 Authentication.

---

## 1. Current State Matrix

| Dimension | Pre-Phase 5 State | Phase 5 Target Architecture |
| :--- | :--- | :--- |
| **User Model** | **None** | `User` schema with `name`, `email` (unique), `passwordHash`, `role` (`user` \| `admin`), `status`, timestamps. |
| **Password Security** | **None** | `bcryptjs` salted hashing (12 rounds), never returned in responses. |
| **Data Ownership** | **Anonymous / Shared** | `Post.userId` (ObjectId ref User, default null for legacy) and `Generation.userId` for per-user AI history. |
| **Auth Tokens** | **None** | Signed JWT access tokens (15m expiration) & secure refresh tokens / cookies. |
| **Authentication Middleware** | **None** | `authenticateUser`, `optionalAuthenticateUser`, `requireAuth`, `requireRole('admin')`. |
| **Rate Limiting** | **General & AI (Active)** | Dedicated `authLimiter` (20 req / 15m) on `/api/v1/auth/*` against brute-force. |
| **IDOR Protection** | **Unprotected** | Server derives user identity strictly from authenticated JWT token (`req.user.id`). |
| **Frontend State** | **Anonymous** | React `AuthContext` managing login, registration, user session, and token interceptors. |
| **Frontend Routes** | **All Public** | `/login`, `/register`, `/profile` (protected), `/create`, `/summarize`, `/`. |

---

## 2. Public vs Authenticated Route Matrix

```text
Public Endpoints:
  GET  /api/v1/health
  GET  /api/v1/ai/config
  GET  /api/v1/post
  POST /api/v1/auth/register
  POST /api/v1/auth/login

Authenticated Endpoints:
  POST /api/v1/auth/logout
  GET  /api/v1/auth/me
  POST /api/v1/auth/change-password
  POST /api/v1/post
  POST /api/v1/ai/image (optional user linkage)
  POST /api/v1/ai/summarize (optional user linkage)
  POST /api/v1/ai/translate (optional user linkage)
  GET  /api/v1/generations (protected per-user history)
```
