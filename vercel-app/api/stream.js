// Vercel Edge Function: GET /api/stream
// Live Server-Sent Events stream of 12-word lines at 100 lines/sec.
// Any app connects with EventSource and catches every line as it is written.
export const config = { runtime: "edge" };

import { WORDS } from "../src/lib/wordBank.js";

const WORDS_PER_LINE = 12;
const TICK_MS = 100; // 10 ticks/sec
const LINES_PER_TICK = 10; // 10 * 10 = 100 lines/sec

// Short visual fingerprint of a line.
function hashLine(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(0, 7);
}

let counter = 0;
function makeLine() {
  counter += 1;
  const words = Array.from(
    { length: WORDS_PER_LINE },
    () => WORDS[Math.floor(Math.random() * WORDS.length)],
  );
  return { id: counter, words, hash: hashLine(words.join(" ")) };
}

export default function handler() {
  const encoder = new TextEncoder();
  let timer;

  const stream = new ReadableStream({
    start(controller) {
      const emit = () => {
        const fresh = Array.from({ length: LINES_PER_TICK }, () => makeLine());
        const payload = `data: ${JSON.stringify({ type: "lines", lines: fresh })}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          clearInterval(timer);
        }
      };
      emit(); // immediate first batch
      timer = setInterval(emit, TICK_MS);
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}