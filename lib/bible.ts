export type ParsedBibleReference = {
  passageId: string;
  reference: string;
};

type BookDefinition = {
  code: string;
  name: string;
  aliases: string[];
};

const BOOKS: BookDefinition[] = [
  { code: "GEN", name: "Genesis", aliases: ["gen", "ge", "ஆதியாகமம்"] },
  { code: "EXO", name: "Exodus", aliases: ["exo", "ex", "யாத்திராகமம்"] },
  { code: "LEV", name: "Leviticus", aliases: ["lev", "le", "லேவியராகமம்"] },
  { code: "NUM", name: "Numbers", aliases: ["num", "nu", "எண்ணாகமம்"] },
  { code: "DEU", name: "Deuteronomy", aliases: ["deu", "dt", "உபாகமம்"] },
  { code: "JOS", name: "Joshua", aliases: ["jos", "josh", "யோசுவா"] },
  { code: "JDG", name: "Judges", aliases: ["jdg", "judg", "jd", "நியாயாதிபதிகள்"] },
  { code: "RUT", name: "Ruth", aliases: ["rut", "ru", "ரூத்"] },
  {
    code: "1SA",
    name: "1 Samuel",
    aliases: ["1 samuel", "1 sam", "1sa", "1 சாமுவேல்"],
  },
  {
    code: "2SA",
    name: "2 Samuel",
    aliases: ["2 samuel", "2 sam", "2sa", "2 சாமுவேல்"],
  },
  {
    code: "1KI",
    name: "1 Kings",
    aliases: ["1 kings", "1 ki", "1kings", "1 இராஜாக்கள்"],
  },
  {
    code: "2KI",
    name: "2 Kings",
    aliases: ["2 kings", "2 ki", "2kings", "2 இராஜாக்கள்"],
  },
  {
    code: "1CH",
    name: "1 Chronicles",
    aliases: ["1 chronicles", "1 chr", "1ch", "1 நாளாகமம்"],
  },
  {
    code: "2CH",
    name: "2 Chronicles",
    aliases: ["2 chronicles", "2 chr", "2ch", "2 நாளாகமம்"],
  },
  { code: "EZR", name: "Ezra", aliases: ["ezr", "ezra", "எஸ்றா"] },
  { code: "NEH", name: "Nehemiah", aliases: ["neh", "nehemiah", "நெகேமியா"] },
  { code: "EST", name: "Esther", aliases: ["est", "esther", "எஸ்தர்"] },
  { code: "JOB", name: "Job", aliases: ["job", "யோபு"] },
  {
    code: "PSA",
    name: "Psalms",
    aliases: ["psalm", "psalms", "ps", "psa", "சங்கீதம்"],
  },
  {
    code: "PRO",
    name: "Proverbs",
    aliases: ["proverbs", "prov", "prv", "pro", "நீதிமொழிகள்"],
  },
  {
    code: "ECC",
    name: "Ecclesiastes",
    aliases: ["ecclesiastes", "ecc", "ec", "பிரசங்கி"],
  },
  {
    code: "SNG",
    name: "Song of Songs",
    aliases: [
      "song of songs",
      "song of solomon",
      "songs",
      "song",
      "sos",
      "sng",
      "உன்னதப்பாட்டு",
    ],
  },
  { code: "ISA", name: "Isaiah", aliases: ["isaiah", "isa", "is", "ஏசாயா"] },
  { code: "JER", name: "Jeremiah", aliases: ["jeremiah", "jer", "je", "எரேமியா"] },
  { code: "LAM", name: "Lamentations", aliases: ["lamentations", "lam", "புலம்பல்"] },
  { code: "EZK", name: "Ezekiel", aliases: ["ezekiel", "ezk", "eze", "எசேக்கியேல்"] },
  { code: "DAN", name: "Daniel", aliases: ["daniel", "dan", "da", "தானியேல்"] },
  { code: "HOS", name: "Hosea", aliases: ["hosea", "hos", "ho", "ஓசியா"] },
  { code: "JOL", name: "Joel", aliases: ["joel", "jol", "jl", "யோவேல்"] },
  { code: "AMO", name: "Amos", aliases: ["amos", "amo", "am", "ஆமோஸ்"] },
  { code: "OBA", name: "Obadiah", aliases: ["obadiah", "oba", "ob", "ஒபதியா"] },
  { code: "JON", name: "Jonah", aliases: ["jonah", "jon", "jh", "யோனா"] },
  { code: "MIC", name: "Micah", aliases: ["micah", "mic", "mc", "மீகா"] },
  { code: "NAM", name: "Nahum", aliases: ["nahum", "nam", "na", "நாகூம்"] },
  { code: "HAB", name: "Habakkuk", aliases: ["habakkuk", "hab", "ஆபகூக்"] },
  {
    code: "ZEP",
    name: "Zephaniah",
    aliases: ["zephaniah", "zep", "zp", "செப்பனியா"],
  },
  { code: "HAG", name: "Haggai", aliases: ["haggai", "hag", "hg", "ஆகாய்"] },
  { code: "ZEC", name: "Zechariah", aliases: ["zechariah", "zec", "zc", "சகரியா"] },
  { code: "MAL", name: "Malachi", aliases: ["malachi", "mal", "ml", "மல்கியா"] },
  { code: "MAT", name: "Matthew", aliases: ["matthew", "matt", "mat", "mt", "மத்தேயு"] },
  { code: "MRK", name: "Mark", aliases: ["mark", "mrk", "mk", "மாற்கு"] },
  { code: "LUK", name: "Luke", aliases: ["luke", "luk", "lk", "லூக்கா"] },
  { code: "JHN", name: "John", aliases: ["john", "jhn", "jn", "யோவான்"] },
  { code: "ACT", name: "Acts", aliases: ["acts", "act", "ac", "அப்போஸ்தலர்"] },
  { code: "ROM", name: "Romans", aliases: ["romans", "rom", "ro", "ரோமர்"] },
  {
    code: "1CO",
    name: "1 Corinthians",
    aliases: ["1 corinthians", "1 cor", "1co", "1 கொரிந்தியர்"],
  },
  {
    code: "2CO",
    name: "2 Corinthians",
    aliases: ["2 corinthians", "2 cor", "2co", "2 கொரிந்தியர்"],
  },
  { code: "GAL", name: "Galatians", aliases: ["galatians", "gal", "ga", "கலாத்தியர்"] },
  { code: "EPH", name: "Ephesians", aliases: ["ephesians", "eph", "ep", "எபேசியர்"] },
  { code: "PHP", name: "Philippians", aliases: ["philippians", "php", "phil", "பிலிப்பியர்"] },
  { code: "COL", name: "Colossians", aliases: ["colossians", "col", "கொலோசெயர்"] },
  {
    code: "1TH",
    name: "1 Thessalonians",
    aliases: ["1 thessalonians", "1 thess", "1th", "1 தெசலோனிக்கேயர்"],
  },
  {
    code: "2TH",
    name: "2 Thessalonians",
    aliases: ["2 thessalonians", "2 thess", "2th", "2 தெசலோனிக்கேயர்"],
  },
  {
    code: "1TI",
    name: "1 Timothy",
    aliases: ["1 timothy", "1 tim", "1ti", "1 தீமோத்தேயு"],
  },
  {
    code: "2TI",
    name: "2 Timothy",
    aliases: ["2 timothy", "2 tim", "2ti", "2 தீமோத்தேயு"],
  },
  { code: "TIT", name: "Titus", aliases: ["titus", "tit", "ti", "தீத்து"] },
  { code: "PHM", name: "Philemon", aliases: ["philemon", "phm", "pm", "பிலேமோன்"] },
  { code: "HEB", name: "Hebrews", aliases: ["hebrews", "heb", "எபிரெயர்"] },
  { code: "JAS", name: "James", aliases: ["james", "jas", "jm", "யாக்கோபு"] },
  { code: "1PE", name: "1 Peter", aliases: ["1 peter", "1 pet", "1pe", "1 பேதுரு"] },
  { code: "2PE", name: "2 Peter", aliases: ["2 peter", "2 pet", "2pe", "2 பேதுரு"] },
  { code: "1JN", name: "1 John", aliases: ["1 john", "1 jn", "1jn", "1 யோவான்"] },
  { code: "2JN", name: "2 John", aliases: ["2 john", "2 jn", "2jn", "2 யோவான்"] },
  { code: "3JN", name: "3 John", aliases: ["3 john", "3 jn", "3jn", "3 யோவான்"] },
  { code: "JUD", name: "Jude", aliases: ["jude", "jud", "யூதா"] },
  {
    code: "REV",
    name: "Revelation",
    aliases: ["revelation", "rev", "re", "வெளிப்படுத்தின விசேஷம்"],
  },
];

