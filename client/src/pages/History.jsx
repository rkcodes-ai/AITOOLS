import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getGenerationsApi, deleteGenerationApi } from '../services/api/generations.js';
import { GenerationDetailModal } from '../components/GenerationDetailModal.jsx';
import {
  RiSearchLine,
  RiFilter3Line,
  RiImageLine,
  RiFileTextLine,
  RiTranslate2,
  RiArrowRightUpLine,
  RiDeleteBinLine,
  RiEyeLine,
} from 'react-icons/ri';

const History = () => {
  const navigate = useNavigate();

  const [generations, setGenerations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalPages: 1, total: 0 });
  const [activeType, setActiveType] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGeneration, setSelectedGeneration] = useState(null);

  const fetchHistory = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const response = await getGenerationsApi({
          page,
          limit: 12,
          type: activeType !== 'all' ? activeType : null,
          status: activeStatus !== 'all' ? activeStatus : null,
          search: searchTerm,
        });

        if (response.success && response.data) {
          setGenerations(response.data);
          setPagination(response.pagination);
        }
      } catch (error) {
        console.warn('[History] Fetch failed:', error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [activeType, activeStatus, searchTerm]
  );

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleDelete = async (id) => {
    try {
      const res = await deleteGenerationApi(id);
      if (res.success) {
        toast.success('Generation deleted.');
        setSelectedGeneration(null);
        fetchHistory(pagination.page);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete record.');
    }
  };

  const handleReuse = (gen) => {
    if (gen.type === 'image') {
      navigate('/create-post', {
        state: { prompt: gen.prompt, model: gen.model },
      });
    } else if (gen.type === 'summarize_url' || gen.type === 'summarize_text') {
      navigate('/summarize', {
        state: {
          input: gen.input || gen.prompt,
          mode: gen.type === 'summarize_url' ? 'url' : 'text',
        },
      });
    } else if (gen.type === 'translate') {
      navigate('/translate', {
        state: {
          input: gen.input || gen.prompt,
          targetLang: gen.result?.targetLang,
          sourceLang: gen.result?.sourceLang || 'auto',
        },
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header & Search Filter Bar */}
      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Generation History</h1>
          <p className="text-xs text-gray-400 mt-1">
            Search, filter, inspect, and reuse your previous AI workspace prompts and outputs.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search prompt, model, provider..."
            className="w-full pl-10 pr-4 py-2 bg-gray-900/80 border border-gray-700 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-gray-900/60 p-1 rounded-xl border border-gray-800 text-xs">
          {[
            { id: 'all', label: 'All Modalities' },
            { id: 'image', label: 'Images' },
            { id: 'summarize_url', label: 'URL Summaries' },
            { id: 'summarize_text', label: 'Text Summaries' },
            { id: 'translate', label: 'Translations' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeType === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-gray-900/60 p-1 rounded-xl border border-gray-800 text-xs">
          <RiFilter3Line className="text-gray-400 ml-2" size={14} />
          {['all', 'completed', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setActiveStatus(st)}
              className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                activeStatus === st
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Generations Grid */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-400 text-sm">Loading history records...</div>
      ) : generations.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-gray-800 text-gray-400">
          <p className="text-base font-semibold text-white mb-1">No generations found</p>
          <p className="text-xs text-gray-400">
            {searchTerm || activeType !== 'all' || activeStatus !== 'all'
              ? 'Try adjusting your search query or filters.'
              : 'Create your first AI generation to build your personal history!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {generations.map((gen) => (
            <div
              key={gen._id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-1.5 rounded-lg text-sm ${
                        gen.type === 'image'
                          ? 'bg-purple-500/20 text-purple-300'
                          : gen.type === 'translate'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {gen.type === 'image' ? (
                        <RiImageLine />
                      ) : gen.type === 'translate' ? (
                        <RiTranslate2 />
                      ) : (
                        <RiFileTextLine />
                      )}
                    </span>
                    <span className="text-xs font-semibold text-white capitalize">
                      {gen.type?.replace('_', ' ')}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                      gen.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {gen.status}
                  </span>
                </div>

                {gen.type === 'image' && gen.result?.imageUrl && (
                  <div
                    onClick={() => setSelectedGeneration(gen)}
                    className="cursor-pointer mb-3 rounded-xl overflow-hidden bg-gray-950/80 border border-gray-800 h-36 flex items-center justify-center group"
                  >
                    <img
                      src={gen.result.imageUrl}
                      alt={gen.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}

                <p className="text-xs text-gray-300 line-clamp-3 font-mono bg-gray-950/40 p-2.5 rounded-xl border border-gray-800/80 mb-3">
                  {gen.prompt || gen.input || 'No prompt'}
                </p>

                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-4">
                  <span className="capitalize">{gen.provider} • {gen.model || 'Default'}</span>
                  <span>{new Date(gen.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedGeneration(gen)}
                    className="flex items-center gap-1 text-xs text-gray-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-gray-800/60 hover:bg-gray-800 transition-colors"
                  >
                    <RiEyeLine size={13} /> View
                  </button>
                  <button
                    onClick={() => handleReuse(gen)}
                    className="flex items-center gap-1 text-xs text-indigo-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 transition-colors"
                  >
                    <RiArrowRightUpLine size={13} /> Reuse
                  </button>
                </div>

                <button
                  onClick={() => handleDelete(gen._id)}
                  className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition-colors"
                  title="Delete generation"
                >
                  <RiDeleteBinLine size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <button
            disabled={pagination.page <= 1}
            onClick={() => fetchHistory(pagination.page - 1)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-gray-400">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchHistory(pagination.page + 1)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedGeneration && (
        <GenerationDetailModal
          generation={selectedGeneration}
          onClose={() => setSelectedGeneration(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default History;
