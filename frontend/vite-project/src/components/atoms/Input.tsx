
import React from 'react';
import './Input.scss';

type InputProps = {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const Input: React.FC<InputProps> = ({ type = 'text', placeholder = '', className = '', ...props }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={`input ${className}`}
      {...props}
    />
  );
};

export default Input;
