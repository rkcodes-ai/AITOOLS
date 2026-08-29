import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TextareaAutosize from 'react-textarea-autosize';
import toast from 'react-hot-toast';
import { languages } from '../utils';
import { FiCopy } from 'react-icons/fi';
import { TiTick } from 'react-icons/ti';
import { AiOutlineDelete } from 'react-icons/ai';
import { translateApi } from '../services/api/ai';
import {
  RiGlobalLine,
  RiSparklingFill,
  RiDownload2Line,
  RiRefreshLine,
  RiHistoryLine,
  RiArrowLeftRightLine,
} from 'react-icons/ri';

const Translate = () => {
  const location = useLocation();

  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [copied, setCopied] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Pre-fill input from navigation state if passed
  useEffect(() => {
    if (location.state?.input) {
      setSourceText(location.state.input);
      if (location.state.targetLang && languages.some((l) => l.code === location.state.targetLang)) {
        setTargetLang(location.state.targetLang);
      }
      if (location.state.sourceLang && (location.state.sourceLang === 'auto' || languages.some((l) => l.code === location.state.sourceLang))) {
        setSourceLang(location.state.sourceLang);
      }
      toast.success('Loaded text into Translate workspace!');
    }
  }, [location.state]);

  // Load session history from localStorage
  useEffect(() => {
    try {
      const storedHistory = JSON.parse(localStorage.getItem('translate_history') || '[]');
      if (Array.isArray(storedHistory)) {
        setHistory(storedHistory);
      }
    } catch (e) {
      console.warn('Failed to parse translate history from localStorage', e);
    }
  }, []);

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') {
      // If auto-detect, switch source to current target and default new target to 'en'
      const newSource = targetLang;
      const newTarget = targetLang === 'en' ? 'es' : 'en';
      setSourceLang(newSource);
      setTargetLang(newTarget);
    } else {
      const tempSource = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(tempSource);
    }

    // If we have translated text, swap source and translated text
    if (translatedText) {
      const tempText = sourceText;
      setSourceText(translatedText);
      setTranslatedText(tempText);
    }
    toast.success('Swapped languages');
  };

  const handleClear = () => {
    setSourceText('');
    setTranslatedText('');
  };

  const handleDeleteHistory = (item) => {
    const newHistory = history.filter(
      (h) => !(h.sourceText === item.sourceText && h.targetLang === item.targetLang && h.sourceLang === item.sourceLang)
    );
    setHistory(newHistory);
    localStorage.setItem('translate_history', JSON.stringify(newHistory));
    toast.success('Removed from history');
  };

  const handleTranslate = async (e) => {
    if (e) e.preventDefault();

    const trimmed = sourceText.trim();
    if (!trimmed) {
      toast.error('Please enter text to translate.');
      return;
    }

    if (!targetLang) {
      toast.error('Please select a target language.');
      return;
    }

    // Check existing translation in history
    const existing = history.find(
      (h) => h.sourceText.trim() === trimmed && h.targetLang === targetLang && (h.sourceLang || 'auto') === sourceLang
    );
    if (existing && existing.translatedText) {
      setTranslatedText(existing.translatedText);
      return;
    }

    setLoading(true);

    try {
      const res = await translateApi({
        text: trimmed,
        targetLanguage: targetLang,
        sourceLang: sourceLang === 'auto' ? 'en' : sourceLang,
      });

      if (res.success && res.data?.translatedText) {
        const result = res.data.translatedText;
        setTranslatedText(result);

        const newEntry = {
          sourceText: trimmed,
          translatedText: result,
          sourceLang,
          targetLang,
          timestamp: Date.now(),
        };

        const updatedHistory = [newEntry, ...history.slice(0, 19)];
        setHistory(updatedHistory);
        localStorage.setItem('translate_history', JSON.stringify(updatedHistory));
        toast.success('Translation complete!');
      } else {
        throw new Error(res.error?.message || res.error || 'Failed to translate text.');
      }
    } catch (err) {
      console.error('[Translate] Error:', err);
      toast.error(err.message || 'Translation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    if (!text) return;
    setCopied(text);
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(''), 3000);
  };

  const handleDownload = () => {
    if (!translatedText) return;
    const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aitools_translation_${targetLang}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded translation file!');
  };

  const getLanguageName = (code) => {
    if (code === 'auto') return 'Auto Detect';
    const found = languages.find((l) => l.code === code);
    return found ? `${found.language} (${found.code.toUpperCase()})` : code.toUpperCase();
  };

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6 box-border font-sans">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#202A44]/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight leading-tight flex items-center gap-2">
            <RiGlobalLine className="text-[#06B6D4]" size={26} />
            <span>
              Translate with <span className="bg-gradient-to-r from-[#06B6D4] via-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent">AI</span>.
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
            Convert text between languages while preserving meaning and nuance.
          </p>
        </div>
      </div>

      {/* 2. Top Language Control Bar */}
      <div className="ai-card-glass rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Source Language Selector */}
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider mb-1">
              Source Language
            </label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              aria-label="Source Language"
              className="w-full py-2.5 px-3 bg-[#0B1020] border border-[#202A44] hover:border-[#06B6D4]/50 rounded-xl text-xs text-[#F8FAFC] focus:outline-none ai-prompt-input cursor-pointer truncate"
            >
              <option value="auto" className="bg-[#0B1020] text-[#F8FAFC]">
                🌐 Auto Detect
              </option>
              {languages.map((l) => (
                <option key={`src-${l.code}`} value={l.code} className="bg-[#0B1020] text-[#F8FAFC]">
                  {l.language} ({l.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Language Swap Button */}
          <div className="flex items-center justify-center pt-2 sm:pt-4 shrink-0">
            <button
              type="button"
              onClick={handleSwapLanguages}
              title="Swap source and target languages"
              aria-label="Swap languages"
              className="p-2.5 rounded-xl bg-[#0B1020] hover:bg-[#0F172A] border border-[#202A44] hover:border-[#06B6D4]/60 text-[#06B6D4] hover:text-[#22D3EE] transition-all hover:scale-105 active:scale-95 shadow-md flex items-center justify-center"
            >
              <RiArrowLeftRightLine size={18} />
            </button>
          </div>

          {/* Target Language Selector */}
          <div className="flex-1 min-w-0">
            <label className="block text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider mb-1">
              Target Language
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              aria-label="Target Language"
              className="w-full py-2.5 px-3 bg-[#0B1020] border border-[#202A44] hover:border-[#8B5CF6]/50 rounded-xl text-xs text-[#F8FAFC] focus:outline-none ai-prompt-input cursor-pointer truncate font-semibold"
            >
              {languages.map((l) => (
                <option key={`tgt-${l.code}`} value={l.code} className="bg-[#0B1020] text-[#F8FAFC]">
                  {l.language} ({l.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Two-Column Translation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start w-full min-w-0">
        
        {/* LEFT COLUMN: Source Text Editor */}
        <div className="w-full min-w-0 space-y-4">
          <div className="ai-card-glass rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden space-y-4 box-border flex flex-col justify-between min-h-[420px]">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#202A44]/70">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#F8FAFC]">
                    Source Text
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
                    {getLanguageName(sourceLang)}
                  </span>
                </div>
                {sourceText && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-[11px] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="relative w-full min-w-0">
                <TextareaAutosize
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Enter text to translate..."
                  minRows={8}
                  maxRows={14}
                  className="w-full box-border p-3.5 sm:p-4 bg-[#0B1020]/90 border border-[#202A44] rounded-xl text-[#F8FAFC] text-xs sm:text-sm placeholder-[#64748B] focus:outline-none ai-prompt-input resize-none leading-relaxed"
                />
                <div className="flex justify-end text-[10px] font-mono text-[#64748B] mt-1">
                  {sourceText.length} characters
                </div>
              </div>
            </div>

            {/* Translate CTA Button */}
            <button
              type="button"
              onClick={handleTranslate}
              disabled={loading || !sourceText.trim()}
              className={`w-full py-3.5 px-6 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm ${
                !sourceText.trim() || loading
                  ? 'bg-[#0B1020] border border-[#202A44] text-[#64748B] cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-[#06B6D4] via-[#3B82F6] to-[#8B5CF6] hover:brightness-110 active:scale-[0.99] text-white shadow-lg shadow-[#06B6D4]/20'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Translating...</span>
                </>
              ) : (
                <span>Translate →</span>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Target Translation Result Editor */}
        <div className="w-full min-w-0 space-y-4">
          <div className="ai-card-glass rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[420px] box-border">
            <div>
              {/* Header: Target Title + Actions */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#202A44]/70">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-[#F8FAFC]">
                    Translation
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                    {getLanguageName(targetLang)}
                  </span>
                </div>

                {translatedText && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(translatedText)}
                      className="p-1.5 px-2.5 rounded-lg bg-[#0B1020] hover:bg-[#0F172A] border border-[#202A44] hover:border-[#8B5CF6]/50 text-[#F8FAFC] text-[11px] font-semibold transition-all flex items-center gap-1"
                      title="Copy translation"
                    >
                      {copied === translatedText ? (
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
                      onClick={() => setTranslatedText('')}
                      className="p-1.5 rounded-lg bg-[#0B1020] hover:bg-[#0F172A] border border-[#202A44] text-[#94A3B8] hover:text-[#F8FAFC] transition-all"
                      title="Clear translation"
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
                    Translating across languages...
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">
                    Preserving context and nuances
                  </p>
                </div>
              ) : translatedText ? (
                /* Generated Translation State */
                <div className="p-4 sm:p-5 bg-[#050812]/90 border border-[#202A44] rounded-xl text-sm leading-relaxed text-[#F8FAFC] whitespace-pre-wrap break-words overflow-wrap-anywhere max-h-[440px] overflow-y-auto font-sans ai-reveal-image">
                  {translatedText}
                </div>
              ) : (
                /* Subtle Empty State */
                <div className="flex flex-col items-center justify-center py-24 text-center select-none space-y-2">
                  <div className="relative w-12 h-12 mx-auto mb-1 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#06B6D4]/10 to-[#8B5CF6]/10 blur-md absolute pointer-events-none" />
                    <svg className="w-12 h-12 absolute inset-0 ai-spin-slow pointer-events-none" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(6, 182, 212, 0.20)" strokeWidth="1" strokeDasharray="3 4" />
                      <circle cx="46" cy="24" r="1.75" fill="#8B5CF6" />
                    </svg>
                    <div className="w-9 h-9 rounded-xl bg-[#0B1020] border border-[#202A44] flex items-center justify-center text-[#06B6D4] shadow-md z-10">
                      <RiGlobalLine size={16} />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-[#F8FAFC]">
                    Your translation will appear here.
                  </h3>
                  <p className="text-xs text-[#94A3B8] max-w-xs">
                    Enter text and select a target language to begin.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Translation Session History */}
      {history.length > 0 && (
        <div className="ai-card-glass rounded-2xl p-4 sm:p-5 space-y-3 w-full min-w-0 box-border">
          <div className="flex items-center justify-between text-xs font-bold text-[#F8FAFC]">
            <div className="flex items-center gap-1.5">
              <RiHistoryLine className="text-[#06B6D4]" size={14} />
              <span>Translation History ({history.length})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {history.map((item, index) => (
              <div
                key={`trans-history-${index}`}
                onClick={() => {
                  setSourceText(item.sourceText);
                  setTranslatedText(item.translatedText);
                  if (item.sourceLang) setSourceLang(item.sourceLang);
                  if (item.targetLang) setTargetLang(item.targetLang);
                }}
                className="p-3 bg-[#050812]/70 border border-[#202A44] hover:border-[#06B6D4]/50 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all group min-w-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
                      {(item.sourceLang || 'AUTO').toUpperCase()} → {(item.targetLang || 'ES').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] group-hover:text-[#F8FAFC] truncate font-medium">
                    {item.sourceText}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(item.translatedText || item.sourceText);
                    }}
                    className="p-1.5 rounded-lg bg-[#0B1020] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                    title="Copy translation"
                  >
                    {copied === (item.translatedText || item.sourceText) ? (
                      <TiTick className="text-emerald-400" size={13} />
                    ) : (
                      <FiCopy size={13} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHistory(item);
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

export default Translate;
