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

const churchHistoryDirectory = path.join(process.cwd(), "content/church-history");

export const CHURCH_HISTORY_SECTION = {
  slug: "church-history",
  image: "/images/history.jpg",
  label: "திருச்சபை வரலாறு",
  description:
    "ஆரம்ப திருச்சபை முதல் சீர்திருத்தக் காலம் மற்றும் அதன் பின்னைய காலங்கள் வரை, கிறிஸ்தவ சாட்சியின் வளர்ச்சி, போராட்டங்கள், முக்கிய தலைவர்கள், சபைக் கூட்டங்கள், இயக்கங்கள், மற்றும் இறையியல் வடிவமைப்புகளை ஆராயும் பகுதி.",
} as const;

export type ChurchHistoryTopicMeta = {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  keywords: string[];
  order: number;
  image?: string;
  subsectionSlug: string;
  subsectionLabel: string;
};

export type ChurchHistoryTopic = ChurchHistoryTopicMeta & {
  contentHtml: string;
};

export type ChurchHistorySubsection = {
  slug: string;
  label: string;
  topicCount: number;
  latestDate?: string;
  topics: ChurchHistoryTopicMeta[];
};

type ChurchHistoryTopicMetaWithSort = ChurchHistoryTopicMeta & {
  sortDate: Date;
};

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

function compareTopics(
  a: ChurchHistoryTopicMetaWithSort,
  b: ChurchHistoryTopicMetaWithSort,
) {
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

function readTopicMeta(relativePath: string): ChurchHistoryTopicMetaWithSort {
  const slug = path.basename(relativePath, ".md");
  const fullPath = path.join(churchHistoryDirectory, relativePath);
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
    subsectionSlug,
    subsectionLabel,
    sortDate: parsedDate,
  };
}

export function getAllChurchHistoryTopics(): ChurchHistoryTopicMeta[] {
  return listMarkdownFilesRecursive(churchHistoryDirectory)
    .map((relativePath) => readTopicMeta(relativePath))
    .sort(compareTopics)
    .map((topic) => ({
      slug: topic.slug,
      title: topic.title,
      date: topic.date,
      author: topic.author,
      excerpt: topic.excerpt,
      keywords: topic.keywords,
      order: topic.order,
      image: topic.image,
      subsectionSlug: topic.subsectionSlug,
      subsectionLabel: topic.subsectionLabel,
    }));
}

export function getChurchHistorySubsections() {
  const grouped = new Map<string, ChurchHistorySubsection>();

  for (const topic of getAllChurchHistoryTopics()) {
    const existing = grouped.get(topic.subsectionSlug);

    if (!existing) {
      grouped.set(topic.subsectionSlug, {
        slug: topic.subsectionSlug,
        label: topic.subsectionLabel,
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

export function getChurchHistorySubsection(subsectionSlug: string) {
  return (
    getChurchHistorySubsections().find(
      (subsection) => subsection.slug === subsectionSlug,
    ) ?? null
  );
}

export async function getChurchHistoryTopic(
  subsectionSlug: string,
  slug: string,
): Promise<ChurchHistoryTopic | null> {
  let fullPath = path.join(churchHistoryDirectory, subsectionSlug, `${slug}.md`);

  if (!fs.existsSync(fullPath) && subsectionSlug === "general") {
    fullPath = path.join(churchHistoryDirectory, `${slug}.md`);
  }

  if (!fs.existsSync(fullPath)) {
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
    subsectionSlug,
    subsectionLabel,
    contentHtml,
  };
}
