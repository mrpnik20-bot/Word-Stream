import { useLayoutEffect, useRef } from "react";
import StreamLine from "@/components/StreamLine";

export default function WordStream({ lines }) {
  const scrollRef = useRef(null);
  const prevHeight = useRef(0);

  // New lines arrive at the top; keep a reader's position if they scrolled down.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop > 2) el.scrollTop += el.scrollHeight - prevHeight.current;
    prevHeight.current = el.scrollHeight;
  }, [lines]);

  return (
    <div
      ref={scrollRef}
      className="feed-scroll h-screen w-full overflow-y-auto bg-background px-4 py-3 sm:px-6 [mask-image:linear-gradient(to_bottom,black_72%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_72%,transparent)]"
    >
      {lines.length === 0
        ? null
        : lines.map((line, i) => (
            <StreamLine key={line.id} line={line} newest={i === 0} />
          ))}
    </div>
  );
}