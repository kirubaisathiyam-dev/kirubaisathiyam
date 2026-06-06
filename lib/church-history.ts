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
const GENERAL_GROUP_SLUG = "general";

export const CHURCH_HISTORY_SECTION = {
  slug: "church-history",
  image: "/images/church-history.jpg",
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
  groupSlug: string | null;
  groupLabel: string | null;
};

export type ChurchHistoryTopic = ChurchHistoryTopicMeta & {
  contentHtml: string;
};

export type ChurchHistoryGroup = {
  slug: string;
  label: string;
  topicCount: number;
  latestDate?: string;
  topics: ChurchHistoryTopicMeta[];
};

export type ChurchHistorySubsection = {
  slug: string;
  label: string;
  topicCount: number;
  latestDate?: string;
  directTopics: ChurchHistoryTopicMeta[];
  groups: ChurchHistoryGroup[];
};

type ChurchHistoryTopicMetaWithSort = ChurchHistoryTopicMeta & {
  sortDate: Date;
};

type ChurchHistoryGroupWithSort = ChurchHistoryGroup & {
  sortOrder: number;
};

type ChurchHistorySubsectionWithSort = Omit<ChurchHistorySubsection, "groups"> & {
  groups: ChurchHistoryGroupWithSort[];
  sortOrder: number;
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

function createSlug(value: unknown, fallback = "general") {
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

  return fallback;
}

function formatLabel(value: string) {
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

  if ((a.groupLabel || "") !== (b.groupLabel || "")) {
    return (a.groupLabel || "").localeCompare(b.groupLabel || "");
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
  const directory = path.dirname(relativePath).replace(/\\/g, "/");
  const segments = directory === "." ? [] : directory.split("/");
  const subsectionDir = segments[0] ?? "";
  const groupDir = segments[1] ?? "";

  const subsectionSlug = subsectionDir
    ? subsectionDir
    : createSlug(data.subsectionFolder ?? data.subsection, "general");
  const rawGroupSlug =
    groupDir ||
    (typeof data.group === "string" && data.group.trim()
      ? createSlug(data.groupFolder ?? data.group, GENERAL_GROUP_SLUG)
      : "");

  const subsectionLabel =
    typeof data.subsection === "string" && data.subsection.trim()
      ? data.subsection.trim()
      : formatLabel(subsectionSlug);
  const groupLabel =
    typeof data.group === "string" && data.group.trim()
      ? data.group.trim()
      : rawGroupSlug
        ? formatLabel(rawGroupSlug)
        : null;

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
    groupSlug: rawGroupSlug || null,
    groupLabel,
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
      groupSlug: topic.groupSlug,
      groupLabel: topic.groupLabel,
    }));
}

export function getChurchHistorySubsections() {
  const grouped = new Map<string, ChurchHistorySubsection>();

  for (const topic of getAllChurchHistoryTopics()) {
    let subsection = grouped.get(topic.subsectionSlug);

    if (!subsection) {
      subsection = {
        slug: topic.subsectionSlug,
        label: topic.subsectionLabel,
        topicCount: 0,
        latestDate: topic.date,
        directTopics: [],
        groups: [],
      };
      grouped.set(topic.subsectionSlug, subsection);
    }

    subsection.topicCount += 1;
    if (
      !subsection.latestDate ||
      new Date(topic.date).getTime() > new Date(subsection.latestDate).getTime()
    ) {
      subsection.latestDate = topic.date;
    }

    if (!topic.groupSlug) {
      subsection.directTopics.push(topic);
      continue;
    }

    let group = subsection.groups.find((entry) => entry.slug === topic.groupSlug);

    if (!group) {
      group = {
        slug: topic.groupSlug,
        label: topic.groupLabel || formatLabel(topic.groupSlug),
        topicCount: 0,
        latestDate: topic.date,
        topics: [],
      };
      subsection.groups.push(group);
    }

    group.topicCount += 1;
    if (
      !group.latestDate ||
      new Date(topic.date).getTime() > new Date(group.latestDate).getTime()
    ) {
      group.latestDate = topic.date;
    }
    group.topics.push(topic);
  }

  return Array.from(grouped.values())
    .map((subsection): ChurchHistorySubsectionWithSort => {
      const directTopics = subsection.directTopics.sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order;
        }

        return a.title.localeCompare(b.title);
      });

      const groups = subsection.groups
        .map((group): ChurchHistoryGroupWithSort => {
          const topics = group.topics.sort((a, b) => {
            if (a.order !== b.order) {
              return a.order - b.order;
            }

            return a.title.localeCompare(b.title);
          });

          return {
            ...group,
            topics,
            sortOrder: topics[0]?.order ?? Number.MAX_SAFE_INTEGER,
          };
        })
        .sort((a, b) => {
          if (a.sortOrder !== b.sortOrder) {
            return a.sortOrder - b.sortOrder;
          }

          return a.label.localeCompare(b.label);
        });

      return {
        ...subsection,
        directTopics,
        groups,
        sortOrder: Math.min(
          directTopics[0]?.order ?? Number.MAX_SAFE_INTEGER,
          groups[0]?.sortOrder ?? Number.MAX_SAFE_INTEGER,
        ),
      };
    })
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.label.localeCompare(b.label);
    })
    .map(
      ({
        sortOrder: _sortOrder,
        groups,
        ...subsection
      }: ChurchHistorySubsectionWithSort) => ({
        ...subsection,
        groups: groups.map(
          ({
            sortOrder: _groupSortOrder,
            ...group
          }: ChurchHistoryGroupWithSort) => group,
        ),
      }),
    );
}

export function getChurchHistorySubsection(subsectionSlug: string) {
  return (
    getChurchHistorySubsections().find(
      (subsection) => subsection.slug === subsectionSlug,
    ) ?? null
  );
}

export function getChurchHistoryGroup(
  subsectionSlug: string,
  groupSlug: string,
) {
  return (
    getChurchHistorySubsection(subsectionSlug)?.groups.find(
      (group) => group.slug === groupSlug,
    ) ?? null
  );
}

export async function getChurchHistoryTopic(
  subsectionSlug: string,
  slug: string,
  groupSlug?: string | null,
): Promise<ChurchHistoryTopic | null> {
  let fullPath = groupSlug
    ? path.join(churchHistoryDirectory, subsectionSlug, groupSlug, `${slug}.md`)
    : path.join(churchHistoryDirectory, subsectionSlug, `${slug}.md`);

  if (!fs.existsSync(fullPath) && groupSlug === GENERAL_GROUP_SLUG) {
    fullPath = path.join(churchHistoryDirectory, subsectionSlug, `${slug}.md`);
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
      : formatLabel(subsectionSlug);
  const rawGroupLabel =
    typeof data.group === "string" && data.group.trim() ? data.group.trim() : "";
  const resolvedGroupSlug = rawGroupLabel
    ? createSlug(data.groupFolder ?? data.group, GENERAL_GROUP_SLUG)
    : groupSlug || null;

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
    groupSlug: resolvedGroupSlug,
    groupLabel: rawGroupLabel || (resolvedGroupSlug ? formatLabel(resolvedGroupSlug) : null),
    contentHtml,
  };
}
