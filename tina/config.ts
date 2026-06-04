import { defineConfig } from "tinacms";

const articleTypeOptions = [
  { label: "கட்டுரை", value: "கட்டுரை" },
  { label: "பிரசங்கம்", value: "பிரசங்கம்" },
  { label: "தியானம்", value: "தியானம்" },
  { label: "ஆய்வு", value: "ஆய்வு" },
  { label: "சாட்சியம்", value: "சாட்சியம்" },
];

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function createTimestampSlug(dateValue?: string) {
  const baseDate =
    typeof dateValue === "string" && dateValue
      ? new Date(dateValue)
      : new Date();
  const safeDate = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;
  const now = new Date();

  return [
    safeDate.getUTCFullYear(),
    pad(safeDate.getUTCMonth() + 1),
    pad(safeDate.getUTCDate()),
    pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds()),
  ].join("-");
}

function createArticleSlug(dateValue?: string) {
  return createTimestampSlug(dateValue);
}

function createSubsectionFolderSlug(value?: string, dateValue?: string) {
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

  return `subsection-${createTimestampSlug(dateValue)}`;
}

function createTheologyFilePath(
  subsectionFolderValue?: string,
  dateValue?: string,
) {
  const fileName = createTimestampSlug(dateValue);

  if (typeof subsectionFolderValue === "string" && subsectionFolderValue.trim()) {
    return `${createSubsectionFolderSlug(subsectionFolderValue, dateValue)}/${fileName}`;
  }

  return fileName;
}

function createChurchHistoryFilePath(
  subsectionFolderValue?: string,
  groupFolderValue?: string,
  dateValue?: string,
) {
  const fileName = createTimestampSlug(dateValue);
  const subsectionFolder = createSubsectionFolderSlug(
    subsectionFolderValue,
    dateValue,
  );
  if (typeof groupFolderValue === "string" && groupFolderValue.trim()) {
    const groupFolder = createSubsectionFolderSlug(groupFolderValue, dateValue);
    return `${subsectionFolder}/${groupFolder}/${fileName}`;
  }

  return `${subsectionFolder}/${fileName}`;
}

function createBookFolderSlug(value?: string, fallbackValue?: string) {
  return createSubsectionFolderSlug(value || fallbackValue);
}

function createBookMetaPath(bookFolderValue?: string, titleValue?: string) {
  return createBookFolderSlug(bookFolderValue, titleValue);
}

function createBookChapterFilePath(
  bookFolderValue?: string,
  sectionFolderValue?: string,
  sectionValue?: string,
  dateValue?: string,
) {
  const fileName = createTimestampSlug(dateValue);
  const bookFolder = createBookFolderSlug(bookFolderValue, "book");
  if (typeof sectionValue === "string" && sectionValue.trim()) {
    const sectionFolder = createBookFolderSlug(sectionFolderValue, sectionValue);
    return `${bookFolder}/${sectionFolder}/${fileName}`;
  }

  return `${bookFolder}/${fileName}`;
}

function createDateField() {
  return {
    type: "datetime" as const,
    name: "date",
    label: "Date",
    required: true,
  };
}

function createAuthorField() {
  return {
    type: "string" as const,
    name: "author",
    label: "Author",
    required: true,
  };
}

function createTagsField() {
  return {
    type: "string" as const,
    name: "tags",
    label: "Tags",
    list: true,
    required: true,
  };
}

function createKeywordsField() {
  return {
    type: "string" as const,
    name: "keywords",
    label: "Keywords",
    list: true,
    required: true,
  };
}

function createSummaryField() {
  return {
    type: "string" as const,
    name: "summary",
    label: "Summary",
    maxSearchIndexFieldLength: 240,
    ui: {
      component: "textarea",
    },
  };
}

function createCreditsField() {
  return {
    type: "string" as const,
    name: "credits",
    label: "Credits",
    ui: {
      component: "textarea",
    },
    description:
      "Source, translator, reviewer, and original-link note shown on the front of the book page. Markdown links are supported.",
  };
}

function createImageField() {
  return {
    type: "image" as const,
    name: "image",
    label: "Cover Image",
  };
}

function createAudioField() {
  return {
    type: "image" as const,
    name: "audio",
    label: "Audio",
    searchable: false,
    description:
      "Upload or select an audio file, for example /uploads/sermon.mp3.",
  };
}

function createBodyField() {
  return {
    type: "rich-text" as const,
    name: "body",
    label: "Body",
    isBody: true,
    required: true,
    maxSearchIndexFieldLength: 500,
  };
}

function createOrderField() {
  return {
    type: "number" as const,
    name: "order",
    label: "Order",
    required: false,
    description:
      "Smaller numbers appear first in the theology section table of contents.",
  };
}

function createSubsectionField() {
  return {
    type: "string" as const,
    name: "subsection",
    label: "Subsection",
    required: true,
    description:
      "Visible subsection name. You can enter Tamil here, for example: தேவனியல்.",
  };
}

function createSubsectionFolderField() {
  return {
    type: "string" as const,
    name: "subsectionFolder",
    label: "Subsection Folder",
    required: false,
    description:
      "English folder name for a new subsection, for example: theology-proper, christology, salvation. Leave this empty when creating inside an existing subsection folder.",
  };
}

function createGroupField() {
  return {
    type: "string" as const,
    name: "group",
    label: "Sub-subsection",
    required: false,
    description:
      "Optional nested group name, for example: Preparation for Christianity. Leave empty if the topic belongs directly under the subsection.",
  };
}

