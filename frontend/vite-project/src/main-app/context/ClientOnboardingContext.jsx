import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ClientGigService from '../services/clientGigService';
import { getCommitmentGateEnabled } from '../services/publicConfigService';
import clientOnboardingService, {
  QUICKSTART_STEPS,
  WALKTHROUGH_CONTENT_VERSION,
} from '../services/clientOnboardingService';
import { isResolvedStepState } from '../utils/onboardingRuntime';
import ClientQuickStartOverlay from '../components/onboarding/ClientQuickStartOverlay';

const SUPPRESSED_ALIASES = ['/MyOrders', '/OrderTasks&Details'];
const EMPTY_FILTERS = Object.freeze({
  sortBy: '',
  priceRange: { min: '', max: '' },
  serviceType: '',
  location: '',
  minRating: '',
  quickFilter: '',
  searchTerm: '',
});

const ClientOnboardingContext = createContext(null);

const ACTION_RULES = Object.freeze({
  start: { fromStatuses: ['not_started'], requiresStepKey: true },
  continue_step: { fromStatuses: ['in_progress'], requiresStepKey: true },
  skip_step: { fromStatuses: ['in_progress'], requiresStepKey: true },
  dismiss_all: { fromStatuses: ['not_started', 'in_progress', 'paused', 'dismissed'], requiresStepKey: false },
  auto_skip_empty_marketplace: { fromStatuses: ['in_progress'], requiresStepKey: true },
  auto_skip_gate_inactive: { fromStatuses: ['in_progress'], requiresStepKey: true },
  auto_skip_no_eligible_gigs: { fromStatuses: ['in_progress'], requiresStepKey: true },
  pause: { fromStatuses: ['in_progress'], requiresStepKey: false },
  resume: { fromStatuses: ['paused'], requiresStepKey: false },
  complete_sequence: { fromStatuses: ['in_progress'], requiresStepKey: false },
});

const parseSeenTips = (seenTips) => {
  const map = new Map();
  (seenTips || []).forEach((tipEntry) => {
    const tipKey = tipEntry?.tipKey || tipEntry?.TipKey;
    if (tipKey) {
      map.set(tipKey, {
        ...tipEntry,
        tipKey,
        seenAt: tipEntry?.seenAt || tipEntry?.SeenAt || null,
      });
    }
  });
  return map;
};

const normalizeWalkthrough = (walkthrough) => {
  if (!walkthrough) {
    return {
      contentVersion: WALKTHROUGH_CONTENT_VERSION,
      status: 'not_started',
      currentStep: null,
      stepStates: [],
      version: 0,
    };
  }

  return {
    contentVersion: walkthrough.contentVersion || WALKTHROUGH_CONTENT_VERSION,
    status: walkthrough.status || 'not_started',
    currentStep: walkthrough.currentStep || null,
    stepStates: Array.isArray(walkthrough.stepStates) ? walkthrough.stepStates : [],
    version: Number.isFinite(walkthrough.version) ? walkthrough.version : 0,
    startedAt: walkthrough.startedAt || null,
    completedAt: walkthrough.completedAt || null,
    dismissedAt: walkthrough.dismissedAt || null,
  };
};

