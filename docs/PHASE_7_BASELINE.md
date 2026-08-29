# AITOOLS — Phase 7 Baseline: Advanced AI Image Studio

This document audits the image generation pipeline, model registry, and UI capabilities prior to Phase 7 Advanced AI Image Studio.

---

## 1. Current State Matrix

| Feature Area | Current Baseline (Post Phase 6) | Phase 7 Target Architecture |
| :--- | :--- | :--- |
| **Studio UI** | Basic prompt + model input with single preview. | Professional dual-column Studio with Prompt Workspace, capability-aware settings, and live preview. |
| **Model Registry** | Basic list (`id`, `name`, `provider`, `isDefault`). | Enriched capability registry with model-specific feature maps (`negativePrompt`, `seed`, `guidanceScale`, `steps`, `dimensions`). |
| **Aspect Ratios & Dimensions** | Fixed default output. | Configurable aspect ratios (`1:1`, `16:9`, `9:16`, `4:3`, `3:4`) mapped to safe resolution presets. |
| **Negative Prompting** | None. | Model-gated negative prompt support (enabled on SD 2.1/SDXL, cleanly disabled on FLUX). |
| **Quality & Inference Steps** | Fixed provider defaults. | Quality presets (`fast`, `balanced`, `quality`) and bounded step/guidance controls. |
| **Seed Control** | Uncontrolled random. | Random / deterministic fixed seed with reproduction metadata. |
| **Image Presets** | None. | User-owned reusable image configuration presets (`ImagePreset` model & CRUD API). |
| **Prompt Builder** | None. | Structured composer (Subject, Style, Environment, Lighting, Mood). |
| **Sharing & Downloads** | Basic share form. | Dual action: high-res direct image download + explicit community gallery publishing. |

---

## 2. Model Capabilities Matrix

| Model Identifier | Provider | Negative Prompt | Seed | Guidance Scale | Inference Steps | Aspect Ratios | Max Resolution |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `stabilityai/stable-diffusion-2-1` | Hugging Face | **Supported** | **Supported** | **Supported (1-20)** | **Supported (10-50)** | `1:1`, `16:9`, `9:16`, `4:3`, `3:4` | 768x768 |
| `black-forest-labs/FLUX.1-schnell` | Hugging Face | *Unsupported* | **Supported** | *Unsupported* | **Supported (1-8)** | `1:1`, `16:9`, `9:16`, `4:3`, `3:4` | 1024x1024 |
| `stabilityai/stable-diffusion-xl-base-1.0` | Hugging Face | **Supported** | **Supported** | **Supported (1-20)** | **Supported (10-50)** | `1:1`, `16:9`, `9:16`, `4:3`, `3:4` | 1024x1024 |
| `runwayml/stable-diffusion-v1-5` | Hugging Face | **Supported** | **Supported** | **Supported (1-20)** | **Supported (10-50)** | `1:1`, `16:9`, `9:16`, `4:3`, `3:4` | 512x512 |

---

## 3. Explicit Capability Status

```text
IMPLEMENTED:
- Server-side multi-provider model selection
- Basic prompt and model execution
- Automatic cold-start backoff retry & fallback routing
- Cloudinary media hosting & persistence

SUPPORTED (Phase 7 Scope):
- Model capability metadata in GET /api/v1/ai/config
- Aspect ratios and safe resolution translation
- Negative prompt handling for diffusion models
- Guidance scale & inference step tuning
- Deterministic seed generation and reproduction
- User-owned ImagePresets (CRUD + IDOR protected)
- Client-side structured Prompt Builder
- Image downloading and explicit community sharing

UNSUPPORTED (Intentionally excluded or model-limited):
- Image-to-Image / Inpainting (unsupported on standard text-to-image server endpoint)
- Multiple simultaneous output images from single inference
- Fake AI prompt enhancement (only executed if live LLM provider is provisioned)
```
