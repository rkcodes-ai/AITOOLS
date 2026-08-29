import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { logo, avatar } from '../assets';
import toast from 'react-hot-toast';
import {
  RiDashboardLine,
  RiTimeLine,
  RiBookOpenLine,
  RiFolder2Line,
  RiChat1Line,
  RiSettings4Line,
  RiSearchLine,
  RiNotification3Line,
  RiVipCrown2Fill,
  RiImageLine,
  RiFileList3Line,
  RiTranslate2,
  RiMoonLine,
  RiSunLine,
  RiMenuLine,
  RiCloseLine,
  RiLogoutBoxRLine,
  RiUserLine,
} from 'react-icons/ri';
import { useTheme } from '../context/ThemeContext.jsx';

export const AppShell = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
    setShowNotifications(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/knowledge?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('shell-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path === '/documents') return location.pathname === '/documents' || (location.pathname.startsWith('/documents/') && location.pathname !== '/documents/chat');
    if (path === '/documents/chat') return location.pathname === '/documents/chat';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      id: 'workspace',
      label: 'Workspace',
      path: '/dashboard',
      icon: <RiDashboardLine size={16} />,
      badgeColor: 'text-[#8B5CF6]',
    },
    {
      id: 'image-ai',
      label: 'Image AI',
      path: '/create-post',
      icon: <RiImageLine size={16} />,
      badgeColor: 'text-[#8B5CF6]',
    },
    {
      id: 'text-ai',
      label: 'Text AI',
      path: '/summarize',
      icon: <RiFileList3Line size={16} />,
      badgeColor: 'text-[#3B82F6]',
    },
    {
      id: 'translate',
      label: 'Translate',
      path: '/translate',
      icon: <RiTranslate2 size={16} />,
      badgeColor: 'text-[#06B6D4]',
    },
    {
      id: 'knowledge',
      label: 'Knowledge',
      path: '/knowledge',
      icon: <RiBookOpenLine size={16} />,
      badgeColor: 'text-[#8B5CF6]',
    },
    {
      id: 'documents',
      label: 'Documents',
      path: '/documents',
      icon: <RiFolder2Line size={16} />,
      badgeColor: 'text-[#22D3EE]',
    },
    {
      id: 'ask-rag',
      label: 'Ask RAG',
      path: '/documents/chat',
      icon: <RiChat1Line size={16} />,
      badgeColor: 'text-[#22D3EE]',
    },
    {
      id: 'history',
      label: 'History',
      path: '/history',
      icon: <RiTimeLine size={16} />,
      badgeColor: 'text-[#8B5CF6]',
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/profile',
      icon: <RiSettings4Line size={16} />,
      badgeColor: 'text-[#94A3B8]',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050812] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#8B5CF6] selection:text-white relative overflow-x-hidden">
      {/* Ambient Grid & Lighting Background */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <div className="absolute inset-0 ai-grid-pattern opacity-30" />
        <div className="absolute top-12 left-1/4 w-[500px] h-[500px] rounded-full bg-[#8B5CF6]/10 blur-[150px] pointer-events-none" />
        <div className="absolute top-36 right-1/4 w-[500px] h-[500px] rounded-full bg-[#06B6D4]/8 blur-[160px] pointer-events-none" />
      </div>

      {/* TOP UNIFIED PORTAL HEADER */}
      <header className="relative z-30 w-full h-[66px] px-4 sm:px-8 border-b border-[#202A44]/70 bg-[#050812]/90 backdrop-blur-xl flex items-center justify-between shrink-0 shadow-lg shadow-black/40">
        {/* Left Section: Mobile Toggle + AITOOLS Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Navigation Menu"
            className="md:hidden p-2 rounded-xl bg-[#0B1020] border border-[#202A44] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
          >
            {isMobileMenuOpen ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
          </button>

          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 group shrink-0">
            <img src={logo} alt="AITOOLS Logo" className="w-28 h-8 object-contain transition-transform group-hover:scale-105" />
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 tracking-wide">
              AI WORKSPACE
            </span>
          </Link>
        </div>

        {/* Center Section: Global Quick Search */}
        <div className="hidden sm:flex items-center flex-1 max-w-md mx-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
              <RiSearchLine size={15} />
            </div>
            <input
              id="shell-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anything..."
              className="w-full pl-9 pr-16 py-1.5 bg-[#0B1020]/90 border border-[#202A44] focus:border-[#8B5CF6]/60 rounded-xl text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none transition-all"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#131B30] text-[#94A3B8] border border-[#202A44]">
                Ctrl + K
              </span>
            </div>
          </form>
        </div>

        {/* Right Section: Theme Toggle, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl bg-[#0B1020] border border-[#202A44] hover:border-[#8B5CF6]/50 text-[#94A3B8] hover:text-[#8B5CF6] transition-colors"
          >
            {darkMode ? <RiMoonLine size={16} /> : <RiSunLine size={16} className="text-amber-400" />}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              aria-label="Notifications"
              className="relative p-2 rounded-xl bg-[#0B1020] border border-[#202A44] hover:border-[#8B5CF6]/50 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              <RiNotification3Line size={16} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] font-bold flex items-center justify-center shadow-md">
                3
              </span>
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 ai-card-glass rounded-2xl p-3 shadow-2xl z-50 border border-[#202A44] animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-[#202A44] mb-2">
                  <span className="text-xs font-bold text-[#F8FAFC]">Notifications</span>
                  <span className="text-[10px] text-[#8B5CF6] cursor-pointer hover:underline">Mark read</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-xl bg-[#050812]/70 border border-[#202A44]/60">
                    <p className="text-[11px] font-medium text-[#F8FAFC]">All AI Tools Online</p>
                    <p className="text-[10px] text-[#94A3B8]">Image AI, Text AI, and Translate operational.</p>
                  </div>
                  <div className="p-2 rounded-xl bg-[#050812]/70 border border-[#202A44]/60">
                    <p className="text-[11px] font-medium text-[#F8FAFC]">Welcome to AITOOLS Portal</p>
                    <p className="text-[10px] text-[#94A3B8]">Your unified neural workspace is ready.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill or Login Controls */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-xl bg-[#0B1020] border border-[#202A44] hover:border-[#8B5CF6]/50 transition-colors group"
              >
                <img
                  src={avatar}
                  alt="User Avatar"
                  className="w-7 h-7 rounded-full object-cover border border-[#8B5CF6]/40 group-hover:scale-105 transition-transform"
                />
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-xs font-bold text-[#F8FAFC] leading-none">
                    {user?.name || 'Account'}
                  </span>
                  <span className="text-[10px] text-[#94A3B8] leading-tight mt-0.5">
                    {user?.role || 'User'}
                  </span>
                </div>
              </button>

              {/* User Profile Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 ai-card-glass rounded-2xl p-2 shadow-2xl z-50 border border-[#202A44] animate-fadeIn">
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#F8FAFC] hover:bg-[#8B5CF6]/15 hover:text-[#8B5CF6] transition-colors"
                  >
                    <RiUserLine size={15} />
                    <span>View Profile</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-950/40 transition-colors"
                  >
                    <RiLogoutBoxRLine size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#8B5CF6] hover:bg-[#8B5CF6]/30 px-3 py-1.5 rounded-xl transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* PORTAL BODY: UNIFIED SIDEBAR + ACTIVE TOOL VIEWPORT */}
      <div className="flex-1 flex w-full max-w-[1536px] mx-auto relative min-h-0">
        
        {/* PERSISTENT LEFT SIDEBAR NAVIGATION */}
        <aside
          className={`
            fixed md:sticky top-[66px] z-20 h-[calc(100vh-66px)] w-[230px] lg:w-[240px]
            bg-[#050812]/95 md:bg-[#050812]/70 backdrop-blur-xl border-r border-[#202A44]/70
            p-4 flex flex-col justify-between shrink-0 transition-transform duration-200 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          {/* Navigation Links */}
          <div className="space-y-4 overflow-y-auto no-scrollbar pr-0.5">
            <nav className="space-y-0.5" aria-label="Main Sidebar Navigation">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-200 ${
                      active
                        ? darkMode
                          ? 'font-bold bg-white text-[#0F172A] shadow-md border border-white sidebar-nav-active-dark'
                          : 'font-bold bg-[#0F172A] text-white shadow-md border border-[#0F172A] sidebar-nav-active-light'
                        : darkMode
                          ? 'font-semibold text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0B1020] border border-transparent'
                          : 'font-semibold text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] border border-transparent'
                    }`}
                  >
                    <span
                      className={
                        active
                          ? darkMode
                            ? 'text-[#0F172A]'
                            : 'text-white'
                          : darkMode
                            ? 'text-[#94A3B8]'
                            : 'text-[#64748B]'
                      }
                    >
                      {item.icon}
                    </span>
                    <span
                      className={
                        active
                          ? darkMode
                            ? 'text-[#0F172A]'
                            : 'text-white'
                          : ''
                      }
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* AI Systems Online Status Card */}
            <div className="p-2.5 rounded-xl bg-[#0B1020]/90 border border-[#202A44] shadow-sm">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#F8FAFC]">
                <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
                <span>AI SYSTEMS ONLINE</span>
              </div>
              <p className="mt-0.5 text-[10px] text-[#94A3B8]">All systems operational</p>
            </div>

            {/* AITOOLS PRO Card */}
            <div className="p-3 rounded-xl bg-gradient-to-b from-[#8B5CF6]/15 via-[#0B1020] to-[#0B1020] border border-[#8B5CF6]/30 shadow-md relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#F8FAFC] mb-1">
                <RiVipCrown2Fill className="text-amber-400" size={14} />
                <span className="bg-gradient-to-r from-amber-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                  AITOOLS PRO
                </span>
              </div>
              <p className="text-[10px] text-[#94A3B8] leading-tight mb-2.5">
                Unlock advanced models, higher limits and more.
              </p>
              <button
                type="button"
                onClick={() => toast.success('Pro features are currently enabled in this deployment!')}
                className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#06B6D4] hover:brightness-110 text-white font-bold text-xs shadow-md shadow-[#8B5CF6]/20 transition-all cursor-pointer"
              >
                Upgrade Now
              </button>
            </div>
          </div>

          {/* Bottom Area: Dark Mode Toggle & Copyright */}
          <div className="pt-4 border-t border-[#202A44]/60 space-y-3 shrink-0">
            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <RiMoonLine size={15} className="text-[#8B5CF6]" />
                <span className="text-[11px] font-medium text-[#F8FAFC]">Dark mode</span>
              </div>
              <button
                type="button"
                onClick={toggleDarkMode}
                role="switch"
                aria-checked={darkMode}
                aria-label="Toggle Dark Mode"
                className={`w-9 h-5 rounded-full p-0.5 transition-colors ${darkMode ? 'bg-[#8B5CF6]' : 'bg-[#202A44]'}`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
            </div>

            <div className="text-[10px] text-[#64748B] leading-tight">
              © 2026 AITOOLS<br />All rights reserved.
            </div>
          </div>
        </aside>

        {/* ACTIVE TOOL VIEWPORT */}
        <main className="flex-1 w-full p-3 sm:p-5 lg:p-6 min-w-0 overflow-y-auto max-w-[1300px]">
          {children}
        </main>
      </div>
    </div>
  );
};
