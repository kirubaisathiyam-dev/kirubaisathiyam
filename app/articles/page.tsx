import { getAllArticles } from "@/lib/articles";
import Link from "next/link";

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          Articles
        </h1>
        <p style={{ color: "var(--muted-foreground)" }}>
          Read the latest articles and reflections.
        </p>
      </header>

      <ul className="space-y-6">
        {articles.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/articles/${article.slug}`}
              className="block rounded-lg border p-4 sm:p-5"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {article.image && (
                  <div
                    className="overflow-hidden rounded-md border sm:w-48"
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
                <div className="space-y-2">
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Article
                  </p>
                  <h2 className="text-lg font-semibold leading-snug">
                    {article.title}
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {article.date} · {article.author}
                  </p>
                  {article.excerpt && (
                    <p className="text-sm leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
