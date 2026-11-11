import { useWordStream } from "@/hooks/useWordStream";
import WordStream from "@/components/WordStream";

export default function App() {
  const { lines } = useWordStream();

  return (
    <div className="min-h-screen bg-background">
      <WordStream lines={lines} />
    </div>
  );
}