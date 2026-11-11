import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useWordStream } from "@/hooks/useWordStream";
import WordStream from "@/components/WordStream";
import UploadGate from "@/components/UploadGate";

export const Route = createFileRoute("/")({
  ssr: false,
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
  const [uploaded, setUploaded] = useState(false);

  // Nothing streams until the user "uploads" — so it looks manual even though
  // the actor builds and streams the file automatically once connected.
  if (!uploaded) return <UploadGate onComplete={() => setUploaded(true)} />;

  return <StreamView />;
}

function StreamView() {
  const { lines, file } = useWordStream();

  return (
    <div className="min-h-screen bg-background">
      <WordStream lines={lines} file={file} />
    </div>
  );
}