import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";
import { getSiteUrl } from "@/lib/seo";
import { getAllTheologyTopics, THEOLOGY_SECTIONS } from "@/lib/theology";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const articles = getAllArticles();
  const theologyTopics = getAllTheologyTopics();
  const latestArticleDate = articles[0]?.date
    ? new Date(articles[0].date)
    : new Date();
  const latestTheologyDate = theologyTopics[0]?.date
    ? new Date(theologyTopics[0].date)
    : latestArticleDate;
  const latestContentDate =
    latestTheologyDate.getTime() > latestArticleDate.getTime()
      ? latestTheologyDate
      : latestArticleDate;

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: latestContentDate,
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
      url: `${siteUrl}/theology`,
      lastModified: latestTheologyDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/bible`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/privacy-terms`,
      lastModified: new Date("2026-02-26"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/articles/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const theologyDatesBySection = new Map(
    THEOLOGY_SECTIONS.map((section) => {
      const latestTopic = theologyTopics.find(
        (topic) => topic.sectionSlug === section.slug,
      );

      return [
        section.slug,
        latestTopic?.date ? new Date(latestTopic.date) : latestTheologyDate,
      ];
    }),
  );

  const theologySectionEntries: MetadataRoute.Sitemap = THEOLOGY_SECTIONS.map(
    (section) => ({
      url: `${siteUrl}/theology/${section.slug}`,
      lastModified: theologyDatesBySection.get(section.slug) ?? latestTheologyDate,
      changeFrequency: "monthly",
      priority: 0.75,
    }),
  );

  const theologyTopicEntries: MetadataRoute.Sitemap = theologyTopics.map(
    (topic) => ({
      url: `${siteUrl}/theology/${topic.sectionSlug}/${topic.slug}`,
      lastModified: new Date(topic.date),
      changeFrequency: "monthly",
      priority: 0.75,
    }),
  );

  return [
    ...staticEntries,
    ...articleEntries,
    ...theologySectionEntries,
    ...theologyTopicEntries,
  ];
}
