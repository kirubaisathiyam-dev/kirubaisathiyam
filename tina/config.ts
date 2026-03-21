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

function createImageField() {
  return {
    type: "image" as const,
    name: "image",
    label: "Cover Image",
  };
}

function createAudioField() {
  return {
    type: "string" as const,
    name: "audio",
    label: "Audio Path",
    searchable: false,
    description:
      "Store the uploaded audio file path, for example /uploads/sermon.mp3.",
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
    ],
  },
});
