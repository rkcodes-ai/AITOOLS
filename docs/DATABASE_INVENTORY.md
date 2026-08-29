# AITOOLS — Database Inventory & Schema Specifications (Phase 9)

This document details MongoDB collections, schemas, references, and indexes.

---

## 1. Schema Specifications

### 1.1 `User` Collection (`server/models/user.js`)

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | Auto | Primary Key | Unique user identifier. |
| `name` | String | Yes | Trim, max 100 chars | Full name of the user. |
| `email` | String | Yes | Unique, lowercase, trim, indexed | User login email. |
| `password` | String | Yes | bcrypt 12-round hash | Salted password hash. |
| `role` | String | Yes | Enum `['user', 'admin']`, default: `'user'` | Role-based authorization. |
| `status` | String | Yes | Enum `['active', 'suspended']`, default: `'active'` | Account status. |
| `createdAt` | Date | Auto | Timestamp | Account creation date. |
| `updatedAt` | Date | Auto | Timestamp | Last update timestamp. |

---

### 1.2 `KnowledgeCollection` Collection (`server/models/knowledgeCollection.js`) [Phase 9]

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | Auto | Primary Key | Unique knowledge collection identifier. |
| `userId` | ObjectId | Yes | Ref: `User`, indexed | Owner of the collection container. |
| `name` | String | Yes | Trim, max 100 chars | Collection display name. |
| `description` | String | No | Trim, max 500 chars, default: `''` | Collection description / topic summary. |
| `documentIds` | [ObjectId] | No | Ref: `Document`, default: `[]` | Array of documents attached to this collection. |
| `status` | String | Yes | Enum `['active', 'archived']`, default: `'active'` | Collection lifecycle state. |
| `createdAt` | Date | Auto | Timestamp, indexed | Creation timestamp. |
| `updatedAt` | Date | Auto | Timestamp | Last update timestamp. |

---

### 1.3 `Document` Collection (`server/models/document.js`)

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | Auto | Primary Key | Unique document identifier. |
| `userId` | ObjectId | Yes | Ref: `User`, indexed | Owner of the document. |
| `name` | String | Yes | Trim, max 150 chars | Display title. |
| `originalFilename` | String | Yes | Trim | Original uploaded filename. |
| `mimeType` | String | Yes | Enum `['application/pdf', 'text/plain']` | Validated MIME type. |
| `size` | Number | Yes | Max 10MB | File size in bytes. |
| `storageKey` | String | Yes | Unique relative path | Safe file storage reference. |
| `checksum` | String | Yes | SHA-256 hex string, indexed | File integrity hash. |
| `pageCount` | Number | No | Default: 0 | Number of document pages. |
| `characterCount` | Number | No | Default: 0 | Total extractable characters. |
| `chunkCount` | Number | No | Default: 0 | Total generated chunks. |
| `status` | String | Yes | Enum `['uploaded', 'processing', 'ready', 'failed', 'deleted']` | High-level status. |
| `processingStage` | String | Yes | Enum `['uploaded', 'extracting', 'chunking', 'embedding', 'indexing', 'ready', 'failed']` | Processing progress stage. |
| `errorCode` | String | No | Default: null | Safe error code on failure. |
| `errorMessage` | String | No | Default: null | Sanitized error message. |
| `metadata` | Mixed | No | Default: `{}` | Extracted PDF info / metadata. |
| `createdAt` | Date | Auto | Timestamp, indexed | Upload timestamp. |
| `updatedAt` | Date | Auto | Timestamp | Update timestamp. |

---

### 1.4 `DocumentChunk` Collection (`server/models/documentChunk.js`)

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | Auto | Primary Key | Unique chunk identifier. |
| `documentId` | ObjectId | Yes | Ref: `Document`, indexed | Parent document reference. |
| `userId` | ObjectId | Yes | Ref: `User`, indexed | Owner user (for strict vector isolation). |
| `chunkIndex` | Number | Yes | Integer (0..N) | Ordered sequence index. |
| `text` | String | Yes | Text chunk | Chunk textual content. |
| `pageStart` | Number | No | Default: 1 | Start page number. |
| `pageEnd` | Number | No | Default: 1 | End page number. |
| `characterStart` | Number | No | Default: 0 | Global start char offset. |
| `characterEnd` | Number | No | Default: 0 | Global end char offset. |
| `tokenEstimate` | Number | No | Default: 0 | Estimated token count. |
| `embedding` | [Number] | No | Default: `[]` | Dense semantic vector embedding. |
| `embeddingStatus` | String | Yes | Enum `['pending', 'completed', 'failed']` | Vector status. |
| `createdAt` | Date | Auto | Timestamp | Creation timestamp. |

---

