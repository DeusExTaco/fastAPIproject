import React, { ChangeEvent, CSSProperties } from 'react';
import { Input } from "@material-tailwind/react";

// Define the props you want to use, omitting unwanted ones.
interface TextInputProps {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  variant?: "outlined" | "standard";
  className?: string;
  type?: string;
  form?: string;
  slot?: string;
  style?: CSSProperties;
  title?: string;
  pattern?: string;
  required?: boolean; // Add 'required' here
}

// Wrapper to exclude specific props from being passed down
const filterProps = (props: any) => {
  const { onPointerEnterCapture, onPointerLeaveCapture, crossOrigin, ...filteredProps } = props;
  return filteredProps;
};

const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChange,
  variant = "outlined",
  className = "",
  type = "text",
  required = false,
  ...props
}) => {
  // Filter unwanted props here
  const filteredProps = filterProps(props);

  return (
    <Input
      variant={variant}
      label={label}
      value={value}
      onChange={onChange}
      type={type}
      className={className}
      required={required}
      {...filteredProps}
    />
  );
};

export default TextInput;