const BOOK_LOOKUP = new Map<string, BookDefinition>();
const TAMIL_ALIAS_PREFIXES: Array<{ key: string; book: BookDefinition }> = [];

function hasTamilLetters(value: string) {
  return /[\u0B80-\u0BFF]/.test(value);
}

function normalizeBookKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[.,;:'"“”‘’]/g, "")
    .replace(/\b(i{1,3})\b/g, (match) => {
      if (match === "i") return "1";
      if (match === "ii") return "2";
      if (match === "iii") return "3";
      return match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

for (const book of BOOKS) {
  const canonicalKey = normalizeBookKey(book.name);
  BOOK_LOOKUP.set(canonicalKey, book);
  for (const alias of book.aliases) {
    const normalized = normalizeBookKey(alias);
    BOOK_LOOKUP.set(normalized, book);
    if (hasTamilLetters(alias)) {
      TAMIL_ALIAS_PREFIXES.push({ key: normalized, book });
    }
  }
}

export function parseBibleReference(input: string): ParsedBibleReference | null {
  const trimmed = input.trim();
  const match = trimmed.match(
    /^([1-3]?\s*[\p{L}\p{M}][\p{L}\p{M}.\s]*)\s+(\d+):(\d+(?:-\d+)?)$/u,
  );

  let bookPart = "";
  let chapter = "";
  let verse = "";

  if (match) {
    bookPart = normalizeBookKey(match[1]);
    chapter = match[2];
    verse = match[3];
  } else {
    const looseMatch = trimmed.match(
      /([1-3]?\s*[\p{L}\p{M}.\s]+?)\s+(\d+):(\d+(?:-\d+)?)/u,
    );
    if (!looseMatch) {
      return null;
    }
    bookPart = normalizeBookKey(looseMatch[1]);
    chapter = looseMatch[2];
    verse = looseMatch[3];
  }

  let book = BOOK_LOOKUP.get(bookPart);
  if (!book) {
    const matches = TAMIL_ALIAS_PREFIXES.filter((entry) =>
      entry.key.startsWith(bookPart),
    );
    const unique = new Map<string, BookDefinition>();
    for (const matchEntry of matches) {
      unique.set(matchEntry.book.code, matchEntry.book);
    }
    if (unique.size === 1) {
      book = Array.from(unique.values())[0];
    }
  }

  if (!book) {
    return null;
  }

  return {
    passageId: `${book.code}.${chapter}.${verse}`,
    reference: `${book.name} ${chapter}:${verse}`,
  };
}
