"use client";

import { Button } from "poyraz-ui/atoms";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "poyraz-ui/molecules";

type DestructiveConfirmationProps = {
  cancelLabel: string;
  confirmLabel: string;
  description: string;
  loading?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function DestructiveConfirmation({
  cancelLabel,
  confirmLabel,
  description,
  loading = false,
  onConfirm,
  onOpenChange,
  open,
  title,
}: DestructiveConfirmationProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent surface="solid" radius="lg" mobile="floating">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button effect="shine" type="button" variant="secondary" disabled={loading}>
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            effect="shine"
            type="button"
            variant="default"
            loading={loading}
            aria-busy={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
