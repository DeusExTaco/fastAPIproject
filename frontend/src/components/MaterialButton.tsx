import React, {CSSProperties, MouseEvent} from 'react';
import {Button} from "@material-tailwind/react";

// Update the interface to include proper onClick typing
interface MaterialButtonProps {
    children: React.ReactNode;
    type?: "button" | "submit" | "reset";
    variant?: "filled" | "gradient" | "outlined" | "text";
    color?: "blue" | "red" | "green" | "amber" | "pink" | "indigo" | "purple" | "teal" | "cyan";
    size?: "sm" | "md" | "lg";
    fullWidth?: boolean;
    ripple?: boolean;
    className?: string;
    disabled?: boolean;
    form?: string;
    slot?: string;
    style?: CSSProperties;
    title?: string;
    onClick?: (e: MouseEvent<HTMLButtonElement>) => void;  // Updated onClick type
    'aria-label'?: string;
}

const filterProps = (props: any) => {
    const {
        onPointerEnterCapture,
        onPointerLeaveCapture,
        placeholder,
        crossOrigin,
        ...filteredProps
    } = props;
    return filteredProps;
};

const MaterialButton: React.FC<MaterialButtonProps> = ({
    children,
    type = "button",
    variant = "gradient",
    color = "blue",
    size = "md",
    fullWidth = false,
    className = "",
    disabled = false,
    onClick,
    ...props
}) => {
    const filteredProps = filterProps(props);

    return (
        <Button
            type={type}
            variant={variant}
            color={color}
            size={size}
            fullWidth={fullWidth}
            className={className}
            disabled={disabled}
            onClick={onClick}
            {...filteredProps}
        >
            {children}
        </Button>
    );
};

export default MaterialButton;