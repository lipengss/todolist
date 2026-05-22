import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";

interface ModalProps {
  title: string;
  description?: string;
  open: boolean;
  children: ReactNode;
  maxWidth?: string;
  onOpenChange: (open: boolean) => void;
}

export function Modal({ title, description, open, children, maxWidth = "max-w-lg", onOpenChange }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 z-50 w-[calc(100vw-48px)] ${maxWidth} -translate-x-1/2 -translate-y-1/2 rounded-[20px] border border-border bg-card p-6 shadow-2xl focus:outline-none`}
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-medium text-foreground">{title}</Dialog.Title>
              {description && <Dialog.Description className="text-sm text-muted-foreground mt-1">{description}</Dialog.Description>}
            </div>
            <Dialog.Close className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="关闭">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
