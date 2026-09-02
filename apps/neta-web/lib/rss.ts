import fs from "node:fs";
import path from "node:path";

const RSS_PATH = path.join(process.cwd(), "rss.xml");

export type RssItem = {
  title: string;
  link: string;
  category: string;
  pubDate: string;
};

function readTag(source: string, tag: string) {
  const match = source.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  return decodeXml(match?.[1]?.trim() ?? "");
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getLatestRssItems(limit = 5): RssItem[] {
  if (!fs.existsSync(RSS_PATH)) {
    return [];
  }

  const source = fs.readFileSync(RSS_PATH, "utf8");
  const items = source.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

  return items.slice(0, limit).map((item) => ({
    title: readTag(item, "title"),
    link: readTag(item, "link"),
    category: readTag(item, "category"),
    pubDate: formatDate(readTag(item, "pubDate")),
  }));
}
