import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { logo } from '../assets';
import {
  RiMailLine,
  RiLockPasswordLine,
  RiEyeLine,
  RiEyeOffLine,
  RiSparklingFill,
  RiImageLine,
  RiFileList3Line,
  RiGlobalLine,
  RiBrainLine,
  RiArrowRightLine,
  RiShieldCheckLine,
  RiLockLine,
  RiRocketLine,
  RiCheckLine,
  RiMoonLine,
  RiSunLine,
} from 'react-icons/ri';

const Login = () => {
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('aitools_remembered_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return !!localStorage.getItem('aitools_remembered_email');
    } catch {
      return false;
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [authError, setAuthError] = useState('');

  const { login } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const from = redirectParam ? decodeURIComponent(redirectParam) : (location.state?.from?.pathname || '/dashboard');

  const validateForm = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (authError) setAuthError('');
    if (validationErrors.email) {
      setValidationErrors((prev) => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (authError) setAuthError('');
    if (validationErrors.password) {
      setValidationErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || isSuccess) return;

    if (!validateForm()) return;

    setAuthError('');
    setIsSubmitting(true);

    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('aitools_remembered_email', email.trim());
        } else {
          localStorage.removeItem('aitools_remembered_email');
        }
        setIsSuccess(true);
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 450);
      } else {
        setAuthError(result.error || 'Invalid credentials. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setAuthError(err.message || 'An unexpected network error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen lg:h-screen lg:max-h-screen w-full flex flex-col justify-between bg-[#050812] text-[#F8FAFC] overflow-x-hidden overflow-y-auto lg:overflow-hidden font-sans selection:bg-[#8B5CF6] selection:text-white">
      {/* Ambient Lighting & Technical Grid */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute inset-0 ai-grid-pattern opacity-40" />
        <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] rounded-full bg-[#8B5CF6]/12 blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] rounded-full bg-[#06B6D4]/10 blur-[150px] pointer-events-none" />
      </div>

      {/* Header Navigation Bar (Clean Authentication Header) */}
      <header className="relative z-20 w-full px-6 sm:px-10 py-3 flex items-center justify-between border-b border-[#202A44]/50 bg-[#050812]/80 backdrop-blur-md shrink-0">
        <Link to="/" className="ai-enter-1 flex items-center gap-3 group">
          <img src={logo} alt="AITOOLS Logo" className="w-28 h-8 object-contain transition-transform group-hover:scale-105" />
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 tracking-wide">
            AI WORKSPACE
          </span>
        </Link>

        <div className="ai-enter-1 flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className="p-1.5 rounded-xl bg-[#0B1020] border border-[#202A44] hover:border-[#8B5CF6]/50 text-[#94A3B8] hover:text-[#8B5CF6] transition-colors"
          >
            {darkMode ? <RiMoonLine size={15} /> : <RiSunLine size={15} className="text-amber-400" />}
          </button>
        </div>
      </header>

      {/* Main Two-Column Viewport Shell (Refinement 3: Slightly Centered Card) */}
      <main className="relative z-20 flex-1 w-full max-w-[1160px] mx-auto px-6 sm:px-8 py-2 sm:py-3 flex items-center justify-center my-auto min-h-0">
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] gap-6 lg:gap-10 xl:gap-12 items-center">
          
          {/* LEFT HERO SECTION */}
          <section aria-label="AITOOLS Platform Overview" className="w-full flex flex-col justify-center">
            {/* Headline */}
            <div className="ai-enter-2">
              <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-black text-[#F8FAFC] tracking-tight leading-[1.02]">
                Create.
                <br />
                <span className="text-[#A855F7]">Understand.</span>
                <br />
                <span className="text-[#06B6D4]">Discover.</span>
              </h1>

              <p className="mt-1 text-sm sm:text-base font-medium text-[#94A3B8] tracking-wide">
                One AI workspace.
              </p>
            </div>

            {/* Circular AI Capability Orbit */}
            <div className="ai-enter-3 relative w-full max-w-[460px] h-[215px] sm:h-[225px] mt-0 mb-3 sm:mb-4 -translate-y-1 lg:-translate-y-2 flex items-center justify-center select-none">
              {/* Soft Center Ambient Glow */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-[#8B5CF6]/20 via-[#06B6D4]/15 to-[#22D3EE]/10 blur-2xl ai-orb-animated" />
              </div>

              <svg className="w-full h-full relative z-10 overflow-visible" viewBox="0 0 460 230" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="beam-v-balanced" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.95" />
                  </linearGradient>

                  <linearGradient id="beam-h-balanced" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.95" />
                  </linearGradient>

                  <filter id="core-glow-balanced" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="7" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Subtle Technical Constellation Network */}
                <g opacity="0.3" stroke="#3B82F6" strokeWidth="0.75">
                  <line x1="230" y1="115" x2="304" y2="75" strokeDasharray="2 3" />
                  <line x1="304" y1="75" x2="376" y2="98" strokeDasharray="2 3" />
                  <line x1="376" y1="98" x2="418" y2="135" strokeDasharray="2 3" />
                  <line x1="304" y1="75" x2="356" y2="160" strokeDasharray="2 3" />
                  <line x1="356" y1="160" x2="412" y2="170" strokeDasharray="2 3" />
                  <line x1="376" y1="98" x2="412" y2="170" strokeDasharray="2 3" />
                  <line x1="230" y1="115" x2="356" y2="160" strokeDasharray="2 3" />
                  <circle cx="304" cy="75" r="2" fill="#06B6D4" />
                  <circle cx="376" cy="98" r="1.5" fill="#8B5CF6" />
                  <circle cx="418" cy="135" r="2" fill="#22D3EE" />
                  <circle cx="356" cy="160" r="1.5" fill="#3B82F6" />
                  <circle cx="412" cy="170" r="2" fill="#8B5CF6" />
                </g>

                {/* Concentric Orbital Rings */}
                <circle cx="230" cy="115" r="98" stroke="#1E293B" strokeWidth="1.2" strokeDasharray="4 8" className="ai-spin-reverse" style={{ transformOrigin: '230px 115px' }} />
                <circle cx="230" cy="115" r="74" stroke="rgba(139, 92, 246, 0.32)" strokeWidth="1.4" strokeDasharray="5 7" className="ai-spin-slow" style={{ transformOrigin: '230px 115px' }} />
                <circle cx="230" cy="115" r="54" stroke="rgba(6, 182, 212, 0.28)" strokeWidth="1.2" strokeDasharray="3 6" />

                {/* Center Radiant Wave */}
                <circle cx="230" cy="115" r="46" stroke="#8B5CF6" strokeWidth="1.4" className="ai-wave-radiate" style={{ transformOrigin: '230px 115px' }} />

                {/* Radial Synaptic Beams */}
                <line x1="230" y1="41" x2="230" y2="189" stroke="#1E293B" strokeWidth="1.2" />
                <line x1="230" y1="41" x2="230" y2="189" stroke="url(#beam-v-balanced)" strokeWidth="1.8" strokeDasharray="6 9" className="ai-beam-active" />

                <line x1="156" y1="115" x2="304" y2="115" stroke="#1E293B" strokeWidth="1.2" />
                <line x1="156" y1="115" x2="304" y2="115" stroke="url(#beam-h-balanced)" strokeWidth="1.8" strokeDasharray="6 9" className="ai-beam-active" style={{ animationDelay: '1.2s' }} />

                {/* 1. TOP: IMAGE ORBITAL CAPABILITY */}
                <g className="ai-orbital-node" style={{ color: '#8B5CF6' }}>
                  <circle cx="230" cy="41" r="3.5" fill="#8B5CF6" />
                  <circle cx="230" cy="41" r="7" stroke="#8B5CF6" strokeWidth="1" opacity="0.45" />
                  <text x="230" y="24" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="700" letterSpacing="0.12em" className="select-none font-sans ai-orbit-text">
                    IMAGE
                  </text>
                </g>

                {/* 2. LEFT: TEXT ORBITAL CAPABILITY */}
                <g className="ai-orbital-node" style={{ color: '#06B6D4', animationDelay: '0.8s' }}>
                  <circle cx="156" cy="115" r="3.5" fill="#06B6D4" />
                  <circle cx="156" cy="115" r="7" stroke="#06B6D4" strokeWidth="1" opacity="0.45" />
                  <text x="142" y="119" textAnchor="end" fill="currentColor" fontSize="10" fontWeight="700" letterSpacing="0.12em" className="select-none font-sans ai-orbit-text">
                    TEXT
                  </text>
                </g>

                {/* 3. BOTTOM: TRANSLATE ORBITAL CAPABILITY */}
                <g className="ai-orbital-node" style={{ color: '#22D3EE', animationDelay: '1.6s' }}>
                  <circle cx="230" cy="189" r="3.5" fill="#22D3EE" />
                  <circle cx="230" cy="189" r="7" stroke="#22D3EE" strokeWidth="1" opacity="0.45" />
                  <text x="230" y="207" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="700" letterSpacing="0.12em" className="select-none font-sans ai-orbit-text">
                    TRANSLATE
                  </text>
                </g>

                {/* 4. RIGHT: KNOWLEDGE ORBITAL CAPABILITY */}
                <g className="ai-orbital-node" style={{ color: '#8B5CF6', animationDelay: '2.4s' }}>
                  <circle cx="304" cy="115" r="3.5" fill="#8B5CF6" />
                  <circle cx="304" cy="115" r="7" stroke="#8B5CF6" strokeWidth="1" opacity="0.45" />
                  <text x="318" y="119" textAnchor="start" fill="currentColor" fontSize="10" fontWeight="700" letterSpacing="0.12em" className="select-none font-sans ai-orbit-text">
                    KNOWLEDGE
                  </text>
                </g>

                {/* Central AI Core */}
                <g className="ai-orb-animated" style={{ transformOrigin: '230px 115px' }}>
                  <circle cx="230" cy="115" r="32" fill="#0B1020" stroke="#8B5CF6" strokeWidth="2.2" filter="url(#core-glow-balanced)" />
                  <circle cx="230" cy="115" r="26" fill="#050812" stroke="#06B6D4" strokeWidth="1.3" />
                  <path
                    d="M230 100 L237 120 L233.5 120 L231.8 115 L228.2 115 L226.5 120 L223 120 Z M230 105.5 L229 111.5 L231 111.5 Z"
                    fill="url(#beam-v-balanced)"
                  />
                </g>
              </svg>
            </div>

            {/* Subordinate Capability Metadata Dock */}
            <div className="ai-enter-4 ai-dock-card rounded-xl p-2 grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-lg shadow-sm">
              <div className="flex flex-col items-start gap-0.5 p-1 rounded-lg hover:bg-[#050812]/60 transition-colors">
                <div className="p-1 rounded bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20">
                  <RiImageLine size={13} />
                </div>
                <div className="text-[11px] font-bold text-[#F8FAFC]">IMAGE</div>
                <div className="text-[9px] text-[#94A3B8] leading-tight">Create from text</div>
              </div>

              <div className="flex flex-col items-start gap-0.5 p-1 rounded-lg hover:bg-[#050812]/60 transition-colors">
                <div className="p-1 rounded bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20">
                  <RiFileList3Line size={13} />
                </div>
                <div className="text-[11px] font-bold text-[#F8FAFC]">TEXT</div>
                <div className="text-[9px] text-[#94A3B8] leading-tight">Turn into insight</div>
              </div>

              <div className="flex flex-col items-start gap-0.5 p-1 rounded-lg hover:bg-[#050812]/60 transition-colors">
                <div className="p-1 rounded bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20">
                  <RiGlobalLine size={13} />
                </div>
                <div className="text-[11px] font-bold text-[#F8FAFC]">TRANSLATE</div>
                <div className="text-[9px] text-[#94A3B8] leading-tight">Across languages</div>
              </div>

              <div className="flex flex-col items-start gap-0.5 p-1 rounded-lg hover:bg-[#050812]/60 transition-colors">
                <div className="p-1 rounded bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20">
                  <RiBrainLine size={13} />
                </div>
                <div className="text-[11px] font-bold text-[#F8FAFC]">KNOWLEDGE</div>
                <div className="text-[9px] text-[#94A3B8] leading-tight">Search & explore</div>
              </div>
            </div>
          </section>

          {/* RIGHT LOGIN CARD SECTION (Refinement 3: Centered Proportions) */}
          <section aria-label="Sign In Card" className="w-full flex items-center justify-center lg:justify-start lg:pl-2">
            <div className="ai-enter-card w-full max-w-[390px] ai-card-glass rounded-2xl p-5 sm:p-6 relative shadow-xl">
              {/* Sparkle Badge */}
              <div className="text-center mb-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] text-white shadow-md shadow-[#8B5CF6]/25 mb-2 transition-transform hover:scale-105">
                  <RiSparklingFill size={18} />
                </div>
                <h2 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">Welcome back.</h2>
                <p className="mt-0.5 text-xs text-[#94A3B8]">Continue to AITOOLS.</p>
              </div>

              {/* Error Alert */}
              {authError && (
                <div
                  role="alert"
                  className="mb-3 p-2 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2 shadow-sm animate-shake"
                >
                  <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-400 mt-1" />
                  <div>{authError}</div>
                </div>
              )}

              {/* Form Controls (Refinement 2: Spacious, Comfortable Input Padding) */}
              <form onSubmit={handleSubmit} noValidate className="space-y-3">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#8B5CF6] transition-colors duration-150">
                      <RiMailLine size={16} />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="name@example.com"
                      disabled={isSubmitting || isSuccess}
                      className={`w-full pl-11 pr-4 py-2 bg-white text-gray-900 placeholder-gray-400 border ${
                        validationErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30'
                      } rounded-xl text-xs font-medium focus:outline-none transition-all duration-150 disabled:opacity-50`}
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="mt-1 text-[11px] text-red-400">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#8B5CF6] transition-colors duration-150">
                      <RiLockPasswordLine size={16} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Enter your password"
                      disabled={isSubmitting || isSuccess}
                      className={`w-full pl-11 pr-11 py-2 bg-white text-gray-900 placeholder-gray-400 border ${
                        validationErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/30'
                      } rounded-xl text-xs font-medium focus:outline-none transition-all duration-150 disabled:opacity-50`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700 focus:outline-none transition-colors"
                    >
                      {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-[11px] text-red-400">{validationErrors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-0.5 text-xs text-[#94A3B8]">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-[#202A44] bg-[#050812] text-[#8B5CF6] focus:ring-[#8B5CF6]/30 focus:ring-offset-0 transition-colors"
                    />
                    <span className="text-[#F8FAFC] text-[11px]">Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => alert('Password reset is available via support email.')}
                    className="text-[#94A3B8] hover:text-[#22D3EE] text-[11px] transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    className={`w-full py-2.5 px-4 ${
                      isSuccess
                        ? 'bg-[#34D399] text-slate-950 font-bold'
                        : 'bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#06B6D4] hover:from-[#7C3AED] hover:via-[#4F46E5] hover:to-[#0891B2] hover:-translate-y-0.5 shadow-md shadow-[#8B5CF6]/20 hover:shadow-[#8B5CF6]/35 text-white font-bold'
                    } text-xs sm:text-sm rounded-xl active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none`}
                  >
                    {isSuccess ? (
                      <>
                        <RiCheckLine size={16} className="animate-bounce" />
                        <span>Authenticated ✓</span>
                      </>
                    ) : isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <RiArrowRightLine size={15} />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-3 pt-2.5 border-t border-[#202A44] text-center text-xs text-[#94A3B8]">
                New here?{' '}
                <Link to="/register" className="font-semibold text-[#8B5CF6] hover:text-[#22D3EE] underline transition-colors">
                  Create account
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer Bar (Minimal Height) */}
      <footer className="relative z-20 w-full px-6 sm:px-10 py-2 border-t border-[#202A44]/50 bg-[#050812]/70 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#94A3B8] gap-1.5 shrink-0">
        <div className="flex flex-wrap items-center justify-center gap-3.5 text-[#94A3B8]">
          <div className="flex items-center gap-1">
            <RiShieldCheckLine size={13} className="text-[#F8FAFC]" />
            <span>Secure by design</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <RiLockLine size={13} className="text-[#F8FAFC]" />
            <span>Private by default</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <RiRocketLine size={13} className="text-[#F8FAFC]" />
            <span>Built for productivity</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <RiSparklingFill size={13} className="text-[#22D3EE]" />
            <span>Always learning</span>
          </div>
        </div>

        <div className="text-[#94A3B8]">
          © 2026 AITOOLS. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Login;
