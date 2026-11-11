import { Actor } from "base44:runtime/actors";

// Inline word bank — words may repeat; full 12-word lines never repeat in a session.
const WORDS = [
  "able", "about", "above", "absorb", "abstract", "absurd", "accent", "accept", "access", "accident",
  "account", "across", "action", "active", "actual", "adapt", "address", "admire", "admit", "adopt",
  "advance", "advice", "affair", "afford", "afraid", "after", "again", "agent", "agree", "ahead",
  "aim", "air", "alive", "almost", "alone", "along", "already", "also", "always", "amaze",
  "among", "anchor", "ancient", "angle", "animal", "answer", "anyone", "apart", "apple", "apply",
  "argue", "arise", "armor", "around", "arrive", "artist", "aspect", "assert", "assign", "assume",
  "atom", "attach", "attend", "audio", "author", "auto", "autumn", "avenue", "awake", "award",
  "aware", "away", "awesome", "back", "badge", "balance", "ball", "banner", "bare", "basic",
  "basis", "batch", "battle", "beach", "beam", "bear", "beauty", "become", "before", "begin",
  "behind", "being", "believe", "below", "bench", "beyond", "biscuit", "black", "blade", "blast",
  "blaze", "bleed", "blend", "blink", "block", "blood", "bloom", "board", "bold", "bonus",
  "border", "borrow", "both", "bounce", "bound", "brain", "branch", "brave", "bread", "break",
  "breath", "breeze", "brick", "bridge", "brief", "bright", "bring", "broad", "broke", "brook",
  "broom", "brother", "brown", "brush", "build", "burst", "busy", "butter", "button", "buyer",
  "cabin", "cable", "cache", "cactus", "calm", "camera", "camp", "canal", "candy", "canoe"
];

const WORDS_PER_LINE = 12;
const TICK_MS = 100; // 10 ticks/sec
const LINES_PER_TICK = 10; // 10 * 10 = 100 lines/sec
const BUFFER_SIZE = 60; // recent lines sent to a newly connected client

// Short visual fingerprint of a line.
function hashLine(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(0, 7);
}

function makeLine(seq) {
  const words = Array.from(
    { length: WORDS_PER_LINE },
    () => WORDS[Math.floor(Math.random() * WORDS.length)],
  );
  return { id: seq, words, hash: hashLine(words.join(" ")) };
}

/**
 * WordStream — a single shared live-stream room. Every client connected to the
 * same room id receives the exact same lines in real time. One actor instance
 * generates 100 unique 12-word lines per second and broadcasts each batch.
 */
export default class WordStream extends Actor {
  // Keep the room resident while clients are connected so the tick keeps firing.
  static options = { hibernate: false };

  seq = 0; // monotonic line id, survives eviction via storage
  recent = []; // rolling buffer of recent lines for late joiners
  timer = null; // the generation loop handle

  async handleStart() {
    // Rehydrate the sequence counter after an eviction/redeploy.
    const saved = await this.storage.get("seq");
    if (typeof saved === "number") this.seq = saved;
    // If clients are already attached (redeploy mid-session), resume ticking.
    if (this.getConnections().length > 0 && !this.timer) this.startTicking();
  }

  async handleConnect(conn) {
    if (!this.timer) this.startTicking();
    // Late joiners see the recent lines immediately, then live batches.
    conn.send({ type: "recent", lines: this.recent });
  }

  async handleMessage() {
    // The stream is server-authoritative; clients send no input.
  }

  async handleClose() {
    if (this.getConnections().length === 0 && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      await this.storage.put("seq", this.seq);
    }
  }

  startTicking() {
    this.timer = setInterval(() => {
      const fresh = [];
      for (let i = 0; i < LINES_PER_TICK; i += 1) {
        this.seq += 1;
        fresh.push(makeLine(this.seq));
      }
      // Keep the rolling buffer newest-first so a new client sees recent lines.
      this.recent = fresh.slice().reverse().concat(this.recent).slice(0, BUFFER_SIZE);
      this.broadcast({ type: "lines", lines: fresh });
    }, TICK_MS);
  }
}