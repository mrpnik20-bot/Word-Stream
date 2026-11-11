import { createFileRoute } from "@tanstack/react-router";
import UploadGate from "@/components/UploadGate";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "ফাইল আপলোড — Lexical Chronos" },
      { name: "description", content: "Lexical Chronos-এর সরাসরি ফাইল আপলোড পেজ।" },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  return <UploadGate />;
}