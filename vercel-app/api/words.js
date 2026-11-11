import { WORDS } from "../src/lib/wordBank.js";

const WORDS_PER_LINE = 12;

// Short visual fingerprint of a line.
function hashLine(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(0, 7);
}

// Generate one unique 12-word line. Words may repeat; a full line never does.
function nextLine(seen, id) {
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
  return { id, words, hash: hashLine(key) };
}

// Vercel serverless function: GET /api/words?count=N
// Returns N lines of 12 random words each (max 100). CORS open.
export default function handler(req, res) {
  const raw = parseInt(req.query.count || "1", 10);
  const count = Math.max(1, Math.min(Number.isNaN(raw) ? 1 : raw, 100));

  const seen = new Set();
  const lines = Array.from({ length: count }, (_, i) => nextLine(seen, i + 1));

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ words_per_line: WORDS_PER_LINE, count: lines.length, lines });
}