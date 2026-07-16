import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useClientOnboarding } from '../../../context/ClientOnboardingContext';

const OnboardingQaHarness = () => {
  const location = useLocation();
  const {
    walkthrough,
    uiStatus,
    loading,
    runtimeGateEnabled,
    runtimeEligibleGigCount,
    startQuickStart,
    continueCurrentStep,
    skipCurrentStep,
    dismissQuickStart,
    refreshState,
    markTipSeen,
    isTipSeen,
    setMarketplaceFilterContext,
    isCanonicalClientRoute,
    isSuppressedAlias,
  } = useClientOnboarding();

  const [tipVariant, setTipVariant] = useState('access_required');
  const [qaLogs, setQaLogs] = useState([]);
  const [networkLogsVersion, setNetworkLogsVersion] = useState(0);

  const pushLog = (message) => {
    setQaLogs((prev) => [
      `${new Date().toISOString()} | ${message}`,
      ...prev,
    ].slice(0, 25));
  };

  const stepStates = useMemo(() => walkthrough?.stepStates || [], [walkthrough?.stepStates]);
  const onboardingNetLog = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return Array.isArray(window.__onboardingNetLog) ? window.__onboardingNetLog : [];
  }, [networkLogsVersion]);

  const runAction = async (label, fn) => {
    pushLog(`START ${label}`);
    try {
      await fn();
      setNetworkLogsVersion((v) => v + 1);
      pushLog(`OK ${label}`);
    } catch (error) {
      setNetworkLogsVersion((v) => v + 1);
      pushLog(`ERR ${label} | ${error?.message || 'unknown error'}`);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Client Onboarding QA Harness</h2>
      <p>Use this page to trigger walkthrough actions and tip events while collecting UI and network evidence.</p>

      <div style={{ marginBottom: 12 }}>
        <strong>Route:</strong> {location.pathname}
      </div>
      <div style={{ marginBottom: 12 }}>
        <strong>Canonical client route:</strong> {String(isCanonicalClientRoute)}
      </div>
      <div style={{ marginBottom: 12 }}>
        <strong>Suppressed alias:</strong> {String(isSuppressedAlias)}
      </div>
      <div style={{ marginBottom: 12 }}>
        <strong>Loading:</strong> {String(loading)}
      </div>
      <div style={{ marginBottom: 12 }}>
        <strong>UI status:</strong> {uiStatus}
      </div>
      <div style={{ marginBottom: 12 }}>
        <strong>Walkthrough status:</strong> {walkthrough?.status || 'n/a'}
      </div>
      <div style={{ marginBottom: 12 }}>
        <strong>Current step:</strong> {walkthrough?.currentStep || 'n/a'}
      </div>
      <div style={{ marginBottom: 12 }}>
        <strong>Version:</strong> {walkthrough?.version ?? 'n/a'}
      </div>
      <div style={{ marginBottom: 12 }}>
        <strong>Content version:</strong> {walkthrough?.contentVersion || 'n/a'}
      </div>
      <div style={{ marginBottom: 12 }}>
        <strong>Runtime gate enabled:</strong> {String(runtimeGateEnabled)}
      </div>
      <div style={{ marginBottom: 12 }}>
        <strong>Runtime eligible gig count:</strong> {String(runtimeEligibleGigCount)}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => {
            setMarketplaceFilterContext({
              sortBy: '',
              priceRange: { min: '', max: '' },
              serviceType: '',
              location: '',
              minRating: '',
              quickFilter: '',
              searchTerm: '__QA_FORCE_EMPTY_MARKETPLACE__',
            });
            pushLog('SET marketplace filter context to forced-empty searchTerm');
          }}
        >
          Force empty marketplace filter
        </button>
        <button
          type="button"
          onClick={() => {
            setMarketplaceFilterContext({
              sortBy: '',
              priceRange: { min: '', max: '' },
              serviceType: '',
              location: '',
              minRating: '',
              quickFilter: '',
              searchTerm: '',
            });
            pushLog('RESET marketplace filter context');
          }}
        >
          Reset marketplace filter
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button type="button" onClick={() => runAction('refreshState', refreshState)}>Refresh state</button>
        <button type="button" onClick={() => runAction('startQuickStart', startQuickStart)}>Start quick-start</button>
        <button type="button" onClick={() => runAction('continueCurrentStep', continueCurrentStep)}>Continue step</button>
        <button type="button" onClick={() => runAction('skipCurrentStep', skipCurrentStep)}>Skip step</button>
        <button type="button" onClick={() => runAction('dismissQuickStart', dismissQuickStart)}>Dismiss all</button>
      </div>

      <div style={{ borderTop: '1px solid #ddd', paddingTop: 12, marginTop: 12 }}>
        <h3>Tip Testing</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <label htmlFor="tipVariant">Chat tip variant</label>
          <select id="tipVariant" value={tipVariant} onChange={(e) => setTipVariant(e.target.value)}>
            <option value="access_required">access_required</option>
            <option value="access_granted">access_granted</option>
            <option value="gate_disabled">gate_disabled</option>
          </select>
          <button
            type="button"
            onClick={() => runAction('markTipSeen tip_chat_access_status', () => markTipSeen({
              tipKey: 'tip_chat_access_status',
              context: {
                route: location.pathname,
                caregiverId: 'qa-caregiver',
                conversationId: 'qa-conversation',
              },
              displayVariant: tipVariant,
            }))}
          >
            Mark tip seen
          </button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>tip_chat_access_status seen:</strong> {String(isTipSeen('tip_chat_access_status'))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #ddd', paddingTop: 12, marginTop: 12 }}>
        <h3>Network Log</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button type="button" onClick={() => setNetworkLogsVersion((v) => v + 1)}>Refresh network log</button>
          <button
            type="button"
            onClick={() => {
              window.__onboardingNetLog = [];
              setNetworkLogsVersion((v) => v + 1);
            }}
          >
            Clear network log
          </button>
        </div>
        <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
          {JSON.stringify(onboardingNetLog, null, 2)}
        </pre>
      </div>

      <div style={{ borderTop: '1px solid #ddd', paddingTop: 12, marginTop: 12 }}>
        <h3>Step States</h3>
        <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
          {JSON.stringify(stepStates, null, 2)}
        </pre>
      </div>

      <div style={{ borderTop: '1px solid #ddd', paddingTop: 12, marginTop: 12 }}>
        <h3>Action Log</h3>
        <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 6, overflowX: 'auto' }}>
          {qaLogs.join('\n') || 'No actions yet'}
        </pre>
      </div>
    </div>
  );
};

export default OnboardingQaHarness;
