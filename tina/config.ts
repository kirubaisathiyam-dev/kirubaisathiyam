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

function createArticleSlug(dateValue?: string) {
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

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";
const searchIndexerToken = process.env.TINA_SEARCH_INDEXER_TOKEN;

export default defineConfig({
  branch,
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
  ...(searchIndexerToken
    ? {
        search: {
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
        },
      }
    : {}),
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
          {
            type: "datetime",
            name: "date",
            label: "Date",
            required: true,
          },
          {
            type: "string",
            name: "author",
            label: "Author",
            required: true,
          },
          {
            type: "string",
            name: "type",
            label: "Type",
            options: articleTypeOptions,
            required: true,
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
            required: true,
          },
          {
            type: "string",
            name: "keywords",
            label: "Keywords",
            list: true,
            required: true,
          },
          {
            type: "string",
            name: "summary",
            label: "Summary",
            maxSearchIndexFieldLength: 240,
            ui: {
              component: "textarea",
            },
          },
          {
            type: "image",
            name: "image",
            label: "Cover Image",
          },
          {
            type: "string",
            name: "audio",
            label: "Audio Path",
            searchable: false,
            description:
              "Store the uploaded audio file path, for example /uploads/sermon.mp3.",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
            required: true,
            maxSearchIndexFieldLength: 500,
          },
        ],
      },
    ],
  },
});
