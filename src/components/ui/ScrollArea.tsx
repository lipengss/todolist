import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { ReactNode } from "react";

interface ScrollAreaProps {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
}

export function ScrollArea({ children, className = "", viewportClassName = "" }: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root className={`relative overflow-hidden ${className}`}>
      <ScrollAreaPrimitive.Viewport className={`h-full w-full ${viewportClassName}`}>{children}</ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className="flex touch-none select-none p-0.5 transition-colors data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2"
      >
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}
