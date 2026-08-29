import { conversationRepository } from '../repositories/conversationRepository.js';
import { AppError } from '../utils/errors.js';

export const getConversations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await conversationRepository.findConversationsForUser(req.user.id, { page, limit });

    return res.status(200).json({
      success: true,
      data: result.conversations,
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

export const getConversationDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await conversationRepository.findConversationByIdForUser(id, req.user.id);

    if (!conversation) {
      throw new AppError('Conversation not found.', 404, 'NOT_FOUND');
    }

    const messages = await conversationRepository.findMessagesForConversation(id, req.user.id);

    return res.status(200).json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await conversationRepository.deleteConversationForUser(id, req.user.id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
