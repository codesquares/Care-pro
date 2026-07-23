import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CareRequestService from '../../../services/careRequestService';
import { subscribeForPush, getSubscriptionState } from '../../../services/pushService';
import '../../client/client-dashboard/marketplaceHero.css';
import './RequestCaregiver.css';

const serviceTypesByGroup = {
  Medical: [
    'Adult Care',
    'Post Surgery Care',
    'Special Needs Care',
    'Medical Support',
    'Palliative',
    'Therapy & Wellness',
  ],
  'Non-Medical': [
    'Adult Care',
    'Child Care',
    'Pet Care',
    'Home Care',
    'Mobility Support',
  ],
};

const taskOptions = [
  'Mobility support',
  'Personal hygiene Support',
  'Meal preparation',
  'Medication reminders',
  'Companionship',
  'Light housekeeping',
  'Chronic illness management',
  'Night monitoring',
];

const experienceOptions = ['No preference', '1+ years', '2+ years', '3+ years', '5+ years'];
const certificationOptions = ['No preference', 'Caregiver training preferred', 'Certified nursing assistant', 'Licensed nurse required'];
const languageOptions = ['English', 'Yoruba', 'Igbo', 'Hausa', 'Pidgin', 'French'];

const urgencyOptions = [
  { id: 'within-24h', label: 'Urgent — Within 24 hours', color: '#ef4444' },
  { id: 'within-week', label: 'Soon — Within a week', color: '#f59e0b' },
  { id: 'within-month', label: 'Flexible — Within a month', color: '#10b981' },
  { id: 'no-rush', label: 'No rush — Just exploring', color: '#6366f1' },
];

const scheduleOptions = [
  'Morning (6 AM – 12 PM)',
  'Afternoon (12 PM – 6 PM)',
  'Evening (6 PM – 10 PM)',
  'Overnight (10 PM – 6 AM)',
  'Full Day',
  '24/7 Live-in',
  'Flexible',
];

const frequencyOptions = [
  'One-time',
  'Daily',
  'A few times a week',
  'Weekly',
  'As needed',
];

const stepLabels = ['Service Details', 'Schedule', 'Budget', 'Summary'];

