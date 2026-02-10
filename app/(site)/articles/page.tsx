import ArticlesBrowser from "@/components/ArticlesBrowser";
import { getAllArticles } from "@/lib/articles";

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          கட்டுரைகள்
        </h1>
        <p style={{ color: "var(--muted-foreground)" }}>
          சமீபத்திய கட்டுரைகள் மற்றும் சிந்தனைகள்.
        </p>
      </header>

      <ArticlesBrowser articles={articles} />
    </div>
  );
}



