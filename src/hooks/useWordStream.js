import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

const MAX_VISIBLE_LINES = 60;
const ROOM_ID = "main";
const FILE_SIZE = 100000; // matches the actor's file batch size

function fileNameFor(n) {
  return `chronos_stream_${String(n).padStart(4, "0")}.txt`;
}

/**
 * Live word stream backed by the WordStream actor. Every client connected to
 * the same room receives the exact same lines in real time — the site and any
 * other app tapping the stream see one shared feed.
 *
 * Also tracks how many lines of the current "file" have been read, so the UI can
 * look like lines are streaming out of an uploaded file (filename + progress).
 */
export function useWordStream() {
  const [lines, setLines] = useState([]);
  const [file, setFile] = useState({
    number: 1,
    name: fileNameFor(1),
    read: 0,
    total: FILE_SIZE,
  });
  const readRef = useRef(0);
  const fileNumRef = useRef(1);

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

        // Count lines read from the current file for the file-read indicator.
        readRef.current += fresh.length;
        while (readRef.current >= FILE_SIZE) {
          readRef.current -= FILE_SIZE;
          fileNumRef.current += 1;
        }
        setFile({
          number: fileNumRef.current,
          name: fileNameFor(fileNumRef.current),
          read: readRef.current,
          total: FILE_SIZE,
        });
      }
    });

    return () => {
      sub.unsubscribe();
      room.close();
    };
  }, []);

  return { lines, file };
}