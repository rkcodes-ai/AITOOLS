import { providerRegistry } from '../../providers/registry/providerRegistry.js';
import { modelRegistry } from '../../providers/registry/modelRegistry.js';
import { vectorStore } from './vectorStore.js';
import { hybridRetriever } from '../knowledge/hybridRetriever.js';
import { documentRepository } from '../../repositories/documentRepository.js';
import { conversationRepository } from '../../repositories/conversationRepository.js';
import { knowledgeCollectionRepository } from '../../repositories/knowledgeCollectionRepository.js';
import { ValidationError, AppError } from '../../utils/errors.js';
import { ProviderConfigurationError } from '../../providers/errors/providerErrors.js';

/**
 * Synthesize an accurate, natural-language, grounded answer from retrieved chunks
 */
function synthesizeGroundedAnswer(question, retrievedResults) {
  if (!retrievedResults || retrievedResults.length === 0) {
    return "I couldn't find enough relevant information in the selected documents to answer this question.";
  }

  // Extract document names and pages
  const docNames = [...new Set(retrievedResults.map((r) => r.documentName || 'Document'))];
  const pages = [...new Set(retrievedResults.map((r) => r.pageStart).filter(Boolean))].sort((a, b) => a - b);
  const docTitle = docNames.join(', ');
  const pageCitations = pages.length > 0 ? `(Pages ${pages.join(', ')})` : '';

  // Process text lines from all chunks to extract structured information
  const allLines = [];
  for (const r of retrievedResults) {
    const raw = r.fullText || r.text || r.snippet || '';
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    allLines.push(...lines);
  }

  // Look for step patterns (e.g. "Step 1", "1)", "1.", "Step:")
  const stepItems = [];
  const bulletItems = [];
  const keySentences = [];

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    const stepMatch = line.match(/^(?:Step\s*([0-9]+)[:\s.-]*|([0-9]+)[.)]\s*)/i);
    if (stepMatch) {
      let content = line;
      let j = i + 1;
      while (j < allLines.length && !allLines[j].match(/^(?:Step\s*[0-9]+|[0-9]+[.)]|---)/i) && j < i + 4) {
        if (allLines[j].length > 0 && !allLines[j].startsWith('--')) {
          content += ' ' + allLines[j];
        }
        j++;
      }
      stepItems.push(content);
    } else if (line.startsWith('*') || line.startsWith('-') || line.startsWith('•')) {
      bulletItems.push(line.replace(/^[*\-•]\s*/, '').trim());
    } else if (line.length > 25 && !line.startsWith('--')) {
      keySentences.push(line);
    }
  }

  let answerBody = '';

  if (stepItems.length > 0) {
    const uniqueSteps = [...new Set(stepItems)].slice(0, 8);
    answerBody = `### Steps & Key Concepts in Document:\n\n` +
      uniqueSteps.map((s, idx) => `${idx + 1}. **${s}**`).join('\n\n');

    if (bulletItems.length > 0) {
      const uniqueBullets = [...new Set(bulletItems)].slice(0, 6);
      answerBody += `\n\n**Key Techniques & Details:**\n` +
        uniqueBullets.map((b) => `- ${b}`).join('\n');
    }
  } else if (bulletItems.length > 0) {
    const uniqueBullets = [...new Set(bulletItems)].slice(0, 8);
    answerBody = `### Key Points from Document:\n\n` +
      uniqueBullets.map((b) => `- **${b}**`).join('\n');
  } else {
    const uniquePassages = retrievedResults.slice(0, 3).map((r) => {
      const pageInfo = r.pageStart ? `Page ${r.pageStart}` : 'General';
      const cleanText = (r.fullText || r.text || r.snippet || '').replace(/\s+/g, ' ').trim();
      return `**From ${r.documentName || 'Document'} (${pageInfo}):**\n> ${cleanText}`;
    });
    answerBody = uniquePassages.join('\n\n');
  }

  return `Based on **${docTitle}** ${pageCitations}, here is the answer regarding **"${question.trim()}"**:\n\n${answerBody}\n\n---\n*Grounded response synthesized directly from your verified source document.*`;
}

