import Conversation from '../models/conversation.js';
import Message from '../models/message.js';
import { getDBStatus } from '../config/database.js';
import { AppError, DatabaseError } from '../utils/errors.js';

// In-memory conversation & message store for offline development execution
const inMemoryConversations = new Map();
const inMemoryMessages = new Map();

export const conversationRepository = {
  isReady() {
    return getDBStatus().connected;
  },

  _assertAvailable() {
    if (process.env.NODE_ENV === 'production' && !this.isReady()) {
      throw new DatabaseError('Database persistence is unavailable in production.');
    }
  },

  async createConversation({ userId, title, documentIds }) {
    if (!this.isReady()) {
      this._assertAvailable();
      const id = 'mem_conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const conv = {
        _id: id,
        id,
        userId: userId?.toString(),
        title: (title || 'Document Conversation').trim(),
        documentIds: (documentIds || []).map((d) => d?.toString()),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryConversations.set(id, conv);
      return { ...conv };
    }
    return Conversation.create({
      userId,
      title: (title || 'Document Conversation').trim(),
      documentIds: documentIds || [],
    });
  },

  async findConversationsForUser(userId, { page = 1, limit = 20 } = {}) {
    if (!this.isReady()) {
      this._assertAvailable();
      let convs = Array.from(inMemoryConversations.values()).filter((c) => c.userId === userId?.toString());
      convs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      const total = convs.length;
      const skip = (Math.max(1, page) - 1) * limit;
      const paginated = convs.slice(skip, skip + limit);
      return {
        conversations: paginated,
        total,
        page: Math.max(1, page),
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    }
    const skip = (Math.max(1, page) - 1) * limit;
    const [conversations, total] = await Promise.all([
      Conversation.find({ userId })
        .populate('documentIds', 'name originalFilename status')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments({ userId }),
    ]);

    return {
      conversations,
      total,
      page: Math.max(1, page),
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async findConversationById(id, userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      const conv = inMemoryConversations.get(id?.toString());
      if (conv && conv.userId === userId?.toString()) {
        const msgs = Array.from(inMemoryMessages.values())
          .filter((m) => m.conversationId === id?.toString())
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return { conversation: { ...conv }, messages: msgs.map((m) => ({ ...m })) };
      }
      return null;
    }

    const conversation = await Conversation.findOne({ _id: id, userId })
      .populate('documentIds', 'name originalFilename status')
      .lean();

    if (!conversation) return null;

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .lean();

    return { conversation, messages };
  },

  async addMessage({ conversationId, userId, role, content, sources = [], metadata = {} }) {
    if (!this.isReady()) {
      this._assertAvailable();
      const msgId = 'mem_msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const msg = {
        _id: msgId,
        id: msgId,
        conversationId: conversationId?.toString(),
        userId: userId?.toString(),
        role,
        content,
        sources,
        metadata,
        createdAt: new Date(),
      };
      inMemoryMessages.set(msgId, msg);

      const conv = inMemoryConversations.get(conversationId?.toString());
      if (conv) {
        conv.updatedAt = new Date();
      }
      return { ...msg };
    }

    const [msg] = await Promise.all([
      Message.create({
        conversationId,
        userId,
        role,
        content,
        sources,
        metadata,
      }),
      Conversation.updateOne({ _id: conversationId }, { $set: { updatedAt: new Date() } }),
    ]);

    return msg;
  },

  async deleteConversation(id, userId) {
    if (!this.isReady()) {
      this._assertAvailable();
      const conv = inMemoryConversations.get(id?.toString());
      if (!conv || conv.userId !== userId?.toString()) {
        throw new AppError('Conversation not found or access denied.', 404, 'NOT_FOUND');
      }
      inMemoryConversations.delete(id?.toString());
      for (const [mId, m] of inMemoryMessages.entries()) {
        if (m.conversationId === id?.toString()) {
          inMemoryMessages.delete(mId);
        }
      }
      return { ...conv };
    }

    const conv = await Conversation.findOneAndDelete({ _id: id, userId });
    if (!conv) {
      throw new AppError('Conversation not found or access denied.', 404, 'NOT_FOUND');
    }
    await Message.deleteMany({ conversationId: id });
    return conv;
  },
};
