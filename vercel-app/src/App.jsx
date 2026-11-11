import { useState } from "react";
import { useWordStream } from "@/hooks/useWordStream";
import WordStream from "@/components/WordStream";
import UploadGate from "@/components/UploadGate";

export default function App() {
  const [uploaded, setUploaded] = useState(false);
  const { lines } = useWordStream();

  if (!uploaded) return <UploadGate onComplete={() => setUploaded(true)} />;

  return (
    <div className="min-h-screen bg-background">
      <WordStream lines={lines} />
    </div>
  );
}