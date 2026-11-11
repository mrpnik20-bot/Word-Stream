import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const MAX_VISIBLE_LINES = 60;
const ROOM_ID = "main";

/**
 * Live word stream backed by the WordStream actor. Every client connected to
 * the same room receives the exact same lines in real time — the site and any
 * other app tapping the stream see one shared feed.
 */
export function useWordStream() {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    // Persist the connection id per tab so a reload reclaims the same seat.
    let connId = sessionStorage.getItem("ws_connId");
    if (!connId) {
      connId = crypto.randomUUID();
      sessionStorage.setItem("ws_connId", connId);
    }

    const room = base44.actors.WordStream(ROOM_ID).connect({ id: connId });
    const sub = room.subscribe((msg) => {
      if (msg.type === "recent") {
        setLines(Array.isArray(msg.lines) ? msg.lines.slice(0, MAX_VISIBLE_LINES) : []);
      } else if (msg.type === "lines") {
        const fresh = Array.isArray(msg.lines) ? msg.lines : [];
        setLines((prev) => fresh.slice().reverse().concat(prev).slice(0, MAX_VISIBLE_LINES));
      }
    });

    return () => {
      sub.unsubscribe();
      room.close();
    };
  }, []);

  return { lines };
}