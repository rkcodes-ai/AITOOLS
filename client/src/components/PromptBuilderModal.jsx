import React, { useState } from 'react';
import { RiCloseLine, RiSparklingLine, RiCheckLine } from 'react-icons/ri';

const STYLES = [
  'Photorealistic 8k',
  'Cinematic Concept Art',
  'Digital Oil Painting',
  'Anime & Manga Aesthetic',
  'Unreal Engine 5 Render',
  'Vintage 35mm Film Photography',
  'Cyberpunk Neon Noir',
  'Watercolor Illustration',
];

const LIGHTING = [
  'Dramatic Volumetric Golden Hour',
  'Neon Cyberpunk Glow',
  'Studio Softbox Key Lighting',
  'Moody Cinematic Rim Light',
  'Bioluminescent Ambient Glow',
  'Natural Sunlit Rays',
];

const ENVIRONMENTS = [
  'Rainy neon reflections in futuristic Tokyo',
  'Ancient overgrown mossy ruins in deep jungle',
  'Deep cosmic nebula with starry constellations',
  'Minimalist modern architectural interior',
  'Post-apocalyptic wasteland at sunset',
  'Ethereal misty mountain peak above clouds',
];

export const PromptBuilderModal = ({ isOpen, onClose, onApply, currentPrompt = '' }) => {
  const [subject, setSubject] = useState(currentPrompt || '');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedLighting, setSelectedLighting] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [extraDetails, setExtraDetails] = useState('');

  if (!isOpen) return null;

  const buildComposedPrompt = () => {
    const parts = [];
    if (subject.trim()) parts.push(subject.trim());
    if (selectedEnvironment) parts.push(selectedEnvironment);
    if (selectedStyle) parts.push(selectedStyle);
    if (selectedLighting) parts.push(selectedLighting);
    if (extraDetails.trim()) parts.push(extraDetails.trim());
    return parts.join(', ');
  };

  const composed = buildComposedPrompt();

  const handleApply = () => {
    onApply(composed);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 overflow-hidden text-gray-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl">
              <RiSparklingLine size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Prompt Composer Studio</h3>
              <p className="text-xs text-gray-400">
                Craft structured, high-coherence prompts with curated artistic styles and lighting.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Main Subject */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              1. Main Subject / Core Idea
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. A robotic guardian meditating in a lotus position"
              className="w-full px-3.5 py-2.5 bg-gray-950/80 border border-gray-700 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Artistic Style Chips */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              2. Artistic Style
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setSelectedStyle(selectedStyle === style ? '' : style)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedStyle === style
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Lighting Chips */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              3. Lighting & Atmosphere
            </label>
            <div className="flex flex-wrap gap-1.5">
              {LIGHTING.map((light) => (
                <button
                  key={light}
                  type="button"
                  onClick={() => setSelectedLighting(selectedLighting === light ? '' : light)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedLighting === light
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {light}
                </button>
              ))}
            </div>
          </div>

          {/* Environment Chips */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              4. Environment & Scene
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ENVIRONMENTS.map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => setSelectedEnvironment(selectedEnvironment === env ? '' : env)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedEnvironment === env
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          {/* Additional details */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              5. Extra Details / Camera Nuances (Optional)
            </label>
            <input
              type="text"
              value={extraDetails}
              onChange={(e) => setExtraDetails(e.target.value)}
              placeholder="e.g. highly detailed, intricate filigree, octane render, 85mm lens"
              className="w-full px-3.5 py-2 bg-gray-950/80 border border-gray-700 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Live Assembled Preview */}
          <div>
            <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">
              Live Assembled Prompt
            </label>
            <div className="p-3 bg-gray-950 border border-indigo-500/30 rounded-xl text-xs font-mono text-gray-200 leading-relaxed break-words min-h-[4rem]">
              {composed || 'Select options above or type a subject to preview your composed prompt.'}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!composed.trim()}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            <RiCheckLine size={16} />
            Apply to Studio
          </button>
        </div>
      </div>
    </div>
  );
};
