// Vercel Serverless Function: POST /api/upload?part=N
// Generates ONE chunk of the 100,000-line file (10,000 lines) and uploads it
// to a Telegram bot as its own document. Splitting into small parts keeps each
// request well under Vercel Hobby's 10s timeout. The client calls this once
// per part (0..9) sequentially.
import { WORDS } from "../src/lib/wordBank.js";

export const config = { maxDuration: 60 };

const TOTAL_LINES = 100000;
const PART_LINES = 10000;
const WORDS_PER_LINE = 12;

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

  const url = new URL(req.url, "http://localhost");
  const part = Math.max(0, parseInt(url.searchParams.get("part") || "0", 10) || 0);
  const totalParts = Math.ceil(TOTAL_LINES / PART_LINES);

  // eslint-disable-next-line no-undef
  const token = process.env.TELEGRAM_BOT_TOKEN;
  // eslint-disable-next-line no-undef
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(500).json({
      ok: false,
      error: "TELEGRAM_BOT_TOKEN বা TELEGRAM_CHAT_ID Vercel-এ সেট করা নেই",
    });
  }

  try {
    const start = part * PART_LINES;
    const end = Math.min(start + PART_LINES, TOTAL_LINES);
    const lines = new Array(end - start);
    for (let i = start; i < end; i += 1) {
      const words = new Array(WORDS_PER_LINE);
      for (let j = 0; j < WORDS_PER_LINE; j += 1) {
        words[j] = WORDS[Math.floor(Math.random() * WORDS.length)];
      }
      const joined = words.join(" ");
      lines[i - start] = `${String(i + 1).padStart(6, "0")}  ${joined}  #${hashLine(joined)}`;
    }
    const text = lines.join("\n");
    const fileName = `chronos_part_${String(part + 1).padStart(2, "0")}.txt`;
    const file = new Blob([text], { type: "text/plain" });

    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("document", file, fileName);
    form.append(
      "caption",
      `Lexical Chronos — part ${part + 1}/${totalParts} (${lines.length.toLocaleString("en-US")} lines)`
    );

    // eslint-disable-next-line no-undef
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body: form,
    });
    const tgData = await tgRes.json().catch(() => ({}));
    if (!tgRes.ok || !tgData.ok) {
      return res.status(502).json({
        ok: false,
        error: tgData.description || "Telegram আপলোড ব্যর্থ",
        part,
      });
    }
    return res.status(200).json({ ok: true, part, totalParts, lines: lines.length, file: fileName });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || "অজানা ত্রুটি", part });
  }
}