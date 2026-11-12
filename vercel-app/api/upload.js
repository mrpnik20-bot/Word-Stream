// Vercel Serverless Function: POST /api/upload
// Generates a 100,000-line unique 12-word file and uploads it to a Telegram
// bot via sendDocument. The bot token and chat id live in Vercel env vars so
// they never reach the browser.
import { WORDS } from "../src/lib/wordBank.js";

export const config = { maxDuration: 60 };

const TOTAL_LINES = 100000;
const WORDS_PER_LINE = 12;
const FILE_NAME = "chronos_stream_100000.txt";

// Short visual fingerprint of a line.
function hashLine(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(0, 7);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(500).json({
      ok: false,
      error: "TELEGRAM_BOT_TOKEN বা TELEGRAM_CHAT_ID Vercel-এ সেট করা নেই",
    });
  }

  try {
    const parts = new Array(TOTAL_LINES);
    for (let i = 0; i < TOTAL_LINES; i += 1) {
      const words = new Array(WORDS_PER_LINE);
      for (let j = 0; j < WORDS_PER_LINE; j += 1) {
        words[j] = WORDS[Math.floor(Math.random() * WORDS.length)];
      }
      const joined = words.join(" ");
      parts[i] = `${String(i + 1).padStart(6, "0")}  ${joined}  #${hashLine(joined)}`;
    }
    const text = parts.join("\n");
    const file = new Blob([text], { type: "text/plain" });

    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("document", file, FILE_NAME);
    form.append(
      "caption",
      `Lexical Chronos — ${TOTAL_LINES.toLocaleString("en-US")} lines`,
    );

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body: form,
    });
    const tgData = await tgRes.json().catch(() => ({}));
    if (!tgRes.ok || !tgData.ok) {
      return res.status(502).json({
        ok: false,
        error: tgData.description || "Telegram আপলোড ব্যর্থ",
      });
    }
    return res.status(200).json({ ok: true, lines: TOTAL_LINES, file: FILE_NAME });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || "অজানা ত্রুটি" });
  }
}