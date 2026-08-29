import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  searchKnowledgeApi,
  getCollectionsApi,
  createCollectionApi,
  deleteCollectionApi,
} from '../services/api/knowledge.js';
import { getDocumentsApi } from '../services/api/documents.js';
import {
  RiSearchLine,
  RiCompass3Line,
  RiFolder2Line,
  RiSparklingFill,
  RiInformationLine,
  RiFilePdfLine,
  RiFileTextLine,
  RiChat1Line,
  RiDeleteBinLine,
  RiLoader4Line,
  RiAddLine,
  RiCloseLine,
  RiEqualizerLine,
  RiFilter3Line,
} from 'react-icons/ri';

export const Knowledge = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [topK, setTopK] = useState(5);
  const [minSimilarity, setMinSimilarity] = useState(0.15);
  const [semanticWeight, setSemanticWeight] = useState(0.70);
  const [showFilters, setShowFilters] = useState(false);

  // Scope State
  const [collections, setCollections] = useState([]);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState([]);

  // Active View Tab ('search' | 'collections')
  const [activeTab, setActiveTab] = useState('search');

  // Source Inspection Modal State
  const [inspectingSource, setInspectingSource] = useState(null);

  // Create Collection Modal State
  const [isCreateColOpen, setIsCreateColOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColDocIds, setNewColDocIds] = useState([]);
  const [isCreatingCol, setIsCreatingCol] = useState(false);

  // 1. Fetch Collections & Ready Documents
  const loadInitialData = useCallback(async () => {
    try {
      const [colRes, docRes] = await Promise.all([
        getCollectionsApi({ limit: 50 }),
        getDocumentsApi({ limit: 100, status: 'ready' }),
      ]);

      if (colRes.success) {
        setCollections(colRes.data || []);
      }
      if (docRes.success) {
        setAvailableDocs(docRes.data || []);
      }
    } catch (err) {
      console.warn('[Knowledge] Error loading metadata:', err.message);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Execute Search Function
  const executeSearch = useCallback(
    async (queryToSearch) => {
      const q = (queryToSearch || searchQuery).trim();
      if (!q) {
        toast.error('Please enter a search query.');
        return;
      }

      setIsSearching(true);
      try {
        const res = await searchKnowledgeApi({
          query: q,
          collectionId: selectedCollectionId || null,
          documentIds: selectedDocIds.length > 0 ? selectedDocIds : [],
          topK,
          minSimilarity,
          semanticWeight,
          keywordWeight: parseFloat((1 - semanticWeight).toFixed(2)),
        });

        if (res.success && res.data) {
          setSearchResults(res.data);
        } else {
          toast.error('No results returned.');
        }
      } catch (err) {
        toast.error(err.message || 'Search failed.');
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery, selectedCollectionId, selectedDocIds, topK, minSimilarity, semanticWeight]
  );

  // Handle URL query parameters (e.g. from Dashboard quick link)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      executeSearch(q);
    }
  }, [location.search, executeSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch();
  };

  // Create Collection Handler
  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newColName.trim()) {
      toast.error('Please enter a collection name.');
      return;
    }

    setIsCreatingCol(true);
    try {
      const res = await createCollectionApi({
        name: newColName.trim(),
        description: newColDesc.trim(),
        documentIds: newColDocIds,
      });

      if (res.success) {
        toast.success(`Collection "${res.data.name}" created!`);
        setIsCreateColOpen(false);
        setNewColName('');
        setNewColDesc('');
        setNewColDocIds([]);
        loadInitialData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create collection.');
    } finally {
      setIsCreatingCol(false);
    }
  };

  // Delete Collection Handler
  const handleDeleteCollection = async (colId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this collection? (Your documents will remain intact).')) {
      return;
    }

    try {
      const res = await deleteCollectionApi(colId);
      if (res.success) {
        toast.success('Collection deleted.');
        if (selectedCollectionId === colId) {
          setSelectedCollectionId('');
        }
        loadInitialData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete collection.');
    }
  };

  const toggleDocFilter = (docId) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 border border-blue-500/20 rounded-3xl backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <RiSparklingFill className="text-yellow-400" />
            AI Knowledge Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
            Semantic Search & Knowledge Graph
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl">
            Hybrid vector + keyword retrieval across all your indexed documents and collections. Find exact passages with semantic relevance scoring and granular source explanations.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-[#050812]/80 p-1 rounded-2xl border border-[#202A44] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'search'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white shadow-md'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <RiSearchLine size={14} /> Semantic Search
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('collections')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'collections'
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white shadow-md'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <RiFolder2Line size={14} /> Collections ({collections.length})
          </button>
        </div>
      </div>

      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Main Search Bar & Scope Selector */}
          <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl shadow-xl space-y-4">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="relative flex items-center">
                <RiSearchLine className="absolute left-4 text-blue-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by conceptual meaning or exact terms across your documents..."
                  className="w-full pl-12 pr-32 py-4 bg-gray-950/80 border border-gray-700 rounded-2xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                />
                <div className="absolute right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                      showFilters
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
                    }`}
                    title="Toggle Search Tuning & Scopes"
                  >
                    <RiEqualizerLine size={16} />
                  </button>
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-40 transition-all"
                  >
                    {isSearching ? (
                      <>
                        <RiLoader4Line className="animate-spin" size={14} /> Searching...
                      </>
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>
              </div>

              {/* Scoping & Tuning Panel */}
              {showFilters && (
                <div className="p-4 bg-gray-950/80 rounded-2xl border border-gray-800/80 space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* Collection Scope */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
                        <RiFolder2Line className="text-indigo-400" /> Target Collection
                      </label>
                      <select
                        value={selectedCollectionId}
                        onChange={(e) => setSelectedCollectionId(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">All Collections / Entire Base</option>
                        {collections.map((col) => (
                          <option key={col._id} value={col._id}>
                            {col.name} ({col.documentIds?.length || 0} docs)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Min Similarity threshold */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
                        <RiFilter3Line className="text-emerald-400" /> Min Similarity: {(minSimilarity * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={0.8}
                        step={0.05}
                        value={minSimilarity}
                        onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                        <span>0% (Broad)</span>
                        <span>40%</span>
                        <span>80% (Strict)</span>
                      </div>
                    </div>

                    {/* Top K limit */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
                        <RiEqualizerLine className="text-cyan-400" /> Max Results: {topK}
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={15}
                        value={topK}
                        onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                        <span>1</span>
                        <span>5</span>
                        <span>10</span>
                        <span>15</span>
                      </div>
                    </div>

                    {/* Semantic vs Keyword Weight */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
                        <RiSparklingFill className="text-yellow-400" /> Balance: {(semanticWeight * 100).toFixed(0)}% Sem / {((1 - semanticWeight) * 100).toFixed(0)}% Kw
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={semanticWeight}
                        onChange={(e) => setSemanticWeight(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                        <span>Keyword</span>
                        <span>Balanced</span>
                        <span>Semantic</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Specific Filter */}
                  {availableDocs.length > 0 && (
                    <div className="pt-2 border-t border-gray-800">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Filter by Specific Documents ({selectedDocIds.length === 0 ? 'All Documents' : `${selectedDocIds.length} Selected`}):
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {availableDocs.map((doc) => {
                          const isSelected = selectedDocIds.includes(doc._id);
                          return (
                            <button
                              key={doc._id}
                              type="button"
                              onClick={() => toggleDocFilter(doc._id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-blue-600/30 border-blue-500 text-white'
                                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                              }`}
                            >
                              <span className="truncate max-w-[160px]">{doc.name}</span>
                              {isSelected && <RiCloseLine size={12} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Search Results Display */}
          {isSearching ? (
            <div className="py-20 text-center text-[#94A3B8] flex flex-col items-center gap-3">
              <RiLoader4Line className="animate-spin text-[#8B5CF6]" size={36} />
              <p className="text-xs font-mono">Searching your knowledge base...</p>
            </div>
          ) : searchResults ? (
            <div className="space-y-4">
              {/* Results Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/5 border border-[#202A44] rounded-2xl text-xs font-mono text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <span className="text-[#F8FAFC] font-bold">{searchResults.results?.length || 0}</span> result(s) for
                  <span className="text-[#06B6D4]">"{searchResults.queryInfo?.normalizedQuery}"</span>
                  {searchResults.scope?.collectionName && (
                    <span className="px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] text-[10px]">
                      in {searchResults.scope.collectionName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span>Mode: {searchResults.queryInfo?.semanticSearchActive ? 'Semantic + Keyword Hybrid' : 'Lexical Keyword'}</span>
                  {searchResults.cached && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                      Cached
                    </span>
                  )}
                </div>
              </div>

              {/* Results List */}
              {searchResults.results?.length === 0 ? (
                <div className="p-12 text-center bg-white/5 border border-[#202A44] rounded-3xl backdrop-blur-xl space-y-2">
                  <RiCompass3Line className="text-[#64748B] mx-auto" size={36} />
                  <h3 className="text-sm font-bold text-[#F8FAFC]">No relevant knowledge found</h3>
                  <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                    Try different keywords or a more specific query.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.results.map((res) => (
                    <div
                      key={res.chunkId}
                      className="p-5 bg-white/5 hover:bg-white/10 border border-[#202A44] hover:border-[#8B5CF6]/40 rounded-2xl backdrop-blur-xl shadow-lg transition-all space-y-3 group"
                    >
                      {/* Result Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#202A44]">
                        <div className="flex items-center gap-2.5">
                          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#8B5CF6]/20 text-[#8B5CF6] font-mono text-xs font-bold border border-[#8B5CF6]/30">
                            #{res.rank}
                          </span>
                          <div className="flex items-center gap-2">
                            {res.mimeType === 'application/pdf' ? (
                              <RiFilePdfLine className="text-red-400" size={16} />
                            ) : (
                              <RiFileTextLine className="text-[#06B6D4]" size={16} />
                            )}
                            <h3 className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#8B5CF6] transition-colors">
                              {res.documentName}
                            </h3>
                          </div>
                          <span className="text-xs text-[#94A3B8] font-mono">
                            Page {res.pageStart}{res.pageEnd !== res.pageStart ? `-${res.pageEnd}` : ''}
                          </span>
                        </div>

                        {/* Scores Pills */}
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          <span className="px-2 py-0.5 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 font-bold" title="Final combined hybrid score">
                            Relevance: {(res.finalScore * 100).toFixed(1)}%
                          </span>
                          {res.semanticScore > 0 && (
                            <span className="px-2 py-0.5 rounded-lg bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30 hidden sm:inline" title="Semantic cosine similarity">
                              Semantic: {(res.semanticScore * 100).toFixed(0)}%
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 hidden sm:inline" title="Keyword lexical match">
                            Keyword: {(res.keywordScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Explanation Badge */}
                      {res.explanation && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 text-[11px]">
                          <RiInformationLine size={13} className="shrink-0" />
                          <span>{res.explanation}</span>
                        </div>
                      )}

                      {/* Snippet Body */}
                      <p className="text-xs text-[#E2E8F0] leading-relaxed font-mono bg-[#050812]/80 p-3.5 rounded-xl border border-[#202A44]">
                        {res.snippet}
                      </p>

                      {/* Actions Footer */}
                      <div className="pt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setInspectingSource(res)}
                          className="flex items-center gap-1 text-xs text-[#06B6D4] hover:text-[#22D3EE] font-semibold"
                        >
                          <RiInformationLine size={14} /> Inspect Full Passage & Metadata
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/documents/${res.documentId}`)}
                            className="px-3 py-1 bg-[#0B1020] hover:bg-[#1E293B] text-[#94A3B8] hover:text-[#F8FAFC] rounded-lg text-xs font-medium border border-[#202A44] transition-colors"
                          >
                            View Document
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/documents/chat?docId=${res.documentId}`)}
                            className="flex items-center gap-1 px-3 py-1 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6] text-[#8B5CF6] hover:text-white rounded-lg text-xs font-semibold border border-[#8B5CF6]/30 transition-all"
                          >
                            <RiChat1Line size={13} /> Ask AI
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white/5 border border-[#202A44] rounded-3xl backdrop-blur-xl space-y-3">
              <div className="p-4 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <RiCompass3Line size={32} />
              </div>
              <h3 className="text-base font-bold text-[#F8FAFC]">Search your knowledge base</h3>
              <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                Enter a query to find relevant passages across your documents and collections.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'collections' && (
        <div className="space-y-6">
          {/* Collections Action Bar */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
            <div>
              <h2 className="text-sm font-bold text-white">Knowledge Collections</h2>
              <p className="text-xs text-gray-400">Organize your documents into topic-focused knowledge containers.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateColOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              <RiAddLine size={16} /> New Collection
            </button>
          </div>

          {/* Collections Grid */}
          {collections.length === 0 ? (
            <div className="p-12 text-center bg-white/5 border border-white/10 rounded-3xl space-y-3">
              <RiFolder2Line className="text-gray-500 mx-auto" size={36} />
              <h3 className="text-sm font-bold text-white">No collections created yet</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Group related documents (e.g. "Projects", "College Notes", "Legal Docs") into reusable knowledge collections.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateColOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all"
              >
                Create First Collection
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((col) => (
                <div
                  key={col._id}
                  className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 rounded-2xl backdrop-blur-xl shadow-lg transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="p-2.5 bg-gray-900 rounded-xl text-indigo-400 border border-gray-800">
                        <RiFolder2Line size={24} />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCollection(col._id, e)}
                        className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
                        title="Delete collection"
                      >
                        <RiDeleteBinLine size={16} />
                      </button>
                    </div>

                    <h3 className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">
                      {col.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {col.description || 'No description provided.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs text-gray-400 font-mono">
                      <span>{col.documentIds?.length || 0} document(s)</span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(col.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCollectionId(col._id);
                        setActiveTab('search');
                      }}
                      className="flex-1 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl text-xs font-semibold border border-blue-500/30 transition-all text-center"
                    >
                      Search Collection
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Source Inspection Modal */}
      {inspectingSource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setInspectingSource(null)}
        >
          <div
            className="relative w-full max-w-xl bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl p-6 text-gray-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                  <RiInformationLine size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Retrieved Knowledge Source</h3>
                  <p className="text-[11px] text-gray-400">Exact passage and scoring breakdown</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingSource(null)}
                className="text-gray-400 hover:text-white"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-950/80 rounded-xl border border-gray-800 font-mono text-[11px]">
                <div>
                  <span className="block text-gray-500 uppercase text-[9px]">Document</span>
                  <span className="text-white truncate font-bold">{inspectingSource.documentName}</span>
                </div>
                <div>
                  <span className="block text-gray-500 uppercase text-[9px]">Page Range</span>
                  <span className="text-white">Page {inspectingSource.pageStart} - {inspectingSource.pageEnd}</span>
                </div>
                <div>
                  <span className="block text-gray-500 uppercase text-[9px]">Relevance Score</span>
                  <span className="text-blue-400 font-bold">{(inspectingSource.finalScore * 100).toFixed(1)}%</span>
                </div>
              </div>

              {inspectingSource.explanation && (
                <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-cyan-300 text-xs">
                  <span className="font-bold">Retrieval Rationale:</span> {inspectingSource.explanation}
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
                  Full Extracted Passage Text:
                </label>
                <p className="p-4 bg-gray-950 rounded-xl border border-gray-800 text-gray-300 font-mono leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {inspectingSource.fullText || inspectingSource.snippet}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-gray-800">
              <button
                type="button"
                onClick={() => {
                  setInspectingSource(null);
                  navigate(`/documents/chat?docId=${inspectingSource.documentId}`);
                }}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                <RiChat1Line size={14} /> Ask AI about this document
              </button>
              <button
                type="button"
                onClick={() => setInspectingSource(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Collection Modal */}
      {isCreateColOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => !isCreatingCol && setIsCreateColOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl p-6 text-gray-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                  <RiFolder2Line size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create Knowledge Collection</h3>
                  <p className="text-xs text-gray-400">Bundle documents into a unified search container</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isCreatingCol}
                onClick={() => setIsCreateColOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <RiCloseLine size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Distributed Systems & Cloud"
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-700 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  placeholder="Brief description of documents inside this container..."
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-700 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Document Checkbox Picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Attach Initial Documents ({newColDocIds.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1 bg-gray-950/80 p-2 rounded-xl border border-gray-800">
                  {availableDocs.length === 0 ? (
                    <p className="text-xs text-gray-500 p-2">No ready documents available. Upload documents first.</p>
                  ) : (
                    availableDocs.map((doc) => {
                      const isSelected = newColDocIds.includes(doc._id);
                      return (
                        <div
                          key={doc._id}
                          onClick={() => {
                            setNewColDocIds((prev) =>
                              prev.includes(doc._id)
                                ? prev.filter((id) => id !== doc._id)
                                : [...prev, doc._id]
                            );
                          }}
                          className={`p-2 rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-600/20 text-white border border-blue-500/40'
                              : 'text-gray-400 hover:text-white hover:bg-gray-900'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="accent-blue-500 rounded cursor-pointer"
                          />
                          <span className="truncate flex-1 font-medium">{doc.name}</span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {(doc.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-800">
                <button
                  type="button"
                  disabled={isCreatingCol}
                  onClick={() => setIsCreateColOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCol || !newColName.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-40"
                >
                  {isCreatingCol ? (
                    <>
                      <RiLoader4Line className="animate-spin" size={14} /> Creating...
                    </>
                  ) : (
                    'Create Collection'
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

export default Knowledge;
