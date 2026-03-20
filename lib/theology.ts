import fs from "fs";
import path from "path";
import {
  getAudioPath,
  getCoverImage,
  getExcerpt,
  listMarkdownFiles,
  normalizeStringList,
  parseDate,
  parseMarkdownFile,
  renderMarkdown,
} from "@/lib/content-utils";

const theologyDirectory = path.join(process.cwd(), "content/theology");

export const THEOLOGY_SECTIONS = [
  {
    slug: "muraimai-iraiyiyal",
    label: "முறையியல் இறையியல்",
    description:
      "கிறிஸ்தவ சத்தியங்களை தலைப்புகளின் அடிப்படையில் ஒழுங்குபடுத்திப் படிக்க வேண்டிய பகுதி.",
  },
  {
    slug: "seerthirutha-iraiyiyal",
    label: "சீர்திருத்த இறையியல்",
    description:
      "சீர்திருத்த மரபில் வேரூன்றிய கிருபை மையமான இறையியல் தலைப்புகள் இடம்பெறும் பகுதி.",
  },
] as const;

export type TheologySectionSlug = (typeof THEOLOGY_SECTIONS)[number]["slug"];

export type TheologyTopicMeta = {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  tags: string[];
  keywords: string[];
  image?: string;
  audio?: string;
  summary?: string;
  sectionSlug: TheologySectionSlug;
  sectionLabel: string;
  sectionDescription: string;
};

export type TheologyTopic = TheologyTopicMeta & {
  contentHtml: string;
};

type TheologyTopicMetaWithSort = TheologyTopicMeta & {
  sortDate: Date;
};

function getSectionDirectory(sectionSlug: TheologySectionSlug) {
  return path.join(theologyDirectory, sectionSlug);
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

function readTopicMeta(
  sectionSlug: TheologySectionSlug,
  fileName: string,
): TheologyTopicMetaWithSort {
  const section = getTheologySection(sectionSlug);

  if (!section) {
    throw new Error(`Unknown irayiyal section: ${sectionSlug}`);
  }

  const slug = fileName.replace(/\.md$/i, "");
  const fullPath = path.join(getSectionDirectory(sectionSlug), fileName);
  const { data, content, stats } = parseMarkdownFile(fullPath);
  const parsedDate = parseDate(data.date, stats.mtime);
  const image = getCoverImage(content, { image: data.image });
  const summary = typeof data.summary === "string" ? data.summary : "";
  const tags = normalizeStringList(data.tags);
  const keywords = normalizeStringList(data.keywords);
  const audio = getAudioPath(data.audio);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : "",
    date:
      typeof data.date === "string"
        ? data.date
        : parsedDate.toISOString().slice(0, 10),
    author: typeof data.author === "string" ? data.author : "",
    excerpt: summary || getExcerpt(content),
    tags,
    keywords,
    image: image || undefined,
    audio: audio || undefined,
    summary: summary || undefined,
    sectionSlug,
    sectionLabel: section.label,
    sectionDescription: section.description,
    sortDate: parsedDate,
  };
}

export function getAllTheologyTopics(): TheologyTopicMeta[] {
  const topics = THEOLOGY_SECTIONS.flatMap((section) =>
    listMarkdownFiles(getSectionDirectory(section.slug)).map((fileName) =>
      readTopicMeta(section.slug, fileName),
    ),
  );

  return topics
    .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
    .map((topic) => ({
      slug: topic.slug,
      title: topic.title,
      date: topic.date,
      author: topic.author,
      excerpt: topic.excerpt,
      tags: topic.tags,
      keywords: topic.keywords,
      image: topic.image,
      audio: topic.audio,
      summary: topic.summary,
      sectionSlug: topic.sectionSlug,
      sectionLabel: topic.sectionLabel,
      sectionDescription: topic.sectionDescription,
    }));
}

export function getTheologyTopicsBySection(sectionSlug: TheologySectionSlug) {
  return getAllTheologyTopics().filter(
    (topic) => topic.sectionSlug === sectionSlug,
  );
}

export function getTheologySectionsWithTopics() {
  return THEOLOGY_SECTIONS.map((section) => ({
    ...section,
    topics: getTheologyTopicsBySection(section.slug),
  }));
}

export async function getTheologyTopic(
  sectionSlug: TheologySectionSlug,
  slug: string,
): Promise<TheologyTopic | null> {
  const fullPath = path.join(getSectionDirectory(sectionSlug), `${slug}.md`);

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
  const summary = typeof data.summary === "string" ? data.summary : "";
  const tags = normalizeStringList(data.tags);
  const keywords = normalizeStringList(data.keywords);
  const audio = getAudioPath(data.audio);
  const contentHtml = await renderMarkdown(content);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : "",
    date:
      typeof data.date === "string"
        ? data.date
        : parsedDate.toISOString().slice(0, 10),
    author: typeof data.author === "string" ? data.author : "",
    excerpt: summary || getExcerpt(content),
    tags,
    keywords,
    image: image || undefined,
    audio: audio || undefined,
    summary: summary || undefined,
    sectionSlug,
    sectionLabel: section.label,
    sectionDescription: section.description,
    contentHtml,
  };
}
