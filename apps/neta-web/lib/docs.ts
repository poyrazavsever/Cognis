import fs from "node:fs";
import path from "node:path";
import { DEFAULT_LOCALE, type Locale, getDocsHref } from "@/lib/i18n";

const DOCS_ROOT = path.join(process.cwd(), "content", "docs");

export type DocMeta = {
  title: string;
  description: string;
  order: number;
};

export type DocPage = {
  slug: string[];
  href: string;
  content: string;
  meta: DocMeta;
};

type ParsedMarkdown = {
  content: string;
  meta: Partial<DocMeta>;
};

function parseFrontmatter(source: string): ParsedMarkdown {
  if (!source.startsWith("---")) {
    return { content: source.trim(), meta: {} };
  }

  const endIndex = source.indexOf("\n---", 3);

  if (endIndex === -1) {
    return { content: source.trim(), meta: {} };
  }

  const frontmatter = source.slice(3, endIndex).trim();
  const content = source.slice(endIndex + 4).trim();
  const meta: Partial<DocMeta> = {};

  for (const line of frontmatter.split("\n")) {
    const [rawKey, ...valueParts] = line.split(":");
    const key = rawKey?.trim();
    const value = valueParts.join(":").trim().replace(/^["']|["']$/g, "");

    if (key === "title") {
      meta.title = value;
    }

    if (key === "description") {
      meta.description = value;
    }

    if (key === "order") {
      meta.order = Number(value);
    }
  }

  return { content, meta };
}

function getMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return getMarkdownFiles(absolutePath);
    }

    return entry.isFile() && entry.name.endsWith(".md") ? [absolutePath] : [];
  });
}

function getDocsRoot(locale: Locale) {
  return path.join(DOCS_ROOT, locale);
}

function slugFromFile(filePath: string, locale: Locale) {
  const relativePath = path.relative(getDocsRoot(locale), filePath);
  const withoutExtension = relativePath.replace(/\.md$/, "");
  const segments = withoutExtension.split(path.sep);

  return segments[0] === "index" ? [] : segments;
}

export function getAllDocs(locale: Locale = DEFAULT_LOCALE) {
  return getMarkdownFiles(getDocsRoot(locale))
    .map((filePath) => {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = parseFrontmatter(raw);
      const slug = slugFromFile(filePath, locale);
      const fallbackTitle = slug.at(-1) ?? "Documentation";

      return {
        slug,
        href: getDocsHref(locale, slug),
        content: parsed.content,
        meta: {
          title: parsed.meta.title ?? fallbackTitle,
          description: parsed.meta.description ?? "",
          order: parsed.meta.order ?? 999,
        },
      } satisfies DocPage;
    })
    .sort(
      (a, b) =>
        a.meta.order - b.meta.order || a.meta.title.localeCompare(b.meta.title),
    );
}

export function getDocBySlug(locale: Locale, slug: string[]) {
  const normalizedSlug = slug.length === 0 ? ["index"] : slug;
  const filePath = path.join(getDocsRoot(locale), ...normalizedSlug) + ".md";

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = parseFrontmatter(raw);
  const hrefSlug = slug.length === 0 ? [] : slug;
  const fallbackTitle = hrefSlug.at(-1) ?? "Documentation";

  return {
    slug: hrefSlug,
    href: getDocsHref(locale, hrefSlug),
    content: parsed.content,
    meta: {
      title: parsed.meta.title ?? fallbackTitle,
      description: parsed.meta.description ?? "",
      order: parsed.meta.order ?? 999,
    },
  } satisfies DocPage;
}
