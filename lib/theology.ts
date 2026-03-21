import fs from "fs";
import path from "path";
import {
  getCoverImage,
  getExcerpt,
  listMarkdownFilesRecursive,
  normalizeStringList,
  parseDate,
  parseMarkdownFile,
  renderMarkdown,
} from "@/lib/content-utils";

const theologyDirectory = path.join(process.cwd(), "content/theology");

export const THEOLOGY_SECTIONS = [
  {
    slug: "systematic-theology",
    label: "முறையியல் இறையியல்",
    description:
      "கோட்பாடுகளும் தலைப்புவாரியான ஒழுங்குமுறையும் அடிப்படையாக அமைக்கப்பட்ட இறையியல் தலைப்புகள்.",
  },
  {
    slug: "reformed-theology",
    label: "சீர்திருத்த இறையியல்",
    description:
      "சீர்திருத்த மரபும் கிருபை மையக்கருத்தும் வலியுறுத்தும் இறையியல் தலைப்புகள்.",
  },
] as const;

export type TheologySectionSlug = (typeof THEOLOGY_SECTIONS)[number]["slug"];

export type TheologyTopicMeta = {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  keywords: string[];
  order: number;
  image?: string;
  sectionSlug: TheologySectionSlug;
  sectionLabel: string;
  sectionDescription: string;
  subsectionSlug: string;
  subsectionLabel: string;
};

export type TheologyTopic = TheologyTopicMeta & {
  contentHtml: string;
};

export type TheologySubsection = {
  slug: string;
  label: string;
  sectionSlug: TheologySectionSlug;
  sectionLabel: string;
  topicCount: number;
  latestDate?: string;
  topics: TheologyTopicMeta[];
};

type TheologyTopicMetaWithSort = TheologyTopicMeta & {
  sortDate: Date;
};

function getSectionDirectory(sectionSlug: TheologySectionSlug) {
  return path.join(theologyDirectory, sectionSlug);
}

function parseOrder(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return Number.MAX_SAFE_INTEGER;
}

function compareTopics(a: TheologyTopicMetaWithSort, b: TheologyTopicMetaWithSort) {
  if (a.sectionSlug !== b.sectionSlug) {
    return a.sectionSlug.localeCompare(b.sectionSlug);
  }

  if (a.order !== b.order) {
    return a.order - b.order;
  }

  if (a.subsectionLabel !== b.subsectionLabel) {
    return a.subsectionLabel.localeCompare(b.subsectionLabel);
  }

  if (a.title !== b.title) {
    return a.title.localeCompare(b.title);
  }

  return a.sortDate.getTime() - b.sortDate.getTime();
}

export function isTheologySection(value: string): value is TheologySectionSlug {
  return THEOLOGY_SECTIONS.some((section) => section.slug === value);
}

export function getTheologySection(sectionSlug: string) {
  if (!isTheologySection(sectionSlug)) {
    return null;
  }

  return (
    THEOLOGY_SECTIONS.find((section) => section.slug === sectionSlug) ?? null
  );
}

function createSubsectionSlug(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    const cleaned = value
      .trim()
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "");

    if (cleaned) {
      return cleaned;
    }
  }

  return "general";
}

