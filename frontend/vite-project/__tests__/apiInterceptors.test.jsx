import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import api from '../src/main-app/services/api';
import { preserveUserJourney } from '../src/main-app/services/sessionRestoration';
import * as authService from '../src/main-app/services/auth';

// Mock dependencies
jest.mock('../src/main-app/services/sessionRestoration', () => ({
  preserveUserJourney: {
    save: jest.fn(),
    restore: jest.fn(),
    clear: jest.fn()
  }
}));

jest.mock('../src/main-app/services/auth', () => ({
  logout: jest.fn(),
  refreshToken: jest.fn()
}));

// Mock notification system. `showNotification` is checked as a bare global in
// api.js (`typeof showNotification === 'function'`) but nothing in the app
// actually assigns it to `global`/`window` — chatService.js and useMessaging.js
// each have their own same-named export/callback that never reaches this
// scope. That branch is effectively dead in production today; we test both
// what happens when it's wired up (as the interceptor code itself expects)
// and what happens in the real, current state where it's undefined.
const mockShowNotification = jest.fn();

describe('Enhanced API Interceptors', () => {
  let mock;
  let originalLocalStorage;
  let originalScrollY;

  beforeEach(() => {
    mock = new MockAdapter(api);

    originalLocalStorage = window.localStorage;
    window.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };

    originalScrollY = window.scrollY;
    Object.defineProperty(window, 'scrollY', {
      value: 150,
      configurable: true
    });

    delete global.showNotification;
    jest.clearAllMocks();
  });

  afterEach(() => {
    mock.restore();
    window.localStorage = originalLocalStorage;
    Object.defineProperty(window, 'scrollY', {
      value: originalScrollY,
      configurable: true
    });
    delete global.showNotification;
    jest.clearAllMocks();
  });

  describe('Request Interceptor', () => {
    test('should attach token to requests when available', async () => {
      window.localStorage.getItem.mockReturnValue('test-token');
      mock.onGet('/test').reply(200, { data: 'success' });

      await api.get('/test');

      expect(mock.history.get[0].headers.Authorization).toBe('Bearer test-token');
    });

    test('should abort non-public requests when no token is available', async () => {
      // api.js:90-101 — a non-public request with no token is aborted client-side
      // rather than sent, to avoid a futile round trip that would just 401.
      window.localStorage.getItem.mockReturnValue(null);
      mock.onGet('/protected').reply(200, { data: 'success' });

      await expect(api.get('/protected')).rejects.toMatchObject({
        code: 'ERR_CANCELED'
      });

      expect(mock.history.get).toHaveLength(0);
    });

    test('should attach an anonymous session id (not a token) for public endpoints when no token is available', async () => {
      window.localStorage.getItem.mockImplementation((key) =>
        key === 'carepro_anon_session_id' ? null : null
      );
      window.localStorage.setItem = jest.fn();
      mock.onGet('/Gigs').reply(200, { data: [] });

      await api.get('/Gigs');

      expect(mock.history.get[0].headers.Authorization).toBeUndefined();
      expect(mock.history.get[0].headers['X-Session-Id']).toBeTruthy();
    });

    test('should prefer an available token over anonymous session handling on public endpoints', async () => {
      window.localStorage.getItem.mockReturnValue('test-token');
      mock.onGet('/Gigs').reply(200, { data: [] });

      await api.get('/Gigs');

      expect(mock.history.get[0].headers.Authorization).toBe('Bearer test-token');
      expect(mock.history.get[0].headers['X-Session-Id']).toBeUndefined();
    });

    test('should handle localStorage errors gracefully', async () => {
      window.localStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      mock.onGet('/Gigs').reply(200, { data: 'success' });

      const response = await api.get('/Gigs');

      expect(response.data).toEqual({ data: 'success' });
      expect(mock.history.get[0].headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor - 401 Handling', () => {
    // These exercise a protected endpoint, so a token must be present or the
    // request interceptor aborts it before it ever reaches the mock adapter.
    beforeEach(() => {
      window.localStorage.getItem.mockReturnValue('old-token');
    });

    test('should preserve journey and logout on 401 error', async () => {
      authService.refreshToken.mockRejectedValue(new Error('Refresh failed'));
      mock.onGet('/protected').reply(401, { message: 'Unauthorized' });

      await expect(api.get('/protected')).rejects.toBeDefined();

      expect(preserveUserJourney.save).toHaveBeenCalledWith(
        window.location.pathname,
        expect.objectContaining({
          scrollPosition: 150
        })
      );
      expect(authService.logout).toHaveBeenCalled();
    });

    test('should preserve form data on 401 error when available', async () => {
      const mockFormData = { email: 'test@example.com', name: 'Test User' };
      global.extractFormData = jest.fn(() => mockFormData);
      authService.refreshToken.mockRejectedValue(new Error('Refresh failed'));
      mock.onGet('/protected').reply(401);

      await expect(api.get('/protected')).rejects.toBeDefined();

      expect(preserveUserJourney.save).toHaveBeenCalledWith(
        window.location.pathname,
        expect.objectContaining({
          formData: mockFormData,
          scrollPosition: 150
        })
      );

      delete global.extractFormData;
    });

    test('should not retry a request that has already been retried', async () => {
      mock.onGet('/protected').reply(401);

      await expect(
        api.get('/protected', { _retry: true })
      ).rejects.toBeDefined();

      expect(authService.refreshToken).not.toHaveBeenCalled();
      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(mock.history.get).toHaveLength(1);
    });

    test('should surface the original error body when refresh also fails', async () => {
      const customMessage = 'Token expired';
      authService.refreshToken.mockRejectedValue(new Error('Refresh failed'));
      mock.onGet('/protected').reply(401, { message: customMessage });

      await expect(api.get('/protected')).rejects.toMatchObject({
        response: { data: { message: customMessage } }
      });

      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('Response Interceptor - Server Error Handling', () => {
    beforeEach(() => {
      window.localStorage.getItem.mockReturnValue('test-token');
    });

    test('should show notification for 500 errors when showNotification is wired up', async () => {
      global.showNotification = mockShowNotification;
      mock.onGet('/server-error').reply(500, { message: 'Internal server error' });

      await expect(api.get('/server-error')).rejects.toBeDefined();

      expect(mockShowNotification).toHaveBeenCalledWith(
        'Server error. Please try again.',
        'error'
      );
    });

    test('should show notification for 502 and 503 errors when showNotification is wired up', async () => {
      global.showNotification = mockShowNotification;
      mock.onGet('/bad-gateway').reply(502);
      mock.onGet('/service-unavailable').reply(503);

      await expect(api.get('/bad-gateway')).rejects.toBeDefined();
      await expect(api.get('/service-unavailable')).rejects.toBeDefined();

      expect(mockShowNotification).toHaveBeenCalledTimes(2);
    });

    test('should not throw on 5xx errors in the real current state, where showNotification is not actually wired to any global', async () => {
      // This is today's real production behavior: nothing ever assigns
      // showNotification onto global/window, so `typeof showNotification`
      // resolves to 'undefined' and the notification branch is a silent no-op.
      mock.onGet('/server-error').reply(500, { message: 'Internal server error' });

      await expect(api.get('/server-error')).rejects.toMatchObject({
        response: { status: 500 }
      });
    });

    test('should not show notification for client errors (4xx)', async () => {
      global.showNotification = mockShowNotification;
      mock.onGet('/not-found').reply(404);
      mock.onPost('/bad-request').reply(400);

      await expect(api.get('/not-found')).rejects.toBeDefined();
      await expect(api.post('/bad-request')).rejects.toBeDefined();

      expect(mockShowNotification).not.toHaveBeenCalled();
    });
  });

  describe('Response Interceptor - Retry Logic', () => {
    beforeEach(() => {
      window.localStorage.getItem.mockReturnValue('old-token');
    });

    test('should attempt token refresh on 401 and retry the original request once', async () => {
      // authService.refreshToken() writes the new token to localStorage as a
      // real side effect (src/main-app/services/auth.js:21) — the retry goes
      // back through the request interceptor, which re-reads localStorage, so
      // the mock has to reflect that write or the retry sees the stale token.
      authService.refreshToken.mockImplementation(async () => {
        window.localStorage.getItem.mockReturnValue('new-token');
        return 'new-token';
      });

      mock
        .onGet('/protected').replyOnce(401)
        .onGet('/protected').reply(200, { data: 'success' });

      const response = await api.get('/protected');

      expect(authService.refreshToken).toHaveBeenCalled();
      expect(response.data).toEqual({ data: 'success' });
      expect(mock.history.get).toHaveLength(2); // Original + retry
      expect(mock.history.get[1].headers.Authorization).toBe('Bearer new-token');
    });

    test('should logout if refresh token fails', async () => {
      authService.refreshToken.mockRejectedValue(new Error('Refresh failed'));
      mock.onGet('/protected').reply(401);

      await expect(api.get('/protected')).rejects.toBeDefined();

      expect(authService.refreshToken).toHaveBeenCalled();
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('Response Interceptor - Network Errors', () => {
    beforeEach(() => {
      window.localStorage.getItem.mockReturnValue('test-token');
    });

    test('should handle network errors gracefully without triggering logout', async () => {
      mock.onGet('/network-error').networkError();

      await expect(api.get('/network-error')).rejects.toMatchObject({
        message: expect.stringContaining('Network Error')
      });

      expect(authService.logout).not.toHaveBeenCalled();
      expect(preserveUserJourney.save).not.toHaveBeenCalled();
    });

    test('should handle timeout errors without triggering logout', async () => {
      mock.onGet('/timeout').timeout();

      await expect(api.get('/timeout')).rejects.toMatchObject({
        code: 'ECONNABORTED'
      });

      expect(authService.logout).not.toHaveBeenCalled();
    });
  });

  describe('Form Data Extraction', () => {
    beforeEach(() => {
      window.localStorage.getItem.mockReturnValue('old-token');
      authService.refreshToken.mockRejectedValue(new Error('Refresh failed'));
    });

    test('should extract form data from DOM inputs on 401', async () => {
      document.body.innerHTML = `
        <form>
          <input name="email" value="test@example.com" />
          <input name="firstName" value="John" />
          <textarea name="message">Hello world</textarea>
          <select name="country">
            <option value="us" selected>United States</option>
          </select>
        </form>
      `;

      global.extractFormData = () => {
        const formData = {};
        document.querySelectorAll('input, textarea, select').forEach(input => {
          if (input.name && input.value) {
            formData[input.name] = input.value;
          }
        });
        return formData;
      };

      mock.onGet('/protected').reply(401);
      await expect(api.get('/protected')).rejects.toBeDefined();

      expect(preserveUserJourney.save).toHaveBeenCalledWith(
        window.location.pathname,
        expect.objectContaining({
          formData: {
            email: 'test@example.com',
            firstName: 'John',
            message: 'Hello world',
            country: 'us'
          }
        })
      );

      delete global.extractFormData;
    });

    test('should handle empty forms gracefully', async () => {
      document.body.innerHTML = '<div>No forms here</div>';
      global.extractFormData = () => ({});

      mock.onGet('/protected').reply(401);
      await expect(api.get('/protected')).rejects.toBeDefined();

      expect(preserveUserJourney.save).toHaveBeenCalledWith(
        window.location.pathname,
        expect.objectContaining({
          formData: {},
          scrollPosition: 150
        })
      );

      delete global.extractFormData;
    });
  });

  describe('Concurrent Request Handling', () => {
    beforeEach(() => {
      window.localStorage.getItem.mockReturnValue('old-token');
      authService.refreshToken.mockRejectedValue(new Error('Refresh failed'));
    });

    test('should handle multiple simultaneous 401s correctly', async () => {
      mock.onGet('/protected1').reply(401);
      mock.onGet('/protected2').reply(401);
      mock.onGet('/protected3').reply(401);

      await Promise.all([
        api.get('/protected1').catch(() => {}),
        api.get('/protected2').catch(() => {}),
        api.get('/protected3').catch(() => {})
      ]);

      // Journey preservation runs unconditionally per 401 (api.js:119-136, before
      // the refresh mutex), so all 3 requests trigger it independently.
      expect(preserveUserJourney.save).toHaveBeenCalledTimes(3);

      // The refresh mutex (isRefreshing, api.js:146-173) means only the request
      // that owns the in-flight refresh calls dispatchAuthLogout() on failure;
      // the other two are queued via subscribeTokenRefresh and just reject with
      // the original error (api.js:148-150) — no second/third logout call.
      expect(authService.logout).toHaveBeenCalledTimes(1);
    });

    test('should handle mixed response codes correctly', async () => {
      mock.onGet('/success').reply(200, { data: 'ok' });
      mock.onGet('/unauthorized').reply(401);
      mock.onGet('/server-error').reply(500);

      await Promise.all([
        api.get('/success'),
        api.get('/unauthorized').catch(() => {}),
        api.get('/server-error').catch(() => {})
      ]);

      expect(preserveUserJourney.save).toHaveBeenCalledTimes(1); // Only for 401
      expect(authService.logout).toHaveBeenCalledTimes(1); // Only for 401
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      window.localStorage.getItem.mockReturnValue('old-token');
      authService.refreshToken.mockRejectedValue(new Error('Refresh failed'));
    });

    test('should handle 401 responses without a response body', async () => {
      mock.onGet('/weird-error').reply(() => [401, null]);

      await expect(api.get('/weird-error')).rejects.toBeDefined();

      expect(authService.logout).toHaveBeenCalled();
    });

    test('should still logout when window.location is unavailable', async () => {
      const originalLocation = window.location;
      delete window.location;

      mock.onGet('/protected').reply(401);
      await expect(api.get('/protected')).rejects.toBeDefined();

      expect(authService.logout).toHaveBeenCalled();

      window.location = originalLocation;
    });

    test('should handle missing extractFormData function', async () => {
      delete global.extractFormData;
      mock.onGet('/protected').reply(401);

      await expect(api.get('/protected')).rejects.toBeDefined();

      expect(preserveUserJourney.save).toHaveBeenCalledWith(
        window.location.pathname,
        expect.objectContaining({
          scrollPosition: 150
        })
      );
    });
  });
});
