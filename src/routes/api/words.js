import { createFileRoute } from "@tanstack/react-router";
import { createLineGenerator, WORDS_PER_LINE } from "@/lib/lineGenerator";

// Public JSON API for consuming the stream elsewhere.
//   GET /api/words            -> 1 line (12 random words)
//   GET /api/words?count=20   -> 20 lines
//
// Each line is unique within the response. Max 100 lines per call.
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "content-type",
  "cache-control": "no-store",
};

export const Route = createFileRoute("/api/words")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const raw = parseInt(url.searchParams.get("count") || "1", 10);
        const count = Math.max(1, Math.min(Number.isNaN(raw) ? 1 : raw, 100));

        const gen = createLineGenerator();
        const lines = Array.from({ length: count }, () => gen.next());

        return Response.json(
          { words_per_line: WORDS_PER_LINE, count: lines.length, lines },
          { headers: CORS },
        );
      },
    },
  },
});