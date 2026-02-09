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
    <main style={{ padding: "2rem" }}>
      <h1>{article.title}</h1>
      <p>
        {article.date} · {article.author}
      </p>
      <article dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
    </main>
  );
}
