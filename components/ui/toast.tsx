"use client";

import { useEffect, useState } from "react";
import type { ComponentPropsWithoutRef, ReactElement } from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastPayload = {
  message: string;
  tone?: ToastTone;
};

const toastEventName = "neta:toast";
let toastId = 0;

export function showToast(payload: ToastPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<ToastPayload>(toastEventName, { detail: payload }));
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handleToast(event: Event) {
      const customEvent = event as CustomEvent<ToastPayload>;
      const item = {
        id: ++toastId,
        message: customEvent.detail.message,
        tone: customEvent.detail.tone ?? "info",
      };

      setItems((current) => [...current.slice(-2), item]);
      window.setTimeout(() => {
        setItems((current) => current.filter((toast) => toast.id !== item.id));
      }, 4500);
    }

    window.addEventListener(toastEventName, handleToast);
    return () => window.removeEventListener(toastEventName, handleToast);
  }, []);

  return (
    <div
      aria-live="polite"
      aria-relevant="additions text"
      className="fixed bottom-4 right-4 z-[80] flex w-[min(calc(100vw-2rem),24rem)] flex-col gap-2"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "flex items-start gap-3 rounded-md border bg-surface p-4 text-sm shadow-lg",
            item.tone === "error" && "border-destructive/30",
            item.tone === "success" && "border-success/30",
          )}
        >
          <div
            className={cn(
              "mt-1 h-2 w-2 shrink-0 rounded-full bg-info",
              item.tone === "error" && "bg-destructive",
              item.tone === "success" && "bg-success",
            )}
          />
          <p className="min-w-0 flex-1 text-foreground">{item.message}</p>
          <IconButton
            label="Bildirimi kapat"
            variant="ghost"
            className="-mr-2 -mt-2 h-8 w-8"
            onClick={() => setItems((current) => current.filter((toast) => toast.id !== item.id))}
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>
      ))}
    </div>
  );
}

export type ToastProps = ComponentPropsWithoutRef<"div"> & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "destructive";
};

export type ToastActionElement = ReactElement;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Toast({ open = true, onOpenChange, variant, className, ...props }: ToastProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      role={variant === "destructive" ? "alert" : "status"}
      className={cn(
        "group pointer-events-auto flex w-full items-start gap-3 rounded-md border bg-surface p-4 text-sm shadow-lg",
        variant === "destructive" && "border-destructive/30",
        className,
      )}
      data-on-open-change={onOpenChange ? "" : undefined}
      {...props}
    />
  );
}

export function ToastTitle({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("font-medium text-foreground", className)} {...props} />;
}

export function ToastDescription({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function ToastClose({ className, ...props }: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "ml-auto rounded-sm p-1 text-muted-foreground opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Bildirimi kapat</span>
    </button>
  );
}

export function ToastViewport({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[80] flex w-[min(calc(100vw-2rem),24rem)] flex-col gap-2",
        className,
      )}
      {...props}
    />
  );
}
