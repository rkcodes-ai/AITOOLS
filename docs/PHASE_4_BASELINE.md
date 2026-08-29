# AITOOLS — Phase 4 Baseline: AI Provider Architecture Analysis

This document audits the current AI provider coupling, model handling, and abstraction state prior to Phase 4 refactoring.

---

## 1. Current Provider Coupling Matrix

| Domain Area | Current Implementation | Specific Provider Coupled | Issues / Architectural Gaps |
| :--- | :--- | :--- | :--- |
| **Image Generation** | `server/services/ai/imageService.js` | Hugging Face Serverless API | Direct Axios calls to `api-inference.huggingface.co`, Hugging Face headers, and response parsing hardcoded in domain service. |
| **URL Summarization** | `server/services/ai/textService.js` | RapidAPI `article-extractor-and-summarizer` | RapidAPI headers (`X-RapidAPI-Key`, `X-RapidAPI-Host`) and endpoint hardcoded in domain service. |
| **Text Summarization** | `server/services/ai/textService.js` | RapidAPI `text-summarize-pro` | RapidAPI headers and URL-encoded form formatting hardcoded in domain service. |
| **Translation** | `server/services/ai/textService.js` | RapidAPI `deep-translate1` | RapidAPI endpoint and translation response parsing hardcoded in domain service. |
| **Model Registry** | `SUPPORTED_IMAGE_MODELS` array | Static strings | No model metadata (capabilities, provider mapping, fallback priority, context limits). |
| **Provider Selection** | Hardcoded logic | Single provider | Cannot route different models to different providers (e.g. DALL-E 3 -> OpenAI, SDXL -> Hugging Face / Replicate). |
| **AI Configuration** | Static array in `aiController.js` | Static strings | `/api/v1/ai/config` does not query dynamic model/provider capability registry. |

---

## 2. Target Phase 4 Abstraction Architecture

```text
Controllers Layer (aiController.js)
        ↓
Domain Services Layer (imageService.js, textService.js, translationService.js)
        ↓
Provider Registry & Model Registry (providerRegistry.js, modelRegistry.js)
        ↓
Provider Interfaces (ImageProvider, TextProvider, TranslationProvider)
        ↓
Provider Adapters (HuggingFaceImageAdapter, RapidApiTextAdapter, RapidApiTranslationAdapter, MockAdapters)
        ↓
External AI APIs (Hugging Face, RapidAPI, future providers)
```

---

## 3. Phase 4 Deliverables

1. **Provider Error Hierarchy** (`server/providers/errors/providerErrors.js`).
2. **Abstract Provider Interfaces** (`server/providers/interfaces/`).
3. **Dedicated Provider Adapters** (`server/providers/adapters/`).
4. **Model Capability & Allowlist Registry** (`server/providers/registry/modelRegistry.js`).
5. **Provider Instance & Health Registry** (`server/providers/registry/providerRegistry.js`).
6. **Refactored Domain Services** (`server/services/ai/`).
7. **Dynamic AI Configuration Endpoint** (`/api/v1/ai/config`).
8. **Contract & Mock Testing Suite** (`server/tests/unit/providers/`).
