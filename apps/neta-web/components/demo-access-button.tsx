"use client";

import { useState } from "react";
import { Icon } from "@/components/app-icon";
import { Button } from "poyraz-ui/atoms";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "poyraz-ui/molecules";
import { AnimatedButton } from "@/components/ui/animated-button";
import { DEFAULT_LOCALE, type Locale, siteCopy } from "@/lib/i18n";

const DEMO_URL = "https://demo.takeneta.com";
const DEMO_EMAIL = "test@takeneta.com";
const DEMO_PASSWORD = "12345678Aa!.";

type DemoAccessButtonProps = {
  locale?: Locale;
  className?: string;
  variant?: "primary" | "outline";
  iconPosition?: "left" | "right";
  onOpen?: () => void;
};

function CredentialRow({
  label,
  value,
  copied,
  copyLabel,
  copiedLabel,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
  onCopy: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-sm border border-border bg-muted/40 p-3 sm:grid-cols-[5.5rem_1fr_auto] sm:items-center">
      <span className="text-xs font-bold uppercase tracking-normal text-muted-foreground">
        {label}
      </span>
      <code className="min-w-0 rounded-sm bg-background px-2.5 py-2 text-sm font-semibold text-foreground">
        {value}
      </code>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCopy}
        className="justify-center gap-2"
      >
        <Icon
          icon={copied ? "mdi:check" : "mdi:content-copy"}
          className="h-4 w-4"
        />
        {copied ? copiedLabel : copyLabel}
      </Button>
    </div>
  );
}

export function DemoAccessButton({
  locale = DEFAULT_LOCALE,
  className,
  variant = "primary",
  iconPosition = "right",
  onOpen,
}: DemoAccessButtonProps) {
  const copy = siteCopy[locale].demo;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"email" | "password" | "all" | null>(
    null,
  );

  const copyValue = async (
    key: "email" | "password" | "all",
    value: string,
  ) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1600);
  };

  const openModal = () => {
    onOpen?.();
    setOpen(true);
  };

  return (
    <>
      <AnimatedButton
        type="button"
        onClick={openModal}
        icon="mdi:chevron-right"
        iconPosition={iconPosition}
        variant={variant}
        className={className}
      >
        {copy.button}
      </AnimatedButton>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent size="lg" className="rounded-sm">
          <ModalHeader>
            <ModalTitle>{copy.title}</ModalTitle>
            <ModalDescription>{copy.description}</ModalDescription>
          </ModalHeader>

          <div className="grid gap-3">
            <CredentialRow
              label={copy.email}
              value={DEMO_EMAIL}
              copied={copied === "email"}
              copyLabel={copy.copy}
              copiedLabel={copy.copied}
              onCopy={() => copyValue("email", DEMO_EMAIL)}
            />
            <CredentialRow
              label={copy.password}
              value={DEMO_PASSWORD}
              copied={copied === "password"}
              copyLabel={copy.copy}
              copiedLabel={copy.copied}
              onCopy={() => copyValue("password", DEMO_PASSWORD)}
            />
          </div>

          <ModalFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                copyValue(
                  "all",
                  `${copy.allCredentialsLabel}: ${DEMO_EMAIL}\n${copy.allCredentialsPasswordLabel}: ${DEMO_PASSWORD}`,
                )
              }
              className="gap-2"
            >
              <Icon
                icon={copied === "all" ? "mdi:check" : "mdi:content-copy"}
                className="h-4 w-4"
              />
              {copied === "all" ? copy.copiedAll : copy.copyAll}
            </Button>

            <Button asChild className="gap-2">
              <a href={DEMO_URL} target="_blank" rel="noopener noreferrer">
                {copy.openDemo}
                <Icon icon="mdi:arrow-top-right" className="h-4 w-4" />
              </a>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
