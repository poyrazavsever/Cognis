import type { ReactNode } from "react";
import { CodeBlock } from "@/components/docs/code-block";

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("`")) {
      nodes.push(
        <code
          key={`${token}-${match.index}`}
          className="rounded-md bg-primary/8 px-1.5 py-0.5 text-[0.92em] text-primary"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${token}-${match.index}`} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

      if (linkMatch) {
        nodes.push(
          <a
            key={`${token}-${match.index}`}
            href={linkMatch[2]}
            className="font-medium text-primary underline-offset-4 hover:underline"
            target={linkMatch[2].startsWith("http") ? "_blank" : undefined}
            rel={linkMatch[2].startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {linkMatch[1]}
          </a>,
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index]?.startsWith("```")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }

      blocks.push(
        <CodeBlock
          key={`code-${index}`}
          code={codeLines.join("\n")}
          language={language}
        />,
      );

      index += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push(
        <h1 key={`h1-${index}`} className="mb-5 text-4xl leading-tight sm:text-5xl">
          {parseInline(line.slice(2))}
        </h1>,
      );
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={`h2-${index}`} className="mb-3 mt-10 text-2xl leading-tight">
          {parseInline(line.slice(3))}
        </h2>,
      );
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={`h3-${index}`} className="mb-2 mt-8 text-xl leading-tight">
          {parseInline(line.slice(4))}
        </h3>,
      );
      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];

      while (index < lines.length && lines[index]?.startsWith("- ")) {
        items.push((lines[index] ?? "").slice(2));
        index += 1;
      }

      blocks.push(
        <ul key={`ul-${index}`} className="my-5 space-y-2 text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    const paragraphLines = [line.trim()];
    index += 1;

    while (
      index < lines.length &&
      lines[index]?.trim() &&
      !lines[index]?.startsWith("#") &&
      !lines[index]?.startsWith("- ") &&
      !lines[index]?.startsWith("```")
    ) {
      paragraphLines.push((lines[index] ?? "").trim());
      index += 1;
    }

    blocks.push(
      <p key={`p-${index}`} className="my-4 text-base leading-8 text-muted-foreground">
        {parseInline(paragraphLines.join(" "))}
      </p>,
    );
  }

  return <article className="max-w-none">{blocks}</article>;
}
