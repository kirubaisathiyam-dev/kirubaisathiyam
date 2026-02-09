import { getAllArticles } from "@/lib/articles";
import Link from "next/link";

export default function Home() {
  const articles = getAllArticles();
  const [featured, ...rest] = articles;

  return (
    <div className="space-y-12">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          கிருபை சத்தியம்
        </h1>
        <p style={{ color: "var(--muted-foreground)" }}>
          தமிழில் எழுத்துகள், போதனைகள், மற்றும் சிந்தனைகள்.
        </p>
      </section>

      {featured && (
        <section className="space-y-4">
          <Link
            href={`/articles/${featured.slug}`}
            className="block rounded-lg border p-4 sm:p-6"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div
              className={`grid gap-6 ${
                featured.image ? "md:grid-cols-[2fr,1fr]" : ""
              }`}
            >
              {featured.image && (
                <div
                  className="overflow-hidden rounded-md border"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="aspect-[16/9] w-full">
                    <img
                      src={featured.image}
                      alt={featured.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Article
                </p>
                <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
                  {featured.title}
                </h2>
                <p
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {featured.date} · {featured.author}
                </p>
                {featured.excerpt && (
                  <p className="leading-relaxed">{featured.excerpt}</p>
                )}
              </div>
            </div>
          </Link>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent</h2>
          <Link
            href="/articles"
            className="text-sm font-semibold hover:underline"
          >
            More →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => (
            <article
              key={article.slug}
              className="flex h-full flex-col gap-3 rounded-lg border p-4"
              style={{ borderColor: "var(--border-color)" }}
            >
              {article.image && (
                <div
                  className="overflow-hidden rounded-md border"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="aspect-[4/3] w-full">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--muted-foreground)" }}
              >
                Article
              </p>
              <Link
                href={`/articles/${article.slug}`}
                className="text-lg font-semibold leading-snug hover:underline"
              >
                {article.title}
              </Link>
              <p
                className="text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                {article.date} · {article.author}
              </p>
              {article.excerpt && (
                <p className="text-sm leading-relaxed">{article.excerpt}</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
