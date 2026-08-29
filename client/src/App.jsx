import React from "react";
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { logo, avatar } from "./assets";
import Home from "./pages/Home";
import CreatePost from "./pages/CreatePost";
import Summarize from "./pages/Summarize";
import Translate from "./pages/Translate";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Documents from "./pages/Documents";
import DocumentDetail from "./pages/DocumentDetail";
import DocumentChat from "./pages/DocumentChat";
import Knowledge from "./pages/Knowledge";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider, useTheme } from "./context/ThemeContext.jsx";
import { ProtectedRoute } from "./components/ProtectedRoute.jsx";
import { AppShell } from "./components/AppShell.jsx";
import {
  RiLogoutBoxRLine,
  RiDashboardLine,
  RiMoonLine,
  RiSunLine,
} from "react-icons/ri";

const NavigationHeader = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="w-full flex justify-between items-center bg-[#050812]/90 backdrop-blur-xl sticky top-0 z-50 sm:px-8 px-4 py-3 border-b border-[#202A44]/70 shadow-lg shadow-black/40">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={logo} alt="AITOOLS Logo" className="w-28 h-8 object-contain transition-transform group-hover:scale-105" />
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
            AI WORKSPACE
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* If authenticated, provide quick Go to Workspace button */}
        {isAuthenticated && (
          <Link
            to="/dashboard"
            className="font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:from-[#7C3AED] hover:to-[#4F46E5] text-white px-3.5 py-1.5 rounded-xl text-xs shadow-md shadow-[#8B5CF6]/20 hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
          >
            <RiDashboardLine size={13} />
            <span>Workspace</span>
          </Link>
        )}

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          aria-label="Toggle theme"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-1.5 rounded-xl bg-[#0B1020] border border-[#202A44] hover:border-[#8B5CF6]/50 text-[#94A3B8] hover:text-[#8B5CF6] transition-colors"
        >
          {darkMode ? <RiMoonLine size={15} /> : <RiSunLine size={15} className="text-amber-400" />}
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-2 pl-2 border-l border-[#202A44]">
            <Link
              to="/profile"
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl bg-[#0B1020] border border-[#202A44] hover:border-[#8B5CF6]/50 text-[#F8FAFC] text-xs font-medium transition-colors"
              title="View Profile"
            >
              <img src={avatar} alt="User Avatar" className="w-5 h-5 rounded-full object-cover border border-[#8B5CF6]/40" />
              <span className="max-w-[85px] truncate">{user?.name || 'Account'}</span>
            </Link>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="p-1.5 rounded-xl bg-[#0B1020] border border-[#202A44] hover:bg-red-950/40 hover:border-red-500/50 text-[#94A3B8] hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <RiLogoutBoxRLine size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-[#202A44]">
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
  );
};

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isLandingPage = location.pathname === '/';

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#050812] text-[#F8FAFC] selection:bg-[#8B5CF6] selection:text-white">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    );
  }

  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-[#050812] text-[#F8FAFC] selection:bg-[#8B5CF6] selection:text-white">
        <NavigationHeader />
        <main className="w-full min-h-[calc(100vh-66px)]">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route
          path="/create-post"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/summarize"
          element={
            <ProtectedRoute>
              <Summarize />
            </ProtectedRoute>
          }
        />
        <Route
          path="/translate"
          element={
            <ProtectedRoute>
              <Translate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/knowledge"
          element={
            <ProtectedRoute>
              <Knowledge />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:id"
          element={
            <ProtectedRoute>
              <DocumentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/chat"
          element={
            <ProtectedRoute>
              <DocumentChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AppShell>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
