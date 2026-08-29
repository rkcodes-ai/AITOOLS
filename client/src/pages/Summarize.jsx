import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TextareaAutosize from 'react-textarea-autosize';
import toast from 'react-hot-toast';
import { FiCopy } from 'react-icons/fi';
import { TiTick } from 'react-icons/ti';
import { AiOutlineDelete } from 'react-icons/ai';
import { summarizeApi } from '../services/api/ai';
import {
  RiSparklingFill,
  RiDownload2Line,
  RiRefreshLine,
  RiHistoryLine,
  RiFileList3Line,
} from 'react-icons/ri';

const URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}([-a-zA-Z0-9@:%_+.~#?&//=]*)?$/i;

const ACTION_CONFIG = {
  Summarize: {
    id: 'Summarize',
    label: 'Summarize',
    cta: 'Summarize →',
    loading: 'Summarizing...',
    resultHeading: 'Summary',
    emptyTitle: 'Your summary will appear here.',
    emptySubtitle: 'Enter text and run Summarize to get started.',
  },
  Rewrite: {
    id: 'Rewrite',
    label: 'Rewrite',
    cta: 'Rewrite →',
    loading: 'Rewriting...',
    resultHeading: 'Rewritten Text',
    emptyTitle: 'Your rewritten text will appear here.',
    emptySubtitle: 'Enter text and run Rewrite to get started.',
  },
  Explain: {
    id: 'Explain',
    label: 'Explain',
    cta: 'Explain →',
    loading: 'Explaining...',
    resultHeading: 'Explanation',
    emptyTitle: 'Your explanation will appear here.',
    emptySubtitle: 'Enter text and run Explain to get started.',
  },
  Improve: {
    id: 'Improve',
    label: 'Improve',
    cta: 'Improve →',
    loading: 'Improving...',
    resultHeading: 'Improved Text',
    emptyTitle: 'Your improved text will appear here.',
    emptySubtitle: 'Enter text and run Improve to get started.',
  },
  Analyze: {
    id: 'Analyze',
    label: 'Analyze',
    cta: 'Analyze →',
    loading: 'Analyzing...',
    resultHeading: 'Analysis',
    emptyTitle: 'Your analysis will appear here.',
    emptySubtitle: 'Enter text and run Analyze to get started.',
  },
};

const ACTIONS = Object.values(ACTION_CONFIG);

const Summarize = () => {
  const location = useLocation();

  const [article, setArticle] = useState({
    data: '',
    summary: '',
    action: 'Summarize',
  });

  const [allArticles, setAllArticles] = useState([]);
  const [copied, setCopied] = useState('');
  const [action, setAction] = useState('Summarize');
  const [loading, setLoading] = useState(false);

  const currentConfig = ACTION_CONFIG[action] || ACTION_CONFIG.Summarize;

  // Pre-fill input from navigation state if passed
  useEffect(() => {
    if (location.state?.input) {
      setArticle((prev) => ({ ...prev, data: location.state.input }));
      if (location.state.action && ACTION_CONFIG[location.state.action]) {
        setAction(location.state.action);
      }
      toast.success('Loaded content into Text AI workspace!');
    }
  }, [location.state]);

  // Load session history from localStorage
  useEffect(() => {
    try {
      const articlesFromLocalStorage = JSON.parse(
        localStorage.getItem('text_ai_history') || localStorage.getItem('articles') || '[]'
      );
      if (Array.isArray(articlesFromLocalStorage)) {
        setAllArticles(articlesFromLocalStorage);
      }
    } catch (e) {
      console.warn('Failed to parse articles from localStorage', e);
    }
  }, []);

  const handleActionChange = (newAction) => {
    if (newAction === action) return;
    setAction(newAction);
    setArticle((prev) => ({
      ...prev,
      summary: '',
      action: newAction,
    }));
  };

  const handleDelete = (item) => {
    const newArticles = allArticles.filter((a) => {
      if (a.data !== item.data) return true;
      return (a.action || 'Summarize') !== (item.action || 'Summarize');
    });

    if (
      article.data === item.data &&
      (article.action || 'Summarize') === (item.action || 'Summarize')
    ) {
      setArticle({ data: '', summary: '', action });
    }
    setAllArticles(newArticles);
    localStorage.setItem('text_ai_history', JSON.stringify(newArticles));
    localStorage.setItem('articles', JSON.stringify(newArticles));
    toast.success('Removed from history');
  };

  const handleInput = (e) => {
    setArticle((prev) => ({ ...prev, data: e.target.value }));
  };

  const handleClear = () => {
    setArticle({ data: '', summary: '', action });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const trimmedInput = article.data.trim();
    if (!trimmedInput) {
      toast.error('Please enter text or an article URL.');
      return;
    }

    // Check if we already have this exact action in history
    const existingArticle = allArticles.find((item) => {
      const itemAction = item.action || 'Summarize';
      return item.data.trim() === trimmedInput && itemAction === action;
    });

    if (existingArticle && existingArticle.summary) {
      setArticle(existingArticle);
      return;
    }

    setLoading(true);

    try {
      let resultSummary = '';
      const isUrl = URL_REGEX.test(trimmedInput);
      const payload = isUrl
        ? { url: trimmedInput, action }
        : { text: trimmedInput, action };

      const res = await summarizeApi(payload);
      if (res.success && res.data?.summary) {
        resultSummary = res.data.summary;
      } else {
        throw new Error(res.error?.message || res.error || `Failed to ${action.toLowerCase()} text.`);
      }

      const updatedArticle = {
        data: article.data,
        summary: resultSummary,
        action,
      };

      const updatedArticles = [updatedArticle, ...allArticles.slice(0, 19)];
      setArticle(updatedArticle);
      setAllArticles(updatedArticles);
      localStorage.setItem('text_ai_history', JSON.stringify(updatedArticles));
      localStorage.setItem('articles', JSON.stringify(updatedArticles));
      toast.success(`${action} complete!`);
    } catch (err) {
      console.error('[Text AI] Error:', err);
      toast.error(err.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (textToCopy) => {
    if (!textToCopy) return;
    setCopied(textToCopy);
    navigator.clipboard.writeText(textToCopy);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(''), 3000);
  };

  const handleDownload = () => {
    if (!article.summary) return;
    const blob = new Blob([article.summary], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aitools_${action.toLowerCase()}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded text file!');
  };

  const isUrlMode = URL_REGEX.test(article.data.trim());

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6 box-border font-sans">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#202A44]/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight leading-tight flex items-center gap-2">
            <RiFileList3Line className="text-[#3B82F6]" size={26} />
            <span>
              Understand with <span className="bg-gradient-to-r from-[#06B6D4] via-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">AI</span>.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
            Understand, transform, and improve text with AI.
          </p>
        </div>
      </div>

      {/* 2. Main Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] gap-5 lg:gap-6 items-start w-full min-w-0">
        
        {/* LEFT COLUMN: Input Workspace */}
        <div className="w-full min-w-0 space-y-4">
          <div className="ai-card-glass rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden space-y-4 box-border">
            {/* Header: Title + Supporting Text + Text Mode Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <label htmlFor="text-ai-input" className="text-xs font-bold text-[#F8FAFC] block truncate">
                  Your text
                </label>
                <span className="text-[11px] text-[#94A3B8] block truncate">
                  Paste text or enter a URL
                </span>
              </div>
              <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#0B1020] border border-[#202A44] text-[#94A3B8]">
                {isUrlMode ? '🔗 URL Mode' : '📝 Text Mode'}
              </span>
            </div>

            {/* Input Textarea with Character Counter */}
            <div className="relative w-full min-w-0">
              <TextareaAutosize
                id="text-ai-input"
                value={article.data}
                onChange={handleInput}
                placeholder="Paste text or a URL to get started..."
                minRows={6}
                maxRows={12}
                className="w-full box-border p-3.5 sm:p-4 bg-[#0B1020]/90 border border-[#202A44] rounded-xl text-[#F8FAFC] text-xs sm:text-sm placeholder-[#64748B] focus:outline-none ai-prompt-input resize-none leading-relaxed"
              />
              <div className="flex justify-end text-[10px] font-mono text-[#64748B] mt-1">
                {article.data.length} characters
              </div>
            </div>

            {/* Action Selector (Segmented Control: Responsive 5-action grid) */}
            <div className="space-y-1.5 pt-1 w-full min-w-0">
              <label className="block text-xs font-bold text-[#F8FAFC]">
                Transformation Action
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 w-full min-w-0">
                {ACTIONS.map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => handleActionChange(act.id)}
                    className={`py-2 px-2 text-center rounded-xl border text-xs font-semibold transition-all duration-200 truncate ${
                      action === act.id
                        ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-white shadow-sm shadow-[#3B82F6]/20 font-bold'
                        : 'bg-[#0B1020]/60 border-[#202A44] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#3B82F6]/30'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !article.data.trim()}
              className={`w-full py-3.5 px-6 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm ${
                !article.data.trim() || loading
                  ? 'bg-[#0B1020] border border-[#202A44] text-[#64748B] cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-[#06B6D4] via-[#3B82F6] to-[#8B5CF6] hover:brightness-110 active:scale-[0.99] text-white shadow-lg shadow-[#06B6D4]/20'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>{currentConfig.loading}</span>
                </>
              ) : (
                <span>{currentConfig.cta}</span>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Result Workspace */}
        <div className="w-full min-w-0 space-y-4">
          <div className="ai-card-glass rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[400px] box-border">
            <div>
              {/* Header: Title + Actions (Copy, Download, Clear) */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#202A44]/70">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-[#F8FAFC]">
                    {currentConfig.resultHeading}
                  </h2>
                  {article.summary && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#3B82F6]">
                      {action}
                    </span>
                  )}
                </div>

                {article.summary && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(article.summary)}
                      className="p-1.5 px-2.5 rounded-lg bg-[#0B1020] hover:bg-[#0F172A] border border-[#202A44] hover:border-[#8B5CF6]/50 text-[#F8FAFC] text-[11px] font-semibold transition-all flex items-center gap-1"
                      title="Copy result"
                    >
                      {copied === article.summary ? (
                        <>
                          <TiTick className="text-emerald-400" size={13} />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <FiCopy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownload}
                      className="p-1.5 px-2.5 rounded-lg bg-[#0B1020] hover:bg-[#0F172A] border border-[#202A44] hover:border-[#06B6D4]/50 text-[#F8FAFC] text-[11px] font-semibold transition-all flex items-center gap-1"
                      title="Download as text file"
                    >
                      <RiDownload2Line size={12} className="text-[#06B6D4]" />
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-1.5 rounded-lg bg-[#0B1020] hover:bg-[#0F172A] border border-[#202A44] text-[#94A3B8] hover:text-[#F8FAFC] transition-all"
                      title="Clear result"
                    >
                      <RiRefreshLine size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Body: Processing vs Content vs Empty State */}
              {loading ? (
                /* Processing State */
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-center animate-fadeIn">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-[#06B6D4]/20 border-t-[#06B6D4] border-r-[#8B5CF6] animate-spin" />
                    <div className="w-6 h-6 rounded-full bg-[#06B6D4]/15 flex items-center justify-center text-[#22D3EE] ai-orb-animated">
                      <RiSparklingFill size={13} />
                    </div>
                  </div>
                  <p className="text-xs font-bold text-[#F8FAFC] animate-pulse">
                    Working on your text...
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">
                    Synthesizing response cleanly
                  </p>
                </div>
              ) : article.summary ? (
                /* Generated Result State */
                <div className="p-4 sm:p-5 bg-[#050812]/90 border border-[#202A44] rounded-xl text-sm leading-relaxed text-[#F8FAFC] whitespace-pre-wrap break-words overflow-wrap-anywhere max-h-[440px] overflow-y-auto font-sans ai-reveal-image">
                  {article.summary}
                </div>
              ) : (
                /* Dynamic Action-Aware Empty State */
                <div className="flex flex-col items-center justify-center py-24 text-center select-none space-y-2">
                  <div className="relative w-12 h-12 mx-auto mb-1 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#06B6D4]/10 to-[#8B5CF6]/10 blur-md absolute pointer-events-none" />
                    <svg className="w-12 h-12 absolute inset-0 ai-spin-slow pointer-events-none" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(6, 182, 212, 0.20)" strokeWidth="1" strokeDasharray="3 4" />
                      <circle cx="46" cy="24" r="1.75" fill="#8B5CF6" />
                    </svg>
                    <div className="w-9 h-9 rounded-xl bg-[#0B1020] border border-[#202A44] flex items-center justify-center text-[#06B6D4] shadow-md z-10">
                      <RiSparklingFill size={16} />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-[#F8FAFC]">
                    {currentConfig.emptyTitle}
                  </h3>
                  <p className="text-xs text-[#94A3B8] max-w-xs">
                    {currentConfig.emptySubtitle}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Session History (Below main workspace) */}
      {allArticles.length > 0 && (
        <div className="ai-card-glass rounded-2xl p-4 sm:p-5 space-y-3 w-full min-w-0 box-border">
          <div className="flex items-center justify-between text-xs font-bold text-[#F8FAFC]">
            <div className="flex items-center gap-1.5">
              <RiHistoryLine className="text-[#3B82F6]" size={14} />
              <span>Text AI History ({allArticles.length})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {allArticles.map((item, index) => (
              <div
                key={`history-${index}`}
                onClick={() => {
                  setArticle(item);
                  if (item.action) setAction(item.action);
                }}
                className="p-3 bg-[#050812]/70 border border-[#202A44] hover:border-[#3B82F6]/50 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all group min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
                      {item.action || 'Summarize'}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] group-hover:text-[#F8FAFC] truncate font-medium">
                    {item.data}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(item.summary || item.data);
                    }}
                    className="p-1.5 rounded-lg bg-[#0B1020] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                    title="Copy"
                  >
                    {copied === (item.summary || item.data) ? (
                      <TiTick className="text-emerald-400" size={13} />
                    ) : (
                      <FiCopy size={13} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-red-400 transition-colors"
                    title="Delete from history"
                  >
                    <AiOutlineDelete size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Summarize;