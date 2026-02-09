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
          <li key={article.slug} className="space-y-2">
            <Link
              href={`/articles/${article.slug}`}
              className="text-lg font-semibold hover:underline"
            >
              {article.title}
            </Link>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {article.date} · {article.author}
            </p>
            {article.excerpt && (
              <p className="leading-relaxed">{article.excerpt}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
