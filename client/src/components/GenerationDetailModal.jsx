import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  RiCloseLine,
  RiFileCopyLine,
  RiArrowRightUpLine,
  RiDeleteBinLine,
  RiImageLine,
  RiFileTextLine,
  RiTranslate2,
} from 'react-icons/ri';

export const GenerationDetailModal = ({ generation, onClose, onDelete }) => {
  const navigate = useNavigate();

  if (!generation) return null;

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text));
    toast.success(`${label} copied to clipboard!`);
  };

  const handleReuse = () => {
    onClose();
    if (generation.type === 'image') {
      navigate('/create-post', {
        state: { prompt: generation.prompt, model: generation.model },
      });
    } else if (generation.type === 'summarize_url' || generation.type === 'summarize_text') {
      navigate('/summarize', {
        state: {
          input: generation.input || generation.prompt,
          mode: generation.type === 'summarize_url' ? 'url' : 'text',
        },
      });
    } else if (generation.type === 'translate') {
      navigate('/summarize', {
        state: {
          input: generation.input || generation.prompt,
          targetLang: generation.result?.targetLang,
          activeTab: 'translate',
        },
      });
    }
  };

  const getIcon = () => {
    switch (generation.type) {
      case 'image':
        return <RiImageLine className="text-purple-400" size={24} />;
      case 'summarize_url':
      case 'summarize_text':
        return <RiFileTextLine className="text-blue-400" size={24} />;
      case 'translate':
        return <RiTranslate2 className="text-emerald-400" size={24} />;
      default:
        return <RiFileTextLine size={24} />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 overflow-hidden text-gray-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-800 rounded-xl">{getIcon()}</div>
            <div>
              <h3 className="text-lg font-bold text-white capitalize">
                {generation.type?.replace('_', ' ')} Generation
              </h3>
              <p className="text-xs text-gray-400">
                {new Date(generation.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
              <span className="text-gray-400 block mb-0.5">Provider</span>
              <span className="font-semibold text-white capitalize">{generation.provider}</span>
            </div>
            <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
              <span className="text-gray-400 block mb-0.5">Model / Target</span>
              <span className="font-semibold text-white truncate block">
                {generation.model || generation.result?.targetLang || 'Default'}
              </span>
            </div>
            <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/50">
              <span className="text-gray-400 block mb-0.5">Status</span>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                  generation.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {generation.status}
              </span>
            </div>
          </div>

          {/* Prompt / Input Section */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span className="font-medium uppercase tracking-wider">Prompt / Source Input</span>
              <button
                onClick={() => copyToClipboard(generation.prompt || generation.input, 'Input')}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <RiFileCopyLine size={13} /> Copy
              </button>
            </div>
            <div className="p-3.5 bg-gray-950/80 rounded-xl border border-gray-800 text-sm font-mono text-gray-300 break-words whitespace-pre-wrap max-h-40 overflow-y-auto">
              {generation.prompt || generation.input || 'No prompt specified.'}
            </div>
          </div>

          {/* Result Output Section */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span className="font-medium uppercase tracking-wider">Generated Output</span>
              {generation.result && (
                <button
                  onClick={() =>
                    copyToClipboard(
                      generation.result?.imageUrl ||
                        generation.result?.summary ||
                        generation.result?.translatedText,
                      'Result'
                    )
                  }
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <RiFileCopyLine size={13} /> Copy
                </button>
              )}
            </div>

            {generation.type === 'image' && generation.result?.imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-gray-950 flex justify-center items-center">
                <img
                  src={generation.result.imageUrl}
                  alt={generation.prompt || 'AI generated output'}
                  className="w-full max-h-72 object-contain rounded-lg"
                />
              </div>
            ) : generation.result?.summary ? (
              <div className="p-3.5 bg-gray-950/80 rounded-xl border border-gray-800 text-sm text-gray-200 leading-relaxed max-h-48 overflow-y-auto">
                {generation.result.summary}
              </div>
            ) : generation.result?.translatedText ? (
              <div className="p-3.5 bg-gray-950/80 rounded-xl border border-gray-800 text-sm text-gray-200 leading-relaxed max-h-48 overflow-y-auto">
                {generation.result.translatedText}
              </div>
            ) : (
              <div className="p-4 bg-gray-950/50 rounded-xl border border-gray-800 text-xs text-gray-500 italic text-center">
                {generation.status === 'failed'
                  ? `Generation failed with code: ${generation.errorCode || 'UNKNOWN_ERROR'}`
                  : 'No output available.'}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <button
            onClick={() => onDelete(generation._id)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-xl transition-all"
          >
            <RiDeleteBinLine size={15} />
            Delete Record
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleReuse}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
            >
              <RiArrowRightUpLine size={15} />
              Reuse in Tool
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
