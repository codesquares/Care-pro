
import "./ReusableAuthForm.css";

const ReusableAuthForm = ({
  title,
  formFields,
  buttonText,
  redirectText,
  redirectLink,
  onSubmit,
  imageComponent,
  additionalInfo,
}) => {
  return (
    <div className="auth-form-container">
      <div className="form-section">
        <h1>{title}</h1>
        <form onSubmit={onSubmit}>
          {formFields.map((field, index) => (
            <div className={`input-group ${field.name}`} key={index}>
              <label htmlFor={field.name}>{field.label}</label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                required={field.required || false}
              />
            </div>
          ))}
          {additionalInfo && (
            <div className="additional-info">{additionalInfo}</div>
          )}
          <button type="submit" className="btn">
            {buttonText}
          </button>
        </form>
        <div className="alternate-login">
          <p>or</p>
          <button className="btn google">Google</button>
          <button className="btn apple">Apple</button>
        </div>
        <p className="redirect-text">
          {redirectText} <a href={redirectLink}>Sign in</a>
        </p>
      </div>
      {imageComponent && (
        <div className="image-section">{imageComponent}</div>
      )}
    </div>
  );
};

export default ReusableAuthForm;
