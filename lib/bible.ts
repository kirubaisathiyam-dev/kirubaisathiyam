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
  { code: "GEN", name: "Genesis", aliases: ["gen", "ge"] },
  { code: "EXO", name: "Exodus", aliases: ["exo", "ex"] },
  { code: "LEV", name: "Leviticus", aliases: ["lev", "le"] },
  { code: "NUM", name: "Numbers", aliases: ["num", "nu"] },
  { code: "DEU", name: "Deuteronomy", aliases: ["deu", "dt"] },
  { code: "JOS", name: "Joshua", aliases: ["jos", "josh"] },
  { code: "JDG", name: "Judges", aliases: ["jdg", "judg", "jd"] },
  { code: "RUT", name: "Ruth", aliases: ["rut", "ru"] },
  { code: "1SA", name: "1 Samuel", aliases: ["1 samuel", "1 sam", "1sa"] },
  { code: "2SA", name: "2 Samuel", aliases: ["2 samuel", "2 sam", "2sa"] },
  { code: "1KI", name: "1 Kings", aliases: ["1 kings", "1 ki", "1kings"] },
  { code: "2KI", name: "2 Kings", aliases: ["2 kings", "2 ki", "2kings"] },
  { code: "1CH", name: "1 Chronicles", aliases: ["1 chronicles", "1 chr", "1ch"] },
  { code: "2CH", name: "2 Chronicles", aliases: ["2 chronicles", "2 chr", "2ch"] },
  { code: "EZR", name: "Ezra", aliases: ["ezr", "ezra"] },
  { code: "NEH", name: "Nehemiah", aliases: ["neh", "nehemiah"] },
  { code: "EST", name: "Esther", aliases: ["est", "esther"] },
  { code: "JOB", name: "Job", aliases: ["job"] },
  { code: "PSA", name: "Psalms", aliases: ["psalm", "psalms", "ps", "psa"] },
  { code: "PRO", name: "Proverbs", aliases: ["proverbs", "prov", "prv", "pro"] },
  { code: "ECC", name: "Ecclesiastes", aliases: ["ecclesiastes", "ecc", "ec"] },
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
    ],
  },
  { code: "ISA", name: "Isaiah", aliases: ["isaiah", "isa", "is"] },
  { code: "JER", name: "Jeremiah", aliases: ["jeremiah", "jer", "je"] },
  { code: "LAM", name: "Lamentations", aliases: ["lamentations", "lam"] },
  { code: "EZK", name: "Ezekiel", aliases: ["ezekiel", "ezk", "eze"] },
  { code: "DAN", name: "Daniel", aliases: ["daniel", "dan", "da"] },
  { code: "HOS", name: "Hosea", aliases: ["hosea", "hos", "ho"] },
  { code: "JOL", name: "Joel", aliases: ["joel", "jol", "jl"] },
  { code: "AMO", name: "Amos", aliases: ["amos", "amo", "am"] },
  { code: "OBA", name: "Obadiah", aliases: ["obadiah", "oba", "ob"] },
  { code: "JON", name: "Jonah", aliases: ["jonah", "jon", "jh"] },
  { code: "MIC", name: "Micah", aliases: ["micah", "mic", "mc"] },
  { code: "NAM", name: "Nahum", aliases: ["nahum", "nam", "na"] },
  { code: "HAB", name: "Habakkuk", aliases: ["habakkuk", "hab"] },
  { code: "ZEP", name: "Zephaniah", aliases: ["zephaniah", "zep", "zp"] },
  { code: "HAG", name: "Haggai", aliases: ["haggai", "hag", "hg"] },
  { code: "ZEC", name: "Zechariah", aliases: ["zechariah", "zec", "zc"] },
  { code: "MAL", name: "Malachi", aliases: ["malachi", "mal", "ml"] },
  { code: "MAT", name: "Matthew", aliases: ["matthew", "matt", "mat", "mt"] },
  { code: "MRK", name: "Mark", aliases: ["mark", "mrk", "mk"] },
  { code: "LUK", name: "Luke", aliases: ["luke", "luk", "lk"] },
  { code: "JHN", name: "John", aliases: ["john", "jhn", "jn"] },
  { code: "ACT", name: "Acts", aliases: ["acts", "act", "ac"] },
  { code: "ROM", name: "Romans", aliases: ["romans", "rom", "ro"] },
  { code: "1CO", name: "1 Corinthians", aliases: ["1 corinthians", "1 cor", "1co"] },
  { code: "2CO", name: "2 Corinthians", aliases: ["2 corinthians", "2 cor", "2co"] },
  { code: "GAL", name: "Galatians", aliases: ["galatians", "gal", "ga"] },
  { code: "EPH", name: "Ephesians", aliases: ["ephesians", "eph", "ep"] },
  { code: "PHP", name: "Philippians", aliases: ["philippians", "php", "phil"] },
  { code: "COL", name: "Colossians", aliases: ["colossians", "col"] },
  { code: "1TH", name: "1 Thessalonians", aliases: ["1 thessalonians", "1 thess", "1th"] },
  { code: "2TH", name: "2 Thessalonians", aliases: ["2 thessalonians", "2 thess", "2th"] },
  { code: "1TI", name: "1 Timothy", aliases: ["1 timothy", "1 tim", "1ti"] },
  { code: "2TI", name: "2 Timothy", aliases: ["2 timothy", "2 tim", "2ti"] },
  { code: "TIT", name: "Titus", aliases: ["titus", "tit", "ti"] },
  { code: "PHM", name: "Philemon", aliases: ["philemon", "phm", "pm"] },
  { code: "HEB", name: "Hebrews", aliases: ["hebrews", "heb"] },
  { code: "JAS", name: "James", aliases: ["james", "jas", "jm"] },
  { code: "1PE", name: "1 Peter", aliases: ["1 peter", "1 pet", "1pe"] },
  { code: "2PE", name: "2 Peter", aliases: ["2 peter", "2 pet", "2pe"] },
  { code: "1JN", name: "1 John", aliases: ["1 john", "1 jn", "1jn"] },
  { code: "2JN", name: "2 John", aliases: ["2 john", "2 jn", "2jn"] },
  { code: "3JN", name: "3 John", aliases: ["3 john", "3 jn", "3jn"] },
  { code: "JUD", name: "Jude", aliases: ["jude", "jud"] },
  { code: "REV", name: "Revelation", aliases: ["revelation", "rev", "re"] },
];

const BOOK_LOOKUP = new Map<string, BookDefinition>();

function normalizeBookKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[.]/g, "")
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
    BOOK_LOOKUP.set(normalizeBookKey(alias), book);
  }
}

export function parseBibleReference(input: string): ParsedBibleReference | null {
  const trimmed = input.trim();
  const match = trimmed.match(
    /^([1-3]?\s?[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+):(\d+(?:-\d+)?)$/i,
  );

  if (!match) {
    return null;
  }

  const bookPart = normalizeBookKey(match[1]);
  const chapter = match[2];
  const verse = match[3];

  const book = BOOK_LOOKUP.get(bookPart);
  if (!book) {
    return null;
  }

  return {
    passageId: `${book.code}.${chapter}.${verse}`,
    reference: `${book.name} ${chapter}:${verse}`,
  };
}
