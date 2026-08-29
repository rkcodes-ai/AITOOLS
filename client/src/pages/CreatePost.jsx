import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getRandomPrompt } from '../utils';
import { BiSolidError } from 'react-icons/bi';
import { generateImageApi, getAIConfigApi } from '../services/api/ai';
import { createPostApi } from '../services/api/posts';
import { getPresetsApi, createPresetApi, deletePresetApi } from '../services/api/presets';
import { useAuth } from '../context/AuthContext.jsx';
import { PromptBuilderModal } from '../components/PromptBuilderModal.jsx';
import {
  RiSparklingFill,
  RiSettings4Line,
  RiDownload2Line,
  RiShareForwardLine,
  RiShuffleLine,
  RiMagicLine,
  RiBookmarkLine,
  RiDeleteBinLine,
  RiRefreshLine,
  RiHeartLine,
  RiHeartFill,
} from 'react-icons/ri';

const DEFAULT_MODELS = [
  { id: 'stabilityai/stable-diffusion-2-1', name: 'Stable Diffusion 2.1' },
  { id: 'black-forest-labs/FLUX.1-schnell', name: 'FLUX.1 Schnell' },
  { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL Base 1.0' },
  { id: 'runwayml/stable-diffusion-v1-5', name: 'Stable Diffusion 1.5' },
];

const ASPECT_RATIO_OPTIONS = [
  { id: '1:1', label: '1:1', icon: '■' },
  { id: '16:9', label: '16:9', icon: '▬' },
  { id: '9:16', label: '9:16', icon: '❚' },
  { id: '4:3', label: '4:3', icon: '▰' },
  { id: '3:4', label: '3:4', icon: '▱' },
];

const QUALITY_PRESETS = [
  { id: 'fast', label: 'Fast' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'quality', label: 'High Quality' },
];

const CreatePost = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Model & Capabilities state
  const [availableModels, setAvailableModels] = useState(DEFAULT_MODELS);
  const [selectedModelMeta, setSelectedModelMeta] = useState(DEFAULT_MODELS[0]);

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [model, setModel] = useState('stabilityai/stable-diffusion-2-1');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [quality, setQuality] = useState('balanced');
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [steps, setSteps] = useState(30);
  const [seed, setSeed] = useState('');
  const [isRandomSeed, setIsRandomSeed] = useState(true);

  // Generated Image State
  const [generatedPhoto, setGeneratedPhoto] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPromptBuilder, setShowPromptBuilder] = useState(false);
  const [showShareForm, setShowShareForm] = useState(false);

  // Presets State
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [presetNameInput, setPresetNameInput] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  // Error Handler
  const [errorHandler, setErrorHandler] = useState({
    isError: false,
    message: '',
    status: '',
  });

  // 1. Fetch AI Model Configuration & Capabilities from server
  useEffect(() => {
    const fetchAIConfig = async () => {
      try {
        const response = await getAIConfigApi();
        if (response.success && Array.isArray(response.data?.imageModels) && response.data.imageModels.length > 0) {
          setAvailableModels(response.data.imageModels);
          const currentMeta =
            response.data.imageModels.find((m) => m.id === 'stabilityai/stable-diffusion-2-1') ||
            response.data.imageModels[0];
          setSelectedModelMeta(currentMeta);
        }
      } catch (err) {
        console.warn('[ImageStudio] Could not fetch models config:', err.message);
      }
    };
    fetchAIConfig();
  }, []);

  // 2. Fetch User Saved Presets if authenticated
  const fetchPresets = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await getPresetsApi();
      if (response.success && response.data) {
        setPresets(response.data);
      }
    } catch (err) {
      console.warn('[ImageStudio] Could not fetch user presets:', err.message);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  // 3. Respond to prompt reuse navigation state
  useEffect(() => {
    if (location.state?.prompt) {
      setPrompt(location.state.prompt);
      if (location.state.model) setModel(location.state.model);
      toast.success('Prompt loaded from generation history!');
    }
  }, [location.state]);

  // 4. Update model meta and reset invalid options when model changes
  const handleModelChange = (newModelId) => {
    setModel(newModelId);
    const meta = availableModels.find((m) => m.id === newModelId);
    if (meta) {
      setSelectedModelMeta(meta);
      if (meta.capabilities?.steps?.default) setSteps(meta.capabilities.steps.default);
      if (meta.capabilities?.guidanceScale?.default) setGuidanceScale(meta.capabilities.guidanceScale.default);
    }
  };

  const handleSurpriseMe = () => {
    const random = getRandomPrompt(prompt);
    setPrompt(random);
  };

  // Generate Image Request
  const handleGenerateImage = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) {
      toast.error('Please describe your image before generating.');
      return;
    }

    setIsGenerating(true);
    setIsFavorited(false);
    setErrorHandler({ isError: false, message: '', status: '' });

    try {
      const payload = {
        prompt: prompt.trim(),
        model,
        negativePrompt: selectedModelMeta?.capabilities?.negativePrompt ? negativePrompt.trim() : null,
        aspectRatio,
        quality,
        steps: steps ? parseInt(steps, 10) : undefined,
        guidanceScale: selectedModelMeta?.capabilities?.guidanceScale?.supported
          ? parseFloat(guidanceScale)
          : undefined,
        seed: !isRandomSeed && seed ? parseInt(seed, 10) : undefined,
      };

      const response = await generateImageApi(payload);

      if (response.success && response.data?.imageUrl) {
        setGeneratedPhoto(response.data.imageUrl);

        if (response.data.usedFallback) {
          toast.success(`Generated using fallback model: ${response.data.model}`);
        } else {
          toast.success('Image generated successfully!');
        }
      } else {
        throw new Error(response.message || 'Image generation failed');
      }
    } catch (error) {
      console.error('[ImageStudio] Generation error:', error);
      setErrorHandler({
        isError: true,
        message: error.message || 'Error occurred while generating image from AI provider.',
        status: error.status || '500',
      });
      toast.error(error.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Direct Image Download
  const handleDownload = () => {
    if (!generatedPhoto) return;
    const link = document.createElement('a');
    link.href = generatedPhoto;
    const cleanPrompt = prompt.slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_') || 'aitools_image';
    link.download = `${cleanPrompt}_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started!');
  };

  // Toggle Favorite
  const handleToggleFavorite = () => {
    setIsFavorited((prev) => {
      const next = !prev;
      toast.success(next ? 'Added to favorites!' : 'Removed from favorites.');
      return next;
    });
  };

  // Community Share
  const handleShare = async (e) => {
    e.preventDefault();
    if (!prompt || !generatedPhoto || !name) {
      toast.error('Please enter your name and generate an image first.');
      return;
    }

    setIsSharing(true);
    try {
      const blobResponse = await fetch(generatedPhoto);
      const blob = await blobResponse.blob();
      const photoFile = new File([blob], `${name.trim().replace(/\s+/g, '_')}_generated.jpg`, {
        type: 'image/jpeg',
      });

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('prompt', prompt.trim());
      formData.append('model', model);
      formData.append('photoFile', photoFile);

      const response = await createPostApi(formData);
      if (response.success) {
        toast.success('Shared with the community gallery!');
        navigate('/');
      } else {
        throw new Error(response.message || 'Failed to share post.');
      }
    } catch (error) {
      console.error('[ImageStudio] Share error:', error);
      toast.error(error.message || 'Error sharing image to community.');
    } finally {
      setIsSharing(false);
    }
  };

  // Presets Handlers
  const handleSavePreset = async () => {
    if (!presetNameInput.trim()) {
      toast.error('Please provide a name for this preset.');
      return;
    }
    setIsSavingPreset(true);
    try {
      const res = await createPresetApi({
        name: presetNameInput.trim(),
        configuration: {
          model,
          aspectRatio,
          negativePrompt,
          guidanceScale,
          steps,
          quality,
        },
      });
      if (res.success) {
        toast.success(`Preset '${presetNameInput}' saved!`);
        setPresetNameInput('');
        fetchPresets();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save preset.');
    } finally {
      setIsSavingPreset(false);
    }
  };

  const handleApplyPreset = (preset) => {
    if (!preset) return;
    setSelectedPresetId(preset._id);
    const config = preset.configuration || {};
    if (config.model) handleModelChange(config.model);
    if (config.aspectRatio) setAspectRatio(config.aspectRatio);
    if (config.negativePrompt) setNegativePrompt(config.negativePrompt);
    if (config.guidanceScale) setGuidanceScale(config.guidanceScale);
    if (config.steps) setSteps(config.steps);
    if (config.quality) setQuality(config.quality);
    toast.success(`Preset '${preset.name}' applied!`);
  };

  const handleDeletePreset = async (presetId) => {
    try {
      const res = await deletePresetApi(presetId);
      if (res.success) {
        toast.success('Preset deleted.');
        setSelectedPresetId('');
        fetchPresets();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete preset.');
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4 ai-enter-1">
      {/* 1. Header: Create with AI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#202A44]/60">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-[#F8FAFC] tracking-tight leading-tight">
            Create with <span className="bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#06B6D4] bg-clip-text text-transparent">AI</span>.
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
            Turn your ideas into images.
          </p>
        </div>

        {/* Saved Presets Dropdown */}
        {isAuthenticated && presets.length > 0 && (
          <div className="flex items-center gap-2 bg-[#0B1020] px-3 py-1.5 rounded-xl border border-[#202A44] shrink-0 self-start sm:self-auto">
            <RiBookmarkLine className="text-[#8B5CF6]" size={15} />
            <select
              value={selectedPresetId}
              onChange={(e) => {
                const p = presets.find((item) => item._id === e.target.value);
                if (p) handleApplyPreset(p);
              }}
              className="bg-transparent text-xs text-[#94A3B8] hover:text-[#F8FAFC] focus:outline-none pr-2 cursor-pointer"
            >
              <option value="" disabled className="bg-[#0B1020] text-[#64748B]">
                Saved Presets ({presets.length})
              </option>
              {presets.map((p) => (
                <option key={p._id} value={p._id} className="bg-[#0B1020] text-[#F8FAFC]">
                  {p.name}
                </option>
              ))}
            </select>
            {selectedPresetId && (
              <button
                type="button"
                onClick={() => handleDeletePreset(selectedPresetId)}
                className="p-1 text-[#64748B] hover:text-red-400 rounded transition-colors"
                title="Delete this preset"
              >
                <RiDeleteBinLine size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Main Two-Column Workflow Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4 lg:gap-6 items-start">
        
        {/* LEFT COLUMN: Controls & Settings */}
        <div className="space-y-3.5">
          
          {/* Card 1: Describe your image (Primary Creative Workspace) */}
          <div className="ai-card-glass rounded-2xl p-4 sm:p-4.5 shadow-xl relative overflow-hidden space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#F8FAFC]">
                Describe your image
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPromptBuilder(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#8B5CF6] hover:text-[#A78BFA] bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 px-2.5 py-1 rounded-xl border border-[#8B5CF6]/30 transition-all duration-200"
                >
                  <RiMagicLine size={13} />
                  <span>Prompt Builder</span>
                </button>
                <button
                  type="button"
                  onClick={handleSurpriseMe}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#06B6D4] hover:text-[#22D3EE] bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 px-2.5 py-1 rounded-xl border border-[#06B6D4]/30 transition-all duration-200"
                >
                  <RiShuffleLine size={13} />
                  <span>Surprise Me</span>
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to create..."
              maxLength={1000}
              className="w-full p-3 bg-[#0B1020]/90 border border-[#202A44] rounded-xl text-white text-xs sm:text-sm placeholder-[#64748B] focus:outline-none ai-prompt-input resize-none leading-relaxed"
            />
            <div className="flex justify-end text-[10px] text-[#64748B]">
              {prompt.length} / 1000
            </div>
          </div>

          {/* Card 2: Model Selection */}
          <div className="ai-card-glass rounded-2xl p-4 sm:p-4.5 shadow-xl space-y-2">
            <label className="block text-xs font-bold text-[#F8FAFC]">
              Model
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
              {availableModels.slice(0, 4).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModelChange(m.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all duration-200 ${
                    model === m.id
                      ? 'bg-[#8B5CF6]/15 border-[#8B5CF6] text-white shadow-sm shadow-[#8B5CF6]/15 font-bold'
                      : 'bg-[#0B1020]/60 border-[#202A44] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#202A44]/90'
                  }`}
                >
                  <div className="font-bold text-xs text-[#F8FAFC] truncate">
                    {m.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Card 3: Aspect Ratio & Quality */}
          <div className="ai-card-glass rounded-2xl p-4 sm:p-4.5 shadow-xl space-y-3">
            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-bold text-[#F8FAFC] mb-1.5">
                Aspect ratio
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {ASPECT_RATIO_OPTIONS.map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setAspectRatio(ar.id)}
                    className={`py-1.5 px-1 text-center rounded-xl border text-xs font-semibold transition-all duration-200 ${
                      aspectRatio === ar.id
                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#F8FAFC] shadow-sm shadow-[#8B5CF6]/10'
                        : 'bg-[#0B1020]/60 border-[#202A44] text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    <div className="text-sm leading-none mb-0.5">{ar.icon}</div>
                    <div className="text-[10px]">{ar.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Preset */}
            <div>
              <label className="block text-xs font-bold text-[#F8FAFC] mb-1.5">
                Quality
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {QUALITY_PRESETS.map((qp) => (
                  <button
                    key={qp.id}
                    type="button"
                    onClick={() => setQuality(qp.id)}
                    className={`py-1.5 text-center rounded-xl border text-xs font-semibold transition-all duration-200 ${
                      quality === qp.id
                        ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#22D3EE] shadow-sm shadow-[#06B6D4]/10'
                        : 'bg-[#0B1020]/60 border-[#202A44] text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Parameters (Collapsed by default) */}
            <div className="pt-2 border-t border-[#202A44]/70">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] py-1 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <RiSettings4Line size={14} className="text-[#8B5CF6]" />
                  <span>Advanced parameters {showAdvanced ? '▴' : '▾'}</span>
                </span>
                <span className="text-[10px] font-mono text-[#64748B]">
                  {showAdvanced ? 'Hide' : 'Configure'}
                </span>
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3 pt-3 border-t border-[#202A44]/60 animate-fadeIn">
                  {/* Negative Prompt */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1">
                      <span>Negative prompt</span>
                      {!selectedModelMeta?.capabilities?.negativePrompt && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          Unsupported by FLUX
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      disabled={!selectedModelMeta?.capabilities?.negativePrompt}
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="e.g. blurry, distorted, low quality"
                      className="w-full px-3 py-1.5 bg-[#0B1020] border border-[#202A44] rounded-xl text-white text-xs disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none ai-prompt-input"
                    />
                  </div>

                  {/* Guidance Scale & Steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs text-[#94A3B8] mb-1">
                        <span>Guidance Scale</span>
                        <span className="font-mono text-[#8B5CF6] text-[11px]">{guidanceScale}</span>
                      </div>
                      <input
                        type="range"
                        min={1.0}
                        max={selectedModelMeta?.capabilities?.guidanceScale?.max || 20.0}
                        step={0.5}
                        disabled={!selectedModelMeta?.capabilities?.guidanceScale?.supported}
                        value={guidanceScale}
                        onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                        className="w-full accent-[#8B5CF6] disabled:opacity-40 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-[#94A3B8] mb-1">
                        <span>Inference Steps</span>
                        <span className="font-mono text-[#06B6D4] text-[11px]">{steps}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={selectedModelMeta?.capabilities?.steps?.max || 50}
                        value={steps}
                        onChange={(e) => setSteps(parseInt(e.target.value, 10))}
                        className="w-full accent-[#06B6D4] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Seed Control */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1">
                      <span>Seed</span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#94A3B8]">
                        <input
                          type="checkbox"
                          checked={isRandomSeed}
                          onChange={(e) => setIsRandomSeed(e.target.checked)}
                          className="accent-[#8B5CF6]"
                        />
                        Random Seed
                      </label>
                    </div>
                    {!isRandomSeed && (
                      <input
                        type="number"
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        placeholder="e.g. 4294967"
                        className="w-full px-3 py-1.5 bg-[#0B1020] border border-[#202A44] rounded-xl text-white text-xs focus:outline-none ai-prompt-input"
                      />
                    )}
                  </div>

                  {/* Save Preset */}
                  {isAuthenticated && (
                    <div className="pt-2 border-t border-[#202A44]/60 flex items-center gap-2">
                      <input
                        type="text"
                        value={presetNameInput}
                        onChange={(e) => setPresetNameInput(e.target.value)}
                        placeholder="Save as preset name..."
                        className="flex-1 px-3 py-1.5 bg-[#0B1020] border border-[#202A44] rounded-xl text-white text-xs placeholder-[#64748B] focus:outline-none ai-prompt-input"
                      />
                      <button
                        type="button"
                        disabled={isSavingPreset || !presetNameInput.trim()}
                        onClick={handleSavePreset}
                        className="px-3 py-1.5 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 text-[#8B5CF6] text-xs font-semibold rounded-xl transition-all disabled:opacity-40"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Primary CTA: Generate Image Button */}
          <button
            type="button"
            onClick={handleGenerateImage}
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-3 px-6 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm ${
              !prompt.trim() || isGenerating
                ? 'bg-[#0B1020] border border-[#202A44] text-[#64748B] cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#06B6D4] hover:brightness-110 active:scale-[0.99] text-white shadow-lg shadow-[#8B5CF6]/20'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <RiSparklingFill className={!prompt.trim() ? 'text-[#64748B]' : 'text-[#22D3EE]'} size={15} />
                <span>Generate image</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT COLUMN: Image Preview Canvas & Actions */}
        <div className="space-y-3.5">
          <div className="ai-card-glass rounded-2xl p-4 sm:p-4.5 shadow-xl relative overflow-hidden flex flex-col justify-between">
            
            {/* Viewport Canvas (Refined height for comfortable 1366x768 fit) */}
            <div className="relative w-full aspect-square max-h-[340px] sm:max-h-[360px] bg-[#050812] border border-[#202A44] rounded-xl overflow-hidden flex items-center justify-center mx-auto group">
              {isGenerating ? (
                /* PROCESSING STATE */
                <div className="flex flex-col items-center gap-3 p-6 text-center z-10 animate-fadeIn">
                  {/* Orbital Generation Spinner */}
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-[#8B5CF6]/20 border-t-[#8B5CF6] border-r-[#06B6D4] animate-spin" />
                    <div className="w-7 h-7 rounded-full bg-[#8B5CF6]/15 flex items-center justify-center text-[#22D3EE] ai-orb-animated">
                      <RiSparklingFill size={14} />
                    </div>
                  </div>
                  <p className="text-xs font-bold text-[#F8FAFC] animate-pulse mt-0.5">
                    Creating your image...
                  </p>
                  <p className="text-[11px] text-[#94A3B8] max-w-xs truncate">
                    {selectedModelMeta?.name || 'AI Diffusion Model'}
                  </p>
                </div>
              ) : errorHandler.isError ? (
                /* ERROR STATE */
                <div className="flex flex-col items-center gap-2.5 p-6 text-center z-10 animate-fadeIn">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-1">
                    <BiSolidError size={22} />
                  </div>
                  <h4 className="text-xs font-bold text-[#F8FAFC]">Couldn't create the image.</h4>
                  <p className="text-[11px] text-[#94A3B8] max-w-xs leading-relaxed">
                    {errorHandler.message || 'Error occurred while generating image.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    className="mt-1 px-3 py-1.5 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/40 text-[#8B5CF6] text-xs font-semibold rounded-xl transition-all"
                  >
                    Try again
                  </button>
                </div>
              ) : generatedPhoto ? (
                /* SUCCESS / GENERATED IMAGE STATE */
                <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                  <img
                    src={generatedPhoto}
                    alt={prompt}
                    className="w-full h-full object-contain rounded-lg ai-reveal-image"
                  />
                  {/* Floating Favorite Button in Top-Right */}
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                    className={`absolute top-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md border transition-all duration-200 shadow-md ${
                      isFavorited
                        ? 'bg-[#8B5CF6]/30 border-[#8B5CF6] text-pink-400'
                        : 'bg-[#0B1020]/75 border-[#202A44] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#8B5CF6]/40'
                    }`}
                  >
                    {isFavorited ? <RiHeartFill size={15} className="text-pink-400" /> : <RiHeartLine size={15} />}
                  </button>
                </div>
              ) : (
                /* AMBIENT EMPTY STATE */
                <div className="relative z-10 text-center p-6 space-y-2 select-none">
                  {/* Ambient Pulsing Orbital Visual */}
                  <div className="relative w-12 h-12 mx-auto mb-2.5 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#8B5CF6]/10 to-[#06B6D4]/10 blur-md absolute pointer-events-none" />
                    <svg className="w-12 h-12 absolute inset-0 ai-spin-slow pointer-events-none" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(139, 92, 246, 0.20)" strokeWidth="1" strokeDasharray="3 4" />
                      <circle cx="46" cy="24" r="1.75" fill="#06B6D4" />
                    </svg>
                    <div className="w-9 h-9 rounded-xl bg-[#0B1020] border border-[#202A44] flex items-center justify-center text-[#8B5CF6] shadow-md z-10">
                      <RiSparklingFill size={16} className="text-[#8B5CF6]" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-[#F8FAFC]">
                    Your image will appear here.
                  </h3>
                  <p className="text-xs text-[#94A3B8]">
                    Describe an idea and generate.
                  </p>
                </div>
              )}
            </div>

            {/* Generated Image Actions */}
            {generatedPhoto && !isGenerating && (
              <div className="mt-3.5 pt-3.5 border-t border-[#202A44]/70 space-y-2.5 animate-fadeIn">
                {/* Primary Actions: Download, Regenerate & Share */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#0B1020] hover:bg-[#0F172A] border border-[#202A44] hover:border-[#8B5CF6]/50 text-[#F8FAFC] text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <RiDownload2Line size={14} className="text-[#8B5CF6]" />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={isGenerating}
                    className="py-2 px-3.5 rounded-xl bg-[#0B1020] hover:bg-[#0F172A] border border-[#202A44] hover:border-[#06B6D4]/50 text-[#F8FAFC] text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    title="Regenerate image"
                  >
                    <RiRefreshLine size={14} className="text-[#06B6D4]" />
                    <span>Regenerate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowShareForm(!showShareForm)}
                    className={`py-2 px-3.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      showShareForm
                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#F8FAFC]'
                        : 'bg-[#0B1020] hover:bg-[#0F172A] border-[#202A44] hover:border-[#8B5CF6]/40 text-[#94A3B8]'
                    }`}
                    title="Share with community"
                  >
                    <RiShareForwardLine size={14} />
                    <span>Share</span>
                  </button>
                </div>

                {/* Secondary Community Share Form */}
                {showShareForm && (
                  <div className="p-3 bg-[#050812]/90 rounded-xl border border-[#202A44] space-y-2 animate-fadeIn">
                    <div className="text-xs font-bold text-[#F8FAFC]">
                      Share with Community Gallery
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your creator name..."
                      className="w-full px-3 py-1.5 bg-[#0B1020] border border-[#202A44] rounded-xl text-white text-xs placeholder-[#64748B] focus:outline-none ai-prompt-input"
                    />
                    <button
                      type="button"
                      disabled={isSharing || !name.trim()}
                      onClick={handleShare}
                      className="w-full py-1.5 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-40"
                    >
                      {isSharing ? 'Sharing...' : 'Publish to Gallery'}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Prompt Builder Modal */}
      <PromptBuilderModal
        isOpen={showPromptBuilder}
        onClose={() => setShowPromptBuilder(false)}
        currentPrompt={prompt}
        onApply={(composedPrompt) => setPrompt(composedPrompt)}
      />
    </div>
  );
};

export default CreatePost;