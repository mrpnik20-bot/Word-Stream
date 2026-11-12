// Vercel Serverless Function: POST /api/upload?part=N
// Sends ONE part of the 100,000-line file FROM the user's personal Telegram
// account TO their bot, using MTProto (gramjs userbot). Each part is a separate
// request + upload so every call finishes well under Vercel Hobby's 10s limit.
//
// Required Vercel env vars: TG_API_ID, TG_API_HASH, TG_SESSION, TG_BOT
//   TG_BOT = bot username (with or without @) the account sends to.
//   The account must have /start-ed the bot at least once.
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
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

  /* eslint-disable no-undef */
  const apiId = parseInt(process.env.TG_API_ID, 10);
  const apiHash = process.env.TG_API_HASH;
  const sessionStr = process.env.TG_SESSION;
  const bot = (process.env.TG_BOT || "").trim();
  if (!apiId || !apiHash || !sessionStr || !bot) {
    return res.status(500).json({
      ok: false,
      error: "TG_API_ID / TG_API_HASH / TG_SESSION / TG_BOT Vercel-এ সেট করা নেই",
    });
  }

  // Build this part's lines.
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
  const tmp = path.join(os.tmpdir(), fileName);
  fs.writeFileSync(tmp, text);

  let client;
  try {
    client = new TelegramClient(new StringSession(sessionStr), apiId, apiHash, {
      connectionRetries: 3,
      retryDelay: 500,
    });
    await client.connect();
    if (!client.connected) throw new Error("MTProto কানেকশন ব্যর্থ");

    await client.sendFile(bot, {
      file: tmp,
      caption: `Lexical Chronos — part ${part + 1}/${totalParts} (${lines.length.toLocaleString("en-US")} lines)`,
      forceDocument: true,
    });
    return res.status(200).json({ ok: true, part, totalParts, lines: lines.length, file: fileName });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || "পাঠাতে ব্যর্থ", part });
  } finally {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
    if (client) {
      try {
        await client.disconnect();
      } catch {
        /* ignore */
      }
    }
  }
}