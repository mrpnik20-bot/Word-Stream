import { createFileRoute } from "@tanstack/react-router";
import { useWordStream } from "@/hooks/useWordStream";
import WordStream from "@/components/WordStream";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lexical Chronos — 12 random words every second" },
      {
        name: "description",
        content:
          "A live word agent that writes twelve random English words every second. Lines are never repeated; words may be.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { lines } = useWordStream(false);

  return (
    <div className="min-h-screen bg-background">
      <WordStream lines={lines} />
    </div>
  );
}