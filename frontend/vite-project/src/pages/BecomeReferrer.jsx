import { useState } from "react";
import { toast } from "react-toastify";
import useApi from "../main-app/services/useApi";
import Modal from "../main-app/components/modal/Modal";
import { getAliasError } from "../main-app/utils/aliasValidation";
import "./BecomeReferrer.css";

const initialFormValues = {
  fullName: "",
  email: "",
  phoneNo: "",
  alias: "",
};

const BecomeReferrer = () => {
  const { loading, fetchData } = useApi("", "post");

  const [formValues, setFormValues] = useState(initialFormValues);
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const validate = (values) => {
    const newErrors = {};

    if (!values.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }

    if (!values.email.trim() || !/\S+@\S+\.\S+/.test(values.email)) {
      newErrors.email = "A valid email address is required.";
    }

    const aliasError = getAliasError(values.alias);
    if (aliasError) {
      newErrors.alias = aliasError;
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValues = { ...formValues, [name]: value };
    setFormValues(nextValues);
    if (isSubmitted) {
      setErrors(validate(nextValues));
    }
  };

  // Alias gets live, as-you-type feedback regardless of submit state, since a
  // client-error here should never be a surprise saved for submit time.
  const handleAliasChange = (e) => {
    const value = e.target.value;
    setFormValues((prev) => ({ ...prev, alias: value }));
    setErrors((prev) => ({ ...prev, alias: getAliasError(value) || undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setSubmitError(null);

    const fieldErrors = validate(formValues);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    const payload = {
      fullName: formValues.fullName.trim(),
      email: formValues.email.trim(),
      phoneNo: formValues.phoneNo.trim(),
      alias: formValues.alias.trim(),
    };

    try {
      await fetchData(payload, "/referrals/apply");
      setFormValues(initialFormValues);
      setErrors({});
      setIsSubmitted(false);
      setIsSuccessModalOpen(true);
    } catch (err) {
      const message = err.message || "Something went wrong. Please try again.";
      setSubmitError(message);
      toast.error(message);
    }
  };

  const aliasPreview = (formValues.alias || "ALIAS").toUpperCase();

  return (
    <div className="become-referrer-page">
      <section className="become-referrer-hero">
        <h1>Become a Referrer</h1>
        <p>Apply to become a CarePro referrer and earn rewards for every client you bring to the platform.</p>
      </section>

      <div className="become-referrer-content">
        <div className="become-referrer-reward-badge">
          <span className="become-referrer-reward-amount">₦5,000</span>
          <span>
            for every unique client you refer who signs up for a recurring service.
            One-off, non-recurring orders don't qualify.
          </span>
        </div>

        <div className="become-referrer-card">
          {submitError && (
            <div className="become-referrer-alert become-referrer-alert--error">{submitError}</div>
          )}

          <form className="become-referrer-form" onSubmit={handleSubmit}>
            <label className="become-referrer-field">
              Full Name
              <input
                name="fullName"
                value={formValues.fullName}
                onChange={handleChange}
                placeholder="Jane Doe"
              />
              {errors.fullName && <p className="become-referrer-error">{errors.fullName}</p>}
            </label>

            <label className="become-referrer-field">
              Email
              <input
                type="email"
                name="email"
                value={formValues.email}
                onChange={handleChange}
                placeholder="jane@example.com"
              />
              {errors.email && <p className="become-referrer-error">{errors.email}</p>}
            </label>

            <label className="become-referrer-field">
              Phone Number <span className="become-referrer-optional">(optional)</span>
              <input
                name="phoneNo"
                value={formValues.phoneNo}
                onChange={handleChange}
                placeholder="080..."
              />
            </label>

            <label className="become-referrer-field">
              Alias
              <input
                name="alias"
                value={formValues.alias}
                onChange={handleAliasChange}
                placeholder="drwealth"
              />
              <span className="become-referrer-hint">
                Your code will look like: <strong>{aliasPreview}1234</strong>
              </span>
              {errors.alias && <p className="become-referrer-error">{errors.alias}</p>}
            </label>

            <button type="submit" className="become-referrer-submit" disabled={loading}>
              {loading ? "Submitting…" : "Apply Now"}
            </button>
          </form>
        </div>
      </div>

      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        onProceed={() => setIsSuccessModalOpen(false)}
        title="Application Received!"
        description="Thanks for applying! We'll review your application and email you your referral code once approved."
        buttonText="Done"
        buttonBgColor="#05668D"
      />
    </div>
  );
};

export default BecomeReferrer;
