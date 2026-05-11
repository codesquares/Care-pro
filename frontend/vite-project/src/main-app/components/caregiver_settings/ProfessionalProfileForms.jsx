import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import professionalProfileService from '../../services/professionalProfileService';
import './ProfessionalProfileForms.css';

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' },   { value: 4, label: 'April' },
  { value: 5, label: 'May' },     { value: 6, label: 'June' },
  { value: 7, label: 'July' },    { value: 8, label: 'August' },
  { value: 9, label: 'September' },{ value: 10, label: 'October' },
  { value: 11, label: 'November' },{ value: 12, label: 'December' },
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);

const DEGREE_TYPES = ['B.Sc', 'HND', 'OND', 'M.Sc', 'PhD', 'Diploma', 'Certificate', 'Other'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Self-employed', 'Internship', 'Volunteer'];

// ─── Shared Helpers ───────────────────────────────────────────────────────────
const MonthYearSelect = ({ monthName, yearName, monthValue, yearValue, onChange, disabled }) => (
  <div className="ppf-month-year">
    <select name={monthName} value={monthValue || ''} onChange={onChange} disabled={disabled}>
      <option value="">Month</option>
      {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
    </select>
    <select name={yearName} value={yearValue || ''} onChange={onChange} disabled={disabled}>
      <option value="">Year</option>
      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
    </select>
  </div>
);

// ─── Education Form ───────────────────────────────────────────────────────────
const BLANK_EDU = {
  schoolName: '', degreeType: '', fieldOfStudy: '',
  startMonth: '', startYear: '', endMonth: '', endYear: '',
  currentlyStudying: false, grade: '', activities: '',
};

const EducationForm = ({ item, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(item || BLANK_EDU);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.schoolName.trim()) return toast.error('School name is required.');
    if (!form.degreeType) return toast.error('Please select a degree type.');
    if (!form.fieldOfStudy.trim()) return toast.error('Field of study is required.');
    if (!form.startMonth || !form.startYear) return toast.error('Start date is required.');
    if (!form.currentlyStudying && (!form.endMonth || !form.endYear)) return toast.error('End date is required (or check "Currently studying").');
    onSave({
      schoolName: form.schoolName.trim(),
      degreeType: form.degreeType,
      fieldOfStudy: form.fieldOfStudy.trim(),
      startMonth: parseInt(form.startMonth),
      startYear: parseInt(form.startYear),
      endMonth: form.currentlyStudying ? undefined : parseInt(form.endMonth),
      endYear: form.currentlyStudying ? undefined : parseInt(form.endYear),
      currentlyStudying: Boolean(form.currentlyStudying),
      grade: form.grade.trim() || undefined,
      activities: form.activities.trim() || undefined,
    });
  };

  return (
    <form className="ppf-form" onSubmit={handleSubmit}>
      <div className="ppf-field">
        <label>School / University *</label>
        <input name="schoolName" value={form.schoolName} onChange={handleChange} placeholder="e.g. University of Lagos" maxLength={200} />
      </div>
      <div className="ppf-row">
        <div className="ppf-field">
          <label>Degree Type *</label>
          <select name="degreeType" value={form.degreeType} onChange={handleChange}>
            <option value="">Select</option>
            {DEGREE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="ppf-field">
          <label>Field of Study *</label>
          <input name="fieldOfStudy" value={form.fieldOfStudy} onChange={handleChange} placeholder="e.g. Nursing Science" maxLength={200} />
        </div>
      </div>
      <div className="ppf-row">
        <div className="ppf-field">
          <label>Start Date *</label>
          <MonthYearSelect monthName="startMonth" yearName="startYear" monthValue={form.startMonth} yearValue={form.startYear} onChange={handleChange} />
        </div>
        <div className="ppf-field">
          <label>End Date</label>
          <MonthYearSelect monthName="endMonth" yearName="endYear" monthValue={form.endMonth} yearValue={form.endYear} onChange={handleChange} disabled={form.currentlyStudying} />
        </div>
      </div>
      <label className="ppf-checkbox-label">
        <input type="checkbox" name="currentlyStudying" checked={form.currentlyStudying} onChange={handleChange} />
        Currently studying here
      </label>
      <div className="ppf-row">
        <div className="ppf-field">
          <label>Grade / CGPA</label>
          <input name="grade" value={form.grade} onChange={handleChange} placeholder="e.g. 4.5 / 5.0" maxLength={50} />
        </div>
      </div>
      <div className="ppf-field">
        <label>Activities / Honours</label>
        <textarea name="activities" value={form.activities} onChange={handleChange} placeholder="Dean's List, clubs, awards…" maxLength={1000} rows={2} />
      </div>
      <div className="ppf-form-actions">
        <button type="button" className="ppf-cancel-btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="ppf-save-btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
};

// ─── Certification Form ───────────────────────────────────────────────────────
const BLANK_CERT = {
  certificationName: '', issuingOrganisation: '',
  issueMonth: '', issueYear: '', expiryMonth: '', expiryYear: '',
  doesNotExpire: false, credentialId: '', credentialUrl: '',
};

const CertificationForm = ({ item, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(item || BLANK_CERT);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.certificationName.trim()) return toast.error('Certification name is required.');
    if (!form.issuingOrganisation.trim()) return toast.error('Issuing organisation is required.');
    if (!form.issueMonth || !form.issueYear) return toast.error('Issue date is required.');
    if (!form.doesNotExpire && (!form.expiryMonth || !form.expiryYear)) return toast.error('Expiry date is required (or check "Does not expire").');
    if (form.credentialUrl && !/^https?:\/\/.+/.test(form.credentialUrl)) return toast.error('Credential URL must start with http:// or https://');
    onSave({
      certificationName: form.certificationName.trim(),
      issuingOrganisation: form.issuingOrganisation.trim(),
      issueMonth: parseInt(form.issueMonth),
      issueYear: parseInt(form.issueYear),
      expiryMonth: form.doesNotExpire ? undefined : parseInt(form.expiryMonth),
      expiryYear: form.doesNotExpire ? undefined : parseInt(form.expiryYear),
      doesNotExpire: Boolean(form.doesNotExpire),
      credentialId: form.credentialId.trim() || undefined,
      credentialUrl: form.credentialUrl.trim() || undefined,
    });
  };

  return (
    <form className="ppf-form" onSubmit={handleSubmit}>
      <div className="ppf-field">
        <label>Certification / Licence Name *</label>
        <input name="certificationName" value={form.certificationName} onChange={handleChange} placeholder="e.g. Registered Nurse Licence" maxLength={200} />
      </div>
      <div className="ppf-field">
        <label>Issuing Organisation *</label>
        <input name="issuingOrganisation" value={form.issuingOrganisation} onChange={handleChange} placeholder="e.g. Nursing and Midwifery Council of Nigeria" maxLength={200} />
      </div>
      <div className="ppf-row">
        <div className="ppf-field">
          <label>Issue Date *</label>
          <MonthYearSelect monthName="issueMonth" yearName="issueYear" monthValue={form.issueMonth} yearValue={form.issueYear} onChange={handleChange} />
        </div>
        <div className="ppf-field">
          <label>Expiry Date</label>
          <MonthYearSelect monthName="expiryMonth" yearName="expiryYear" monthValue={form.expiryMonth} yearValue={form.expiryYear} onChange={handleChange} disabled={form.doesNotExpire} />
        </div>
      </div>
      <label className="ppf-checkbox-label">
        <input type="checkbox" name="doesNotExpire" checked={form.doesNotExpire} onChange={handleChange} />
        This credential does not expire
      </label>
      <div className="ppf-row">
        <div className="ppf-field">
          <label>Credential ID</label>
          <input name="credentialId" value={form.credentialId} onChange={handleChange} placeholder="e.g. RN-2020-456789" maxLength={200} />
        </div>
        <div className="ppf-field">
          <label>Credential URL</label>
          <input name="credentialUrl" value={form.credentialUrl} onChange={handleChange} placeholder="https://" maxLength={2000} />
        </div>
      </div>
      <div className="ppf-form-actions">
        <button type="button" className="ppf-cancel-btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="ppf-save-btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
};

// ─── Work Experience Form ─────────────────────────────────────────────────────
const BLANK_WORK = {
  jobTitle: '', employmentType: '', organisationName: '', location: '',
  startMonth: '', startYear: '', endMonth: '', endYear: '',
  currentlyWorkingHere: false, industry: '', description: '',
};

const WorkExperienceForm = ({ item, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(item || BLANK_WORK);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.jobTitle.trim()) return toast.error('Job title is required.');
    if (!form.employmentType) return toast.error('Please select an employment type.');
    if (!form.organisationName.trim()) return toast.error('Organisation name is required.');
    if (!form.location.trim()) return toast.error('Location is required.');
    if (!form.startMonth || !form.startYear) return toast.error('Start date is required.');
    if (!form.currentlyWorkingHere && (!form.endMonth || !form.endYear)) return toast.error('End date is required (or check "I currently work here").');
    onSave({
      jobTitle: form.jobTitle.trim(),
      employmentType: form.employmentType,
      organisationName: form.organisationName.trim(),
      location: form.location.trim(),
      startMonth: parseInt(form.startMonth),
      startYear: parseInt(form.startYear),
      endMonth: form.currentlyWorkingHere ? undefined : parseInt(form.endMonth),
      endYear: form.currentlyWorkingHere ? undefined : parseInt(form.endYear),
      currentlyWorkingHere: Boolean(form.currentlyWorkingHere),
      industry: form.industry.trim() || undefined,
      description: form.description.trim() || undefined,
    });
  };

  return (
    <form className="ppf-form" onSubmit={handleSubmit}>
      <div className="ppf-row">
        <div className="ppf-field">
          <label>Job Title *</label>
          <input name="jobTitle" value={form.jobTitle} onChange={handleChange} placeholder="e.g. Senior Caregiver" maxLength={200} />
        </div>
        <div className="ppf-field">
          <label>Employment Type *</label>
          <select name="employmentType" value={form.employmentType} onChange={handleChange}>
            <option value="">Select</option>
            {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="ppf-row">
        <div className="ppf-field">
          <label>Organisation / Employer *</label>
          <input name="organisationName" value={form.organisationName} onChange={handleChange} placeholder="e.g. Lagos Care Home" maxLength={200} />
        </div>
        <div className="ppf-field">
          <label>Location *</label>
          <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Lagos, Nigeria" maxLength={200} />
        </div>
      </div>
      <div className="ppf-row">
        <div className="ppf-field">
          <label>Start Date *</label>
          <MonthYearSelect monthName="startMonth" yearName="startYear" monthValue={form.startMonth} yearValue={form.startYear} onChange={handleChange} />
        </div>
        <div className="ppf-field">
          <label>End Date</label>
          <MonthYearSelect monthName="endMonth" yearName="endYear" monthValue={form.endMonth} yearValue={form.endYear} onChange={handleChange} disabled={form.currentlyWorkingHere} />
        </div>
      </div>
      <label className="ppf-checkbox-label">
        <input type="checkbox" name="currentlyWorkingHere" checked={form.currentlyWorkingHere} onChange={handleChange} />
        I currently work here
      </label>
      <div className="ppf-field">
        <label>Industry</label>
        <input name="industry" value={form.industry} onChange={handleChange} placeholder="e.g. Healthcare" maxLength={100} />
      </div>
      <div className="ppf-field">
        <label>Description / Key Duties</label>
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe your key responsibilities…" maxLength={4000} rows={3} />
      </div>
      <div className="ppf-form-actions">
        <button type="button" className="ppf-cancel-btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="ppf-save-btn" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
};

// ─── Generic Section ──────────────────────────────────────────────────────────
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatItemLabel = (item, type) => {
  if (type === 'education') return `${item.degreeType} – ${item.schoolName}`;
  if (type === 'certifications') return `${item.certificationName}`;
  return `${item.jobTitle} at ${item.organisationName}`;
};

const formatItemSub = (item, type) => {
  const sm = item.startMonth ? MONTHS_SHORT[item.startMonth - 1] : '';
  const sy = item.startYear || '';
  if (type === 'education') {
    const ongoing = item.currentlyStudying;
    const em = item.endMonth ? MONTHS_SHORT[item.endMonth - 1] : '';
    const ey = item.endYear || '';
    return `${sm} ${sy} – ${ongoing ? 'Present' : `${em} ${ey}`}`;
  }
  if (type === 'certifications') {
    const ongoing = item.doesNotExpire;
    const em = item.expiryMonth ? MONTHS_SHORT[item.expiryMonth - 1] : '';
    const ey = item.expiryYear || '';
    return `Issued ${sm} ${sy}${ongoing ? ' · No expiry' : ` · Expires ${em} ${ey}`}`;
  }
  const ongoing = item.currentlyWorkingHere;
  const em = item.endMonth ? MONTHS_SHORT[item.endMonth - 1] : '';
  const ey = item.endYear || '';
  return `${sm} ${sy} – ${ongoing ? 'Present' : `${em} ${ey}`}`;
};

const ProfileSection = ({ title, icon, type, items, FormComponent, onAdd, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleSave = async (payload) => {
    setSaving(true);
    if (editingItem) {
      await onUpdate(editingItem.id, payload);
    } else {
      await onAdd(payload);
    }
    setSaving(false);
    setShowForm(false);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
    setExpanded(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this entry?')) return;
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setShowForm(true);
    setExpanded(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <div className="ppf-section">
      <button
        type="button"
        className="ppf-section-header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="ppf-section-icon">{icon}</span>
        <span className="ppf-section-title">{title}</span>
        {items.length > 0 && <span className="ppf-section-count">{items.length}</span>}
        <span className="ppf-chevron">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="ppf-section-body">
          {items.length > 0 && !showForm && (
            <ul className="ppf-entry-list">
              {items.map((item) => (
                <li key={item.id} className="ppf-entry">
                  <div className="ppf-entry-text">
                    <p className="ppf-entry-title">{formatItemLabel(item, type)}</p>
                    <p className="ppf-entry-sub">{formatItemSub(item, type)}</p>
                  </div>
                  <div className="ppf-entry-actions">
                    <button type="button" className="ppf-entry-edit" onClick={() => handleEdit(item)}>Edit</button>
                    <button
                      type="button"
                      className="ppf-entry-delete"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? '…' : 'Remove'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {showForm ? (
            <FormComponent
              item={editingItem}
              onSave={handleSave}
              onCancel={handleCancelForm}
              saving={saving}
            />
          ) : (
            <button type="button" className="ppf-add-btn" onClick={handleAddNew}>
              + Add {title}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
const ProfessionalProfileForms = () => {
  const [education, setEducation] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [workExperience, setWorkExperience] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const load = async () => {
      const [eduRes, certRes, workRes] = await Promise.all([
        professionalProfileService.getEducation(),
        professionalProfileService.getCertifications(),
        professionalProfileService.getWorkExperience(),
      ]);
      if (eduRes.success) setEducation(eduRes.data);
      if (certRes.success) setCertifications(certRes.data);
      if (workRes.success) setWorkExperience(workRes.data);
      if (!eduRes.success || !certRes.success || !workRes.success) {
        setLoadError('Some sections could not be loaded. Please refresh.');
      }
    };
    load();
  }, []);

  // Education handlers
  const handleAddEdu = useCallback(async (payload) => {
    const res = await professionalProfileService.addEducation(payload);
    if (res.success) { setEducation((prev) => [...prev, res.data]); toast.success('Education added.'); }
    else toast.error(res.error);
  }, []);
  const handleUpdateEdu = useCallback(async (id, payload) => {
    const res = await professionalProfileService.updateEducation(id, payload);
    if (res.success) { setEducation((prev) => prev.map((e) => e.id === id ? res.data : e)); toast.success('Education updated.'); }
    else toast.error(res.error);
  }, []);
  const handleDeleteEdu = useCallback(async (id) => {
    const res = await professionalProfileService.deleteEducation(id);
    if (res.success) { setEducation((prev) => prev.filter((e) => e.id !== id)); toast.success('Education removed.'); }
    else toast.error(res.error);
  }, []);

  // Certification handlers
  const handleAddCert = useCallback(async (payload) => {
    const res = await professionalProfileService.addCertification(payload);
    if (res.success) { setCertifications((prev) => [...prev, res.data]); toast.success('Certification added.'); }
    else toast.error(res.error);
  }, []);
  const handleUpdateCert = useCallback(async (id, payload) => {
    const res = await professionalProfileService.updateCertification(id, payload);
    if (res.success) { setCertifications((prev) => prev.map((c) => c.id === id ? res.data : c)); toast.success('Certification updated.'); }
    else toast.error(res.error);
  }, []);
  const handleDeleteCert = useCallback(async (id) => {
    const res = await professionalProfileService.deleteCertification(id);
    if (res.success) { setCertifications((prev) => prev.filter((c) => c.id !== id)); toast.success('Certification removed.'); }
    else toast.error(res.error);
  }, []);

  // Work experience handlers
  const handleAddWork = useCallback(async (payload) => {
    const res = await professionalProfileService.addWorkExperience(payload);
    if (res.success) { setWorkExperience((prev) => [...prev, res.data]); toast.success('Work experience added.'); }
    else toast.error(res.error);
  }, []);
  const handleUpdateWork = useCallback(async (id, payload) => {
    const res = await professionalProfileService.updateWorkExperience(id, payload);
    if (res.success) { setWorkExperience((prev) => prev.map((w) => w.id === id ? res.data : w)); toast.success('Work experience updated.'); }
    else toast.error(res.error);
  }, []);
  const handleDeleteWork = useCallback(async (id) => {
    const res = await professionalProfileService.deleteWorkExperience(id);
    if (res.success) { setWorkExperience((prev) => prev.filter((w) => w.id !== id)); toast.success('Work experience removed.'); }
    else toast.error(res.error);
  }, []);

  return (
    <div className="ppf-root">
      <p className="ppf-intro">
        Add your educational background, qualifications, and work history. This information is displayed on your public service page to help clients make informed hiring decisions.
      </p>
      {loadError && <p className="ppf-load-error">{loadError}</p>}
      <ProfileSection
        title="Education"
        icon="🎓"
        type="education"
        items={education}
        FormComponent={EducationForm}
        onAdd={handleAddEdu}
        onUpdate={handleUpdateEdu}
        onDelete={handleDeleteEdu}
      />
      <ProfileSection
        title="Professional Qualifications & Certifications"
        icon="📜"
        type="certifications"
        items={certifications}
        FormComponent={CertificationForm}
        onAdd={handleAddCert}
        onUpdate={handleUpdateCert}
        onDelete={handleDeleteCert}
      />
      <ProfileSection
        title="Work Experience"
        icon="💼"
        type="experience"
        items={workExperience}
        FormComponent={WorkExperienceForm}
        onAdd={handleAddWork}
        onUpdate={handleUpdateWork}
        onDelete={handleDeleteWork}
      />
    </div>
  );
};

export default ProfessionalProfileForms;