function formatSubsectionLabel(value: string) {
  const normalized = value.replace(/[-_]+/g, " ").trim();

  if (!normalized) {
    return "பொது";
  }

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function readTopicMeta(
  sectionSlug: TheologySectionSlug,
  relativePath: string,
): TheologyTopicMetaWithSort {
  const section = getTheologySection(sectionSlug);

  if (!section) {
    throw new Error(`Unknown theology section: ${sectionSlug}`);
  }

  const slug = path.basename(relativePath, ".md");
  const fullPath = path.join(getSectionDirectory(sectionSlug), relativePath);
  const { data, content, stats } = parseMarkdownFile(fullPath);
  const parsedDate = parseDate(data.date, stats.mtime);
  const image = getCoverImage(content, { image: data.image });
  const keywords = normalizeStringList(data.keywords);
  const subsectionDirectory = path.dirname(relativePath).replace(/\\/g, "/");
  const subsectionSlug =
    subsectionDirectory !== "." && subsectionDirectory
      ? subsectionDirectory
      : createSubsectionSlug(data.subsectionFolder ?? data.subsection);
  const subsectionLabel =
    typeof data.subsection === "string" && data.subsection.trim()
      ? data.subsection.trim()
      : formatSubsectionLabel(
          subsectionDirectory !== "." ? subsectionDirectory : subsectionSlug,
        );

  return {
    slug,
    title: typeof data.title === "string" ? data.title : "",
    date:
      typeof data.date === "string"
        ? data.date
        : parsedDate.toISOString().slice(0, 10),
    author: typeof data.author === "string" ? data.author : "",
    excerpt: getExcerpt(content),
    keywords,
    order: parseOrder(data.order),
    image: image || undefined,
    sectionSlug,
    sectionLabel: section.label,
    sectionDescription: section.description,
    subsectionSlug,
    subsectionLabel,
    sortDate: parsedDate,
  };
}

export function getAllTheologyTopics(): TheologyTopicMeta[] {
  const topics = THEOLOGY_SECTIONS.flatMap((section) =>
    listMarkdownFilesRecursive(getSectionDirectory(section.slug)).map(
      (relativePath) => readTopicMeta(section.slug, relativePath),
    ),
  );

  return topics.sort(compareTopics).map((topic) => ({
    slug: topic.slug,
    title: topic.title,
    date: topic.date,
    author: topic.author,
    excerpt: topic.excerpt,
    keywords: topic.keywords,
    order: topic.order,
    image: topic.image,
    sectionSlug: topic.sectionSlug,
    sectionLabel: topic.sectionLabel,
    sectionDescription: topic.sectionDescription,
    subsectionSlug: topic.subsectionSlug,
    subsectionLabel: topic.subsectionLabel,
  }));
}

export function getTheologyTopicsBySection(sectionSlug: TheologySectionSlug) {
  return getAllTheologyTopics().filter(
    (topic) => topic.sectionSlug === sectionSlug,
  );
}

export function getTheologySubsectionsBySection(
  sectionSlug: TheologySectionSlug,
) {
  const section = getTheologySection(sectionSlug);

  if (!section) {
    return [];
  }

  const grouped = new Map<string, TheologySubsection>();

  for (const topic of getTheologyTopicsBySection(sectionSlug)) {
    const existing = grouped.get(topic.subsectionSlug);

    if (!existing) {
      grouped.set(topic.subsectionSlug, {
        slug: topic.subsectionSlug,
        label: topic.subsectionLabel,
        sectionSlug,
        sectionLabel: section.label,
        topicCount: 1,
        latestDate: topic.date,
        topics: [topic],
      });
      continue;
    }

    existing.topicCount += 1;
    existing.topics.push(topic);
    if (
      !existing.latestDate ||
      new Date(topic.date).getTime() > new Date(existing.latestDate).getTime()
    ) {
      existing.latestDate = topic.date;
    }
  }

  return Array.from(grouped.values()).map((subsection) => ({
    ...subsection,
    topics: subsection.topics.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }

      return a.title.localeCompare(b.title);
    }),
  }));
}

export function getTheologySectionsWithTopics() {
  return THEOLOGY_SECTIONS.map((section) => ({
    ...section,
    topics: getTheologyTopicsBySection(section.slug),
    subsections: getTheologySubsectionsBySection(section.slug),
  }));
}

export function getTheologySubsection(
  sectionSlug: TheologySectionSlug,
  subsectionSlug: string,
) {
  return (
    getTheologySubsectionsBySection(sectionSlug).find(
      (subsection) => subsection.slug === subsectionSlug,
    ) ?? null
  );
}

export async function getTheologyTopic(
  sectionSlug: TheologySectionSlug,
  subsectionSlug: string,
  slug: string,
): Promise<TheologyTopic | null> {
  let fullPath = path.join(
    getSectionDirectory(sectionSlug),
    subsectionSlug,
    `${slug}.md`,
  );

  if (!fs.existsSync(fullPath) && subsectionSlug === "general") {
    fullPath = path.join(getSectionDirectory(sectionSlug), `${slug}.md`);
  }

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const section = getTheologySection(sectionSlug);

  if (!section) {
    return null;
  }

  const { data, content, stats } = parseMarkdownFile(fullPath);
  const parsedDate = parseDate(data.date, stats.mtime);
  const image = getCoverImage(content, { image: data.image });
  const keywords = normalizeStringList(data.keywords);
  const contentHtml = await renderMarkdown(content);
  const subsectionLabel =
    typeof data.subsection === "string" && data.subsection.trim()
      ? data.subsection.trim()
      : formatSubsectionLabel(subsectionSlug);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : "",
    date:
      typeof data.date === "string"
        ? data.date
        : parsedDate.toISOString().slice(0, 10),
    author: typeof data.author === "string" ? data.author : "",
    excerpt: getExcerpt(content),
    keywords,
    order: parseOrder(data.order),
    image: image || undefined,
    sectionSlug,
    sectionLabel: section.label,
    sectionDescription: section.description,
    subsectionSlug,
    subsectionLabel,
    contentHtml,
  };
}
