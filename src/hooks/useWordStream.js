import { useCallback, useEffect, useRef, useState } from "react";
import { WORDS_PER_LINE, createLineGenerator } from "@/lib/lineGenerator";

const MAX_VISIBLE_LINES = 60;
const TICK_MS = 100;
const LINES_PER_TICK = 10; // 10 ticks/sec * 10 lines = 100 lines/sec
const SEED_LINES = 12;

export function useWordStream() {
  const [generator] = useState(() => createLineGenerator());
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState({ lines: 0, words: 0, seconds: 0 });
  const seeded = useRef(false);

  const push = useCallback(
    (count = 1) => {
      const fresh = [];
      for (let i = 0; i < count; i += 1) fresh.push(generator.next());

      setLines((prev) => fresh.reverse().concat(prev).slice(0, MAX_VISIBLE_LINES));
      setStats((prev) => ({
        lines: prev.lines + count,
        words: prev.words + count * WORDS_PER_LINE,
        seconds: prev.seconds,
      }));
    },
    [generator],
  );

  // First render is shared with the server; the opening lines arrive once running starts.
  useEffect(() => {
    if (!running || seeded.current) return;
    seeded.current = true;
    push(SEED_LINES);
  }, [push, running]);

  // 100 lines/sec, emitted in 10-line bursts so the feed stays smooth on mobile.
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => push(LINES_PER_TICK), TICK_MS);
    return () => clearInterval(timer);
  }, [running, push]);

  // Independent run-time clock so it stays accurate at any rate.
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(
      () => setStats((prev) => ({ ...prev, seconds: prev.seconds + 1 })),
      1000,
    );
    return () => clearInterval(timer);
  }, [running]);

  const toggle = useCallback(() => setRunning((prev) => !prev), []);

  const clear = useCallback(() => {
    setLines([]);
    setStats({ lines: 0, words: 0, seconds: 0 });
  }, []);

  return { lines, running, stats, toggle, clear };
}