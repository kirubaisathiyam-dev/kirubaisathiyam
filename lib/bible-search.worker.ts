import { Document } from "flexsearch";
import type { BibleSearchVerse } from "@/lib/bible-search";
import type {
  BibleSearchWorkerMessage,
  BibleSearchWorkerResponse,
} from "@/lib/bible-search-worker";

let index: Document<BibleSearchVerse> | null = null;
let corpus: BibleSearchVerse[] = [];

function normalizeValue(value: string) {
  return value
    .toLocaleLowerCase("ta")
    .replace(/\s+/g, " ")
    .trim();
}

function isExactReferenceMatch(entry: BibleSearchVerse, query: string) {
  const normalizedQuery = normalizeValue(query);
  if (!normalizedQuery) {
    return false;
  }

  const referenceVariants = [
    entry.reference,
    `${entry.bookTamil} ${entry.chapter}:${entry.verse}`,
    `${entry.bookShort} ${entry.chapter}:${entry.verse}`,
    `${entry.bookEnglish} ${entry.chapter}:${entry.verse}`,
  ];

  return referenceVariants.some(
    (reference) => normalizeValue(reference) === normalizedQuery,
  );
}

function isExactPhraseMatch(entry: BibleSearchVerse, query: string) {
  const normalizedQuery = normalizeValue(query);
  if (!normalizedQuery) {
    return false;
  }

  const searchableValues = [
    entry.text,
    entry.reference,
    entry.bookTamil,
    entry.bookShort,
    entry.bookEnglish,
  ];

  return searchableValues.some((value) =>
    normalizeValue(value).includes(normalizedQuery),
  );
}

function rankSearchResults(results: BibleSearchVerse[], query: string) {
  return results
    .map((entry, position) => {
      if (isExactReferenceMatch(entry, query)) {
        return { entry, priority: 0, position };
      }

      if (isExactPhraseMatch(entry, query)) {
        return { entry, priority: 1, position };
      }

      return { entry, priority: 2, position };
    })
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }

      if (left.priority < 2) {
        return left.entry.id - right.entry.id;
      }

      if (left.position !== right.position) {
        return left.position - right.position;
      }

      return left.entry.id - right.entry.id;
    })
    .map((item) => item.entry);
}

function findExactSubstringMatches(query: string, limit = 80) {
  const normalizedQuery = normalizeValue(query);
  if (!normalizedQuery) {
    return [];
  }

  return corpus
    .filter((entry) => isExactPhraseMatch(entry, normalizedQuery))
    .slice(0, limit);
}

function createIndex(corpus: BibleSearchVerse[]) {
  const nextIndex = new Document<BibleSearchVerse>({
    tokenize: "forward",
    resolution: 9,
    cache: 100,
    document: {
      id: "id",
      index: ["text", "bookTamil", "bookEnglish", "bookShort", "reference"],
      store: true,
    },
  });

  corpus.forEach((entry) => {
    nextIndex.add(entry);
  });

  return nextIndex;
}

function searchIndex(query: string, limit = 80) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery || !index) {
    return [];
  }

  const results = index.search(trimmedQuery, {
    limit,
    enrich: true,
    merge: true,
  });

  const flexResults = results
    .map((entry) => entry.doc)
    .filter((entry): entry is BibleSearchVerse => Boolean(entry));

  const exactSubstringMatches = findExactSubstringMatches(trimmedQuery, limit);
  const mergedResults = Array.from(
    new Map(
      [...exactSubstringMatches, ...flexResults].map((entry) => [entry.id, entry]),
    ).values(),
  );

  return rankSearchResults(mergedResults, trimmedQuery);
}

function postMessageToClient(message: BibleSearchWorkerResponse) {
  self.postMessage(message);
}

self.onmessage = (event: MessageEvent<BibleSearchWorkerMessage>) => {
  const message = event.data;

  try {
    if (message.type === "init") {
      corpus = message.corpus;
      index = createIndex(message.corpus);
      postMessageToClient({ type: "ready" });
      return;
    }

    if (message.type === "search") {
      postMessageToClient({
        type: "result",
        requestId: message.requestId,
        query: message.query,
        results: searchIndex(message.query, message.limit),
      });
    }
  } catch (error) {
    postMessageToClient({
      type: "error",
      message:
        error instanceof Error ? error.message : "Unable to search Bible.",
    });
  }
};

export {};
