import { WORDS } from "@/lib/wordBank";

export const WORDS_PER_LINE = 12;

// Short visual fingerprint of a line, shown in the feed's meta gutter.
function hashLine(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(0, 7);
}

/**
 * Random line generator. Words may repeat (within a line and across lines),
 * but a full 12-word line is never emitted twice in a session.
 */
export function createLineGenerator() {
  const seen = new Set();
  let index = 0;

  return {
    get count() {
      return index;
    },
    next() {
      let words = [];
      let key = "";

      for (let attempt = 0; attempt < 40; attempt += 1) {
        words = Array.from(
          { length: WORDS_PER_LINE },
          () => WORDS[Math.floor(Math.random() * WORDS.length)],
        );
        key = words.join(" ");
        if (!seen.has(key)) break;
      }

      seen.add(key);
      index += 1;

      return { id: index, words, hash: hashLine(key) };
    },
  };
}