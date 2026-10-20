import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import ClientSubscriptions from './ClientSubscriptions';
import SubscriptionDetail from './SubscriptionDetail';
import PackageSubscriptionService, { billingNote } from '../../../services/packageSubscriptionService';

jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));
jest.mock('../../../services/packageSubscriptionService', () => {
  const actual = jest.requireActual('../../../services/packageSubscriptionService');
  return {
    __esModule: true,
    ...actual,
    default: { list: jest.fn(), get: jest.fn(), cancel: jest.fn() },
  };
});
jest.mock('../../../services/api', () => ({ __esModule: true, default: {} }));

const SUB = {
  id: 's1', packageRequestId: 'r1', packageCategory: 'Adult/Elder Care', packageTierLabel: 'Essential Companion',
  status: 'Active', baseAmount: 65000, gatewayFee: 910, recurringAmount: 65910, currency: 'NGN',
  currentPeriodStart: '2026-10-20T00:00:00Z', currentPeriodEnd: '2026-11-19T00:00:00Z', nextChargeDate: '2026-11-19T00:00:00Z',
  billingCyclesCompleted: 0, autoRenew: true, hasSavedCard: true, cardBrand: 'VISA', cardLastFour: '4242', cardExpiry: '09/30',
  cancelAtPeriodEnd: false, failedChargeAttempts: 0, payments: [],
};

const Where = () => <div data-testid="where">{useLocation().pathname}</div>;

const renderList = () => render(
  <MemoryRouter initialEntries={['/app/client/subscriptions']}>
    <Routes><Route path="/app/client/subscriptions" element={<ClientSubscriptions />} /></Routes>
    <Where />
  </MemoryRouter>
);
const renderDetail = () => render(
  <MemoryRouter initialEntries={['/app/client/subscriptions/s1']}>
    <Routes>
      <Route path="/app/client/subscriptions/:id" element={<SubscriptionDetail />} />
      <Route path="/app/client/subscriptions" element={<div>list page</div>} />
    </Routes>
    <Where />
  </MemoryRouter>
);

beforeEach(() => jest.clearAllMocks());

describe('client subscriptions list (package subscriptions)', () => {
  test('shows the fee-inclusive monthly amount, package name and saved card', async () => {
    PackageSubscriptionService.list.mockResolvedValue({ success: true, data: [SUB] });
    renderList();
    await waitFor(() => expect(screen.getByText('Adult/Elder Care')).toBeInTheDocument());
    expect(screen.getByText('Essential Companion')).toBeInTheDocument();
    expect(screen.getAllByText('₦65,910').length).toBeGreaterThan(0); // the amount that will actually be charged
    expect(screen.queryByText('₦65,000')).toBeNull();
    expect(screen.getByText(/VISA •••• 4242/)).toBeInTheDocument();
    expect(screen.getByText(/Next charge of ₦65,910/)).toBeInTheDocument();
  });

  test('a subscription with no saved card is flagged as not renewing', async () => {
    PackageSubscriptionService.list.mockResolvedValue({ success: true, data: [{ ...SUB, hasSavedCard: false, cardLastFour: null }] });
    renderList();
    await waitFor(() => expect(screen.getByText(/will not renew automatically/i)).toBeInTheDocument());
    expect(screen.getByText('No card saved')).toBeInTheDocument();
  });

  test('empty state when the client has none; does not call the old gig endpoints', async () => {
    PackageSubscriptionService.list.mockResolvedValue({ success: true, data: [] });
    renderList();
    await waitFor(() => expect(screen.getByText(/no recurring subscriptions/i)).toBeInTheDocument());
    expect(PackageSubscriptionService.list).toHaveBeenCalledTimes(1);
  });

  test('load failure shows an error instead of a blank page', async () => {
    PackageSubscriptionService.list.mockResolvedValue({ success: false, error: 'Boom' });
    renderList();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Boom'));
  });

  test('clicking a card opens its detail page', async () => {
    PackageSubscriptionService.list.mockResolvedValue({ success: true, data: [SUB] });
    renderList();
    await waitFor(() => screen.getByText('Adult/Elder Care'));
    fireEvent.click(screen.getByText('Adult/Elder Care'));
    expect(screen.getByTestId('where')).toHaveTextContent('/app/client/subscriptions/s1');
  });
});

