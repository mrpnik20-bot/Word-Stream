import { useCallback, useEffect, useRef, useState } from "react";
import { WORDS_PER_LINE, createLineGenerator } from "@/lib/lineGenerator";

const MAX_VISIBLE_LINES = 60;
const SEED_LINES = 4;

export function useWordStream() {
  const [generator] = useState(() => createLineGenerator());
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(true);
  const [stats, setStats] = useState({ lines: 0, words: 0 });
  const seeded = useRef(false);

  const push = useCallback(
    (count = 1) => {
      const fresh = [];
      for (let i = 0; i < count; i += 1) fresh.push(generator.next());

      setLines((prev) => fresh.reverse().concat(prev).slice(0, MAX_VISIBLE_LINES));
      setStats((prev) => ({
        lines: prev.lines + count,
        words: prev.words + count * WORDS_PER_LINE,
      }));
    },
    [generator],
  );

  // First render is shared with the server; the opening lines arrive after mount.
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    push(SEED_LINES);
  }, [push]);

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => push(1), 1000);
    return () => clearInterval(timer);
  }, [running, push]);

  const toggle = useCallback(() => setRunning((prev) => !prev), []);

  const clear = useCallback(() => {
    setLines([]);
    setStats({ lines: 0, words: 0 });
  }, []);

  return { lines, running, stats, toggle, clear };
}