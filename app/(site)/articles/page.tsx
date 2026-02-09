import { getAllArticles } from "@/lib/articles";
import Image from "next/image";
import Link from "next/link";

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
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
              className="block border"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start">
                {article.image && (
                  <div
                    className="flex-shrink-0 self-start overflow-hidden border w-full sm:w-72"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        sizes="(min-width: 640px) 18rem, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2 p-4 sm:p-5">
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
