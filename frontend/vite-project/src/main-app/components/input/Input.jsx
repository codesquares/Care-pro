import "./Input.scss";

const Input = ({ 
  label, 
  name, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  className = "",
  onFocus,
  onBlur,
  ...props 
}) => {
  return (
    <div className="input-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className={className}
        {...props}
      />
    </div>
  );
};

export default Input;
