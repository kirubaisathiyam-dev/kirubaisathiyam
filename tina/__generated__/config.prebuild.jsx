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
function createTopicSlug(titleValue, dateValue) {
  if (typeof titleValue === "string" && titleValue.trim()) {
    const cleaned = titleValue.trim().toLowerCase().normalize("NFKC").replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-+|-+$/g, "");
    if (cleaned) {
      return cleaned;
    }
  }
  return `thalappu-${createTimestampSlug(dateValue)}`;
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
    type: "string",
    name: "audio",
    label: "Audio Path",
    searchable: false,
    description: "Store the uploaded audio file path, for example /uploads/sermon.mp3."
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
function createSharedContentFields() {
  return [
    createDateField(),
    createAuthorField(),
    createTagsField(),
    createKeywordsField(),
    createSummaryField(),
    createImageField(),
    createAudioField(),
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
    }
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
          createTagsField(),
          createKeywordsField(),
          createSummaryField(),
          createImageField(),
          createAudioField(),
          createBodyField()
        ]
      },
      {
        name: "systematicTheology",
        label: "\u0BAE\u0BC1\u0BB1\u0BC8\u0BAF\u0BBF\u0BAF\u0BB2\u0BCD \u0B87\u0BB1\u0BC8\u0BAF\u0BBF\u0BAF\u0BB2\u0BCD",
        path: "content/theology/muraimai-iraiyiyal",
        format: "md",
        ui: {
          filename: {
            slugify: (values) => createTopicSlug(values.title, values.date),
            description: "\u0B92\u0BB5\u0BCD\u0BB5\u0BCA\u0BB0\u0BC1 \u0BA4\u0BB2\u0BC8\u0BAA\u0BCD\u0BAA\u0BC1\u0BAE\u0BCD \u0BA4\u0BA9\u0BBF\u0BA4\u0BCD\u0BA4\u0BA9\u0BBF markdown file \u0B86\u0B95\u0B9A\u0BCD \u0B9A\u0BC7\u0BAE\u0BBF\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BC1\u0BAE\u0BCD."
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
          ...createSharedContentFields()
        ]
      },
      {
        name: "reformedTheology",
        label: "\u0B9A\u0BC0\u0BB0\u0BCD\u0BA4\u0BBF\u0BB0\u0BC1\u0BA4\u0BCD\u0BA4 \u0B87\u0BB1\u0BC8\u0BAF\u0BBF\u0BAF\u0BB2\u0BCD",
        path: "content/theology/seerthirutha-iraiyiyal",
        format: "md",
        ui: {
          filename: {
            slugify: (values) => createTopicSlug(values.title, values.date),
            description: "\u0B92\u0BB5\u0BCD\u0BB5\u0BCA\u0BB0\u0BC1 \u0BA4\u0BB2\u0BC8\u0BAA\u0BCD\u0BAA\u0BC1\u0BAE\u0BCD \u0BA4\u0BA9\u0BBF\u0BA4\u0BCD\u0BA4\u0BA9\u0BBF markdown file \u0B86\u0B95\u0B9A\u0BCD \u0B9A\u0BC7\u0BAE\u0BBF\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BC1\u0BAE\u0BCD."
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
          ...createSharedContentFields()
        ]
      }
    ]
  }
});
export {
  config_default as default
};
