import type { BibleSearchVerse } from "@/lib/bible-search";

export type BibleSearchWorkerInitMessage = {
  type: "init";
  corpus: BibleSearchVerse[];
};

export type BibleSearchWorkerSearchMessage = {
  type: "search";
  query: string;
  requestId: number;
  limit?: number;
};

export type BibleSearchWorkerMessage =
  | BibleSearchWorkerInitMessage
  | BibleSearchWorkerSearchMessage;

export type BibleSearchWorkerReadyMessage = {
  type: "ready";
};

export type BibleSearchWorkerResultMessage = {
  type: "result";
  requestId: number;
  query: string;
  results: BibleSearchVerse[];
};

export type BibleSearchWorkerErrorMessage = {
  type: "error";
  message: string;
};

export type BibleSearchWorkerResponse =
  | BibleSearchWorkerReadyMessage
  | BibleSearchWorkerResultMessage
  | BibleSearchWorkerErrorMessage;
