import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getDocumentsApi, chatWithDocumentsApi } from '../services/api/documents.js';
import {
  getConversationsApi,
  getConversationDetailsApi,
  deleteConversationApi,
} from '../services/api/conversations.js';
import {
  RiChat1Line,
  RiSendPlaneFill,
  RiBookmarkLine,
  RiDeleteBinLine,
  RiInformationLine,
  RiSparklingFill,
  RiShieldCheckLine,
  RiLoader4Line,
  RiCloseLine,
  RiFileList3Line,
} from 'react-icons/ri';

export const DocumentChat = () => {
  const location = useLocation();
  const messagesEndRef = useRef(null);

  // Ready Documents State
  const [availableDocs, setAvailableDocs] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);

  // Conversations State
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  // Query Input State
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // Source Citation Modal State
  const [selectedSource, setSelectedSource] = useState(null);

  // 1. Fetch available ready documents
  const fetchAvailableDocs = useCallback(async () => {
    try {
      const res = await getDocumentsApi({ limit: 50, status: 'ready' });
      if (res.success && res.data) {
        setAvailableDocs(res.data);

        // Check if navigated with a specific docId in query param
        const params = new URLSearchParams(location.search);
        const urlDocId = params.get('docId');
        if (urlDocId && res.data.some((d) => d._id === urlDocId)) {
          setSelectedDocIds([urlDocId]);
        } else if (res.data.length > 0) {
          setSelectedDocIds((prev) => (prev.length === 0 ? [res.data[0]._id] : prev));
        }
      }
    } catch (err) {
      console.warn('[DocumentChat] Could not load documents:', err.message);
    }
  }, [location.search]);

  // 2. Fetch past conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await getConversationsApi({ limit: 30 });
      if (res.success && res.data) {
        setConversations(res.data);
      }
    } catch (err) {
      console.warn('[DocumentChat] Could not load conversations:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchAvailableDocs();
    fetchConversations();
  }, [fetchAvailableDocs, fetchConversations]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAsking]);

  const handleSelectConversation = async (convId) => {
    setActiveConversationId(convId);
    try {
      const res = await getConversationDetailsApi(convId);
      if (res.success && res.data) {
        setMessages(res.data.messages || []);
        if (res.data.conversation?.documentIds) {
          setSelectedDocIds(res.data.conversation.documentIds.map((d) => d._id || d));
        }
      }
    } catch (err) {
      toast.error('Failed to load conversation history.');
    }
  };

  const handleToggleDoc = (docId) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSendQuestion = async (e) => {
    if (e) e.preventDefault();
    if (!question.trim()) return;

    if (selectedDocIds.length === 0) {
      toast.error('Please select at least one document to ground your question.');
      return;
    }

    const currentQuestion = question.trim();
    setQuestion('');
    setIsAsking(true);

    // Optimistically add user message
    const tempUserMsg = {
      _id: `temp_${Date.now()}`,
      role: 'user',
      content: currentQuestion,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await chatWithDocumentsApi({
        question: currentQuestion,
        documentIds: selectedDocIds,
        conversationId: activeConversationId,
      });

      if (res.success && res.data) {
        setActiveConversationId(res.data.conversationId);
        const assistantMsg = {
          _id: res.data.messageId || `msg_${Date.now()}`,
          role: 'assistant',
          content: res.data.answer,
          sources: res.data.sources || [],
          model: res.data.model,
          provider: res.data.provider,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        fetchConversations();
      } else {
        throw new Error(res.message || 'Failed to get answer.');
      }
    } catch (err) {
      console.error('[DocumentChat] Error:', err);
      toast.error(err.message || 'Failed to answer question.');
      setMessages((prev) => [
        ...prev,
        {
          _id: `err_${Date.now()}`,
          role: 'assistant',
          content: `Error: ${err.message || 'Unable to connect to answering provider.'}`,
          sources: [],
          status: 'failed',
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      const res = await deleteConversationApi(convId);
      if (res.success) {
        toast.success('Conversation deleted.');
        if (activeConversationId === convId) {
          setActiveConversationId(null);
          setMessages([]);
        }
        fetchConversations();
      }
    } catch (err) {
      toast.error('Failed to delete conversation.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 animate-fadeIn">
      {/* Left Sidebar: Documents & History */}
      <div className="w-full md:w-80 flex flex-col gap-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl p-4 overflow-hidden">
        {/* Document Selection Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <RiFileList3Line className="text-blue-400" /> Active Documents ({selectedDocIds.length})
            </h3>
            <button
              type="button"
              onClick={() => setSelectedDocIds(availableDocs.map((d) => d._id))}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
            >
              Select All
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {availableDocs.length === 0 ? (
              <p className="text-[11px] text-gray-500 p-2">
                No ready documents found. Please upload a document first.
              </p>
            ) : (
              availableDocs.map((doc) => {
                const isSelected = selectedDocIds.includes(doc._id);
                return (
                  <div
                    key={doc._id}
                    onClick={() => handleToggleDoc(doc._id)}
                    className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-gray-950/40 border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="accent-blue-500 rounded cursor-pointer"
                    />
                    <div className="truncate flex-1 font-medium">{doc.name}</div>
                    <span className="text-[10px] text-gray-500 uppercase font-mono">
                      {doc.mimeType === 'application/pdf' ? 'PDF' : 'TXT'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Conversation History Section */}
        <div className="flex-1 flex flex-col border-t border-gray-800 pt-3 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <RiBookmarkLine className="text-indigo-400" /> Past Chats
            </h3>
            {activeConversationId && (
              <button
                type="button"
                onClick={() => {
                  setActiveConversationId(null);
                  setMessages([]);
                }}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                New Chat
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {conversations.length === 0 ? (
              <p className="text-[11px] text-gray-500 p-2">No past conversations.</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => handleSelectConversation(conv._id)}
                  className={`p-2 rounded-xl border text-xs flex items-center justify-between group cursor-pointer transition-all ${
                    activeConversationId === conv._id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-gray-950/30 border-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <div className="truncate flex-1 pr-2">{conv.title}</div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(conv._id, e)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 rounded transition-opacity"
                    title="Delete chat"
                  >
                    <RiDeleteBinLine size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl p-6 overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
              <RiSparklingFill size={18} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Grounded Document Q&A</h2>
              <p className="text-[11px] text-gray-400">
                Answers are strictly synthesized from your active documents with page citations.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <RiShieldCheckLine size={14} /> Zero Hallucination Mode
          </div>
        </div>

        {/* Message Timeline */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-3">
              <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl">
                <RiChat1Line size={32} />
              </div>
              <h3 className="text-sm font-bold text-white">Ask anything about your documents</h3>
              <p className="text-xs text-gray-400 max-w-md">
                Select one or more documents from the sidebar, then ask questions like:
                "What is the main finding in section 3?", "Summarize the methodology", or "Compare the documents".
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl p-4 rounded-2xl text-xs space-y-2 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-lg shadow-blue-500/10'
                      : 'bg-gray-900/90 border border-gray-800 text-gray-200 rounded-bl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Sources Bar for Assistant Messages */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-gray-800 space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-blue-400 flex items-center gap-1">
                        <RiInformationLine size={12} /> Verified Sources ({msg.sources.length}):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedSource(src)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-950/80 hover:bg-blue-600/30 text-gray-300 hover:text-white rounded-lg border border-gray-700 hover:border-blue-500/50 text-[10px] font-mono transition-all"
                          >
                            <span className="text-blue-400 font-bold">#{idx + 1}</span>
                            <span className="truncate max-w-[120px]">{src.documentName}</span>
                            <span className="text-gray-500">p.{src.pageStart}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isAsking && (
            <div className="flex items-center gap-2 text-xs text-blue-400 p-3 bg-gray-900/60 rounded-2xl border border-gray-800 w-fit">
              <RiLoader4Line className="animate-spin" size={16} />
              <span>Retrieving relevant chunks and synthesizing grounded answer...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendQuestion} className="pt-3 border-t border-gray-800">
          <div className="relative flex items-center gap-2">
            <textarea
              rows={1}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendQuestion();
                }
              }}
              placeholder={
                selectedDocIds.length > 0
                  ? `Ask a question across ${selectedDocIds.length} document(s)...`
                  : 'Select a document from the left to start asking...'
              }
              maxLength={2000}
              className="flex-1 py-3 px-4 bg-gray-950/90 border border-gray-700 rounded-2xl text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim() || selectedDocIds.length === 0}
              className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <RiSendPlaneFill size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Citation Preview Modal */}
      {selectedSource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedSource(null)}
        >
          <div
            className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl p-6 text-gray-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                  <RiInformationLine size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Source Citation Details</h3>
                  <p className="text-[11px] text-gray-400">Exact retrieved snippet from document</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="text-gray-400 hover:text-white"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-950/60 rounded-xl border border-gray-800 font-mono text-[11px]">
                <div>
                  <span className="block text-gray-500 uppercase text-[9px]">Document</span>
                  <span className="text-white truncate font-bold">{selectedSource.documentName}</span>
                </div>
                <div>
                  <span className="block text-gray-500 uppercase text-[9px]">Page Range</span>
                  <span className="text-white">{selectedSource.pageStart} - {selectedSource.pageEnd}</span>
                </div>
                <div>
                  <span className="block text-gray-500 uppercase text-[9px]">Relevance Score</span>
                  <span className="text-blue-400">{(selectedSource.relevanceScore * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                  Retrieved Text Passage:
                </label>
                <p className="p-4 bg-gray-950 rounded-xl border border-gray-800 text-gray-300 font-mono leading-relaxed max-h-60 overflow-y-auto">
                  {selectedSource.snippet}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSource(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentChat;
