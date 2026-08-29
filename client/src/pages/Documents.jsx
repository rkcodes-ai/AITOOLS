import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getDocumentsApi,
  uploadDocumentApi,
  retryProcessingApi,
  deleteDocumentApi,
} from '../services/api/documents.js';
import {
  RiFileLine,
  RiFilePdfLine,
  RiFileTextLine,
  RiUploadCloud2Line,
  RiChat1Line,
  RiInformationLine,
  RiRefreshLine,
  RiDeleteBinLine,
  RiSearchLine,
  RiCheckDoubleLine,
  RiErrorWarningLine,
  RiLoader4Line,
  RiShieldCheckLine,
} from 'react-icons/ri';

const STATUS_TABS = [
  { id: null, label: 'All Documents' },
  { id: 'ready', label: 'Ready for AI' },
  { id: 'processing', label: 'Processing' },
  { id: 'failed', label: 'Failed' },
];

export const Documents = () => {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getDocumentsApi({
        page: pagination.page,
        status: selectedStatus,
        search: searchQuery,
      });
      if (res.success) {
        setDocuments(res.data || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.warn('[DocumentsPage] Failed to fetch documents:', err.message);
      toast.error('Failed to load documents.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Polling for processing status update
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing' || d.status === 'uploaded');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchDocuments();
    }, 4000);

    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select a PDF or TXT file to upload.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (documentName.trim()) {
        formData.append('name', documentName.trim());
      }

      const res = await uploadDocumentApi(formData);
      if (res.success) {
        toast.success(`Document '${res.data.name}' uploaded! Processing started.`);
        setIsUploadOpen(false);
        setUploadFile(null);
        setDocumentName('');
        fetchDocuments();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetry = async (docId, e) => {
    e.stopPropagation();
    try {
      const res = await retryProcessingApi(docId);
      if (res.success) {
        toast.success('Reprocessing scheduled.');
        fetchDocuments();
      }
    } catch (err) {
      toast.error(err.message || 'Retry failed.');
    }
  };

  const handleDelete = async (docId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document and all its vector chunks?')) {
      return;
    }

    try {
      const res = await deleteDocumentApi(docId);
      if (res.success) {
        toast.success('Document deleted.');
        fetchDocuments();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete document.');
    }
  };

  const getStatusBadge = (doc) => {
    switch (doc.status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <RiCheckDoubleLine size={13} /> Ready for RAG
          </span>
        );
      case 'processing':
      case 'uploaded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
            <RiLoader4Line className="animate-spin" size={13} /> {doc.processingStage || 'Processing'}...
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <RiErrorWarningLine size={13} /> {doc.errorCode || 'Failed'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-[#8B5CF6]/15 via-[#6366F1]/10 to-[#0B1020]/80 border border-[#202A44] rounded-3xl backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-[#8B5CF6] text-xs font-semibold uppercase tracking-wider mb-2">
            <RiShieldCheckLine className="text-[#22D3EE]" />
            AI Document Intelligence & RAG
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
            Your Documents & AI Knowledge Library
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl">
            Upload PDFs and TXT files, track processing, and prepare your documents for AI-powered search and grounded answers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/documents/chat')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0B1020] hover:bg-[#0F172A] text-[#F8FAFC] text-xs font-semibold rounded-2xl border border-[#202A44] hover:border-[#8B5CF6]/50 transition-all shadow-md"
          >
            <RiChat1Line size={16} className="text-[#06B6D4]" /> Open Document Chat
          </button>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:from-[#7C3AED] hover:to-[#4F46E5] text-white text-xs font-bold rounded-2xl shadow-lg shadow-[#8B5CF6]/25 transition-all"
          >
            <RiUploadCloud2Line size={16} /> Upload Document
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/5 border border-[#202A44] rounded-2xl backdrop-blur-xl">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id || 'all'}
              type="button"
              onClick={() => {
                setSelectedStatus(tab.id);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedStatus === tab.id
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white shadow-sm'
                  : 'bg-[#0B1020] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0F172A] border border-[#202A44]/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" size={15} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#050812]/80 border border-[#202A44] rounded-xl text-[#F8FAFC] text-xs placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
          />
        </div>
      </div>

      {/* Document Grid / Table */}
      {isLoading ? (
        <div className="py-20 text-center text-[#94A3B8] flex flex-col items-center gap-3">
          <RiLoader4Line className="animate-spin text-[#8B5CF6]" size={36} />
          <p className="text-xs">Loading your document library...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center bg-white/5 border border-[#202A44] rounded-3xl backdrop-blur-xl space-y-4">
          <div className="p-4 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <RiFileLine size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC]">No documents found</h3>
            <p className="text-xs text-[#94A3B8] max-w-sm mx-auto mt-1">
              Upload your first PDF or TXT document to begin processing and prepare it for AI-powered search and grounded answers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:from-[#7C3AED] hover:to-[#4F46E5] text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            Upload Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div
              key={doc._id}
              onClick={() => navigate(`/documents/${doc._id}`)}
              className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 rounded-2xl backdrop-blur-xl shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-2.5 bg-gray-900/90 rounded-xl border border-gray-800 text-blue-400 group-hover:text-blue-300">
                    {doc.mimeType === 'application/pdf' ? (
                      <RiFilePdfLine size={24} className="text-red-400" />
                    ) : (
                      <RiFileTextLine size={24} className="text-blue-400" />
                    )}
                  </div>
                  {getStatusBadge(doc)}
                </div>

                {/* Title & Metadata */}
                <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-blue-300 transition-colors">
                  {doc.name}
                </h3>
                <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 font-mono">
                  {doc.originalFilename}
                </p>

                <div className="mt-4 pt-3 border-t border-gray-800/60 grid grid-cols-3 gap-2 text-[10px] text-gray-400 font-mono">
                  <div>
                    <span className="block text-gray-600 uppercase text-[9px]">Size</span>
                    <span>{(doc.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div>
                    <span className="block text-gray-600 uppercase text-[9px]">Pages</span>
                    <span>{doc.pageCount || 1}</span>
                  </div>
                  <div>
                    <span className="block text-gray-600 uppercase text-[9px]">Chunks</span>
                    <span>{doc.chunkCount || 0}</span>
                  </div>
                </div>

                {doc.errorMessage && (
                  <p className="mt-3 text-[11px] text-red-400 bg-red-950/30 p-2 rounded-lg border border-red-900/40 line-clamp-2">
                    {doc.errorMessage}
                  </p>
                )}
              </div>

              {/* Card Actions */}
              <div className="mt-5 pt-3 border-t border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {doc.status === 'ready' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/documents/chat?docId=${doc._id}`);
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-semibold border border-blue-500/30 transition-all"
                    >
                      <RiChat1Line size={13} /> Chat
                    </button>
                  )}
                  {doc.status === 'failed' && (
                    <button
                      type="button"
                      onClick={(e) => handleRetry(doc._id, e)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-yellow-600/20 hover:bg-yellow-600 text-yellow-300 hover:text-white rounded-lg text-xs font-semibold border border-yellow-500/30 transition-all"
                    >
                      <RiRefreshLine size={13} /> Retry
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/documents/${doc._id}`)}
                    className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800"
                    title="View details"
                  >
                    <RiInformationLine size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDelete(doc._id, e)}
                  className="p-1 text-gray-500 hover:text-red-400 rounded hover:bg-gray-800 transition-colors"
                  title="Delete document"
                >
                  <RiDeleteBinLine size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => !isUploading && setIsUploadOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl p-6 text-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                  <RiUploadCloud2Line size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Upload Knowledge Document</h3>
                  <p className="text-xs text-gray-400">PDF & TXT files supported (Max 10MB)</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => setIsUploadOpen(false)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="py-5 space-y-4">
              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                  Select File
                </label>
                <div className="p-6 border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-2xl bg-gray-950/60 text-center cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    accept=".pdf,.txt,application/pdf,text/plain"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const f = e.target.files[0];
                        setUploadFile(f);
                        if (!documentName) {
                          setDocumentName(f.name.replace(/\.[^/.]+$/, ''));
                        }
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {uploadFile ? (
                    <div className="space-y-1">
                      <RiFileLine className="text-blue-400 mx-auto" size={32} />
                      <p className="text-xs font-bold text-white">{uploadFile.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <RiUploadCloud2Line className="text-gray-500 mx-auto" size={32} />
                      <p className="text-xs font-semibold text-gray-300">
                        Click or drag file here to upload
                      </p>
                      <p className="text-[10px] text-gray-500">PDF or TXT up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Display Name Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="e.g. Q3 Financial Statement"
                  className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-700 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-800">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-40"
                >
                  {isUploading ? (
                    <>
                      <RiLoader4Line className="animate-spin" size={14} /> Uploading...
                    </>
                  ) : (
                    'Upload & Process'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