### 1.5 `Conversation` Collection (`server/models/conversation.js`)

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | Auto | Primary Key | Unique conversation identifier. |
| `userId` | ObjectId | Yes | Ref: `User`, indexed | Owner user. |
| `title` | String | Yes | Trim, max 150 chars | Conversation title. |
| `documentIds` | [ObjectId] | No | Ref: `Document` | Selected active documents. |
| `createdAt` | Date | Auto | Timestamp | Start timestamp. |
| `updatedAt` | Date | Auto | Timestamp, indexed | Last activity timestamp. |

---

### 1.6 `Message` Collection (`server/models/message.js`)

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | Auto | Primary Key | Unique message identifier. |
| `conversationId` | ObjectId | Yes | Ref: `Conversation`, indexed | Parent conversation reference. |
| `userId` | ObjectId | Yes | Ref: `User`, indexed | Message sender / owner. |
| `role` | String | Yes | Enum `['user', 'assistant', 'system']` | Message role. |
| `content` | String | Yes | String | Message content. |
| `sources` | [Object] | No | Default: `[]` | Grounded source citations (`documentId`, `documentName`, `chunkId`, `pageStart`, `pageEnd`, `snippet`, `relevanceScore`). |
| `model` | String | No | Default: `''` | Answering model. |
| `provider` | String | No | Default: `''` | Answering provider. |
| `status` | String | Yes | Enum `['completed', 'failed']` | Message status. |
| `errorCode` | String | No | Default: null | Error code on failure. |
| `createdAt` | Date | Auto | Timestamp, indexed | Message timestamp. |

---

### 1.7 `Post` Collection (`server/models/post.js`)

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | Auto | Primary Key | Unique post identifier. |
| `name` | String | Yes | Trim, max 100 chars | Display creator name. |
| `prompt` | String | Yes | Trim, max 1000 chars | Image prompt. |
| `model` | String | Yes | Trim | Model used for image generation. |
| `photo` | String | Yes | URL string | Cloudinary CDN secure URL. |
| `userId` | ObjectId | No | Ref: `User`, indexed | Associated user account. |
| `createdAt` | Date | Auto | Timestamp, indexed | Creation timestamp. |
| `updatedAt` | Date | Auto | Timestamp | Update timestamp. |

---

### 1.8 `Generation` Collection (`server/models/generation.js`)

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | Auto | Primary Key | Unique generation identifier. |
| `userId` | ObjectId | Yes | Ref: `User`, indexed | Owner of the generation record. |
| `type` | String | Yes | Enum `['image', 'summarize_url', 'summarize_text', 'translate']` | Modality/task type. |
| `provider` | String | Yes | e.g. `'huggingface'`, `'rapidapi'` | Upstream provider. |
| `model` | String | No | Default: `''` | Model identifier. |
| `prompt` | String | No | Default: `''` | Prompt text. |
| `result` | Mixed | No | Default: `{}` | Generation result. |
| `metadata` | Mixed | No | Default: `{}` | Execution options. |
| `status` | String | Yes | Enum `['completed', 'failed']` | Status. |
| `errorCode` | String | No | Default: `null` | Error code on failure. |
| `createdAt` | Date | Auto | Timestamp, indexed | Timestamp. |

---

### 1.9 `ImagePreset` Collection (`server/models/imagePreset.js`)

| Field | Type | Required | Constraints / Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `_id` | ObjectId | Auto | Primary Key | Unique preset identifier. |
| `userId` | ObjectId | Yes | Ref: `User`, indexed | Owner of the preset. |
| `name` | String | Yes | Trim, max 100 chars | Preset display name. |
| `configuration` | Mixed | Yes | Stored settings | Studio configuration. |
| `createdAt` | Date | Auto | Timestamp, indexed | Timestamp. |

---

## 2. Database Indexes Matrix

- `User`: `{ email: 1 }` (Unique)
- `KnowledgeCollection`: `{ userId: 1, createdAt: -1 }`, `{ userId: 1, name: 1 }`
- `Document`: `{ userId: 1, createdAt: -1 }`, `{ userId: 1, status: 1 }`
- `DocumentChunk`: `{ documentId: 1, chunkIndex: 1 }` (Unique), `{ userId: 1, documentId: 1 }`
- `Conversation`: `{ userId: 1, updatedAt: -1 }`
- `Message`: `{ conversationId: 1, createdAt: 1 }`
- `Post`: `{ createdAt: -1 }`, `{ userId: 1, createdAt: -1 }`
- `Generation`: `{ userId: 1, createdAt: -1 }`, `{ userId: 1, type: 1, createdAt: -1 }`, `{ userId: 1, status: 1 }`
- `ImagePreset`: `{ userId: 1, createdAt: -1 }`
