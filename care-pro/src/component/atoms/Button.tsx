import React from 'react';
import styles from './Button.module.scss'; // Import your custom SCSS module for styling

// Define the button types
type ButtonType = 'primary' | 'secondary' | 'danger' | 'success'; 

// Interface for the button props
interface ButtonProps {
  type?: ButtonType; // Optional button type for styling
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void; // Click handler
  children: React.ReactNode; // Content inside the button
  disabled?: boolean; // Optional disabled state
  long?: boolean; // Optional prop for long button style
}

const Button: React.FC<ButtonProps> = ({
  type = 'primary', // Default button type
  onClick,
  children,
  disabled = false,
  long = false,
}) => {
  // Determine the class names based on button type and long prop
  const classNames = `${styles.btn} ${styles[type]} ${long ? styles.long : ''}`;

  return (
    <button
      className={classNames} // Dynamic class names
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
