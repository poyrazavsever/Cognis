"use client";

import { type ReactNode, useMemo, useState } from "react";
import { Icon } from "@/components/app-icon";

const KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "import",
  "from",
  "export",
  "type",
  "interface",
  "class",
  "extends",
  "async",
  "await",
  "if",
  "else",
  "for",
  "while",
  "true",
  "false",
  "null",
  "undefined",
  "in",
  "of",
]);

function tokenClass(token: string, language: string) {
  if (/^(\s+)$/.test(token)) {
    return "";
  }

  if (/^(\/\/.*|#.*)$/.test(token)) {
    return "text-slate-500";
  }

  if (/^(['"`]).*\1$/.test(token)) {
    return "text-emerald-300";
  }

  if (/^\d+(\.\d+)?$/.test(token)) {
    return "text-amber-300";
  }

  if (KEYWORDS.has(token)) {
    return "text-sky-300";
  }

  if (language === "json" && /^".*"$/.test(token)) {
    return "text-emerald-300";
  }

  if (/^--?[a-zA-Z][\w-]*$/.test(token)) {
    return "text-violet-300";
  }

  if (/^[{}[\]().,:;=<>/]+$/.test(token)) {
    return "text-slate-400";
  }

  if (language === "md" || language === "markdown") {
    if (/^#{1,6}$/.test(token)) {
      return "text-primary";
    }

    if (/^-+$/.test(token)) {
      return "text-sky-300";
    }
  }

  return "text-slate-100";
}

function highlightLine(line: string, language: string) {
  const tokens = line.split(
    /(\s+|\/\/.*|#.*|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|\b\d+(?:\.\d+)?\b|--?[a-zA-Z][\w-]*|\b[a-zA-Z_$][\w$]*\b|[{}[\]().,:;=<>/]+)/g,
  );

  return tokens.map((token, index) => {
    if (!token) {
      return null;
    }

    const className = tokenClass(token, language);

    if (!className) {
      return token;
    }

    return (
      <span key={`${token}-${index}`} className={className}>
        {token}
      </span>
    );
  });
}

function highlightedCode(code: string, language: string): ReactNode[] {
  return code.split("\n").flatMap((line, index, lines) => {
    const nodes: ReactNode[] = [
      <span key={`line-${index}`}>{highlightLine(line, language)}</span>,
    ];

    if (index < lines.length - 1) {
      nodes.push("\n");
    }

    return nodes;
  });
}

export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const [copied, setCopied] = useState(false);
  const normalizedLanguage = language || "text";
  const highlighted = useMemo(
    () => highlightedCode(code, normalizedLanguage),
    [code, normalizedLanguage],
  );

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-[0_18px_48px_rgba(16,24,40,0.12)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <span className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-semibold uppercase tracking-normal text-slate-300">
          {normalizedLanguage}
        </span>

        <button
          type="button"
          onClick={copyCode}
          className="inline-flex h-8 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
          aria-label="Kod bloğunu kopyala"
        >
          <Icon
            icon={copied ? "mdi:check" : "mdi:content-copy"}
            className={`h-4 w-4 ${copied ? "text-emerald-300" : ""}`}
          />
          {copied ? "Kopyalandı" : "Kopyala"}
        </button>
      </div>

      <pre className="overflow-x-auto p-4 text-sm leading-6">
        <code>{highlighted}</code>
      </pre>
    </div>
  );
}
