import SubscribeForm from "@/components/SubscribeForm";
import { getAllArticles } from "@/lib/articles";
import Link from "next/link";

export default function Home() {
  const articles = getAllArticles();

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

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Latest Articles</h2>
        <ul className="space-y-6">
          {articles.map((a) => (
            <li key={a.slug} className="space-y-2">
              <Link
                href={`/articles/${a.slug}`}
                className="text-lg font-semibold hover:underline"
              >
                {a.title}
              </Link>
              <p
                className="text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                {a.date} · {a.author}
              </p>
              {a.excerpt && <p className="leading-relaxed">{a.excerpt}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          புதிய கட்டுரைகள் உங்கள் மின்னஞ்சலில்
        </h2>
        <SubscribeForm />
      </section>
    </div>
  );
}
