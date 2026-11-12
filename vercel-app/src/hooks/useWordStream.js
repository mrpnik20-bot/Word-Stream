import { useEffect, useRef, useState } from "react";

const MAX_VISIBLE_LINES = 60;

/**
 * Live word stream from the Vercel SSE endpoint /api/stream.
 * The server writes 100 lines/sec; this hook catches every batch and shows
 * the newest first. Duplicate lines are dropped so a reconnect never repeats.
 *
 * The stream starts stopped. Start opens a connection; Stop closes it
 * immediately and prevents queued batches from changing the visible feed.
 */
export function useWordStream() {
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const sourceRef = useRef(null);
  const seen = useRef(new Set());

  useEffect(() => {
    if (!running) return;
    const es = new EventSource("/api/stream");
    sourceRef.current = es;

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
        if (seen.current.has(key)) return false;
        seen.current.add(key);
        return true;
      });
      if (fresh.length === 0) return;

      setLines((prev) => runningRef.current
        ? fresh.slice().reverse().concat(prev).slice(0, MAX_VISIBLE_LINES)
        : prev);
    });

    return () => {
      es.close();
      if (sourceRef.current === es) sourceRef.current = null;
    };
  }, [running]);

  const stop = () => {
    runningRef.current = false;
    sourceRef.current?.close();
    setRunning(false);
  };
  const start = () => {
    runningRef.current = true;
    setRunning(true);
  };

  return { lines, running, stop, start };
}