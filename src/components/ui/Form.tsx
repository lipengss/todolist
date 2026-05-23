import * as FormPrimitive from "@radix-ui/react-form";

function FormField({
  name,
  label,
  children,
  className = "",
}: {
  name: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <FormPrimitive.Field name={name} className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <FormPrimitive.Label className="text-sm text-muted-foreground">
          {label}
        </FormPrimitive.Label>
      </div>
      <FormPrimitive.Control asChild>{children}</FormPrimitive.Control>
      <FormPrimitive.Message className="text-xs text-destructive" />
    </FormPrimitive.Field>
  );
}

export { FormField, FormPrimitive };
