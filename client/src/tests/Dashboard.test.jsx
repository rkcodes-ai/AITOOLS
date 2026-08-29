import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard.jsx';
import { AppShell } from '../components/AppShell.jsx';

// Mock axios
jest.mock('axios', () => ({
  create: () => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn().mockResolvedValue({ success: true, data: [] }),
    post: jest.fn(),
    delete: jest.fn(),
  }),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  get: jest.fn().mockResolvedValue({ success: true, data: [] }),
  post: jest.fn(),
  delete: jest.fn(),
}));

// Mock API calls
jest.mock('../services/api/generations.js', () => ({
  getGenerationsApi: jest.fn().mockResolvedValue({ success: true, data: [] }),
  deleteGenerationApi: jest.fn().mockResolvedValue({ success: true }),
  getWorkspaceStatsApi: jest.fn().mockResolvedValue({ success: true, data: { total: 0, images: 0, summaries: 0, translations: 0 } }),
}));

// Mock AuthContext
const mockLogout = jest.fn();
jest.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { name: 'Alice Johnson', email: 'alice@aitools.io', role: 'Student' },
    isAuthenticated: true,
    isLoading: false,
    logout: mockLogout,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('AITOOLS Phase 10 Dashboard UI & Architecture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Renders top navigation with branding, tabs, search, and user profile', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AppShell>
            <Dashboard />
          </AppShell>
        </MemoryRouter>
      );
    });

    // Top Nav / Sidebar Workspace & Tool items
    expect(screen.getAllByText(/Workspace/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Image AI/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Text AI/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Translate/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/History/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Knowledge/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Documents/i).length).toBeGreaterThan(0);

    // User Profile
    expect(screen.getByText(/Alice Johnson/i)).toBeInTheDocument();
    expect(screen.getByText(/Student/i)).toBeInTheDocument();

    // Search input
    expect(screen.getByPlaceholderText(/Search anything\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText(/Ctrl \+ K/i)).toBeInTheDocument();
  });

  test('2. Renders Hero section with welcome heading and AI status', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AppShell>
            <Dashboard />
          </AppShell>
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Welcome back, Alice!/i)).toBeInTheDocument();
    expect(screen.getByText(/workspace\./i)).toBeInTheDocument();
    expect(screen.getByText(/Create, understand, and discover — from one place\./i)).toBeInTheDocument();
    expect(screen.getAllByText(/AI SYSTEMS ONLINE/i).length).toBeGreaterThan(0);
  });

  test('3. Renders AI Orbital Core with 4 capability nodes (IMAGE, TEXT, TRANSLATE, KNOWLEDGE)', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AppShell>
            <Dashboard />
          </AppShell>
        </MemoryRouter>
      );
    });

    expect(screen.getAllByText('IMAGE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TEXT').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TRANSLATE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('KNOWLEDGE').length).toBeGreaterThan(0);
  });

  test('4. Renders all 4 Main AI Tool Cards with titles and descriptions', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AppShell>
            <Dashboard />
          </AppShell>
        </MemoryRouter>
      );
    });

    expect(screen.getAllByText(/Image AI/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Create from text').length).toBeGreaterThan(0);

    expect(screen.getAllByText(/Text AI/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Understand & transform text')).toBeInTheDocument();

    expect(screen.getAllByText(/Translate/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Translate across languages').length).toBeGreaterThan(0);

    expect(screen.getAllByText(/Knowledge/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Search & explore').length).toBeGreaterThan(0);
  });

  test('5. Renders Quick Start panel with all 4 action rows', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AppShell>
            <Dashboard />
          </AppShell>
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Quick Start')).toBeInTheDocument();
    expect(screen.getByText('New Text AI')).toBeInTheDocument();
    expect(screen.getByText('Summarize & transform text')).toBeInTheDocument();

    expect(screen.getByText('Create an image')).toBeInTheDocument();
    expect(screen.getAllByText('Generate from text').length).toBeGreaterThan(0);

    expect(screen.getByText('Translate text')).toBeInTheDocument();

    expect(screen.getByText('Explore Knowledge')).toBeInTheDocument();
    expect(screen.getAllByText('Search & explore').length).toBeGreaterThan(0);
  });

  test('6. Renders Recent Activity panel with View all link and rows', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AppShell>
            <Dashboard />
          </AppShell>
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('View all')).toBeInTheDocument();
    expect(screen.getByText(/A futuristic city at night/i)).toBeInTheDocument();
    expect(screen.getByText(/Summary: The future of AI/i)).toBeInTheDocument();
  });

  test('7. Renders Sidebar Pro card, Dark mode toggle, and copyright', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AppShell>
            <Dashboard />
          </AppShell>
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/AITOOLS PRO/i)).toBeInTheDocument();
    expect(screen.getByText(/Upgrade Now/i)).toBeInTheDocument();
    expect(screen.getByText(/Dark mode/i)).toBeInTheDocument();
    expect(screen.getByText(/© 2026 AITOOLS/i)).toBeInTheDocument();
  });
});
