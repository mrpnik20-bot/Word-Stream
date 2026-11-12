import { useEffect, useRef, useState } from "react";

const MAX_VISIBLE_LINES = 60;

/**
 * Live word stream from the Vercel SSE endpoint /api/stream.
 * The server writes 100 lines/sec; this hook catches every batch and shows
 * the newest first. Duplicate lines are dropped so a reconnect never repeats.
 *
 * `running` toggles whether incoming lines are shown. Pausing keeps the
 * connection open but ignores new batches; resuming drops nothing.
 */
export function useWordStream() {
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(true);
  const runningRef = useRef(true);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    const seen = new Set();
    const es = new EventSource("/api/stream");

    es.addEventListener("message", (e) => {
      if (!runningRef.current) return;
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      if (msg.type !== "lines" || !Array.isArray(msg.lines)) return;

      const fresh = msg.lines.filter((line) => {
        const key = line.words.join(" ");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (fresh.length === 0) return;

      setLines((prev) => fresh.slice().reverse().concat(prev).slice(0, MAX_VISIBLE_LINES));
    });

    return () => es.close();
  }, []);

  const stop = () => setRunning(false);
  const start = () => setRunning(true);

  return { lines, running, stop, start };
}