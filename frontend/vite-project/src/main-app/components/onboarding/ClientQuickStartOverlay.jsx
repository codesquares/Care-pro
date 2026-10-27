import './clientOnboarding.css';
import { useClientOnboarding } from '../../context/ClientOnboardingContext';

const STEP_CONTENT = {
  step_1_dashboard_orientation: {
    title: 'Dashboard orientation',
    body: 'Start here: your dashboard gives you quick access to care packages, your care requests, and your wallet.',
  },
  step_2_marketplace_search: {
    title: 'Browse care packages',
    body: 'Browse care packages by category. You choose the package; CarePro assigns a vetted caregiver for you.',
  },
  step_3_service_detail_actions: {
    title: 'Start with a free assessment',
    body: 'Pick a package to chat with our care team about a free care assessment. They arrange everything from there.',
  },
  step_4_checkout_basics: {
    title: 'Payment basics',
    body: 'When your package is confirmed, you will see a clear payment breakdown and pay securely.',
  },
  step_5_commitment_explainer_conditional: {
    title: 'Messaging your caregiver',
    body: 'Once a caregiver accepts your request you can message them from that request. There is no payment needed to chat.',
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
