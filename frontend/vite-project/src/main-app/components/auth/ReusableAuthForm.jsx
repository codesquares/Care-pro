// src/components/ReusableAuthForm.jsx
import Input from "../input/Input";
import Button from "../button/Button";
import GoogleButton from "../button/GoogleButton";
import "./ReusableAuthForm.scss";

const ReusableAuthForm = ({
  title,
  formFields,
  buttonText,
  redirectText,
  redirectLink,
  onSubmit,
  imageComponent, // Pass the image or carousel as a prop
}) => {
  return (
    <div className="auth-form-wrapper">
      <div className="auth-form-left">
        <h2>{title}</h2>
        <form onSubmit={onSubmit} className="auth-form">
          {formFields.map((field, index) => (
            <Input
              key={index}
              label={field.label}
              name={field.name}
              type={field.type}
              value={field.value}
              onChange={field.onChange}
              placeholder={field.placeholder}
            />
          ))}
          <Button type="submit" className="auth-btn">
            {buttonText}
          </Button>
          <div className="divider">or</div>
          <GoogleButton />
          <p className="redirect-text">
            {redirectText} <a href={redirectLink}>Click here</a>.
          </p>
        </form>
      </div>
      <div className="auth-form-right">
        {imageComponent} {/* Render the image or carousel component */}
      </div>
    </div>
  );
};

export default ReusableAuthForm;

