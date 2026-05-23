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

export function Modal({ title, open, children, maxWidth = "max-w-[512px]", onOpenChange }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 z-50 w-[calc(100vw-48px)] ${maxWidth} -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card shadow-[0px_25px_25px_rgba(0,0,0,0.25)] focus:outline-none`}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <Dialog.Title className="text-xl font-medium text-foreground">{title}</Dialog.Title>
            <Dialog.Close className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="关闭">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <div className="px-6 pt-6 pb-6">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}