function createGroupFolderField() {
  return {
    type: "string" as const,
    name: "groupFolder",
    label: "Sub-subsection Folder",
    required: false,
    description:
      "English folder name for the nested group, for example: preparation-for-christianity.",
  };
}

function createBookFolderField() {
  return {
    type: "string" as const,
    name: "bookFolder",
    label: "Book Folder",
    required: false,
    description:
      "English folder name for the book, for example: the-mortification-of-sin.",
  };
}

function createSectionField() {
  return {
    type: "string" as const,
    name: "section",
    label: "Section",
    required: false,
    description: "Optional visible section name inside the book.",
  };
}

function createSectionFolderField() {
  return {
    type: "string" as const,
    name: "sectionFolder",
    label: "Section Folder",
    required: false,
    description:
      "English folder name for the section, for example: the-nature-of-mortification.",
  };
}

function createArticleFields() {
  return [
    createTagsField(),
    createKeywordsField(),
    createSummaryField(),
    createImageField(),
    createAudioField(),
    createBodyField(),
  ];
}

function createTheologyFields() {
  return [
    createOrderField(),
    createDateField(),
    createBodyField(),
  ];
}

const branch =
  process.env.NEXT_PUBLIC_TINA_BRANCH ||
  process.env.CF_PAGES_BRANCH ||
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";
const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
const tinaClientId = process.env.NEXT_PUBLIC_TINA_CLIENT_ID;
const tinaToken = process.env.TINA_TOKEN;
const searchIndexerToken = process.env.TINA_SEARCH_INDEXER_TOKEN || "";

const searchConfig = {
  tina: {
    indexerToken: searchIndexerToken,
    stopwordLanguages: ["eng"],
    fuzzyEnabled: true,
    fuzzyOptions: {
      maxDistance: 2,
      minSimilarity: 0.6,
      maxTermExpansions: 10,
      useTranspositions: true,
    },
  },
  indexBatchSize: 100,
  maxSearchIndexFieldLength: 300,
};

export default defineConfig({
  branch,
  ...(!isLocal
    ? {
        clientId: tinaClientId,
        token: tinaToken,
      }
    : {}),
  build: {
    outputFolder: "tina-admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
    accept: ["image/*", "audio/*"],
  },
  search: searchConfig,
  schema: {
    collections: [
      {
        name: "article",
        label: "Articles",
        path: "content/articles",
        format: "md",
        ui: {
          filename: {
            slugify: (values) => createArticleSlug(values.date),
            readonly: true,
            description:
              "New articles keep the existing timestamp-style filename format.",
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          createDateField(),
          createAuthorField(),
          {
            type: "string",
            name: "type",
            label: "Type",
            options: articleTypeOptions,
            required: true,
          },
          ...createArticleFields(),
        ],
      },
      {
        name: "systematicTheology",
        label: "Systematic Theology",
        path: "content/theology/systematic-theology",
        format: "md",
        ui: {
          filename: {
            slugify: (values) =>
              createTheologyFilePath(values.subsectionFolder, values.date),
            description:
              "Each topic is stored as a timestamp-named markdown file inside the English subsection folder.",
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          createSubsectionField(),
          createSubsectionFolderField(),
          ...createTheologyFields(),
        ],
      },
      {
        name: "reformedTheology",
        label: "Reformed Theology",
        path: "content/theology/reformed-theology",
        format: "md",
        ui: {
          filename: {
            slugify: (values) =>
              createTheologyFilePath(values.subsectionFolder, values.date),
            description:
              "Each topic is stored as a timestamp-named markdown file inside the English subsection folder.",
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          createSubsectionField(),
          createSubsectionFolderField(),
          ...createTheologyFields(),
        ],
      },
      {
        name: "churchHistory",
        label: "Church History",
        path: "content/church-history",
        format: "md",
        ui: {
          filename: {
            slugify: (values) =>
              createChurchHistoryFilePath(
                values.subsectionFolder,
                values.groupFolder,
                values.date,
              ),
            description:
              "Each topic is stored as a timestamp-named markdown file inside subsection and nested group folders.",
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          createSubsectionField(),
          createSubsectionFolderField(),
          createGroupField(),
          createGroupFolderField(),
          ...createTheologyFields(),
        ],
      },
      {
        name: "book",
        label: "Books",
        path: "content/books/meta",
        format: "md",
        ui: {
          filename: {
            slugify: (values) => createBookMetaPath(values.bookFolder, values.title),
            description:
              "Each book introduction is stored as one markdown file using the book slug.",
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          createBookFolderField(),
          createDateField(),
          createAuthorField(),
          createKeywordsField(),
          createSummaryField(),
          createCreditsField(),
          createImageField(),
        ],
      },
      {
        name: "bookChapter",
        label: "Book Chapters",
        path: "content/books/chapters",
        format: "md",
        ui: {
          filename: {
            slugify: (values) =>
              createBookChapterFilePath(
                values.bookFolder,
                values.sectionFolder,
                values.section,
                values.date,
              ),
            description:
              "Each chapter is stored as a timestamp-named markdown file inside the book and section folders.",
          },
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "bookFolder",
            label: "Book Folder",
            required: true,
            description:
              "Book folder slug, for example: the-mortification-of-sin.",
          },
          createSectionField(),
          createSectionFolderField(),
          createOrderField(),
          createDateField(),
          createBodyField(),
        ],
      },
    ],
  },
});
