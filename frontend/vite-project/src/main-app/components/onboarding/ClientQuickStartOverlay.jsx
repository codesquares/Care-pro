import './clientOnboarding.css';
import { useClientOnboarding } from '../../context/ClientOnboardingContext';

const STEP_CONTENT = {
  step_1_dashboard_orientation: {
    title: 'Dashboard orientation',
    body: 'Start here: your dashboard gives you access to messages, orders, and quick hiring actions.',
  },
  step_2_marketplace_search: {
    title: 'Marketplace search',
    body: 'Use search, category, and filters to quickly find caregivers that match your care needs.',
  },
  step_3_service_detail_actions: {
    title: 'Service detail actions',
    body: 'On service detail pages, compare options, read reviews, and use Message or Hire actions.',
  },
  step_4_checkout_basics: {
    title: 'Checkout basics',
    body: 'Review your service configuration, payment breakdown, and proceed to secure checkout.',
  },
  step_5_commitment_explainer_conditional: {
    title: 'Commitment explainer',
    body: 'Some chats may require commitment payment before full access. This step appears only when active.',
  },
};

const STATUS_LABEL = {
  not_started: 'Not started',
  prompt_visible: 'Prompt visible',
  in_progress: 'In progress',
  paused: 'Paused',
  dismissed: 'Dismissed',
  completed: 'Completed',
};

const ClientQuickStartOverlay = () => {
  const {
    shouldRenderOnboarding,
    uiStatus,
    walkthrough,
    startQuickStart,
    continueCurrentStep,
    skipCurrentStep,
    dismissQuickStart,
    loading,
  } = useClientOnboarding();

  if (!shouldRenderOnboarding || loading) {
    return null;
  }

  const currentStep = walkthrough?.currentStep;
  const stepConfig = STEP_CONTENT[currentStep] || null;

  if (uiStatus === 'prompt_visible') {
    return (
      <aside className="client-onboarding-card" data-testid="client-quickstart-prompt">
        <h4>Quick-start walkthrough</h4>
        <p>This guided flow is skippable, non-blocking, and can be dismissed any time.</p>
        <div className="client-onboarding-actions">
          <button type="button" className="client-onboarding-btn primary" onClick={startQuickStart}>
            Start quick-start
          </button>
          <button type="button" className="client-onboarding-btn" onClick={dismissQuickStart}>
            Dismiss
          </button>
        </div>
      </aside>
    );
  }

  if (uiStatus !== 'in_progress' || !stepConfig) {
    return null;
  }

  return (
    <aside className="client-onboarding-card" data-testid="client-quickstart-step">
      <div className="client-onboarding-header">
        <h4>{stepConfig.title}</h4>
        <span>{STATUS_LABEL[walkthrough?.status] || 'In progress'}</span>
      </div>
      <p>{stepConfig.body}</p>
      <div className="client-onboarding-actions">
        <button type="button" className="client-onboarding-btn primary" onClick={continueCurrentStep}>
          Continue
        </button>
        <button type="button" className="client-onboarding-btn" onClick={skipCurrentStep}>
          Skip step
        </button>
        <button type="button" className="client-onboarding-btn" onClick={dismissQuickStart}>
          Dismiss all
        </button>
      </div>
    </aside>
  );
};

export default ClientQuickStartOverlay;
