# AITOOLS — Dependency Audit & Vulnerability Analysis

This document evaluates the dependencies in both `client/` and `server/`, identifying deprecated libraries, security vulnerabilities, and recommended upgrades.

---

## 1. Client Dependency Audit (`client/package.json`)

| Package | Current Version | Purpose | Status / Findings | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `react` / `react-dom` | `^18.2.0` | Frontend UI runtime | Up to date (React 18) | Keep |
| `react-router-dom` | `^6.9.0` | Client-side routing | Modern v6 | Keep |
| `tailwindcss` | `^3.2.7` | Utility-first styling | Stable Tailwind 3.x | Keep |
| `axios` | `^1.5.0` | HTTP client | Functional | Keep |
| `file-saver` | `^2.0.5` | Client image downloads | Functional | Keep |
| `react-hot-toast` | `^2.4.0` | Notification toasts | Lightweight & active | Keep |
| `react-icons` | `^4.8.0` | Icon set | Functional | Keep |
| `react-textarea-autosize` | `^8.5.3` | Dynamic textarea | Functional | Keep |
| `@reduxjs/toolkit` | `^1.9.3` | State management | **Unused** (Store is empty) | Either connect store or remove to reduce bundle size |
| `react-redux` | `^8.0.5` | Redux React bindings | **Unused** | Either connect store or remove |
| `react-scripts` | `5.0.1` | CRA build tools | Deprecated Webpack 5 runner | Maintain for now; plan eventual Vite migration |

---

## 2. Server Dependency Audit (`server/package.json`)

| Package | Current Version | Purpose | Status / Findings | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `express` | `^4.18.2` | Web Framework | Stable Express 4 | Keep |
| `mongoose` | `^7.4.5` | MongoDB ODM | Stable Mongoose 7 | Keep |
| `cloudinary` | `^1.40.0` | Media upload SDK | Active | Keep |
| `cors` | `^2.8.5` | CORS middleware | Needs origin restriction | Keep, configure properly |
| `dotenv` | `^16.3.1` | Environment loader | Standard | Keep |
| `express-fileupload` | `^1.4.0` | Multipart file handler | Tested & working with temp files | Keep or consider `multer` for granular memory/disk storage |
| `nodemon` | `^3.0.1` | Dev hot-reloading | Development tool | Move to `devDependencies` |
| `openai` | `^4.2.0` | OpenAI API client | Installed but unused in active routes | Maintain for OpenAI provider abstraction |
| `bardapi` | `^1.0.4` | Google Bard scraper | **Deprecated / Obsolete** | Remove; replace with `@google/genai` or official SDK when needed |

---

## 3. Recommended New Dependencies to Add

### Server (Security, Validation & Architecture)

- `helmet`: HTTP security headers.
- `express-rate-limit`: Rate limiting and DDoS protection.
- `zod`: Request validation schemas.
- `bcryptjs`: Password hashing for user authentication.
- `jsonwebtoken`: Access and refresh token generation.
- `morgan`: Request logging and tracing.
- `@huggingface/inference`: Server-side Hugging Face API client.

### Client

- `lucide-react`: Modern icon system.
- `clsx` / `tailwind-merge`: Robust class name composition.