describe('subscription detail', () => {
  test('breaks the renewal charge into package price + card fee = total', async () => {
    PackageSubscriptionService.get.mockResolvedValue({ success: true, data: SUB });
    renderDetail();
    await waitFor(() => expect(screen.getByText('Package price')).toBeInTheDocument());
    expect(screen.getByText('₦65,000')).toBeInTheDocument();
    expect(screen.getByText('₦910')).toBeInTheDocument();
    expect(screen.getByText('Charged each renewal').nextSibling).toHaveTextContent('₦65,910');
  });

  test('cancel needs a confirmation, then stops auto-renewal and shows the stopped state', async () => {
    PackageSubscriptionService.get.mockResolvedValue({ success: true, data: SUB });
    PackageSubscriptionService.cancel.mockResolvedValue({
      success: true,
      data: { ...SUB, status: 'PendingCancellation', nextChargeDate: null, autoRenew: false, cancelAtPeriodEnd: true },
    });
    renderDetail();
    await waitFor(() => screen.getByText('Cancel auto-renewal'));

    fireEvent.click(screen.getByText('Cancel auto-renewal'));
    expect(PackageSubscriptionService.cancel).not.toHaveBeenCalled(); // one click is not enough
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'Moving abroad' } });
    fireEvent.click(screen.getByText('Yes, stop auto-renewal'));

    await waitFor(() => expect(PackageSubscriptionService.cancel).toHaveBeenCalledWith('s1', 'Moving abroad'));
    await waitFor(() => expect(screen.getByText(/Auto-renewal stopped\. Your service continues until/)).toBeInTheDocument());
    expect(screen.queryByText('Cancel auto-renewal')).toBeNull();
  });

  test('"Keep it" backs out without cancelling', async () => {
    PackageSubscriptionService.get.mockResolvedValue({ success: true, data: SUB });
    renderDetail();
    await waitFor(() => screen.getByText('Cancel auto-renewal'));
    fireEvent.click(screen.getByText('Cancel auto-renewal'));
    fireEvent.click(screen.getByText('Keep it'));
    expect(PackageSubscriptionService.cancel).not.toHaveBeenCalled();
    expect(screen.getByText('Cancel auto-renewal')).toBeInTheDocument();
  });

  test('already-stopped subscriptions offer no cancel button', async () => {
    PackageSubscriptionService.get.mockResolvedValue({ success: true, data: { ...SUB, status: 'PendingCancellation', nextChargeDate: null } });
    renderDetail();
    await waitFor(() => screen.getByText('Package price'));
    expect(screen.queryByText('Cancel auto-renewal')).toBeNull();
  });

  test('lists past renewal charges with the amount that was charged', async () => {
    PackageSubscriptionService.get.mockResolvedValue({
      success: true,
      data: { ...SUB, billingCyclesCompleted: 1, payments: [{ id: 'p1', attemptedAt: '2026-11-19T00:00:00Z', billingCycleNumber: 1, amount: 65910, status: 'successful' }] },
    });
    renderDetail();
    await waitFor(() => screen.getByText('#1'));
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getAllByText('₦65,910').length).toBeGreaterThan(1);
  });

  test("someone else's / missing subscription shows a not-found error with a way back", async () => {
    PackageSubscriptionService.get.mockResolvedValue({ success: false, error: 'Subscription not found.' });
    renderDetail();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Subscription not found.'));
    fireEvent.click(screen.getByText('Back to subscriptions'));
    expect(screen.getByText('list page')).toBeInTheDocument();
  });
});

describe('billingNote', () => {
  test.each([
    ['PendingCancellation', 'warn'], ['Cancelled', 'muted'], ['Suspended', 'error'], ['PastDue', 'warn'],
  ])('%s -> %s', (status, tone) => expect(billingNote({ ...SUB, status }).tone).toBe(tone));
});
