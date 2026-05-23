import { forwardRef } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full bg-card border border-border text-foreground text-sm rounded-lg px-4 py-2.5 outline-none focus:ring-2 ring-ring/30 placeholder:text-muted-foreground resize-none transition-colors ${className}`}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";

export { Textarea };
