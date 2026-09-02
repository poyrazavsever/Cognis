import { Icon } from "@/components/app-icon";
import { getLatestRssItems } from "@/lib/rss";
import { type Locale, siteCopy } from "@/lib/i18n";

const RESOURCE_LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/poyrazavsever/neta",
    icon: "mdi:github",
  },
  {
    label: "Demo",
    href: "https://demo.takeneta.com",
    icon: "mdi:monitor-dashboard",
  },
  {
    label: "RSS",
    href: "https://poyrazavsever.com/rss.xml",
    icon: "mdi:rss",
  },
] as const;

export function DocsRightRail({ locale }: { locale: Locale }) {
  const copy = siteCopy[locale].docs;
  const posts = getLatestRssItems(5);

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-8 space-y-8">
        {posts.length > 0 ? (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-normal text-muted-foreground">
              Blog
            </h2>
            <div className="mt-3 grid gap-3">
              {posts.map((post) => (
                <a
                  key={post.link}
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-sm border-l border-border py-1 pl-3 transition-colors hover:border-primary"
                >
                  <span className="line-clamp-2 text-sm font-semibold leading-5 text-foreground group-hover:text-primary">
                    {post.title}
                  </span>
                  <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {post.category ? <span>{post.category}</span> : null}
                    {post.category && post.pubDate ? <span>/</span> : null}
                    {post.pubDate ? <span>{post.pubDate}</span> : null}
                  </span>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="text-xs font-bold uppercase tracking-normal text-muted-foreground">
            {copy.resources}
          </h2>
          <div className="mt-3 grid gap-1">
            {RESOURCE_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex min-h-10 items-center gap-2 rounded-sm px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon icon={link.icon} className="h-4 w-4" />
                {link.label}
              </a>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
