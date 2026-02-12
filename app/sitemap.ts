import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const articles = getAllArticles();
  const latestArticleDate = articles[0]?.date
    ? new Date(articles[0].date)
    : new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: latestArticleDate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/articles`,
      lastModified: latestArticleDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/bible`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/articles/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticEntries, ...articleEntries];
}
