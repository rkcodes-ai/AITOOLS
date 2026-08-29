# AITOOLS — AI Provider & Model Inventory (Phase 8 Status)

This document provides a registry of external and local AI providers, models, tasks, and configurations.

---

## 1. Provider Registry Matrix

| Provider | Task / Interface | Supported Models | Adapter File | Auth / Key Env | Health Endpoint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hugging Face** | Image Generation | `stabilityai/stable-diffusion-2-1` (Default), `black-forest-labs/FLUX.1-schnell` (Fallback), `stabilityai/stable-diffusion-xl-base-1.0`, `runwayml/stable-diffusion-v1-5` | `HuggingFaceImageAdapter.js` | `HF_TOKEN` | Verified via `/api/v1/ai/config` |
| **Hugging Face** | Dense Embeddings (Feature Extraction) | `sentence-transformers/all-MiniLM-L6-v2` (Default, 384d), `BAAI/bge-small-en-v1.5` (384d) | `HuggingFaceEmbeddingAdapter.js` | `HF_TOKEN` | Verified via `/api/v1/ai/config` |
| **Hugging Face** | Instruct / Chat LLM (Text Generation) | `meta-llama/Meta-Llama-3-8B-Instruct` (Default, 8k ctx), `mistralai/Mistral-7B-Instruct-v0.3` (8k ctx) | `HuggingFaceChatAdapter.js` | `HF_TOKEN` | Verified via `/api/v1/ai/config` |
| **RapidAPI** | Text Summarization | `article-extractor-and-summarizer` | `RapidApiTextAdapter.js` | `RAPID_API_KEY` | Verified via `/api/v1/ai/config` |
| **RapidAPI** | Translation | `nlp-translation` (13 languages) | `RapidApiTranslationAdapter.js` | `RAPID_API_KEY` | Verified via `/api/v1/ai/config` |

---

## 2. Model Registry Metadata

### 2.1 Embedding Models

- **`sentence-transformers/all-MiniLM-L6-v2`**: 384 dimensions, max input length: 512 characters/tokens. Fast, memory-efficient dense sentence embeddings.
- **`BAAI/bge-small-en-v1.5`**: 384 dimensions, max input length: 512 characters/tokens. State-of-the-art retrieval embedding.

### 2.2 Chat / Answering Models

- **`meta-llama/Meta-Llama-3-8B-Instruct`**: 8,192 token context window. Excellent instruction following and contextual synthesis.
- **`mistralai/Mistral-7B-Instruct-v0.3`**: 8,192 token context window. High coherence instruction following.

---

## 3. Configuration & Fallback Rules

- **Offline / Unconfigured Mode**:
  - If `HF_TOKEN` is missing, document processing stores readable text chunks and returns clear `status: ready` with keyword retrieval. Chat endpoints return a clear error envelope: `Hugging Face API token is not configured in the server environment.` without faking completions.
- **Grounded Prompt System Instruction**:
  - LLM is strictly constrained to use only the retrieved context chunks, preventing external hallucinations.