export const ragService = {
  /**
   * Execute retrieval augmented generation (RAG) query over user-selected documents or collection
   */
  async answerQuestion({
    userId,
    question,
    documentIds = [],
    collectionId = null,
    conversationId = null,
    model = null,
    topK = 4,
  }) {
    if (!userId) {
      throw new AppError('Authentication required to query documents.', 401, 'UNAUTHORIZED');
    }

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      throw new ValidationError('Question is required and cannot be empty.', 'EMPTY_QUESTION');
    }

    if (question.length > 2000) {
      throw new ValidationError('Question length exceeds limit of 2,000 characters.', 'QUESTION_TOO_LONG');
    }

    // 1. Resolve Document IDs from Collection or direct input
    let targetDocIds = Array.isArray(documentIds) ? [...documentIds] : [];
    if (collectionId) {
      const collection = await knowledgeCollectionRepository.findByIdForUser(collectionId, userId);
      if (collection && Array.isArray(collection.documentIds)) {
        const colDocIds = collection.documentIds.map((d) => (d._id ? d._id.toString() : d.toString()));
        targetDocIds = [...new Set([...targetDocIds, ...colDocIds])];
      }
    }

    // 2. Verify user ownership of all requested documents
    const verifiedDocuments = [];
    if (targetDocIds.length > 0) {
      for (const docId of targetDocIds) {
        const doc = await documentRepository.findByIdForUser(docId, userId);
        if (doc && doc.status === 'ready') {
          verifiedDocuments.push(doc);
        }
      }
    } else {
      // If no document IDs specified, include all user's ready documents
      const userDocs = await documentRepository.findManyForUser(userId, { limit: 50, status: 'ready' });
      verifiedDocuments.push(...userDocs.documents);
    }

    if (verifiedDocuments.length === 0) {
      return {
        answer: 'No processed documents are currently selected or available to answer your question. Please upload and process a document first.',
        sources: [],
        status: 'completed',
        usedRag: false,
      };
    }

    const verifiedDocIds = verifiedDocuments.map((d) => d._id.toString());
    const docMap = new Map(verifiedDocuments.map((d) => [d._id.toString(), d.name]));

    // 3. Resolve or create conversation
    let activeConversation;
    if (conversationId) {
      const convData = await conversationRepository.findConversationById(conversationId, userId);
      activeConversation = convData?.conversation;
    }
    if (!activeConversation) {
      activeConversation = await conversationRepository.createConversation({
        userId,
        title: question.trim().slice(0, 50),
        documentIds: verifiedDocIds,
      });
    }

    // Save user's question message
    await conversationRepository.addMessage({
      conversationId: activeConversation._id,
      userId,
      role: 'user',
      content: question.trim(),
    });

    // 4. Retrieve candidate chunks (try vector search first if embedding configured)
    let retrievedChunks = [];
    const embeddingProvider = providerRegistry.getEmbeddingProvider('huggingface');
    const defaultEmbeddingModel = modelRegistry.getDefaultEmbeddingModel();

    if (embeddingProvider && embeddingProvider.isConfigured()) {
      try {
        const embedResult = await embeddingProvider.embedText({
          text: question.trim(),
          model: defaultEmbeddingModel.id,
        });
        if (embedResult && embedResult.vector) {
          const rawChunks = await vectorStore.searchSimilarChunks({
            userId,
            queryVector: embedResult.vector,
            documentIds: verifiedDocIds,
            topK,
            minSimilarity: 0.2,
          });
          retrievedChunks = (rawChunks || []).map((c) => ({
            ...c,
            documentName: docMap.get(c.documentId?.toString()) || 'Document',
          }));
        }
      } catch (embedError) {
        console.warn(`[RAGService] Vector embedding search failed: ${embedError.message}`);
      }
    }

    // 5. Fallback to Hybrid Keyword / Lexical Retriever if vector search returned no results
    if (!retrievedChunks || retrievedChunks.length === 0) {
      const retrievalResult = await hybridRetriever.retrieve({
        userId,
        query: question.trim(),
        documentIds: verifiedDocIds,
        collectionId,
        topK: Math.max(1, Math.min(topK || 5, 10)),
        minSimilarity: 0.1,
      });

      if (retrievalResult && retrievalResult.results) {
        retrievedChunks = retrievalResult.results.map((r) => ({
          chunkId: r.chunkId,
          documentId: r.documentId,
          documentName: docMap.get(r.documentId?.toString()) || r.documentName || 'Document',
          text: r.fullText || r.snippet,
          pageStart: r.pageStart,
          pageEnd: r.pageEnd,
          score: r.finalScore || r.keywordScore || 0.5,
        }));
      }
    }

    // Honest "I don't know" if no relevant chunks found
    if (!retrievedChunks || retrievedChunks.length === 0) {
      const fallbackAnswer = "I couldn't find enough relevant information in the selected documents to answer this question.";

      const assistantMsg = await conversationRepository.addMessage({
        conversationId: activeConversation._id,
        userId,
        role: 'assistant',
        content: fallbackAnswer,
        sources: [],
      });

      return {
        answer: fallbackAnswer,
        sources: [],
        conversationId: activeConversation._id,
        messageId: assistantMsg._id,
        status: 'completed',
        usedRag: false,
      };
    }

    // 6. Construct Grounded Context with Prompt Injection Defense
    const formattedContext = retrievedChunks
      .map((chunk, idx) => {
        const docName = docMap.get(chunk.documentId?.toString()) || 'Document';
        // Sanitize chunk text to avoid prompt injection delimiters
        const safeText = (chunk.text || '').replace(/---/g, '-');
        return `[Source ${idx + 1}: "${docName}", Page: ${chunk.pageStart}]\n${safeText}`;
      })
      .join('\n\n');

    // 7. Generate Grounded Answer from Chat Provider (or fallback local grounded synthesis)
    const chatProvider = providerRegistry.getChatProvider('huggingface');
    const selectedChatModel = model || modelRegistry.getDefaultChatModel().id;

    let finalAnswer = '';
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
      if (!chatProvider || !chatProvider.isConfigured()) {
        throw new ProviderConfigurationError(
          'huggingface',
          'CRITICAL: HF_TOKEN is mandatory in production environment for RAG LLM chat.'
        );
      }
      const chatResult = await chatProvider.generateAnswer({
        messages: [{ role: 'user', content: question.trim() }],
        context: formattedContext,
        model: selectedChatModel,
      });
      finalAnswer = chatResult.answer;
    } else {
      const hasConfiguredChat = chatProvider && (typeof chatProvider.isConfigured === 'function' ? chatProvider.isConfigured() : typeof chatProvider.generateAnswer === 'function');

      if (hasConfiguredChat && typeof chatProvider.generateAnswer === 'function') {
        try {
          const chatResult = await chatProvider.generateAnswer({
            messages: [{ role: 'user', content: question.trim() }],
            context: formattedContext,
            model: selectedChatModel,
          });
          finalAnswer = chatResult.answer;
        } catch (chatError) {
          console.warn(`[RAGService] Chat provider failed: ${chatError.message}. Using local grounded synthesis.`);
          finalAnswer = synthesizeGroundedAnswer(question, retrievedChunks);
        }
      } else {
        finalAnswer = synthesizeGroundedAnswer(question, retrievedChunks);
      }
    }

    // 8. Assemble Structured Source Citations
    const sources = retrievedChunks.map((chunk) => {
      const docName = docMap.get(chunk.documentId?.toString()) || 'Document';
      return {
        documentId: chunk.documentId,
        documentName: docName,
        chunkId: chunk.chunkId,
        pageStart: chunk.pageStart,
        pageEnd: chunk.pageEnd,
        snippet: (chunk.text || '').slice(0, 200) + ((chunk.text || '').length > 200 ? '...' : ''),
        relevanceScore: chunk.score,
      };
    });

    // 9. Record Assistant Message in Conversation
    const assistantMsg = await conversationRepository.addMessage({
      conversationId: activeConversation._id,
      userId,
      role: 'assistant',
      content: finalAnswer,
      sources,
      metadata: {
        model: selectedChatModel,
        provider: chatProvider?.name || 'local-grounded',
      },
    });

    return {
      answer: finalAnswer,
      sources,
      conversationId: activeConversation._id,
      messageId: assistantMsg._id,
      model: selectedChatModel,
      provider: chatProvider?.name || 'local-grounded',
      status: 'completed',
      usedRag: true,
    };
  },
};
