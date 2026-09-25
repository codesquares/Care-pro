import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import caregiverVettingService, { CAREGIVER_TYPES } from '../../../services/caregiverVettingService';
import './vetting.css';

const MAX_SPECIALTY_LENGTH = 120;

const ClassificationForm = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [caregiverType, setCaregiverType] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 6000);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const result = await caregiverVettingService.getClassification();
      if (result.success && result.data) {
        setCaregiverType(result.data.caregiverType || '');
        setSpecialty(result.data.specialty || '');
      } else if (!result.success) {
        showToast('error', result.error);
      }
      setLoading(false);
    })();
  }, []);

  const isRegisteredNurse = caregiverType === 'RegisteredNurse';
  const specialtyTooLong = specialty.length > MAX_SPECIALTY_LENGTH;
  const canSubmit = !!caregiverType && !specialtyTooLong;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    const result = await caregiverVettingService.setClassification({
      caregiverType,
      specialty: isRegisteredNurse ? specialty.trim() : '',
    });
    if (result.success) {
      showToast('success', 'Classification saved.');
    } else {
      showToast('error', result.error);
    }
    setSaving(false);
  };

  return (
    <div className="vet-page">
      <div className="vet-header">
        <button className="vet-back-link" onClick={() => navigate('/app/caregiver/vetting')}>
          <i className="fas fa-arrow-left"></i> Back to Vetting
        </button>
        <h1><i className="fas fa-id-badge"></i> Classification</h1>
        <p>Tell us your caregiver type. If you're a Registered Nurse, you can also add your specialty (e.g. Midwifery).</p>
      </div>

      {toast && (
        <div className={`vet-alert vet-alert-${toast.type === 'error' ? 'error' : 'success'}`}>
          <i className={`fas fa-${toast.type === 'error' ? 'exclamation-circle' : 'check-circle'}`}></i>
          <div><p>{toast.msg}</p></div>
          <button className="vet-alert-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {loading ? (
        <div className="vet-pkg-loading"><div className="vet-spinner"></div><p>Loading…</p></div>
      ) : (
        <form className="vet-panel" onSubmit={handleSubmit}>
          <div className="vet-type-options">
            {CAREGIVER_TYPES.map((opt) => (
              <div
                key={opt.value}
                className={`vet-type-option${caregiverType === opt.value ? ' vet-type-option--selected' : ''}`}
                onClick={() => setCaregiverType(opt.value)}
              >
                <label>
                  <input
                    type="radio"
                    name="caregiverType"
                    value={opt.value}
                    checked={caregiverType === opt.value}
                    onChange={() => setCaregiverType(opt.value)}
                  />
                  {opt.label}
                </label>
              </div>
            ))}
          </div>

          {isRegisteredNurse && (
            <div className="vet-form-group">
              <label htmlFor="specialty">Specialty (optional)</label>
              <input
                id="specialty"
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Midwifery"
                maxLength={MAX_SPECIALTY_LENGTH + 20}
              />
              {specialtyTooLong && (
                <p className="vet-field-error">Specialty must be {MAX_SPECIALTY_LENGTH} characters or fewer.</p>
              )}
            </div>
          )}

          <div className="vet-form-actions">
            <button type="submit" className="vet-btn-primary" disabled={!canSubmit || saving}>
              {saving ? <><i className="fas fa-vet-spinner fa-spin"></i> Saving…</> : <><i className="fas fa-check"></i> Save Classification</>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ClassificationForm;
