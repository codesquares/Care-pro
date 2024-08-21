

import React from 'react';
import '../../styles/components/atom/button.scss';

type ButtonProps = {
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

const Button: React.FC<ButtonProps> = ({ type = 'button', children, onClick, className = '', ...props }) => {
  return (
    <button type={type} className={`btn ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

export default Button;
