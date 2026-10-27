import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import caregiverVettingService, {
  GUARANTOR_RELATIONSHIP_CATEGORIES,
  GUARANTOR_LAST_CONTACT_OPTIONS,
  GUARANTOR_TRUST_OPTIONS,
  MIN_GUARANTOR_YEARS_KNOWN,
  MIN_HOW_THEY_KNOW_WORDS,
  countWords,
} from '../services/caregiverVettingService';
import './GuarantorConfirmationPage.css';

const EMPTY_FORM = {
  caregiverName: '',
  relationshipCategory: '',
  yearsKnown: '',
  lastContact: '',
  caregiverArea: '',
  howTheyKnow: '',
  trustAnswer: '',
  trustExplanation: '',
  phoneNo: '',
  declaration: false,
};

const GuarantorConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // 'loading' | 'invalid' | 'form' | 'already' | 'submitting' | 'success'
  const [phase, setPhase] = useState(token ? 'loading' : 'invalid');
  const [guarantorName, setGuarantorName] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitError, setSubmitError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    (async () => {
      const result = await caregiverVettingService.getGuarantorQuiz(token);
      if (cancelled) return;
      if (!result.success) {
        setPhase('invalid');
      } else if (result.data?.alreadyResponded) {
        setGuarantorName(result.data.guarantorName || '');
        setPhase('already');
      } else {
        setGuarantorName(result.data?.guarantorName || '');
        setPhase('form');
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const words = countWords(form.howTheyKnow);
  const needsExplanation = form.trustAnswer !== '' && form.trustAnswer !== 'yes';
  const yearsNumber = Number(form.yearsKnown);

  const canSubmit =
    form.caregiverName.trim().length >= 2 &&
    form.relationshipCategory &&
    form.yearsKnown !== '' && Number.isInteger(yearsNumber) && yearsNumber >= 0 && yearsNumber <= 80 &&
    form.lastContact &&
    form.caregiverArea.trim().length >= 2 &&
    words >= MIN_HOW_THEY_KNOW_WORDS &&
    form.trustAnswer &&
    (!needsExplanation || form.trustExplanation.trim().length > 0) &&
    form.declaration;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setPhase('submitting');
    setSubmitError('');
    const result = await caregiverVettingService.confirmGuarantorByToken(token, {
      caregiverName: form.caregiverName.trim(),
      relationshipCategory: form.relationshipCategory,
      yearsKnown: yearsNumber,
      lastContact: form.lastContact,
      caregiverArea: form.caregiverArea.trim(),
      howTheyKnow: form.howTheyKnow.trim(),
      trustAnswer: form.trustAnswer,
      trustExplanation: needsExplanation ? form.trustExplanation.trim() : null,
      phoneNo: form.phoneNo.trim() || null,
      declaration: form.declaration,
    });
    if (result.success) {
      setMessage(result.data?.message || 'Thank you. Your responses have been recorded.');
      setPhase('success');
    } else {
      setSubmitError(result.error || 'We could not record your answers. Please try again.');
      setPhase('form');
    }
  };

  const submitting = phase === 'submitting';

  return (
    <div className="gcp-page">
      <div className={`gcp-card ${phase === 'form' || submitting ? 'gcp-card--wide' : ''}`}>
        <div className="gcp-icon">🤝</div>
        <h1 className="gcp-title">Guarantor Confirmation</h1>

        {phase === 'loading' && <p className="gcp-intro">Loading…</p>}

        {phase === 'invalid' && (
          <>
            <p className="gcp-invalid">
              This confirmation link is invalid or has expired. Please use the link from the email you received.
            </p>
            <p className="gcp-help-text">
              Need help?{' '}
              <a href="mailto:codesquareltd@gmail.com" className="gcp-help-link">codesquareltd@gmail.com</a>
            </p>
          </>
        )}

        {phase === 'already' && (
          <div className="gcp-success-box">
            <p className="gcp-box-title">Already responded</p>
            <p className="gcp-box-message">You have already responded. No further action is needed.</p>
          </div>
        )}

        {phase === 'success' && (
          <div className="gcp-success-box">
            <p className="gcp-box-title">✅ Thank you</p>
            <p className="gcp-box-message">{message}</p>
          </div>
        )}

        {(phase === 'form' || submitting) && (
          <form className="gcp-form" onSubmit={handleSubmit}>
            <p className="gcp-intro">
              {guarantorName ? `Hello ${guarantorName}. ` : ''}
              A caregiver has listed you as a guarantor on CarePro. Before we record your confirmation,
              please answer a few short questions so we know you really know them. Answer honestly — if
              you are unsure of something, give your best answer.
            </p>

            <div className="gcp-field">
              <label htmlFor="gq-name">What is the caregiver&apos;s full name?</label>
              <input id="gq-name" type="text" value={form.caregiverName} onChange={set('caregiverName')} disabled={submitting} required />
            </div>

            <div className="gcp-field">
              <label htmlFor="gq-rel">How do you know them?</label>
              <select id="gq-rel" value={form.relationshipCategory} onChange={set('relationshipCategory')} disabled={submitting} required>
                <option value="">Select…</option>
                {GUARANTOR_RELATIONSHIP_CATEGORIES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="gcp-field">
              <label htmlFor="gq-years">How many years have you known them?</label>
              <input id="gq-years" type="number" min="0" max="80" step="1" value={form.yearsKnown} onChange={set('yearsKnown')} disabled={submitting} required />
              {form.yearsKnown !== '' && yearsNumber < MIN_GUARANTOR_YEARS_KNOWN && (
                <p className="gcp-hint">
                  Guarantors usually need to have known the caregiver for at least {MIN_GUARANTOR_YEARS_KNOWN} years.
                  You can still submit; our team will review your answers.
                </p>
              )}
            </div>

            <div className="gcp-field">
              <label htmlFor="gq-last">When did you last see or speak with them?</label>
              <select id="gq-last" value={form.lastContact} onChange={set('lastContact')} disabled={submitting} required>
                <option value="">Select…</option>
                {GUARANTOR_LAST_CONTACT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="gcp-field">
              <label htmlFor="gq-area">Which city and state do they currently live in?</label>
              <input id="gq-area" type="text" placeholder="e.g. Yaba, Lagos" value={form.caregiverArea} onChange={set('caregiverArea')} disabled={submitting} required />
            </div>

            <div className="gcp-field">
              <label htmlFor="gq-how">
                In your own words, how do you know them, and what have you seen of how they treat or look
                after other people?
              </label>
              <textarea id="gq-how" rows={5} value={form.howTheyKnow} onChange={set('howTheyKnow')} disabled={submitting} required />
              <p className={`gcp-hint ${words >= MIN_HOW_THEY_KNOW_WORDS ? 'gcp-hint--ok' : ''}`}>
                {words} / {MIN_HOW_THEY_KNOW_WORDS} words minimum
              </p>
            </div>

            <div className="gcp-field">
              <label htmlFor="gq-trust">
                Would you trust them to care for a vulnerable person (an elderly person, a child, someone
                who is ill) on their own?
              </label>
              <select id="gq-trust" value={form.trustAnswer} onChange={set('trustAnswer')} disabled={submitting} required>
                <option value="">Select…</option>
                {GUARANTOR_TRUST_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {needsExplanation && (
              <div className="gcp-field">
                <label htmlFor="gq-trust-why">Please explain your answer</label>
                <textarea id="gq-trust-why" rows={3} value={form.trustExplanation} onChange={set('trustExplanation')} disabled={submitting} required />
              </div>
            )}

            <div className="gcp-field">
              <label htmlFor="gq-phone">Your phone number <span className="gcp-optional">(optional)</span></label>
              <input id="gq-phone" type="tel" value={form.phoneNo} onChange={set('phoneNo')} disabled={submitting} />
              <p className="gcp-hint">Helps us reach you if we need to follow up.</p>
            </div>

            <label className="gcp-declaration">
              <input type="checkbox" checked={form.declaration} onChange={set('declaration')} disabled={submitting} />
              <span>I confirm that my answers are true and that I agree to act as this caregiver&apos;s guarantor.</span>
            </label>

            {submitError && (
              <div className="gcp-error-box">
                <p className="gcp-box-message">{submitError}</p>
              </div>
            )}

            <button type="submit" disabled={!canSubmit || submitting} className="gcp-confirm-btn">
              {submitting ? 'Submitting…' : 'Submit and confirm'}
            </button>
          </form>
        )}

        <p className="gcp-footer">
          <Link to="/" className="gcp-footer-link">Back to CarePro</Link>
        </p>
      </div>
    </div>
  );
};

export default GuarantorConfirmationPage;
