import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { cityNight } from '../assets';
import { getGenerationsApi, deleteGenerationApi } from '../services/api/generations.js';
import { GenerationDetailModal } from '../components/GenerationDetailModal.jsx';
import toast from 'react-hot-toast';
import {
  RiTimeLine,
  RiImageLine,
  RiImageAddLine,
  RiFileList3Line,
  RiTranslate2,
  RiChat1Line,
  RiArrowRightLine,
  RiBookOpenLine,
  RiSearchLine,
} from 'react-icons/ri';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recentGenerations, setRecentGenerations] = useState([]);
  const [selectedGeneration, setSelectedGeneration] = useState(null);

  const fetchActivity = async () => {
    try {
      const res = await getGenerationsApi({ limit: 4 });
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setRecentGenerations(res.data);
      } else if (Array.isArray(res?.data) && res.data.length > 0) {
        setRecentGenerations(res.data);
      } else {
        setRecentGenerations([]);
      }
    } catch (err) {
      console.warn('[Dashboard] Activity fallback active:', err.message);
      setRecentGenerations([]);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const handleDeleteGeneration = async (id) => {
    try {
      const res = await deleteGenerationApi(id);
      if (res.success) {
        toast.success('Record deleted.');
        setSelectedGeneration(null);
        fetchActivity();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete record.');
    }
  };

  // Helper for relative timestamps
  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Just now';
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    const diffInHours = Math.floor(diffInSeconds / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Curated Fallback Activity matching design reference
  const defaultActivities = [
    {
      _id: 'default-1',
      title: 'A futuristic city at night',
      toolType: 'Image AI',
      time: '2 mins ago',
      category: 'Image',
      badgeColor: 'text-[#8B5CF6] bg-[#8B5CF6]/15 border-[#8B5CF6]/30',
      icon: <RiImageLine size={16} className="text-[#8B5CF6]" />,
      hasThumbnail: true,
      thumbnail: cityNight,
      type: 'image',
      prompt: 'A futuristic cyberpunk city at night with glowing neon towers and flying vehicles',
    },
    {
      _id: 'default-2',
      title: 'Summary: The future of AI',
      toolType: 'Text AI',
      time: '30 mins ago',
      category: 'Text',
      badgeColor: 'text-[#3B82F6] bg-[#3B82F6]/15 border-[#3B82F6]/30',
      icon: <RiFileList3Line size={16} className="text-[#3B82F6]" />,
      type: 'summary',
      prompt: 'Summary: The future of AI, multimodal reasoning, autonomous workflow agents, and human-machine collaboration in 2026.',
    },
    {
      _id: 'default-3',
      title: 'Translation: Hello World',
      toolType: 'Translate',
      time: '2 hours ago',
      category: 'Translate',
      badgeColor: 'text-[#06B6D4] bg-[#06B6D4]/15 border-[#06B6D4]/30',
      icon: <RiTranslate2 size={16} className="text-[#06B6D4]" />,
      type: 'translate',
      prompt: 'Translation from English to Spanish: Hello world and welcome to the neural platform.',
    },
    {
      _id: 'default-4',
      title: 'Doc: Quantum Computing 101',
      toolType: 'Knowledge',
      time: '1 day ago',
      category: 'Knowledge',
      badgeColor: 'text-[#8B5CF6] bg-[#8B5CF6]/15 border-[#8B5CF6]/30',
      icon: <RiBookOpenLine size={16} className="text-[#8B5CF6]" />,
      type: 'knowledge',
      prompt: 'Indexed research paper on superconducting qubits and quantum error correction codes.',
    },
  ];

  const activitiesToDisplay =
    recentGenerations && recentGenerations.length > 0
      ? recentGenerations.map((gen) => {
          let category = 'Image';
          let badgeColor = 'text-[#8B5CF6] bg-[#8B5CF6]/15 border-[#8B5CF6]/30';
          let icon = <RiImageLine size={16} className="text-[#8B5CF6]" />;
          let title = gen.prompt ? gen.prompt.slice(0, 45) + (gen.prompt.length > 45 ? '...' : '') : 'AI Generation';

          if (gen.type === 'image') {
            category = 'Image';
            badgeColor = 'text-[#8B5CF6] bg-[#8B5CF6]/15 border-[#8B5CF6]/30';
            icon = <RiImageLine size={16} className="text-[#8B5CF6]" />;
          } else if (gen.type === 'summarize_url' || gen.type === 'summarize_text') {
            category = 'Text';
            badgeColor = 'text-[#3B82F6] bg-[#3B82F6]/15 border-[#3B82F6]/30';
            icon = <RiFileList3Line size={16} className="text-[#3B82F6]" />;
            title = gen.input ? `Summary: ${gen.input.slice(0, 35)}...` : 'Text Summary';
          } else if (gen.type === 'translate') {
            category = 'Translate';
            badgeColor = 'text-[#06B6D4] bg-[#06B6D4]/15 border-[#06B6D4]/30';
            icon = <RiTranslate2 size={16} className="text-[#06B6D4]" />;
            title = gen.input ? `Translation: ${gen.input.slice(0, 35)}...` : 'Neural Translation';
          } else if (gen.type === 'knowledge_search') {
            category = 'Knowledge';
            badgeColor = 'text-[#8B5CF6] bg-[#8B5CF6]/15 border-[#8B5CF6]/30';
            icon = <RiBookOpenLine size={16} className="text-[#8B5CF6]" />;
            title = gen.prompt ? `Knowledge: ${gen.prompt.slice(0, 35)}...` : 'Knowledge Search';
          }

          return {
            ...gen,
            title,
            toolType: category,
            time: getRelativeTime(gen.createdAt),
            category,
            badgeColor,
            icon,
            hasThumbnail: !!gen.result?.imageUrl,
            thumbnail: gen.result?.imageUrl,
          };
        })
      : defaultActivities;

  return (
    <div className="w-full space-y-6 lg:space-y-7 max-w-[1340px] mx-auto font-sans">
      {/* 1. HERO SECTION & AI ORBITAL VISUAL */}
      <section
        aria-label="Workspace Hero"
        className="ai-enter-1 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 lg:gap-8 items-center pt-0 sm:pt-1"
      >
        {/* Left Hero Text */}
        <div className="space-y-3">
          <div className="text-xs sm:text-sm font-medium text-[#94A3B8] flex items-center gap-1.5">
            <span>Welcome back, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'}!</span>
            <span role="img" aria-label="Waving hand">👋</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black text-[#F8FAFC] tracking-tight leading-[1.08]">
            Your <span className="bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#06B6D4] bg-clip-text text-transparent">AI</span>
            <br />
            workspace.
          </h1>

          <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed max-w-md">
            Create, understand, and discover — from one place.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1020]/90 border border-[#202A44] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
            <span className="text-[11px] font-bold text-[#F8FAFC] tracking-wide">
              AI SYSTEMS ONLINE
            </span>
          </div>
        </div>

        {/* Right Hero: Animated AI Orbital Visual */}
        <div className="relative w-full max-w-[360px] h-[210px] mx-auto lg:mx-0 lg:ml-auto lg:mr-2 lg:translate-y-2 flex items-center justify-center select-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-44 h-44 rounded-full bg-gradient-to-tr from-[#8B5CF6]/20 via-[#06B6D4]/12 to-[#22D3EE]/8 blur-2xl ai-orb-animated" />
          </div>

          <svg className="w-full h-full relative z-10 overflow-visible" viewBox="0 0 380 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="dash-beam-v" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.95" />
              </linearGradient>

              <linearGradient id="dash-beam-h" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.95" />
              </linearGradient>

              <filter id="dash-core-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Concentric Rotating Orbital Rings */}
            <circle cx="190" cy="110" r="92" stroke="#1E293B" strokeWidth="1.2" strokeDasharray="4 8" className="ai-spin-reverse" style={{ transformOrigin: '190px 110px' }} />
            <circle cx="190" cy="110" r="70" stroke="rgba(139, 92, 246, 0.30)" strokeWidth="1.4" strokeDasharray="5 7" className="ai-spin-slow" style={{ transformOrigin: '190px 110px' }} />
            <circle cx="190" cy="110" r="50" stroke="rgba(6, 182, 212, 0.25)" strokeWidth="1.2" strokeDasharray="3 6" />

            {/* Radiating Wave Pulse */}
            <circle cx="190" cy="110" r="42" stroke="#8B5CF6" strokeWidth="1.4" className="ai-wave-radiate" style={{ transformOrigin: '190px 110px' }} />

            {/* Radial Synaptic Beams */}
            <line x1="190" y1="38" x2="190" y2="182" stroke="#1E293B" strokeWidth="1.2" />
            <line x1="190" y1="38" x2="190" y2="182" stroke="url(#dash-beam-v)" strokeWidth="1.8" strokeDasharray="6 8" className="ai-beam-active" />

            <line x1="118" y1="110" x2="262" y2="110" stroke="#1E293B" strokeWidth="1.2" />
            <line x1="118" y1="110" x2="262" y2="110" stroke="url(#dash-beam-h)" strokeWidth="1.8" strokeDasharray="6 8" className="ai-beam-active" style={{ animationDelay: '1.2s' }} />

            {/* 1. TOP NODE: IMAGE */}
            <g className="ai-orbital-node cursor-pointer group" onClick={() => navigate('/create-post')}>
              <circle cx="190" cy="38" r="14" fill="#0B1020" stroke="#8B5CF6" strokeWidth="1.8" />
              <foreignObject x="182" y="30" width="16" height="16">
                <div className="flex items-center justify-center w-full h-full text-[#8B5CF6]">
                  <RiImageLine size={12} />
                </div>
              </foreignObject>
              <text x="190" y="16" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="700" letterSpacing="0.1em" className="select-none font-sans ai-orbit-text">
                IMAGE
              </text>
            </g>

            {/* 2. LEFT NODE: TEXT */}
            <g className="ai-orbital-node cursor-pointer group" style={{ animationDelay: '0.8s' }} onClick={() => navigate('/summarize')}>
              <circle cx="118" cy="110" r="14" fill="#0B1020" stroke="#3B82F6" strokeWidth="1.8" />
              <foreignObject x="110" y="102" width="16" height="16">
                <div className="flex items-center justify-center w-full h-full text-[#3B82F6]">
                  <RiFileList3Line size={12} />
                </div>
              </foreignObject>
              <text x="96" y="113" textAnchor="end" fill="currentColor" fontSize="9" fontWeight="700" letterSpacing="0.1em" className="select-none font-sans ai-orbit-text">
                TEXT
              </text>
            </g>

            {/* 3. BOTTOM NODE: TRANSLATE */}
            <g className="ai-orbital-node cursor-pointer group" style={{ animationDelay: '1.6s' }} onClick={() => navigate('/translate')}>
              <circle cx="190" cy="182" r="14" fill="#0B1020" stroke="#06B6D4" strokeWidth="1.8" />
              <foreignObject x="182" y="174" width="16" height="16">
                <div className="flex items-center justify-center w-full h-full text-[#06B6D4]">
                  <RiTranslate2 size={12} />
                </div>
              </foreignObject>
              <text x="190" y="208" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="700" letterSpacing="0.1em" className="select-none font-sans ai-orbit-text">
                TRANSLATE
              </text>
            </g>

            {/* 4. RIGHT NODE: KNOWLEDGE */}
            <g className="ai-orbital-node cursor-pointer group" style={{ animationDelay: '2.4s' }} onClick={() => navigate('/knowledge')}>
              <circle cx="262" cy="110" r="14" fill="#0B1020" stroke="#8B5CF6" strokeWidth="1.8" />
              <foreignObject x="254" y="102" width="16" height="16">
                <div className="flex items-center justify-center w-full h-full text-[#8B5CF6]">
                  <RiBookOpenLine size={12} />
                </div>
              </foreignObject>
              <text x="284" y="113" textAnchor="start" fill="currentColor" fontSize="9" fontWeight="700" letterSpacing="0.1em" className="select-none font-sans ai-orbit-text">
                KNOWLEDGE
              </text>
            </g>

            {/* Central AI Core */}
            <g className="ai-orb-animated" style={{ transformOrigin: '190px 110px' }}>
              <circle cx="190" cy="110" r="30" fill="#0B1020" stroke="#8B5CF6" strokeWidth="2.2" filter="url(#dash-core-glow)" />
              <circle cx="190" cy="110" r="24" fill="#050812" stroke="#06B6D4" strokeWidth="1.3" />
              <path
                d="M190 96 L197 115 L193.5 115 L191.8 110 L188.2 110 L186.5 115 L183 115 Z M190 101.5 L189 107.5 L191 107.5 Z"
                fill="url(#dash-beam-v)"
              />
            </g>
          </svg>
        </div>
      </section>

      {/* 2. FOUR MAIN AI TOOL CARDS */}
      <section aria-label="Main AI Tools" className="ai-enter-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* Card 1: IMAGE AI */}
          <Link
            to="/create-post"
            className="ai-card-glass rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 hover:border-[#8B5CF6]/45 transition-all duration-200 flex flex-col justify-between min-h-[160px] shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#8B5CF6]/10 rounded-full blur-xl pointer-events-none group-hover:bg-[#8B5CF6]/20 transition-colors" />
            <div>
              <div className="w-11 h-11 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] mb-3 group-hover:scale-105 transition-transform">
                <RiImageLine size={22} />
              </div>
              <h3 className="text-base font-extrabold text-[#F8FAFC] tracking-tight group-hover:text-[#8B5CF6] transition-colors">
                Image AI
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5 leading-snug">
                Create from text
              </p>
            </div>
            <div className="mt-4 flex items-center justify-end">
              <div className="w-7 h-7 rounded-full bg-[#050812]/80 border border-[#202A44] group-hover:border-[#8B5CF6]/60 text-[#94A3B8] group-hover:text-[#8B5CF6] flex items-center justify-center group-hover:translate-x-1 transition-all duration-200">
                <RiArrowRightLine size={14} />
              </div>
            </div>
          </Link>

          {/* Card 2: TEXT AI */}
          <Link
            to="/summarize"
            className="ai-card-glass rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 hover:border-[#3B82F6]/45 transition-all duration-200 flex flex-col justify-between min-h-[160px] shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#3B82F6]/10 rounded-full blur-xl pointer-events-none group-hover:bg-[#3B82F6]/20 transition-colors" />
            <div>
              <div className="w-11 h-11 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] mb-3 group-hover:scale-105 transition-transform">
                <RiFileList3Line size={22} />
              </div>
              <h3 className="text-base font-extrabold text-[#F8FAFC] tracking-tight group-hover:text-[#3B82F6] transition-colors">
                Text AI
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5 leading-snug">
                Understand & transform text
              </p>
            </div>
            <div className="mt-4 flex items-center justify-end">
              <div className="w-7 h-7 rounded-full bg-[#050812]/80 border border-[#202A44] group-hover:border-[#3B82F6]/60 text-[#94A3B8] group-hover:text-[#3B82F6] flex items-center justify-center group-hover:translate-x-1 transition-all duration-200">
                <RiArrowRightLine size={14} />
              </div>
            </div>
          </Link>

          {/* Card 3: TRANSLATE */}
          <Link
            to="/translate"
            className="ai-card-glass rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 hover:border-[#06B6D4]/45 transition-all duration-200 flex flex-col justify-between min-h-[160px] shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#06B6D4]/10 rounded-full blur-xl pointer-events-none group-hover:bg-[#06B6D4]/20 transition-colors" />
            <div>
              <div className="w-11 h-11 rounded-xl bg-[#06B6D4]/15 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4] mb-3 group-hover:scale-105 transition-transform">
                <RiTranslate2 size={22} />
              </div>
              <h3 className="text-base font-extrabold text-[#F8FAFC] tracking-tight group-hover:text-[#06B6D4] transition-colors">
                Translate
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5 leading-snug">
                Translate across languages
              </p>
            </div>
            <div className="mt-4 flex items-center justify-end">
              <div className="w-7 h-7 rounded-full bg-[#050812]/80 border border-[#202A44] group-hover:border-[#06B6D4]/60 text-[#94A3B8] group-hover:text-[#06B6D4] flex items-center justify-center group-hover:translate-x-1 transition-all duration-200">
                <RiArrowRightLine size={14} />
              </div>
            </div>
          </Link>

          {/* Card 4: KNOWLEDGE */}
          <Link
            to="/knowledge"
            className="ai-card-glass rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 hover:border-[#8B5CF6]/45 transition-all duration-200 flex flex-col justify-between min-h-[160px] shadow-lg"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#8B5CF6]/10 rounded-full blur-xl pointer-events-none group-hover:bg-[#8B5CF6]/20 transition-colors" />
            <div>
              <div className="w-11 h-11 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] mb-3 group-hover:scale-105 transition-transform">
                <RiBookOpenLine size={22} />
              </div>
              <h3 className="text-base font-extrabold text-[#F8FAFC] tracking-tight group-hover:text-[#8B5CF6] transition-colors">
                Knowledge
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5 leading-snug">
                Search & explore
              </p>
            </div>
            <div className="mt-4 flex items-center justify-end">
              <div className="w-7 h-7 rounded-full bg-[#050812]/80 border border-[#202A44] group-hover:border-[#8B5CF6]/60 text-[#94A3B8] group-hover:text-[#8B5CF6] flex items-center justify-center group-hover:translate-x-1 transition-all duration-200">
                <RiArrowRightLine size={14} />
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* 3. LOWER SECTION: RECENT ACTIVITY (LEFT) & QUICK START (RIGHT) */}
      <section
        aria-label="Activity and Quick Actions"
        className="ai-enter-3 grid grid-cols-1 lg:grid-cols-[1.28fr_0.92fr] gap-6 items-start"
      >
        
        {/* LEFT PANEL: RECENT ACTIVITY */}
        <div className="ai-card-glass rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#202A44]/70 mb-4">
            <div className="flex items-center gap-2">
              <RiTimeLine className="text-[#8B5CF6]" size={18} />
              <h2 className="text-base font-bold text-[#F8FAFC]">Recent Activity</h2>
            </div>
            <Link
              to="/history"
              className="text-xs font-semibold text-[#8B5CF6] hover:text-[#06B6D4] transition-colors"
            >
              View all
            </Link>
          </div>

          {/* Activity Rows */}
          <div className="space-y-2.5">
            {activitiesToDisplay.map((item, idx) => (
              <div
                key={item._id || idx}
                onClick={() => {
                  if (item._id && !item._id.startsWith('default-')) {
                    setSelectedGeneration(item);
                  } else {
                    if (item.category === 'Image') navigate('/create-post');
                    else if (item.category === 'Text') navigate('/summarize');
                    else if (item.category === 'Translate') navigate('/translate');
                    else navigate('/knowledge');
                  }
                }}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#0B1020]/60 hover:bg-[#0B1020] border border-[#202A44]/60 hover:border-[#8B5CF6]/35 cursor-pointer transition-all duration-200 group"
              >
                {/* Left: Icon or Thumbnail + Title + Subtitle */}
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  {item.hasThumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-10 h-10 rounded-lg object-cover border border-[#202A44] shrink-0 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#050812] border border-[#202A44] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {item.icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#8B5CF6] transition-colors truncate">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      {item.toolType} • {item.time}
                    </p>
                  </div>
                </div>

                {/* Right: Category Badge & Arrow */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                    {item.category}
                  </span>
                  <RiArrowRightLine size={15} className="text-[#64748B] group-hover:text-[#8B5CF6] group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: QUICK START */}
        <div className="ai-card-glass rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#202A44]/70 mb-4">
            <h2 className="text-base font-bold text-[#F8FAFC]">Quick Start</h2>
          </div>

          {/* 4 Action Rows */}
          <div className="space-y-2.5">
            
            {/* 1. New Text AI */}
            <Link
              to="/summarize"
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#0B1020]/60 hover:bg-[#0B1020] border border-[#202A44]/60 hover:border-[#8B5CF6]/35 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] shrink-0 group-hover:scale-105 transition-transform">
                  <RiChat1Line size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#8B5CF6] transition-colors">
                    New Text AI
                  </h4>
                  <p className="text-[11px] text-[#94A3B8]">
                    Summarize & transform text
                  </p>
                </div>
              </div>
              <RiArrowRightLine size={15} className="text-[#64748B] group-hover:text-[#8B5CF6] group-hover:translate-x-1 transition-all duration-200" />
            </Link>

            {/* 2. Create an image */}
            <Link
              to="/create-post"
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#0B1020]/60 hover:bg-[#0B1020] border border-[#202A44]/60 hover:border-[#3B82F6]/35 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] shrink-0 group-hover:scale-105 transition-transform">
                  <RiImageAddLine size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#3B82F6] transition-colors">
                    Create an image
                  </h4>
                  <p className="text-[11px] text-[#94A3B8]">
                    Generate from text
                  </p>
                </div>
              </div>
              <RiArrowRightLine size={15} className="text-[#64748B] group-hover:text-[#3B82F6] group-hover:translate-x-1 transition-all duration-200" />
            </Link>

            {/* 3. Translate text */}
            <Link
              to="/translate"
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#0B1020]/60 hover:bg-[#0B1020] border border-[#202A44]/60 hover:border-[#06B6D4]/35 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/15 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4] shrink-0 group-hover:scale-105 transition-transform">
                  <RiTranslate2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#06B6D4] transition-colors">
                    Translate text
                  </h4>
                  <p className="text-[11px] text-[#94A3B8]">
                    Translate across languages
                  </p>
                </div>
              </div>
              <RiArrowRightLine size={15} className="text-[#64748B] group-hover:text-[#06B6D4] group-hover:translate-x-1 transition-all duration-200" />
            </Link>

            {/* 4. Explore Knowledge */}
            <Link
              to="/knowledge"
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#0B1020]/60 hover:bg-[#0B1020] border border-[#202A44]/60 hover:border-[#8B5CF6]/35 transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] shrink-0 group-hover:scale-105 transition-transform">
                  <RiSearchLine size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#8B5CF6] transition-colors">
                    Explore Knowledge
                  </h4>
                  <p className="text-[11px] text-[#94A3B8]">
                    Search & explore
                  </p>
                </div>
              </div>
              <RiArrowRightLine size={15} className="text-[#64748B] group-hover:text-[#8B5CF6] group-hover:translate-x-1 transition-all duration-200" />
            </Link>

          </div>
        </div>

      </section>

      {/* Generation Detail Inspection Modal */}
      {selectedGeneration && (
        <GenerationDetailModal
          generation={selectedGeneration}
          onClose={() => setSelectedGeneration(null)}
          onDelete={handleDeleteGeneration}
        />
      )}
    </div>
  );
};

export default Dashboard;
