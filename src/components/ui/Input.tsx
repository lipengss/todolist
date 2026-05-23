import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "number";
}

const baseClass =
  "w-full bg-card border border-border text-foreground text-sm outline-none focus:ring-2 ring-ring/30 placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", variant = "default", type, ...props }, ref) => {
    const isNumber = variant === "number" || type === "number";
    return (
      <input
        ref={ref}
        type={isNumber ? "number" : type}
        className={`${baseClass} ${isNumber ? "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" : ""} rounded-lg px-4 py-2.5 ${className}`}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
