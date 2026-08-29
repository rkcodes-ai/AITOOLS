import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getDocumentDetailsApi,
  retryProcessingApi,
  deleteDocumentApi,
} from '../services/api/documents.js';
import {
  RiArrowLeftLine,
  RiFilePdfLine,
  RiFileTextLine,
  RiChat1Line,
  RiRefreshLine,
  RiDeleteBinLine,
  RiCheckDoubleLine,
  RiErrorWarningLine,
  RiLoader4Line,
  RiDatabase2Line,
  RiShieldKeyholeLine,
} from 'react-icons/ri';

export const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getDocumentDetailsApi(id);
      if (res.success && res.data) {
        setDocument(res.data.document);
        setChunks(res.data.chunks || []);
      }
    } catch (err) {
      toast.error('Failed to load document details.');
      navigate('/documents');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleRetry = async () => {
    try {
      const res = await retryProcessingApi(id);
      if (res.success) {
        toast.success('Reprocessing scheduled.');
        fetchDetails();
      }
    } catch (err) {
      toast.error(err.message || 'Retry failed.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this document and all its indexed vector chunks?')) {
      return;
    }
    try {
      const res = await deleteDocumentApi(id);
      if (res.success) {
        toast.success('Document deleted.');
        navigate('/documents');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-gray-400 flex flex-col items-center gap-3">
        <RiLoader4Line className="animate-spin text-blue-500" size={36} />
        <p className="text-xs">Loading document inspection...</p>
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/documents')}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <RiArrowLeftLine size={16} /> Back to Document Library
        </button>

        <div className="flex items-center gap-2">
          {document.status === 'ready' && (
            <button
              type="button"
              onClick={() => navigate(`/documents/chat?docId=${document._id}`)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
            >
              <RiChat1Line size={15} /> Ask AI Questions
            </button>
          )}
          {document.status === 'failed' && (
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600 text-yellow-300 hover:text-white rounded-xl text-xs font-bold border border-yellow-500/30 transition-all"
            >
              <RiRefreshLine size={15} /> Retry Processing
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-400 rounded-xl hover:bg-gray-800 transition-colors"
            title="Delete document"
          >
            <RiDeleteBinLine size={18} />
          </button>
        </div>
      </div>

      {/* Main Metadata Overview Card */}
      <div className="p-6 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-gray-900/60 border border-blue-500/20 rounded-3xl backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gray-900/90 rounded-2xl border border-gray-800">
            {document.mimeType === 'application/pdf' ? (
              <RiFilePdfLine size={32} className="text-red-400" />
            ) : (
              <RiFileTextLine size={32} className="text-blue-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{document.name}</h1>
              {document.status === 'ready' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <RiCheckDoubleLine size={13} /> Ready for RAG
                </span>
              ) : document.status === 'processing' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
                  <RiLoader4Line className="animate-spin" size={13} /> {document.processingStage}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                  <RiErrorWarningLine size={13} /> Failed
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono mt-1">{document.originalFilename}</p>
          </div>
        </div>

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-950/60 rounded-2xl border border-gray-800 text-xs font-mono text-gray-300">
          <div>
            <span className="block text-gray-500 uppercase text-[10px]">File Size</span>
            <span className="font-bold text-white">{(document.size / 1024).toFixed(1)} KB</span>
          </div>
          <div>
            <span className="block text-gray-500 uppercase text-[10px]">Pages</span>
            <span className="font-bold text-white">{document.pageCount || 1}</span>
          </div>
          <div>
            <span className="block text-gray-500 uppercase text-[10px]">Total Characters</span>
            <span className="font-bold text-white">{document.characterCount?.toLocaleString() || 0}</span>
          </div>
          <div>
            <span className="block text-gray-500 uppercase text-[10px]">Indexed Chunks</span>
            <span className="font-bold text-blue-400">{document.chunkCount || 0}</span>
          </div>
        </div>

        {/* Security & Checksum Bar */}
        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono bg-gray-950/80 p-3 rounded-xl border border-gray-800/80 overflow-hidden">
          <RiShieldKeyholeLine className="text-cyan-400 shrink-0" size={16} />
          <span className="text-gray-500 shrink-0">SHA-256:</span>
          <span className="truncate text-gray-300">{document.checksum}</span>
        </div>
      </div>

      {/* Extracted Chunks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiDatabase2Line className="text-blue-400" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">
              Extracted & Vectorized Chunks ({chunks.length})
            </h2>
          </div>
        </div>

        {chunks.length === 0 ? (
          <div className="p-8 text-center bg-white/5 border border-white/10 rounded-2xl text-xs text-gray-500">
            No chunks generated yet. Check processing status.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chunks.map((chunk) => (
              <div
                key={chunk._id}
                className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl shadow space-y-2.5"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded border border-blue-500/20 font-bold">
                    Chunk #{chunk.chunkIndex + 1}
                  </span>
                  <span className="text-gray-400">Page {chunk.pageStart}</span>
                  <span className="text-gray-500">~{chunk.tokenEstimate} tokens</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-mono bg-gray-950/60 p-3 rounded-xl border border-gray-800">
                  {chunk.textSnippet}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentDetail;
