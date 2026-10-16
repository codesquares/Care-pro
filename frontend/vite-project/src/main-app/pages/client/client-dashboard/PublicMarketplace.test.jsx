import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import PublicMarketplace from './PublicMarketplace';
import ClientPackageService from '../../../services/clientPackageService';
import PublicPackageService from '../../../services/publicPackageService';
import { useAuth } from '../../../context/AuthContext';

jest.mock('../../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../../services/clientPackageService', () => ({ __esModule: true, default: { getPackages: jest.fn() } }));
jest.mock('../../../services/publicPackageService', () => ({ __esModule: true, default: { getPackageSummaries: jest.fn() } }));
jest.mock('../../../services/analyticsService', () => ({ trackEvent: jest.fn() }));

const PUBLIC = [
  { category: 'Adult/Elder Care', tierLabel: 'Essential Companion', description: 'Daily support', requiredCaregiverType: 'AuxiliaryNurse' },
  { category: 'Post Surgery Care', tierLabel: 'Essential Recovery', description: 'Recovery help', requiredCaregiverType: 'CHEW' },
];
const PRICED = PUBLIC.map((p, i) => ({ ...p, id: `p${i}`, basePrice: 50000 + i * 1000, additionalDayPrice: 0, requiredSpecialty: null }));

const Where = () => { const l = useLocation(); return <div data-testid="where">{l.pathname + l.search}</div>; };
const renderPage = (url = '/marketplace') => render(<MemoryRouter initialEntries={[url]}><PublicMarketplace /><Where /></MemoryRouter>);

beforeEach(() => {
  jest.clearAllMocks();
  PublicPackageService.getPackageSummaries.mockResolvedValue({ success: true, data: PUBLIC });
  ClientPackageService.getPackages.mockResolvedValue({ success: true, data: PRICED });
});

describe('PublicMarketplace follows the dashboard card pattern', () => {
  test('logged out: public endpoint only, price-free cards, no sign-in wall', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    renderPage();
    await waitFor(() => expect(screen.getByText('Adult & Elder Care')).toBeInTheDocument());
    expect(PublicPackageService.getPackageSummaries).toHaveBeenCalledTimes(1);
    expect(ClientPackageService.getPackages).not.toHaveBeenCalled();
    expect(document.querySelectorAll('.pkg-cat-card')).toHaveLength(2);
    expect(document.body.textContent).not.toMatch(/₦/);
    expect(screen.queryByText(/Sign in to view care packages/i)).toBeNull();
    expect(document.querySelector('.pkg-cat-grid--priced')).toBeNull();
  });

  test('logged out: selecting a tier follows the public home-page rule (sign up, return here)', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    renderPage();
    await waitFor(() => screen.getByText('Adult & Elder Care'));
    fireEvent.click(screen.getByText('Essential Companion'));
    fireEvent.click(screen.getAllByRole('button', { name: /View pricing & select/i })[0]);
    expect(screen.getByTestId('where').textContent).toBe(
      `/register?returnTo=${encodeURIComponent('/marketplace?category=Adult%2FElder+Care&q=Essential+Companion')}`);
  });

  test('logged in: authenticated catalog with prices, dashboard destination', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    renderPage();
    await waitFor(() => expect(screen.getByText('Adult & Elder Care')).toBeInTheDocument());
    expect(ClientPackageService.getPackages).toHaveBeenCalledTimes(1);
    expect(PublicPackageService.getPackageSummaries).not.toHaveBeenCalled();
    expect(document.body.textContent).toMatch(/From ₦50,000/);
    expect(document.querySelector('.pkg-cat-grid--priced')).not.toBeNull();
    fireEvent.click(screen.getByText('Essential Companion'));
    fireEvent.click(screen.getAllByRole('button', { name: /Select this package/i })[0]);
    expect(screen.getByTestId('where').textContent).toBe('/start-assessment?category=Adult%2FElder+Care&tier=Essential+Companion');
  });

  test('waits for auth to settle before fetching (no price-free flash for a signed-in client)', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: true });
    renderPage();
    await new Promise((r) => setTimeout(r, 50));
    expect(PublicPackageService.getPackageSummaries).not.toHaveBeenCalled();
    expect(ClientPackageService.getPackages).not.toHaveBeenCalled();
    expect(screen.getByText(/Loading care packages/i)).toBeInTheDocument();
  });

  test('?category= filters to that category', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    renderPage('/marketplace?category=Post%20Surgery%20Care');
    await waitFor(() => screen.getByRole('heading', { name: 'Post Surgery Care' }));
    expect(document.querySelectorAll('.pkg-cat-card')).toHaveLength(1);
  });

  test('error state is friendly (no raw error) and retry works', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    PublicPackageService.getPackageSummaries.mockResolvedValueOnce({ success: false, data: [] });
    renderPage();
    await waitFor(() => screen.getByText(/We couldn't load care packages/i, { selector: 'h3' }));
    expect(document.body.textContent).not.toMatch(/Error|undefined|AxiosError/);
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
    await waitFor(() => screen.getByText('Adult & Elder Care'));
  });

  test('empty catalog shows a friendly message', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    PublicPackageService.getPackageSummaries.mockResolvedValue({ success: true, data: [] });
    renderPage();
    await waitFor(() => screen.getByText(/No care packages available yet/i));
  });
});
