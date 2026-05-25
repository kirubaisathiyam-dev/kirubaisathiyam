import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";
import dailyDevotionRecords from "@/public/daily-devotion.json";
import {
  getAllChurchHistoryTopics,
  getChurchHistorySubsections,
} from "@/lib/church-history";
import {
  getDevotionSlug,
  type DailyDevotionRecord,
} from "@/lib/daily-devotion";
import { getSiteUrl } from "@/lib/seo";
import {
  getAllTheologyTopics,
  getTheologySubsectionsBySection,
  THEOLOGY_SECTIONS,
} from "@/lib/theology";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl().toString().replace(/\/$/, "");
  const articles = getAllArticles();
  const churchHistoryTopics = getAllChurchHistoryTopics();
  const theologyTopics = getAllTheologyTopics();
  const devotionRecords = dailyDevotionRecords as DailyDevotionRecord[];
  const latestArticleDate = articles[0]?.date
    ? new Date(articles[0].date)
    : new Date();
  const latestTheologyDate = theologyTopics[0]?.date
    ? new Date(theologyTopics[0].date)
    : latestArticleDate;
  const latestChurchHistoryDate = churchHistoryTopics[0]?.date
    ? new Date(churchHistoryTopics[0].date)
    : latestArticleDate;
  const latestContentDate =
    Math.max(
      latestTheologyDate.getTime(),
      latestChurchHistoryDate.getTime(),
      latestArticleDate.getTime(),
    ) === latestTheologyDate.getTime()
      ? latestTheologyDate
      : Math.max(
            latestChurchHistoryDate.getTime(),
            latestArticleDate.getTime(),
          ) === latestChurchHistoryDate.getTime()
        ? latestChurchHistoryDate
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
      url: `${siteUrl}/church-history`,
      lastModified: latestChurchHistoryDate,
      changeFrequency: "weekly",
      priority: 0.8,
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

  const theologySubsectionEntries: MetadataRoute.Sitemap =
    THEOLOGY_SECTIONS.flatMap((section) =>
      getTheologySubsectionsBySection(section.slug).map((subsection) => ({
        url: `${siteUrl}/theology/${section.slug}/${subsection.slug}`,
        lastModified: subsection.latestDate
          ? new Date(subsection.latestDate)
          : theologyDatesBySection.get(section.slug) ?? latestTheologyDate,
        changeFrequency: "monthly",
        priority: 0.75,
      })),
    );

  const theologyTopicEntries: MetadataRoute.Sitemap = theologyTopics.map(
    (topic) => ({
      url: `${siteUrl}/theology/${topic.sectionSlug}/${topic.subsectionSlug}/${topic.slug}`,
      lastModified: new Date(topic.date),
      changeFrequency: "monthly",
      priority: 0.75,
    }),
  );

  const churchHistorySubsectionEntries: MetadataRoute.Sitemap =
    getChurchHistorySubsections().map((subsection) => ({
      url: `${siteUrl}/church-history/${subsection.slug}`,
      lastModified: subsection.latestDate
        ? new Date(subsection.latestDate)
        : latestChurchHistoryDate,
      changeFrequency: "monthly",
      priority: 0.72,
    }));

  const churchHistoryTopicEntries: MetadataRoute.Sitemap =
    churchHistoryTopics.map((topic) => ({
      url: `${siteUrl}/church-history/${topic.subsectionSlug}/${topic.slug}`,
      lastModified: new Date(topic.date),
      changeFrequency: "monthly",
      priority: 0.72,
    }));

  const devotionEntries: MetadataRoute.Sitemap = devotionRecords.flatMap(
    (record) => {
      if (!record.date) {
        return [];
      }

      return (["am", "pm"] as const)
        .filter((slot) => Boolean(record[slot]?.verse))
        .map((slot) => ({
          url: `${siteUrl}/devotions/${getDevotionSlug(record.date!, slot)}`,
          lastModified: latestContentDate,
          changeFrequency: "yearly" as const,
          priority: 0.7,
        }));
    },
  );

  return [
    ...staticEntries,
    ...articleEntries,
    ...theologySectionEntries,
    ...theologySubsectionEntries,
    ...theologyTopicEntries,
    ...churchHistorySubsectionEntries,
    ...churchHistoryTopicEntries,
    ...devotionEntries,
  ];
}
