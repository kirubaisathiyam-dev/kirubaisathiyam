// tina/config.ts
import { defineConfig } from "tinacms";
var articleTypeOptions = [
  { label: "\u0B95\u0B9F\u0BCD\u0B9F\u0BC1\u0BB0\u0BC8", value: "\u0B95\u0B9F\u0BCD\u0B9F\u0BC1\u0BB0\u0BC8" },
  { label: "\u0BAA\u0BBF\u0BB0\u0B9A\u0B99\u0BCD\u0B95\u0BAE\u0BCD", value: "\u0BAA\u0BBF\u0BB0\u0B9A\u0B99\u0BCD\u0B95\u0BAE\u0BCD" },
  { label: "\u0BA4\u0BBF\u0BAF\u0BBE\u0BA9\u0BAE\u0BCD", value: "\u0BA4\u0BBF\u0BAF\u0BBE\u0BA9\u0BAE\u0BCD" },
  { label: "\u0B86\u0BAF\u0BCD\u0BB5\u0BC1", value: "\u0B86\u0BAF\u0BCD\u0BB5\u0BC1" },
  { label: "\u0B9A\u0BBE\u0B9F\u0BCD\u0B9A\u0BBF\u0BAF\u0BAE\u0BCD", value: "\u0B9A\u0BBE\u0B9F\u0BCD\u0B9A\u0BBF\u0BAF\u0BAE\u0BCD" }
];
function pad(value) {
  return value.toString().padStart(2, "0");
}
function createTimestampSlug(dateValue) {
  const baseDate = typeof dateValue === "string" && dateValue ? new Date(dateValue) : /* @__PURE__ */ new Date();
  const safeDate = Number.isNaN(baseDate.getTime()) ? /* @__PURE__ */ new Date() : baseDate;
  const now = /* @__PURE__ */ new Date();
  return [
    safeDate.getUTCFullYear(),
    pad(safeDate.getUTCMonth() + 1),
    pad(safeDate.getUTCDate()),
    pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds())
  ].join("-");
}
function createArticleSlug(dateValue) {
  return createTimestampSlug(dateValue);
}
function createSubsectionFolderSlug(value, dateValue) {
  if (typeof value === "string" && value.trim()) {
    const cleaned = value.trim().toLowerCase().normalize("NFKC").replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-+|-+$/g, "");
    if (cleaned) {
      return cleaned;
    }
  }
  return `subsection-${createTimestampSlug(dateValue)}`;
}
function createTheologyFilePath(subsectionFolderValue, dateValue) {
  const fileName = createTimestampSlug(dateValue);
  if (typeof subsectionFolderValue === "string" && subsectionFolderValue.trim()) {
    return `${createSubsectionFolderSlug(subsectionFolderValue, dateValue)}/${fileName}`;
  }
  return fileName;
}
function createDateField() {
  return {
    type: "datetime",
    name: "date",
    label: "Date",
    required: true
  };
}
function createAuthorField() {
  return {
    type: "string",
    name: "author",
    label: "Author",
    required: true
  };
}
function createTagsField() {
  return {
    type: "string",
    name: "tags",
    label: "Tags",
    list: true,
    required: true
  };
}
function createKeywordsField() {
  return {
    type: "string",
    name: "keywords",
    label: "Keywords",
    list: true,
    required: true
  };
}
function createSummaryField() {
  return {
    type: "string",
    name: "summary",
    label: "Summary",
    maxSearchIndexFieldLength: 240,
    ui: {
      component: "textarea"
    }
  };
}
function createImageField() {
  return {
    type: "image",
    name: "image",
    label: "Cover Image"
  };
}
function createAudioField() {
  return {
    type: "image",
    name: "audio",
    label: "Audio",
    searchable: false,
    description: "Upload or select an audio file, for example /uploads/sermon.mp3."
  };
}
function createBodyField() {
  return {
    type: "rich-text",
    name: "body",
    label: "Body",
    isBody: true,
    required: true,
    maxSearchIndexFieldLength: 500
  };
}
function createOrderField() {
  return {
    type: "number",
    name: "order",
    label: "Order",
    required: false,
    description: "Smaller numbers appear first in the theology section table of contents."
  };
}
function createSubsectionField() {
  return {
    type: "string",
    name: "subsection",
    label: "Subsection",
    required: true,
    description: "Visible subsection name. You can enter Tamil here, for example: \u0BA4\u0BC7\u0BB5\u0BA9\u0BBF\u0BAF\u0BB2\u0BCD."
  };
}
function createSubsectionFolderField() {
  return {
    type: "string",
    name: "subsectionFolder",
    label: "Subsection Folder",
    required: false,
    description: "English folder name for a new subsection, for example: theology-proper, christology, salvation. Leave this empty when creating inside an existing subsection folder."
  };
}
function createArticleFields() {
  return [
    createTagsField(),
    createKeywordsField(),
    createSummaryField(),
    createImageField(),
    createAudioField(),
    createBodyField()
  ];
}
function createTheologyFields() {
  return [
    createOrderField(),
    createDateField(),
    createBodyField()
  ];
}
var branch = process.env.NEXT_PUBLIC_TINA_BRANCH || process.env.CF_PAGES_BRANCH || process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.HEAD || "main";
var isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";
var tinaClientId = process.env.NEXT_PUBLIC_TINA_CLIENT_ID;
var tinaToken = process.env.TINA_TOKEN;
var searchIndexerToken = process.env.TINA_SEARCH_INDEXER_TOKEN || "";
var searchConfig = {
  tina: {
    indexerToken: searchIndexerToken,
    stopwordLanguages: ["eng"],
    fuzzyEnabled: true,
    fuzzyOptions: {
      maxDistance: 2,
      minSimilarity: 0.6,
      maxTermExpansions: 10,
      useTranspositions: true
    }
  },
  indexBatchSize: 100,
  maxSearchIndexFieldLength: 300
};
var config_default = defineConfig({
  branch,
  ...!isLocal ? {
    clientId: tinaClientId,
    token: tinaToken
  } : {},
  build: {
    outputFolder: "tina-admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public"
    },
    accept: ["image/*", "audio/*"]
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
            description: "New articles keep the existing timestamp-style filename format."
          }
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true
          },
          createDateField(),
          createAuthorField(),
          {
            type: "string",
            name: "type",
            label: "Type",
            options: articleTypeOptions,
            required: true
          },
          ...createArticleFields()
        ]
      },
      {
        name: "systematicTheology",
        label: "Systematic Theology",
        path: "content/theology/systematic-theology",
        format: "md",
        ui: {
          filename: {
            slugify: (values) => createTheologyFilePath(values.subsectionFolder, values.date),
            description: "Each topic is stored as a timestamp-named markdown file inside the English subsection folder."
          }
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true
          },
          createSubsectionField(),
          createSubsectionFolderField(),
          ...createTheologyFields()
        ]
      },
      {
        name: "reformedTheology",
        label: "Reformed Theology",
        path: "content/theology/reformed-theology",
        format: "md",
        ui: {
          filename: {
            slugify: (values) => createTheologyFilePath(values.subsectionFolder, values.date),
            description: "Each topic is stored as a timestamp-named markdown file inside the English subsection folder."
          }
        },
        fields: [
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true
          },
          createSubsectionField(),
          createSubsectionFolderField(),
          ...createTheologyFields()
        ]
      }
    ]
  }
});
export {
  config_default as default
};
