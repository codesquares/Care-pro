import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CareRequestService from '../../../services/careRequestService';
import './RequestCaregiver.css';

const serviceCategories = [
  { id: 'Adult Care', icon: '👴', description: 'Elderly care and daily living assistance' },
  { id: 'Child Care', icon: '👶', description: 'Babysitting, supervision, and child support' },
  { id: 'Pet Care', icon: '🐕', description: 'Pet sitting, walking, and animal care' },
  { id: 'Home Care', icon: '🏠', description: 'Housekeeping, cooking, and errands' },
  { id: 'Post Surgery Care', icon: '🏥', description: 'Post-operative recovery support' },
  { id: 'Special Needs Care', icon: '♿', description: 'Support for individuals with special needs' },
  { id: 'Medical Support', icon: '⚕️', description: 'Nursing and health monitoring' },
  { id: 'Mobility Support', icon: '🦽', description: 'Physical mobility and transport assistance' },
  { id: 'Therapy & Wellness', icon: '🧘', description: 'Therapy, rehab, and wellness support' },
  { id: 'Palliative', icon: '🕊️', description: 'Comfort and end-of-life care' },
];

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

const RequestCaregiver = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    serviceCategory: '',
    title: '',
    description: '',
    urgency: '',
    schedule: [],
    frequency: '',
    duration: '',
    location: '',
    budget: '',
    specialRequirements: '',
  });

  const [errors, setErrors] = useState({});

  // Pre-fill location from user profile
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

  const totalSteps = 3;

  const validateStep = (stepNum) => {
    const newErrors = {};

    if (stepNum === 1) {
      if (!form.serviceCategory) newErrors.serviceCategory = 'Please select a service category';
      if (!form.title.trim()) newErrors.title = 'Please provide a brief title';
      if (!form.description.trim()) newErrors.description = 'Please describe what you need';
    }

    if (stepNum === 2) {
      if (!form.urgency) newErrors.urgency = 'Please select how urgent this is';
      if (form.schedule.length === 0) newErrors.schedule = 'Please select at least one preferred time';
      if (!form.frequency) newErrors.frequency = 'Please select how often you need care';
    }

    // Step 3 has no required fields (location is pre-filled, rest is optional)

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

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    try {
      setIsSubmitting(true);
      await CareRequestService.submitCareRequest(form);
      setSubmitted(true);
      toast.success('Care request submitted successfully!');
    } catch (err) {
      console.error('Failed to submit care request:', err);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="request-caregiver-page">
        <div className="request-success">
          <div className="success-icon">✅</div>
          <h2>Request Submitted!</h2>
          <p>
            We've received your care request. Our team will review it and match you with
            available caregivers. You'll receive notifications when caregivers respond.
          </p>
          <div className="success-actions">
            <button className="btn-primary" onClick={() => navigate('/app/client/dashboard')}>
              Back to Dashboard
            </button>
            <button className="btn-secondary" onClick={() => navigate('/marketplace')}>
              Browse Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="request-caregiver-page">
      {/* Header */}
      <div className="request-header">
        <button className="back-btn" onClick={() => navigate('/app/client/dashboard')}>
          ← Back
        </button>
        <div>
          <h1>Request a Caregiver</h1>
          <p>Can't find the right caregiver? Tell us what you need and we'll help match you.</p>
        </div>
      </div>

      {/* Progress */}
      <div className="request-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
        <div className="progress-steps">
          {['Service Details', 'Schedule & Urgency', 'Location & Budget'].map((label, i) => (
            <span key={i} className={`step-label ${step >= i + 1 ? 'active' : ''} ${step > i + 1 ? 'completed' : ''}`}>
              <span className="step-number">{step > i + 1 ? '✓' : i + 1}</span>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Step 1: Service Details */}
      {step === 1 && (
        <div className="request-step">
          <h2>What type of care do you need?</h2>

          <div className="category-grid">
            {serviceCategories.map(cat => (
              <button
                key={cat.id}
                className={`category-card ${form.serviceCategory === cat.id ? 'selected' : ''}`}
                onClick={() => {
                  setForm(prev => ({ ...prev, serviceCategory: cat.id }));
                  setErrors(prev => ({ ...prev, serviceCategory: undefined }));
                }}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.id}</span>
                <span className="category-desc">{cat.description}</span>
              </button>
            ))}
          </div>
          {errors.serviceCategory && <p className="field-error">{errors.serviceCategory}</p>}

          <div className="form-field">
            <label>Request Title *</label>
            <input
              type="text"
              placeholder="e.g., Need an experienced elderly caregiver for my mother"
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
            <label>Describe what you need *</label>
            <textarea
              placeholder="Tell us about the care recipient, their condition, what kind of help they need, and any other important details..."
              value={form.description}
              onChange={e => {
                setForm(prev => ({ ...prev, description: e.target.value }));
                setErrors(prev => ({ ...prev, description: undefined }));
              }}
              rows={5}
              maxLength={2000}
            />
            <span className="char-count">{form.description.length}/2000</span>
            {errors.description && <p className="field-error">{errors.description}</p>}
          </div>
        </div>
      )}

      {/* Step 2: Schedule & Urgency */}
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

      {/* Step 3: Location & Budget */}
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

          {/* Summary */}
          <div className="request-summary">
            <h3>Request Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Service</span>
                <span className="summary-value">
                  {serviceCategories.find(c => c.id === form.serviceCategory)?.icon}{' '}
                  {form.serviceCategory}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Title</span>
                <span className="summary-value">{form.title}</span>
              </div>
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
            Next →
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