export const ClientOnboardingProvider = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, userRole } = useAuth();

  const [loading, setLoading] = useState(false);
  const [walkthrough, setWalkthrough] = useState(() => normalizeWalkthrough(null));
  const [seenTipsMap, setSeenTipsMap] = useState(() => new Map());
  const [marketplaceFilters, setMarketplaceFilters] = useState(EMPTY_FILTERS);
  const [runtimeGateEnabled, setRuntimeGateEnabled] = useState(null);
  const [runtimeEligibleGigCount, setRuntimeEligibleGigCount] = useState(null);

  const actionInFlightRef = useRef(false);

  const pathname = location.pathname;
  const isSuppressedAlias = SUPPRESSED_ALIASES.includes(pathname);
  const isCanonicalClientRoute = pathname.startsWith('/app/client/');
  const isClientSession = isAuthenticated && userRole === 'Client';

  const loadState = useCallback(async () => {
    if (!isClientSession || !isCanonicalClientRoute) {
      return null;
    }

    setLoading(true);
    try {
      const state = await clientOnboardingService.getState();
      const nextWalkthrough = normalizeWalkthrough(state.walkthrough);
      setWalkthrough(nextWalkthrough);
      setSeenTipsMap(parseSeenTips(state.seenTips));
      return nextWalkthrough;
    } catch (error) {
      console.error('Failed to fetch client onboarding state:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isCanonicalClientRoute, isClientSession]);

  const computeEligibleGigCount = useCallback(async () => {
    try {
      const allGigs = await ClientGigService.getAllGigs();
      const filtered = ClientGigService.applyAdvancedFilters(allGigs, marketplaceFilters || EMPTY_FILTERS);
      return Array.isArray(filtered) ? filtered.length : 0;
    } catch (error) {
      console.error('Failed to compute eligible gig count:', error);
      return 0;
    }
  }, [marketplaceFilters]);

  const updateWalkthrough = useCallback(async ({ action, stepKey = null, reason = 'user_click', metadata = {} }) => {
    if (actionInFlightRef.current) {
      return null;
    }

    const actionRule = ACTION_RULES[action];
    if (!actionRule) {
      console.warn(`Blocked onboarding action with unknown vocabulary: ${action}`);
      return null;
    }

    const currentStatus = walkthrough.status || 'not_started';
    if (!actionRule.fromStatuses.includes(currentStatus)) {
      console.warn(`Blocked onboarding action ${action} from status ${currentStatus}`);
      return null;
    }

    if (actionRule.requiresStepKey && !stepKey) {
      console.warn(`Blocked onboarding action ${action} because stepKey is required`);
      return null;
    }

    actionInFlightRef.current = true;

    const payload = {
      contentVersion: walkthrough.contentVersion || WALKTHROUGH_CONTENT_VERSION,
      version: walkthrough.version || 0,
      action,
      reason,
      metadata,
    };

    if (actionRule.requiresStepKey) {
      payload.stepKey = stepKey;
    }

    try {
      const result = await clientOnboardingService.updateWalkthrough(payload);

      if (result.conflict) {
        if (result.data?.walkthrough) {
          setWalkthrough(normalizeWalkthrough(result.data.walkthrough));
          setSeenTipsMap(parseSeenTips(result.data.seenTips));
        } else {
          await loadState();
        }
        return { conflict: true };
      }

      if (!result.ok) {
        console.error('Walkthrough update failed:', result.error);
        return null;
      }

      const responseWalkthrough = normalizeWalkthrough(result.data?.walkthrough);
      setWalkthrough((current) => ({
        ...current,
        ...responseWalkthrough,
      }));
      setSeenTipsMap(parseSeenTips(result.data?.seenTips));

      return responseWalkthrough;
    } finally {
      actionInFlightRef.current = false;
    }
  }, [loadState, walkthrough.contentVersion, walkthrough.version]);

  const ensureSequenceCompleted = useCallback(async () => {
    const status = walkthrough.status;
    if (status !== 'in_progress') return;
    if (walkthrough.currentStep) return;

    const hasResolvedStep = (stepKey) => walkthrough.stepStates.some((s) => {
      if (s.stepKey !== stepKey) return false;
      return isResolvedStepState(s.state);
    });

    const mandatoryResolved = [
      'step_1_dashboard_orientation',
      'step_2_marketplace_search',
      'step_3_service_detail_actions',
      'step_4_checkout_basics',
    ].every(hasResolvedStep);

    const conditionalResolved = hasResolvedStep('step_5_commitment_explainer_conditional') || runtimeGateEnabled === false;

    if (mandatoryResolved && conditionalResolved) {
      await updateWalkthrough({
        action: 'complete_sequence',
        reason: 'system_guard',
        metadata: {
          route: pathname,
          eligibleGigCount: runtimeEligibleGigCount,
          gateEnabledLive: runtimeGateEnabled,
        },
      });
    }
  }, [pathname, runtimeEligibleGigCount, runtimeGateEnabled, updateWalkthrough, walkthrough.currentStep, walkthrough.status, walkthrough.stepStates]);

  useEffect(() => {
    loadState();
  }, [loadState, pathname]);

  useEffect(() => {
    if (!isClientSession || !isCanonicalClientRoute || isSuppressedAlias) {
      return;
    }

    if (walkthrough.status === 'paused') {
      updateWalkthrough({
        action: 'resume',
        reason: 'system_guard',
        metadata: { route: pathname },
      });
    }
  }, [isCanonicalClientRoute, isClientSession, isSuppressedAlias, pathname, updateWalkthrough, walkthrough.status]);

  useEffect(() => {
    if (isSuppressedAlias) {
      return;
    }

    if (walkthrough.status !== 'in_progress') {
      return;
    }

    if (!isClientSession || !isCanonicalClientRoute) {
      updateWalkthrough({
        action: 'pause',
        reason: 'system_guard',
        metadata: { route: pathname },
      });
    }
  }, [isCanonicalClientRoute, isClientSession, isSuppressedAlias, pathname, updateWalkthrough, walkthrough.status]);

  useEffect(() => {
    if (walkthrough.status !== 'in_progress') {
      return;
    }

    if (runtimeGateEnabled === null || runtimeEligibleGigCount === null) {
      let cancelled = false;

      const hydrateRuntimeContext = async () => {
        const [gateEnabledLive, eligibleGigCount] = await Promise.all([
          getCommitmentGateEnabled({ forceRefresh: true }),
          computeEligibleGigCount(),
        ]);

        if (cancelled) return;
        setRuntimeGateEnabled(gateEnabledLive);
        setRuntimeEligibleGigCount(eligibleGigCount);
      };

      hydrateRuntimeContext();

      return () => {
        cancelled = true;
      };
    }

    const currentStep = walkthrough.currentStep;
    if (!currentStep) {
      ensureSequenceCompleted();
      return;
    }

    if (currentStep === 'step_3_service_detail_actions' || currentStep === 'step_4_checkout_basics') {
      if (runtimeEligibleGigCount === 0) {
        updateWalkthrough({
          action: 'auto_skip_empty_marketplace',
          stepKey: currentStep,
          reason: 'empty_marketplace',
          metadata: {
            route: pathname,
            eligibleGigCount: 0,
            gateEnabledLive: runtimeGateEnabled,
          },
        });
      }
    }

    if (currentStep === 'step_5_commitment_explainer_conditional') {
      if (runtimeGateEnabled === false) {
        updateWalkthrough({
          action: 'auto_skip_gate_inactive',
          stepKey: currentStep,
          reason: 'gate_inactive',
          metadata: {
            route: pathname,
            eligibleGigCount: runtimeEligibleGigCount,
            gateEnabledLive: false,
          },
        });
      } else if (runtimeEligibleGigCount === 0) {
        updateWalkthrough({
          action: 'auto_skip_no_eligible_gigs',
          stepKey: currentStep,
          reason: 'no_eligible_gigs',
          metadata: {
            route: pathname,
            eligibleGigCount: 0,
            gateEnabledLive: runtimeGateEnabled,
          },
        });
      }
    }
  }, [
    ensureSequenceCompleted,
    pathname,
    runtimeEligibleGigCount,
    runtimeGateEnabled,
    computeEligibleGigCount,
    updateWalkthrough,
    walkthrough.currentStep,
    walkthrough.status,
  ]);

  const startQuickStart = useCallback(async () => {
    if (!isClientSession || !isCanonicalClientRoute) return;

    const gateEnabledLive = await getCommitmentGateEnabled({ forceRefresh: true });
    const eligibleGigCount = await computeEligibleGigCount();

    setRuntimeGateEnabled(gateEnabledLive);
    setRuntimeEligibleGigCount(eligibleGigCount);

    await updateWalkthrough({
      action: 'start',
      stepKey: 'step_1_dashboard_orientation',
      reason: 'user_click',
      metadata: {
        route: pathname,
        eligibleGigCount,
        gateEnabledLive,
      },
    });
  }, [computeEligibleGigCount, isCanonicalClientRoute, isClientSession, pathname, updateWalkthrough]);

  const continueCurrentStep = useCallback(async () => {
    if (!walkthrough.currentStep) return;

    await updateWalkthrough({
      action: 'continue_step',
      stepKey: walkthrough.currentStep,
      reason: 'user_click',
      metadata: {
        route: pathname,
        eligibleGigCount: runtimeEligibleGigCount,
        gateEnabledLive: runtimeGateEnabled,
      },
    });
  }, [pathname, runtimeEligibleGigCount, runtimeGateEnabled, updateWalkthrough, walkthrough.currentStep]);

  const skipCurrentStep = useCallback(async () => {
    if (!walkthrough.currentStep) return;

    await updateWalkthrough({
      action: 'skip_step',
      stepKey: walkthrough.currentStep,
      reason: 'user_click',
      metadata: {
        route: pathname,
        eligibleGigCount: runtimeEligibleGigCount,
        gateEnabledLive: runtimeGateEnabled,
      },
    });
  }, [pathname, runtimeEligibleGigCount, runtimeGateEnabled, updateWalkthrough, walkthrough.currentStep]);

  const dismissQuickStart = useCallback(async () => {
    await updateWalkthrough({
      action: 'dismiss_all',
      reason: 'user_click',
      metadata: {
        route: pathname,
        eligibleGigCount: runtimeEligibleGigCount,
        gateEnabledLive: runtimeGateEnabled,
      },
    });
  }, [pathname, runtimeEligibleGigCount, runtimeGateEnabled, updateWalkthrough]);

  const markTipSeen = useCallback(async ({ tipKey, context = {}, displayVariant }) => {
    if (!tipKey) return;

    try {
      await clientOnboardingService.markTipSeen({
        tipKey,
        context,
        displayVariant,
      });

      setSeenTipsMap((currentMap) => {
        const next = new Map(currentMap);
        next.set(tipKey, {
          tipKey,
          seenAt: new Date().toISOString(),
          context,
          displayVariant,
        });
        return next;
      });
    } catch (error) {
      console.error(`Failed to mark tip seen for ${tipKey}:`, error);
    }
  }, []);

  const isTipSeen = useCallback((tipKey) => seenTipsMap.has(tipKey), [seenTipsMap]);

  const uiStatus = walkthrough.status === 'not_started' ? 'prompt_visible' : walkthrough.status;
  const shouldRenderOnboarding =
    isClientSession &&
    isCanonicalClientRoute &&
    !isSuppressedAlias &&
    (uiStatus === 'prompt_visible' || uiStatus === 'in_progress');

  const isRenderingStep4or5 = shouldRenderOnboarding && uiStatus === 'in_progress' && (
    walkthrough.currentStep === 'step_4_checkout_basics' || walkthrough.currentStep === 'step_5_commitment_explainer_conditional'
  );

  const value = useMemo(() => ({
    loading,
    walkthrough,
    quickStartSteps: QUICKSTART_STEPS,
    uiStatus,
    shouldRenderOnboarding,
    isRenderingStep4or5,
    runtimeGateEnabled,
    runtimeEligibleGigCount,
    startQuickStart,
    continueCurrentStep,
    skipCurrentStep,
    dismissQuickStart,
    markTipSeen,
    isTipSeen,
    refreshState: loadState,
    setMarketplaceFilterContext: setMarketplaceFilters,
    isCanonicalClientRoute,
    isSuppressedAlias,
  }), [
    continueCurrentStep,
    dismissQuickStart,
    isCanonicalClientRoute,
    isRenderingStep4or5,
    isSuppressedAlias,
    isTipSeen,
    loadState,
    loading,
    markTipSeen,
    runtimeEligibleGigCount,
    runtimeGateEnabled,
    shouldRenderOnboarding,
    skipCurrentStep,
    startQuickStart,
    uiStatus,
    walkthrough,
  ]);

  return (
    <ClientOnboardingContext.Provider value={value}>
      {children}
      <ClientQuickStartOverlay />
    </ClientOnboardingContext.Provider>
  );
};

export const useClientOnboarding = () => {
  const context = useContext(ClientOnboardingContext);
  if (!context) {
    throw new Error('useClientOnboarding must be used within ClientOnboardingProvider');
  }
  return context;
};
