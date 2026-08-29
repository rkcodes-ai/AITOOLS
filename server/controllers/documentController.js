import { documentService } from '../services/documents/documentService.js';
import { ragService } from '../services/documents/ragService.js';
import { sanitizeDocumentListParams, validateChatQueryInput } from '../validators/documentValidators.js';

export const uploadDocument = async (req, res, next) => {
  try {
    const file = req.files?.file || req.files?.document;
    const { name } = req.body;

    const document = await documentService.uploadDocument({
      file,
      name,
      userId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req, res, next) => {
  try {
    const params = sanitizeDocumentListParams(req.query);
    const result = await documentService.getUserDocuments(req.user.id, params);

    return res.status(200).json({
      success: true,
      data: result.documents,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await documentService.getDocumentDetails(id, req.user.id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const retryDocumentProcessing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await documentService.retryProcessing(id, req.user.id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await documentService.deleteDocument(id, req.user.id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const chatWithDocuments = async (req, res, next) => {
  try {
    const validated = validateChatQueryInput(req.body);
    const result = await ragService.answerQuestion({
      userId: req.user.id,
      question: validated.question,
      documentIds: validated.documentIds,
      conversationId: validated.conversationId,
      model: validated.model,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
