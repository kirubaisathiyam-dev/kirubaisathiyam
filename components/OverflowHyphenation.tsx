"use client";

import { useEffect } from "react";

const SOFT_HYPHEN = "\u00AD";
const MIN_CANDIDATE_LENGTH = 12;
const EXCLUDED_TAGS = new Set([
  "CODE",
  "INPUT",
  "KBD",
  "NOSCRIPT",
  "OPTION",
  "PRE",
  "SAMP",
  "SCRIPT",
  "SELECT",
  "STYLE",
  "SVG",
  "TEXTAREA",
]);

const canvas =
  typeof document === "undefined" ? null : document.createElement("canvas");
const context = canvas?.getContext("2d") ?? null;
const originals = new WeakMap<Text, string>();
const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

function measureTextWidth(text: string, element: HTMLElement) {
  if (!context) {
    return 0;
  }

  const styles = window.getComputedStyle(element);
  context.font =
    styles.font ||
    `${styles.fontStyle} ${styles.fontVariant} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;

  return context.measureText(text).width;
}

function splitGraphemes(text: string) {
  if (!segmenter) {
    return Array.from(text);
  }

  return Array.from(segmenter.segment(text), (part) => part.segment);
}

function insertSoftHyphens(token: string, element: HTMLElement) {
  const availableWidth = element.clientWidth;

  if (availableWidth <= 0 || measureTextWidth(token, element) <= availableWidth) {
    return token;
  }

  const graphemes = splitGraphemes(token);
  const hyphenWidth = measureTextWidth("-", element);
  let chunk = "";
  let result = "";

  for (const grapheme of graphemes) {
    const candidate = chunk + grapheme;

    if (
      chunk &&
      measureTextWidth(candidate, element) + hyphenWidth > availableWidth
    ) {
      result += `${chunk}${SOFT_HYPHEN}`;
      chunk = grapheme;
      continue;
    }

    chunk = candidate;
  }

  return result ? `${result}${chunk}` : token;
}

function shouldSkipNode(node: Text) {
  if (!node.data.trim()) {
    return true;
  }

  let element = node.parentElement;

  while (element) {
    if (
      EXCLUDED_TAGS.has(element.tagName) ||
      element.dataset.inlineIcon === "true" ||
      element.isContentEditable
    ) {
      return true;
    }

    element = element.parentElement;
  }

  return false;
}

function getContainer(node: Text) {
  let element = node.parentElement;

  while (element && element !== document.body) {
    if (EXCLUDED_TAGS.has(element.tagName) || element.dataset.inlineIcon === "true") {
      return null;
    }

    const styles = window.getComputedStyle(element);

    if (styles.display !== "inline" && styles.display !== "contents") {
      if (element.clientWidth > 0) {
        return element;
      }
    }

    element = element.parentElement;
  }

  return document.body;
}

function hyphenateTextNode(node: Text) {
  if (shouldSkipNode(node)) {
    return;
  }

  const container = getContainer(node);

  if (!container) {
    return;
  }

  const currentSource = node.data.replaceAll(SOFT_HYPHEN, "");
  const original = originals.get(node);
  const source = original === currentSource ? original : currentSource;

  originals.set(node, source);

  const nextValue = source.replace(/\S+/g, (token) => {
    if (token.length < MIN_CANDIDATE_LENGTH) {
      return token;
    }

    return insertSoftHyphens(token, container);
  });

  if (node.data !== nextValue) {
    node.data = nextValue;
  }
}

function processDocument() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();

  while (currentNode) {
    if (currentNode instanceof Text) {
      hyphenateTextNode(currentNode);
    }

    currentNode = walker.nextNode();
  }
}

export default function OverflowHyphenation() {
  useEffect(() => {
    let frameId = 0;

    const schedule = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        processDocument();
        frameId = 0;
      });
    };

    const observer = new MutationObserver(() => {
      schedule();
    });

    schedule();
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    window.addEventListener("resize", schedule);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      observer.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return null;
}
