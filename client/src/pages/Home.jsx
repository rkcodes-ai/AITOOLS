import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Loader from '../components/Loader';
import Spatial3DCanvas from '../components/Spatial3DCanvas';
import Tilt3DCard from '../components/Tilt3DCard';
import toast from 'react-hot-toast';
import { getPostsApi } from '../services/api/posts';
import {
  RiSparklingFill,
  RiImageLine,
  RiFileList3Line,
  RiGlobalLine,
  RiBrainLine,
  RiArrowRightLine,
  RiSearchLine,
} from 'react-icons/ri';

const RenderCards = ({ data, title }) => {
  if (data?.length > 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.map((post) => (
          <Tilt3DCard key={post._id} maxTilt={8} scale={1.03} className="rounded-2xl">
            <Card {...post} />
          </Tilt3DCard>
        ))}
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <h2 className="font-bold text-[#8B5CF6] text-lg uppercase tracking-wider">{title}</h2>
      <p className="text-sm text-[#94A3B8] mt-1">Be the first to generate and share a community creation!</p>
    </div>
  );
};

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [allPosts, setAllPosts] = useState([]);
  const [dbConnected, setDbConnected] = useState(true);

  const [searchText, setSearchText] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [searchedResults, setSearchedResults] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getPostsApi();
      if (response.success) {
        setAllPosts(response.data || []);
        setDbConnected(response.dbConnected !== false);
      }
    } catch (error) {
      console.error('[Home] Fetch error:', error);
      toast.error('Unable to reach backend server. Please verify connection.');
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    clearTimeout(searchTimeout);
    const value = e.target.value;
    setSearchText(value);

    setSearchTimeout(
      setTimeout(() => {
        if (!value.trim()) {
          setSearchedResults(null);
          return;
        }
        const filtered = allPosts.filter(
          (item) =>
            item.name?.toLowerCase().includes(value.toLowerCase()) ||
            item.prompt?.toLowerCase().includes(value.toLowerCase()) ||
            item.model?.toLowerCase().includes(value.toLowerCase())
        );
        setSearchedResults(filtered);
      }, 300)
    );
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="relative min-h-screen bg-[#050816] text-[#F8FAFC] overflow-x-hidden font-sans selection:bg-[#8B5CF6] selection:text-white">
      {/* 1. Interactive 3D Spatial Canvas in Hero */}
      <div className="relative w-full h-[520px] sm:h-[580px] flex items-center justify-center overflow-hidden border-b border-[#202A44]/60">
        {/* Real-time 3D Particle Sphere */}
        <Spatial3DCanvas className="z-0 opacity-80" particleCount={160} radius={240} />

        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#8B5CF6]/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#06B6D4]/15 blur-[120px] pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-[#8B5CF6] text-xs font-semibold mb-6 shadow-lg shadow-[#8B5CF6]/10">
            <RiSparklingFill className="text-[#22D3EE] animate-spin" style={{ animationDuration: '8s' }} size={14} />
            <span>SYNAPSE 3D • SPATIAL AI ENGINE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#F8FAFC] tracking-tight leading-[1.08] max-w-4xl">
            Step into the{' '}
            <span className="bg-gradient-to-r from-[#8B5CF6] via-[#22D3EE] to-[#06B6D4] bg-clip-text text-transparent ai-text-gradient-animated">
              3rd Dimension
            </span>{' '}
            of AI.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#94A3B8] max-w-2xl leading-relaxed">
            Generate state-of-the-art visuals, synthesize document intelligence, translate 13 languages, and query high-dimensional vector knowledge bases.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/create-post"
              className="px-6 py-3.5 bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#06B6D4] hover:from-[#7C3AED] hover:to-[#0891B2] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#8B5CF6]/25 hover:shadow-[#8B5CF6]/40 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Launch Image Studio</span>
              <RiArrowRightLine size={16} />
            </Link>

            <Link
              to="/summarize"
              className="px-6 py-3.5 bg-[#0B1020] hover:bg-[#0F172A] border border-[#202A44] hover:border-[#3B82F6]/50 text-[#F8FAFC] font-semibold text-sm rounded-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <RiFileList3Line size={16} className="text-[#3B82F6]" />
              <span>Text AI</span>
            </Link>

            <Link
              to="/translate"
              className="px-6 py-3.5 bg-[#0B1020] hover:bg-[#0F172A] border border-[#202A44] hover:border-[#06B6D4]/50 text-[#F8FAFC] font-semibold text-sm rounded-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <RiGlobalLine size={16} className="text-[#06B6D4]" />
              <span>Translate</span>
            </Link>

            <Link
              to="/knowledge"
              className="px-6 py-3.5 bg-[#0B1020] hover:bg-[#0F172A] border border-[#202A44] hover:border-[#8B5CF6]/50 text-[#F8FAFC] font-semibold text-sm rounded-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <RiBrainLine size={16} className="text-[#8B5CF6]" />
              <span>Knowledge Engine</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. 3D Interactive Spatial Portals (4 Modalities) */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Spatial Capability Matrix</h2>
          <p className="mt-2 text-sm text-[#94A3B8]">Interact with the four core dimensions of the AITOOLS ecosystem.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: IMAGE */}
          <Tilt3DCard maxTilt={12} scale={1.04} className="ai-card-glass rounded-3xl p-6 flex flex-col justify-between h-[260px]">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] mb-4">
                <RiImageLine size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">Image Studio</h3>
              <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
                Generate hyper-realistic art with FLUX.1 schnell, SDXL, and Stable Diffusion 2.1.
              </p>
            </div>
            <Link to="/create-post" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B5CF6] hover:text-[#22D3EE] transition-colors">
              <span>Create Visuals</span>
              <RiArrowRightLine size={14} />
            </Link>
          </Tilt3DCard>

          {/* Card 2: TEXT */}
          <Tilt3DCard maxTilt={12} scale={1.04} className="ai-card-glass rounded-3xl p-6 flex flex-col justify-between h-[260px]">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] mb-4">
                <RiFileList3Line size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">Text AI</h3>
              <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
                Summarize, rewrite, explain, and transform text with neural intelligence.
              </p>
            </div>
            <Link to="/summarize" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3B82F6] hover:text-[#22D3EE] transition-colors">
              <span>Transform Text</span>
              <RiArrowRightLine size={14} />
            </Link>
          </Tilt3DCard>

          {/* Card 3: TRANSLATE */}
          <Tilt3DCard maxTilt={12} scale={1.04} className="ai-card-glass rounded-3xl p-6 flex flex-col justify-between h-[260px]">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/15 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4] mb-4">
                <RiGlobalLine size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">Translate</h3>
              <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
                Seamless neural translation across 13 major global languages with nuance retention.
              </p>
            </div>
            <Link to="/translate" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#06B6D4] hover:text-[#8B5CF6] transition-colors">
              <span>Translate Text</span>
              <RiArrowRightLine size={14} />
            </Link>
          </Tilt3DCard>

          {/* Card 4: KNOWLEDGE */}
          <Tilt3DCard maxTilt={12} scale={1.04} className="ai-card-glass rounded-3xl p-6 flex flex-col justify-between h-[260px]">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] mb-4">
                <RiBrainLine size={24} />
              </div>
              <h3 className="text-lg font-bold text-[#F8FAFC]">Knowledge RAG</h3>
              <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
                Index documents into semantic vector embeddings with hybrid cosine similarity search.
              </p>
            </div>
            <Link to="/knowledge" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8B5CF6] hover:text-[#22D3EE] transition-colors">
              <span>Explore Knowledge</span>
              <RiArrowRightLine size={14} />
            </Link>
          </Tilt3DCard>
        </div>
      </div>

      {/* 3. 3D Community Showcase Gallery */}
      <div className="max-w-7xl mx-auto px-6 py-12 border-t border-[#202A44]/60">
        {!dbConnected && (
          <div className="mb-6 p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-amber-200 text-xs">
            <strong>Database Notice:</strong> MongoDB is currently not connected. Community posts persistence requires MongoDB configuration in server/.env, but AI image studio, summarization, translation, and knowledge vector search work normally.
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC]">Community Creations</h2>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">Explore spatial AI artwork generated across the workspace.</p>
          </div>

          <div className="w-full sm:w-80">
            <div className="relative">
              <RiSearchLine className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
              <input
                type="text"
                placeholder="Search prompt or creator..."
                value={searchText}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B1020] border border-[#202A44] focus:border-[#8B5CF6] rounded-xl text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Loading / Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader />
          </div>
        ) : (
          <RenderCards
            data={searchedResults || allPosts}
            title={searchText ? `No results found for "${searchText}"` : 'No community posts yet'}
          />
        )}
      </div>
    </div>
  );
};

export default Home;