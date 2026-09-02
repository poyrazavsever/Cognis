"use client";

import { useState } from "react";
import { Icon } from "@/components/app-icon";
import { Button, Typography } from "poyraz-ui/atoms";
import { type Locale, landingCopy } from "@/lib/i18n";

type InstallCommandProps = {
  locale: Locale;
  tone?: "dark" | "light";
  compact?: boolean;
};

export function InstallCommand({
  locale,
  tone = "dark",
  compact = false,
}: InstallCommandProps) {
  const copy = landingCopy[locale].install;
  const [copied, setCopied] = useState(false);

  const copyCommand = async () => {
    await navigator.clipboard.writeText(copy.command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const dark = tone === "dark";

  return (
    <div
      className={`install-command ${compact ? "install-command--compact" : ""} ${
        dark ? "install-command--dark" : "install-command--light"
      }`}
    >
      <div className="install-command__label-row">
        <Typography
          variant="small"
          className={dark ? "text-white/60" : "text-muted-foreground"}
        >
          {copy.label}
        </Typography>
        <span className="sr-only" aria-live="polite">
          {copied ? copy.copied : ""}
        </span>
      </div>

      <div className="install-command__control">
        <code>{copy.command}</code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyCommand}
          className="install-command__copy"
          aria-label={copied ? copy.copied : copy.copy}
          title={copied ? copy.copied : copy.copy}
        >
          <Icon
            icon={copied ? "mdi:check" : "mdi:content-copy"}
            className="h-4 w-4"
          />
        </Button>
      </div>
    </div>
  );
}