const RequestCaregiver = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState(null);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [pushPromptLoading, setPushPromptLoading] = useState(false);

  const [form, setForm] = useState({
    serviceGroup: '',
    serviceCategory: '',
    title: '',
    tasks: [],
    notes: '',
    experiencePreference: '',
    certificationPreference: '',
    languagePreference: '',
    urgency: '',
    schedule: [],
    frequency: '',
    duration: '',
    location: '',
    budget: '',
    specialRequirements: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    try {
      const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
      if (userDetails.homeAddress || userDetails.location || userDetails.address) {
        setForm(prev => ({
          ...prev,
          location: userDetails.homeAddress || userDetails.location || userDetails.address || '',
        }));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const totalSteps = 4;

  const validateStep = (stepNum) => {
    const newErrors = {};

    if (stepNum === 1) {
      if (!form.serviceGroup) newErrors.serviceGroup = 'Please choose a service group';
      if (!form.serviceCategory) newErrors.serviceCategory = 'Please select a service type';
      if (!form.title.trim()) newErrors.title = 'Please provide a request title';
    }

    if (stepNum === 2) {
      if (!form.urgency) newErrors.urgency = 'Please select how urgent this is';
      if (form.schedule.length === 0) newErrors.schedule = 'Please select at least one preferred time';
      if (!form.frequency) newErrors.frequency = 'Please select how often you need care';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScheduleToggle = (option) => {
    setForm(prev => ({
      ...prev,
      schedule: prev.schedule.includes(option)
        ? prev.schedule.filter(s => s !== option)
        : [...prev.schedule, option],
    }));
    setErrors(prev => ({ ...prev, schedule: undefined }));
  };

  const handleTaskToggle = (task) => {
    setForm(prev => ({
      ...prev,
      tasks: prev.tasks.includes(task)
        ? prev.tasks.filter(t => t !== task)
        : [...prev.tasks, task],
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const result = await CareRequestService.submitCareRequest(form);
      setSubmittedRequestId(result?.id || result?.careRequestId || null);
      setSubmitted(true);
      toast.success('Care request submitted successfully!');

      // This is the moment the client most needs to be pulled back for match/
      // negotiation events — only prompt if they haven't already granted or
      // denied notification permission (matches ClientSettings.jsx's gating).
      getSubscriptionState()
        .then((state) => setShowPushPrompt(state.supported && state.permission === 'default'))
        .catch(() => {});
    } catch (err) {
      console.error('Failed to submit care request:', err);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnablePushFromPrompt = async () => {
    setPushPromptLoading(true);
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        await subscribeForPush();
        toast.success('Push notifications enabled — we\'ll let you know when caregivers respond.');
      }
    } catch (err) {
      console.error('[RequestCaregiver] Enable push failed:', err);
    } finally {
      setPushPromptLoading(false);
      setShowPushPrompt(false);
    }
  };

  const availableServiceTypes = form.serviceGroup
    ? serviceTypesByGroup[form.serviceGroup] || []
    : [];

  if (submitted) {
    return (
      <div className="request-caregiver-page">
        <div className="request-success">
          <div className="success-icon">✅</div>
          <h2>Request Submitted!</h2>
          <p>
            We've received your care request and our matching engine is now finding
            the best caregivers for you. You'll be notified when matches are ready.
          </p>
          <div className="matching-status-hint">
            <div className="matching-pulse" />
            <span>Finding caregivers...</span>
          </div>
          {showPushPrompt && (
            <div className="push-opt-in-prompt">
              <p>Get notified the moment a caregiver responds or your matches are ready.</p>
              <div className="push-opt-in-prompt-actions">
                <button
                  className="btn-primary"
                  onClick={handleEnablePushFromPrompt}
                  disabled={pushPromptLoading}
                >
                  {pushPromptLoading ? 'Enabling…' : 'Turn On Notifications'}
                </button>
                <button className="btn-secondary" onClick={() => setShowPushPrompt(false)}>
                  Not Now
                </button>
              </div>
            </div>
          )}
          <div className="success-actions">
            {submittedRequestId && (
              <button
                className="btn-primary"
                onClick={() => navigate(`/app/client/care-requests/${submittedRequestId}/matches`)}
              >
                View Matches
              </button>
            )}
            <button className="btn-secondary" onClick={() => navigate('/app/client/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="request-caregiver-page">
      {/* Header Banner */}
      <div className="marketplace-banner request-banner">
        <div className="marketplace-banner-content">
          <button className="back-btn" onClick={() => navigate('/app/client/dashboard')}>
            Back
          </button>
          <h1 className="marketplace-banner-title">Request a Caregiver</h1>
        </div>
        <p className="request-header-tagline">
          Can't find the right caregiver?<br />
          Tell us what you need &amp; we'll help match you.
        </p>
      </div>

      {/* Stepper */}
      <div className="request-stepper">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          return (
            <div key={label} className="stepper-item-wrapper">
              {i > 0 && <span className="stepper-chevron">&gt;</span>}
              <button
                className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => {
                  if (isCompleted) {
                    setStep(stepNum);
                    setErrors({});
                  }
                }}
                type="button"
              >
                <span className="stepper-number">{stepNum}</span>
                <span className="stepper-label">{label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Step 1: Service Details */}
      {step === 1 && (
        <div className="request-step">
          <h2>What type of care do you need?</h2>

          <div className="service-selection-row">
            <div className="service-group-section">
              <label className="field-label">Choose Service Group</label>
              <div className="radio-group">
                {Object.keys(serviceTypesByGroup).map(group => (
                  <label key={group} className="radio-option">
                    <input
                      type="radio"
                      name="serviceGroup"
                      value={group}
                      checked={form.serviceGroup === group}
                      onChange={() => {
                        setForm(prev => ({ ...prev, serviceGroup: group, serviceCategory: '' }));
                        setErrors(prev => ({ ...prev, serviceGroup: undefined, serviceCategory: undefined }));
                      }}
                    />
                    <span>{group}</span>
                  </label>
                ))}
              </div>
              {errors.serviceGroup && <p className="field-error">{errors.serviceGroup}</p>}
            </div>

            <div className="service-type-section">
              <label className="field-label">Choose Service Type</label>
              <div className="chip-grid">
                {availableServiceTypes.map(type => (
                  <button
                    key={type}
                    className={`chip ${form.serviceCategory === type ? 'selected' : ''}`}
                    onClick={() => {
                      setForm(prev => ({ ...prev, serviceCategory: type }));
                      setErrors(prev => ({ ...prev, serviceCategory: undefined }));
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {errors.serviceCategory && <p className="field-error">{errors.serviceCategory}</p>}
            </div>
          </div>

          <div className="form-field">
            <label>Request Title</label>
            <input
              type="text"
              placeholder="Experienced Elderly Caregiver Needed"
              value={form.title}
              onChange={e => {
                setForm(prev => ({ ...prev, title: e.target.value }));
                setErrors(prev => ({ ...prev, title: undefined }));
              }}
              maxLength={120}
            />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          <div className="form-field">
            <label className="field-label">Tasks Required:</label>
            <div className="chip-grid">
              {taskOptions.map(task => (
                <button
                  key={task}
                  className={`chip ${form.tasks.includes(task) ? 'selected' : ''}`}
                  onClick={() => handleTaskToggle(task)}
                >
                  {task}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>Notes</label>
            <textarea
              placeholder="My mother is calm and prefers someone patient and soft-spoken. She enjoys conversation and light walks. We need someone who can be consistent and kind."
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="form-field">
            <label className="field-label">Caregiver Preferences</label>
            <div className="preferences-row">
              <div className="preference-item">
                <span className="pref-label">Experience:</span>
                <select
                  value={form.experiencePreference}
                  onChange={e => setForm(prev => ({ ...prev, experiencePreference: e.target.value }))}
                >
                  <option value="">Select</option>
                  {experienceOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="preference-item">
                <span className="pref-label">Certifications:</span>
                <select
                  value={form.certificationPreference}
                  onChange={e => setForm(prev => ({ ...prev, certificationPreference: e.target.value }))}
                >
                  <option value="">Select</option>
                  {certificationOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="preference-item">
                <span className="pref-label">Language:</span>
                <select
                  value={form.languagePreference}
                  onChange={e => setForm(prev => ({ ...prev, languagePreference: e.target.value }))}
                >
                  <option value="">Select</option>
                  {languageOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Schedule */}
      {step === 2 && (
        <div className="request-step">
          <h2>When do you need care?</h2>

          <div className="form-field">
            <label>How urgent is this? *</label>
            <div className="urgency-grid">
              {urgencyOptions.map(opt => (
                <button
                  key={opt.id}
                  className={`urgency-card ${form.urgency === opt.id ? 'selected' : ''}`}
                  style={{ '--urgency-color': opt.color }}
                  onClick={() => {
                    setForm(prev => ({ ...prev, urgency: opt.id }));
                    setErrors(prev => ({ ...prev, urgency: undefined }));
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.urgency && <p className="field-error">{errors.urgency}</p>}
          </div>

          <div className="form-field">
            <label>Preferred time of day * <span className="hint">(select all that apply)</span></label>
            <div className="chip-grid">
              {scheduleOptions.map(opt => (
                <button
                  key={opt}
                  className={`chip ${form.schedule.includes(opt) ? 'selected' : ''}`}
                  onClick={() => handleScheduleToggle(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {errors.schedule && <p className="field-error">{errors.schedule}</p>}
          </div>

          <div className="form-field">
            <label>How often do you need care? *</label>
            <div className="chip-grid">
              {frequencyOptions.map(opt => (
                <button
                  key={opt}
                  className={`chip ${form.frequency === opt ? 'selected' : ''}`}
                  onClick={() => {
                    setForm(prev => ({ ...prev, frequency: opt }));
                    setErrors(prev => ({ ...prev, frequency: undefined }));
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
            {errors.frequency && <p className="field-error">{errors.frequency}</p>}
          </div>

          <div className="form-field">
            <label>Estimated duration per visit</label>
            <input
              type="text"
              placeholder="e.g., 4 hours, Full day, Overnight"
              value={form.duration}
              onChange={e => setForm(prev => ({ ...prev, duration: e.target.value }))}
            />
          </div>
        </div>
      )}

      {/* Step 3: Budget */}
      {step === 3 && (
        <div className="request-step">
          <h2>Where and what's your budget?</h2>

          <div className="form-field">
            <label>Location</label>
            <input
              type="text"
              placeholder="e.g., Lekki Phase 1, Lagos"
              value={form.location}
              onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
            />
            <span className="hint">Where the caregiver will be needed</span>
          </div>

          <div className="form-field">
            <label>Budget (₦ per day or per visit)</label>
            <input
              type="text"
              placeholder="e.g., ₦15,000 - ₦25,000"
              value={form.budget}
              onChange={e => setForm(prev => ({ ...prev, budget: e.target.value }))}
            />
            <span className="hint">Optional — helps us find caregivers in your range</span>
          </div>

          <div className="form-field">
            <label>Any special requirements?</label>
            <textarea
              placeholder="e.g., Female caregiver preferred, must speak Yoruba, needs to have experience with dementia patients..."
              value={form.specialRequirements}
              onChange={e => setForm(prev => ({ ...prev, specialRequirements: e.target.value }))}
              rows={4}
              maxLength={1000}
            />
          </div>
        </div>
      )}

      {/* Step 4: Summary */}
      {step === 4 && (
        <div className="request-step">
          <h2>Review your request</h2>

          <div className="request-summary">
            <h3>Request Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Service Group</span>
                <span className="summary-value">{form.serviceGroup}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Service Type</span>
                <span className="summary-value">{form.serviceCategory}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Title</span>
                <span className="summary-value">{form.title}</span>
              </div>
              {form.tasks.length > 0 && (
                <div className="summary-item full-width">
                  <span className="summary-label">Tasks</span>
                  <span className="summary-value">{form.tasks.join(', ')}</span>
                </div>
              )}
              {form.notes && (
                <div className="summary-item full-width">
                  <span className="summary-label">Notes</span>
                  <span className="summary-value">{form.notes}</span>
                </div>
              )}
              <div className="summary-item">
                <span className="summary-label">Urgency</span>
                <span className="summary-value">
                  {urgencyOptions.find(u => u.id === form.urgency)?.label}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Schedule</span>
                <span className="summary-value">{form.schedule.join(', ')}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Frequency</span>
                <span className="summary-value">{form.frequency}</span>
              </div>
              {form.duration && (
                <div className="summary-item">
                  <span className="summary-label">Duration</span>
                  <span className="summary-value">{form.duration}</span>
                </div>
              )}
              {form.location && (
                <div className="summary-item">
                  <span className="summary-label">Location</span>
                  <span className="summary-value">{form.location}</span>
                </div>
              )}
              {form.budget && (
                <div className="summary-item">
                  <span className="summary-label">Budget</span>
                  <span className="summary-value">{form.budget}</span>
                </div>
              )}
              {form.experiencePreference && (
                <div className="summary-item">
                  <span className="summary-label">Experience</span>
                  <span className="summary-value">{form.experiencePreference}</span>
                </div>
              )}
              {form.certificationPreference && (
                <div className="summary-item">
                  <span className="summary-label">Certifications</span>
                  <span className="summary-value">{form.certificationPreference}</span>
                </div>
              )}
              {form.languagePreference && (
                <div className="summary-item">
                  <span className="summary-label">Language</span>
                  <span className="summary-value">{form.languagePreference}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="request-nav">
        {step > 1 && (
          <button className="btn-secondary" onClick={handleBack}>
            ← Previous
          </button>
        )}
        <div className="nav-spacer" />
        {step < totalSteps ? (
          <button className="btn-primary" onClick={handleNext}>
            Next
          </button>
        ) : (
          <button
            className="btn-primary submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        )}
      </div>
    </div>
  );
};

export default RequestCaregiver;
