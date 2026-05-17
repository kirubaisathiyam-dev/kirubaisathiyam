import { Document } from "flexsearch";
import type { BibleSearchVerse } from "@/lib/bible-search";
import type {
  BibleSearchWorkerMessage,
  BibleSearchWorkerResponse,
} from "@/lib/bible-search-worker";

let index: Document<BibleSearchVerse> | null = null;

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

  return results
    .map((entry) => entry.doc)
    .filter((entry): entry is BibleSearchVerse => Boolean(entry));
}

function postMessageToClient(message: BibleSearchWorkerResponse) {
  self.postMessage(message);
}

self.onmessage = (event: MessageEvent<BibleSearchWorkerMessage>) => {
  const message = event.data;

  try {
    if (message.type === "init") {
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
