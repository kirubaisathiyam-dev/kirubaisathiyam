import { getAllArticles } from "@/lib/articles";
import Link from "next/link";

export default function Home() {
  const articles = getAllArticles();

  return (
    <main style={{ padding: "2rem" }}>
      <h1>கிருபை சத்தியம்</h1>

      <ul>
        {articles.map((a) => (
          <li key={a.slug}>
            <Link href={`/articles/${a.slug}`}>
              {a.title} - {a.date}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
