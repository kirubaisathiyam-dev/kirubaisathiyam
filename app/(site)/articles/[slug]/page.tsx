import { getAllArticles, getArticleBySlug } from "@/lib/articles";

export function generateStaticParams() {
  const articles = getAllArticles();

  return articles.map((article) => ({
    slug: article.slug,
  }));
}

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
          {article.title}
        </h1>
        <p style={{ color: "var(--muted-foreground)" }} className="text-sm">
          {article.date} · {article.author}
        </p>
      </header>

      {article.image && (
        <div
          className="overflow-hidden rounded-lg border"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="aspect-[16/9] w-full">
            <img
              src={article.image}
              alt={article.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      )}

      <div
        className="prose prose-neutral max-w-none"
        dangerouslySetInnerHTML={{ __html: article.contentHtml }}
      />
    </article>
  );
}
