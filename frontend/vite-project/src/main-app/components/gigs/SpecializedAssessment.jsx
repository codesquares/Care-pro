import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import specializedAssessmentService from '../../services/specializedAssessmentService';
import { toDisplayName } from '../../constants/serviceClassification';
import './specialized-assessment.css';

/**
 * SpecializedAssessment — Quiz component for specialized service assessments.
 *
 * Can be used as a standalone page (reads `category` from URL search params)
 * or embedded (receives `serviceCategory` + `onComplete` as props).
 *
 * Flow:
 *  1. Fetch questions from GET /api/Assessments/questions?serviceCategory=X
 *  2. Render one question at a time (multiple choice)
 *  3. Submit all answers via POST /api/Assessments/submit
 *  4. Show result (pass/fail, score, cooldown)
 */
const SpecializedAssessment = ({
  serviceCategory: propCategory,
  onComplete,
  onCancel,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const serviceCategory = propCategory || searchParams.get('category') || '';

  // ─── State ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState('loading'); // loading | intro | quiz | submitting | result | cooldown | error
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [requirements, setRequirements] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Session state (from getQuestions)
  const [sessionId, setSessionId] = useState(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null); // seconds
  const timerRef = useRef(null);

  const categoryDisplayName = toDisplayName(serviceCategory);

  // ─── Caregiver ID ────────────────────────────────────────────────────────
  const getCaregiverId = () => {
    try {
      const ud = JSON.parse(localStorage.getItem('userDetails') || '{}');
      return ud.id || null;
    } catch { return null; }
  };

  // ─── Load Requirements + History ─────────────────────────────────────────
  const loadInitialData = useCallback(async () => {
    if (!serviceCategory) {
      setError('No service category specified.');
      setStep('error');
      return;
    }

    try {
      setStep('loading');
      const caregiverId = getCaregiverId();

      // Fetch requirements + history in parallel
      const [reqRes, histRes] = await Promise.all([
        specializedAssessmentService.getServiceRequirements(),
        caregiverId
          ? specializedAssessmentService.getHistory(caregiverId, serviceCategory)
          : Promise.resolve({ success: true, data: [] }),
      ]);

      if (reqRes.success && Array.isArray(reqRes.data)) {
        const match = reqRes.data.find(r => r.serviceCategory === serviceCategory);
        setRequirements(match || null);
      }

      if (histRes.success) {
        const histData = histRes.data || {};
        const hist = Array.isArray(histData.items) ? histData.items : (Array.isArray(histData) ? histData : []);
        setHistory(hist);
        setHistoryHasMore(!!histData.hasMore);
        setHistoryPage(histData.page || 1);

        // Check if there's an active cooldown
        const lastAttempt = hist[0];
        if (lastAttempt?.nextRetryDate && new Date(lastAttempt.nextRetryDate) > new Date()) {
          setResult({
            passed: false,
            score: lastAttempt.score,
            threshold: requirements?.passingScore || 75,
            cooldownUntil: lastAttempt.nextRetryDate,
          });
          setStep('cooldown');
          return;
        }
      }

      setStep('intro');
    } catch (err) {
      console.error('Error loading assessment data:', err);
      setError('Failed to load assessment information. Please try again.');
      setStep('error');
    }
  }, [serviceCategory]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // ─── Start Quiz ──────────────────────────────────────────────────────────
  const handleStartQuiz = async () => {
    try {
      setStep('loading');
      setError('');

      const caregiverId = getCaregiverId();
      if (!caregiverId) {
        setError('Unable to identify your account. Please log in again.');
        setStep('error');
        return;
      }

      const res = await specializedAssessmentService.getQuestions(serviceCategory, caregiverId);
      if (!res.success || !res.data?.questions?.length) {
        setError(res.error || 'No questions are available for this category yet.');
        setStep('error');
        return;
      }

      const session = res.data;
      setSessionId(session.sessionId);
      setSessionExpiresAt(session.expiresAt);
      setQuestions(session.questions);
      setCurrentIdx(0);
      setAnswers({});

      // Start countdown timer if expiresAt is provided
      if (session.expiresAt) {
        startCountdownTimer(session.expiresAt);
      }

      setStep('quiz');
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load assessment questions. Please try again.');
      setStep('error');
    }
  };

  // ─── Countdown Timer ────────────────────────────────────────────────────
  const startCountdownTimer = (expiresAt) => {
    // Clear any existing timer
    if (timerRef.current) clearInterval(timerRef.current);

    const updateRemaining = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000));
      setTimeRemaining(diff);
      if (diff <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        // Auto-expire: show error
        setError('Your assessment session has expired. Please start a new session.');
        setStep('error');
      }
    };

    updateRemaining();
    timerRef.current = setInterval(updateRemaining, 1000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTimeRemaining = (seconds) => {
    if (seconds == null) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ─── Answer Selection ────────────────────────────────────────────────────
  const handleSelectAnswer = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  // ─── Navigation ──────────────────────────────────────────────────────────
  const goNext = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx((i) => i + 1);
  };
  const goPrev = () => {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  };

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const caregiverId = getCaregiverId();
    if (!caregiverId) {
      setError('Unable to identify your account. Please log in again.');
      setStep('error');
      return;
    }

    if (!sessionId) {
      setError('No active session. Please restart the assessment.');
      setStep('error');
      return;
    }

    // Stop the countdown timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      setStep('submitting');
      const res = await specializedAssessmentService.submitAssessment(
        caregiverId,
        serviceCategory,
        answers,
        sessionId,
      );

      if (res.sessionExpired) {
        setError('Your assessment session has expired. Please start a new session.');
        setStep('error');
        return;
      }

      if (res.sessionAlreadySubmitted) {
        setError('This assessment session has already been submitted.');
        setStep('error');
        return;
      }

      if (res.cooldown) {
        setResult(res.data);
        setStep('cooldown');
        return;
      }

      if (!res.success) {
        setError(res.error || 'Failed to submit assessment.');
        setStep('error');
        return;
      }

      setResult(res.data);
      setStep('result');

      // Notify parent if embedded
      if (onComplete) onComplete(res.data);
    } catch (err) {
      console.error('Error submitting assessment:', err);
      setError('Submission failed. Please try again.');
      setStep('error');
    }
  };

  // ─── Computed ────────────────────────────────────────────────────────────
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const allAnswered = answeredCount === totalQuestions;
  const currentQuestion = questions[currentIdx] || null;
  const progressPct = totalQuestions ? Math.round(((currentIdx + 1) / totalQuestions) * 100) : 0;

  const formatCooldownTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = new Date(dateStr) - new Date();
    if (diff <= 0) return 'now';
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // ─── Load more history ──────────────────────────────────────────────────
  const loadMoreHistory = async () => {
    const caregiverId = getCaregiverId();
    if (!caregiverId || historyLoading) return;
    try {
      setHistoryLoading(true);
      const nextPage = historyPage + 1;
      const res = await specializedAssessmentService.getHistory(caregiverId, serviceCategory, nextPage);
      if (res.success) {
        const histData = res.data || {};
        const newItems = Array.isArray(histData.items) ? histData.items : [];
        setHistory((prev) => [...prev, ...newItems]);
        setHistoryPage(histData.page || nextPage);
        setHistoryHasMore(!!histData.hasMore);
      }
    } catch (err) {
      console.error('Error loading more history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ─── Render: Loading ─────────────────────────────────────────────────────
  if (step === 'loading' || step === 'submitting') {
    return (
      <div className="sa-container">
        <div className="sa-card sa-loading-card">
          <div className="sa-spinner" />
          <p>{step === 'submitting' ? 'Submitting your answers...' : 'Loading assessment...'}</p>
        </div>
      </div>
    );
  }

  // ─── Render: Error ───────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="sa-container">
        <div className="sa-card sa-error-card">
          <div className="sa-error-icon">⚠️</div>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <div className="sa-actions">
            <button className="sa-btn sa-btn-primary" onClick={loadInitialData}>Try Again</button>
            <button className="sa-btn sa-btn-secondary" onClick={() => onCancel ? onCancel() : navigate(-1)}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Cooldown ────────────────────────────────────────────────────
  if (step === 'cooldown') {
    const cooldownUntil = result?.cooldownUntil;
    return (
      <div className="sa-container">
        <div className="sa-card sa-cooldown-card">
          <div className="sa-cooldown-icon">⏳</div>
          <h2>Cooldown Period Active</h2>
          <p>
            You've recently attempted this assessment. You can retake it in{' '}
            <strong>{formatCooldownTime(cooldownUntil)}</strong>.
          </p>
          {result?.score !== undefined && (
            <p className="sa-last-score">
              Last score: <strong>{result.score}%</strong> (passing: {result.threshold || 75}%)
            </p>
          )}
          <div className="sa-actions">
            <button className="sa-btn sa-btn-secondary" onClick={() => onCancel ? onCancel() : navigate(-1)}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Intro ───────────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <div className="sa-container">
        <div className="sa-card sa-intro-card">
          <div className="sa-intro-badge">{categoryDisplayName}</div>
          <h2>Specialized Assessment</h2>
          <p className="sa-intro-desc">
            This assessment verifies your expertise in <strong>{categoryDisplayName}</strong>.
            Answer all questions to the best of your knowledge.
          </p>

          {requirements && (
            <div className="sa-info-grid">
              <div className="sa-info-item">
                <span className="sa-info-label">Questions</span>
                <span className="sa-info-value">{requirements.questionCount || '—'}</span>
              </div>
              <div className="sa-info-item">
                <span className="sa-info-label">Passing Score</span>
                <span className="sa-info-value">{requirements.passingScore || 75}%</span>
              </div>
              <div className="sa-info-item">
                <span className="sa-info-label">Cooldown</span>
                <span className="sa-info-value">{requirements.cooldownHours || 48}h</span>
              </div>
              {(requirements.sessionDurationMinutes || requirements.sessionDurationMinutes === 0) && (
                <div className="sa-info-item">
                  <span className="sa-info-label">Time Limit</span>
                  <span className="sa-info-value">{requirements.sessionDurationMinutes} min</span>
                </div>
              )}
              {(requirements.assessmentValidityMonths > 0) && (
                <div className="sa-info-item">
                  <span className="sa-info-label">Valid For</span>
                  <span className="sa-info-value">{requirements.assessmentValidityMonths} months</span>
                </div>
              )}
              {requirements.requiredCertificates?.length > 0 && (
                <div className="sa-info-item sa-info-full">
                  <span className="sa-info-label">Required Certificates</span>
                  <span className="sa-info-value">
                    {requirements.requiredCertificates.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {history.length > 0 && (
            <div className="sa-history-summary">
              <h4>Previous Attempts</h4>
              <ul>
                {history.slice(0, 5).map((h, i) => (
                  <li key={h.attemptId || i} className={h.passed ? 'sa-hist-pass' : 'sa-hist-fail'}>
                    <span>{new Date(h.date).toLocaleDateString()}</span>
                    <span className="sa-hist-score">{h.score}%</span>
                    <span className={`sa-hist-badge ${h.passed ? 'pass' : 'fail'}`}>
                      {h.passed ? 'Passed' : 'Failed'}
                    </span>
                  </li>
                ))}
              </ul>
              {historyHasMore && (
                <button
                  className="sa-btn sa-btn-secondary sa-btn-sm"
                  onClick={loadMoreHistory}
                  disabled={historyLoading}
                  style={{ marginTop: '0.5rem' }}
                >
                  {historyLoading ? 'Loading…' : 'Load More'}
                </button>
              )}
            </div>
          )}

          <div className="sa-actions">
            <button className="sa-btn sa-btn-primary" onClick={handleStartQuiz}>
              Start Assessment
            </button>
            <button className="sa-btn sa-btn-secondary" onClick={() => onCancel ? onCancel() : navigate(-1)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Result ──────────────────────────────────────────────────────
  if (step === 'result' && result) {
    const passed = result.passed;
    return (
      <div className="sa-container">
        <div className={`sa-card sa-result-card ${passed ? 'sa-result-pass' : 'sa-result-fail'}`}>
          <div className="sa-result-icon">{passed ? '🎉' : '😞'}</div>
          <h2>{passed ? 'Assessment Passed!' : 'Assessment Not Passed'}</h2>
          <div className="sa-score-display">
            <div className="sa-score-circle">
              <svg viewBox="0 0 120 120">
                <circle className="sa-score-bg" cx="60" cy="60" r="54" />
                <circle
                  className={`sa-score-fg ${passed ? 'pass' : 'fail'}`}
                  cx="60" cy="60" r="54"
                  strokeDasharray={`${(2 * Math.PI * 54 * result.score) / 100} ${2 * Math.PI * 54}`}
                  strokeDashoffset="0"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <span className="sa-score-text">{result.score}%</span>
            </div>
            <p className="sa-threshold-text">
              Passing score: {result.threshold || 75}%
            </p>
          </div>

          {passed ? (
            <p className="sa-result-msg">
              Congratulations! You are now eligible to publish gigs in <strong>{categoryDisplayName}</strong>.
              Make sure your required certificates are uploaded and verified.
            </p>
          ) : (
            <p className="sa-result-msg">
              You didn't reach the passing score this time.
              {result.cooldownUntil && (
                <> You can retake the assessment in <strong>{formatCooldownTime(result.cooldownUntil)}</strong>.</>
              )}
            </p>
          )}

          <div className="sa-actions">
            {passed ? (
              <button
                className="sa-btn sa-btn-primary"
                onClick={() => navigate('/app/caregiver/create-gigs')}
              >
                Create a Gig
              </button>
            ) : (
              <button
                className="sa-btn sa-btn-primary"
                onClick={() => onCancel ? onCancel() : navigate(-1)}
              >
                Go Back
              </button>
            )}
            <button
              className="sa-btn sa-btn-secondary"
              onClick={() => navigate('/app/caregiver/specialized-assessments')}
            >
              View All Assessments
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Quiz ────────────────────────────────────────────────────────
  return (
    <div className="sa-container">
      <div className="sa-card sa-quiz-card">
        {/* Header */}
        <div className="sa-quiz-header">
          <span className="sa-quiz-category">{categoryDisplayName}</span>
          {timeRemaining != null && (
            <span className={`sa-quiz-timer ${timeRemaining <= 300 ? 'sa-timer-warning' : ''}`}>
              ⏱ {formatTimeRemaining(timeRemaining)}
            </span>
          )}
          <span className="sa-quiz-progress">
            Question {currentIdx + 1} / {totalQuestions}
          </span>
        </div>

        {/* Progress bar */}
        <div className="sa-progress-bar">
          <div className="sa-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Question */}
        {currentQuestion && (
          <div className="sa-question-block">
            <h3 className="sa-question-text">{currentQuestion.question}</h3>
            {currentQuestion.difficultyLevel && (
              <span className={`sa-difficulty sa-diff-${currentQuestion.difficultyLevel.toLowerCase()}`}>
                {currentQuestion.difficultyLevel}
              </span>
            )}

            <div className="sa-options">
              {currentQuestion.options?.map((opt, i) => {
                const isSelected = answers[currentQuestion.id] === opt;
                return (
                  <button
                    key={i}
                    className={`sa-option ${isSelected ? 'sa-option-selected' : ''}`}
                    onClick={() => handleSelectAnswer(currentQuestion.id, opt)}
                  >
                    <span className="sa-option-letter">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="sa-option-text">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="sa-quiz-nav">
          <button
            className="sa-btn sa-btn-secondary"
            onClick={goPrev}
            disabled={currentIdx === 0}
          >
            Previous
          </button>

          <div className="sa-answer-count">
            {answeredCount}/{totalQuestions} answered
          </div>

          {currentIdx === totalQuestions - 1 ? (
            <button
              className="sa-btn sa-btn-primary sa-btn-submit"
              onClick={handleSubmit}
              disabled={!allAnswered}
              title={!allAnswered ? 'Answer all questions before submitting' : ''}
            >
              Submit Assessment
            </button>
          ) : (
            <button className="sa-btn sa-btn-primary" onClick={goNext}>
              Next
            </button>
          )}
        </div>

        {/* Question navigator dots */}
        <div className="sa-question-nav-dots">
          {questions.map((q, i) => (
            <button
              key={q.id || i}
              className={`sa-dot ${i === currentIdx ? 'sa-dot-active' : ''} ${answers[q.id] ? 'sa-dot-answered' : ''}`}
              onClick={() => setCurrentIdx(i)}
              title={`Question ${i + 1}${answers[q.id] ? ' (answered)' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpecializedAssessment;
