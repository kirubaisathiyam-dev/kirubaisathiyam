import { getAllArticles } from "@/lib/articles";
import { formatTamilDate } from "@/lib/date";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const articles = getAllArticles();
  const [featured, ...rest] = articles;

  return (
    <div className="space-y-12">
      {/* <section className="space-y-3">
        <h1 className="text-2xl font-semibold leading-tight sm:text-3xl">
          கிருபை சத்தியம்
        </h1>
        <p style={{ color: "var(--muted-foreground)" }}>
          தமிழில் எழுத்துகள், போதனைகள், மற்றும் சிந்தனைகள்.
        </p>
      </section> */}

      {featured && (
        <section className="space-y-4">
          <Link
            href={`/articles/${featured.slug}`}
            className="block border"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div
              className={`grid ${
                featured.image ? "md:grid-cols-[2fr,1fr]" : ""
              }`}
            >
              {featured.image && (
                <div
                  className="overflow-hidden border"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={featured.image}
                      alt={featured.title}
                      fill
                      sizes="(min-width: 1024px) 40rem, 100vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-3 p-4 sm:p-6">
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  கட்டுரை
                </p>
                <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
                  {featured.title}
                </h2>
                <p
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {formatTamilDate(featured.date)} · {featured.author}
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
          <h2 className="text-xl font-semibold">சமீபத்திய கட்டுரைகள்</h2>
          <Link
            href="/articles"
            className="text-sm font-semibold hover:underline"
          >
            மேலும் →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => (
            <article
              key={article.slug}
              className="flex h-full flex-col border"
              style={{ borderColor: "var(--border-color)" }}
            >
              {article.image && (
                <div
                  className="overflow-hidden border"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      sizes="(min-width: 1024px) 18rem, 100vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="p-4 space-y-2">
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  கட்டுரை
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
                  {formatTamilDate(article.date)} · {article.author}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
