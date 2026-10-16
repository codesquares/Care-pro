import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import VettingLockGuard from './VettingLockGuard';
import { computeLockState } from '../utils/vettingLockout';

let mockLock;
jest.mock('../contexts/VettingLockoutContext', () => ({ useVettingLockout: () => mockLock }));

const Where = () => <div data-testid="where">{useLocation().pathname}</div>;
const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <VettingLockGuard><Routes><Route path="*" element={<Where />} /></Routes></VettingLockGuard>
  </MemoryRouter>
);
const locked = () => ({ status: 'ready', ...computeLockState({ ready: true, enforcementDate: '2020-01-01', classificationSet: false, guarantorCount: 0, addressComplete: false, clearance: null }) });

test('locked: /profile, /dashboard and a deep link are redirected to the hub', () => {
  for (const p of ['/app/caregiver/profile', '/app/caregiver/dashboard', '/app/caregiver/assignments/9']) {
    mockLock = locked();
    const { unmount } = renderAt(p);
    expect(screen.getByTestId('where').textContent).toBe('/app/caregiver/vetting');
    unmount();
  }
});

test('locked: every open-list route stays where it is', () => {
  for (const p of ['/app/caregiver/vetting', '/app/caregiver/vetting/police-clearance', '/app/caregiver/wallet', '/app/caregiver/settings', '/app/caregiver/message', '/app/caregiver/notifications', '/app/caregiver/verification', '/app/caregiver/assessment', '/app/caregiver/earnings', '/app/caregiver/withdraw']) {
    mockLock = locked();
    const { unmount } = renderAt(p);
    expect(screen.getByTestId('where').textContent).toBe(p);
    unmount();
  }
});

test('unlocked after refresh: same path now renders', () => {
  mockLock = locked();
  const { unmount } = renderAt('/app/caregiver/profile');
  expect(screen.getByTestId('where').textContent).toBe('/app/caregiver/vetting');
  unmount();
  mockLock = { status: 'ready', ...computeLockState({ ready: true, enforcementDate: '2020-01-01', classificationSet: true, guarantorCount: 2, addressComplete: true, clearance: null }) };
  renderAt('/app/caregiver/profile');
  expect(screen.getByTestId('where').textContent).toBe('/app/caregiver/profile');
});

test('fail open: error status lets everything through; loading holds back only locked paths', () => {
  mockLock = { status: 'error', ...computeLockState({ ready: false }) };
  let r = renderAt('/app/caregiver/dashboard');
  expect(screen.getByTestId('where').textContent).toBe('/app/caregiver/dashboard');
  r.unmount();
  mockLock = { status: 'loading', locked: false, missing: [] };
  r = renderAt('/app/caregiver/dashboard');
  expect(screen.getByTestId('vetting-lock-checking')).toBeTruthy();
  r.unmount();
  renderAt('/app/caregiver/wallet');
  expect(screen.getByTestId('where').textContent).toBe('/app/caregiver/wallet');
});
