import { Actor } from "base44:runtime/actors";

// Inline word bank — words may repeat; full 12-word lines never repeat within a file.
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
const FILE_SIZE = 100000; // lines per "file"
const PREPARE_AT = 50000; // start building the next file when the current one is half streamed
const PREPARE_CHUNK = 2000; // lines built per tick while preparing the next file
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

function makeLine(seq, seen) {
  let words = [];
  let key = "";
  for (let attempt = 0; attempt < 40; attempt += 1) {
    words = Array.from(
      { length: WORDS_PER_LINE },
      () => WORDS[Math.floor(Math.random() * WORDS.length)],
    );
    key = words.join(" ");
    if (!seen.has(key)) break;
  }
  seen.add(key);
  return { id: seq, words, hash: hashLine(key) };
}

// Build a full file of FILE_SIZE unique lines up front. The first file is created
// before streaming begins, exactly as requested: file first, then stream.
function buildFile(startSeq) {
  const seen = new Set();
  const lines = new Array(FILE_SIZE);
  let seq = startSeq;
  for (let i = 0; i < FILE_SIZE; i += 1) {
    seq += 1;
    lines[i] = makeLine(seq, seen);
  }
  return { lines, seq };
}

/**
 * WordStream — a single shared live-stream room. Lines come from pre-generated
 * "files" of 100,000 lines each. A file is created, streamed at 100 lines/sec,
 * and while it streams the next file is built in the background. When a file has
 * been fully streamed it is deleted (its memory is freed) and the next file takes
 * over. When the last client leaves, any remaining files are deleted too.
 */
export default class WordStream extends Actor {
  // Keep the room resident while clients are connected so the tick keeps firing.
  static options = { hibernate: false };

  seq = 0; // monotonic line id, survives eviction via storage
  recent = []; // rolling buffer of recent lines for late joiners
  timer = null; // the generation loop handle

  currentFile = null; // { lines: Array, cursor: number } — the file being streamed
  nextFile = null; // { lines, cursor, seen, ready } — the file being prepared

  async handleStart() {
    const saved = await this.storage.get("seq");
    if (typeof saved === "number") this.seq = saved;
    if (this.getConnections().length > 0 && !this.timer) this.startTicking();
  }

  async handleConnect(conn) {
    // First connection builds the first file, then begins streaming.
    if (!this.currentFile) {
      const built = buildFile(this.seq);
      this.seq = built.seq;
      this.currentFile = { lines: built.lines, cursor: 0 };
    }
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
      // Streaming has ended — delete every file.
      this.currentFile = null;
      this.nextFile = null;
      await this.storage.put("seq", this.seq);
    }
  }

  startTicking() {
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  tick() {
    if (!this.currentFile) return;

    // If the current file is fully streamed, swap in the next file and delete the old one.
    if (this.currentFile.cursor >= FILE_SIZE) {
      if (this.nextFile && this.nextFile.ready) {
        this.currentFile = { lines: this.nextFile.lines, cursor: 0 };
        this.nextFile = null;
      } else {
        // Next file not ready yet — keep preparing, emit nothing this tick.
        this.prepareNext();
        return;
      }
    }

    // Emit the next batch from the current file.
    const start = this.currentFile.cursor;
    const end = Math.min(start + LINES_PER_TICK, FILE_SIZE);
    const fresh = this.currentFile.lines.slice(start, end);
    this.currentFile.cursor = end;

    // Keep the rolling buffer newest-first so a new client sees recent lines.
    this.recent = fresh.slice().reverse().concat(this.recent).slice(0, BUFFER_SIZE);
    this.broadcast({ type: "lines", lines: fresh });

    // While streaming, prepare the next file once the current one is past the threshold.
    this.prepareNext();
  }

  prepareNext() {
    // Start preparing the next file once the current one is past the threshold.
    if (!this.nextFile && this.currentFile && this.currentFile.cursor >= PREPARE_AT) {
      this.nextFile = { lines: new Array(FILE_SIZE), cursor: 0, seen: new Set(), ready: false };
    }
    if (!this.nextFile || this.nextFile.ready) return;

    // Build a chunk of lines each tick until the next file is complete.
    const nf = this.nextFile;
    const remaining = FILE_SIZE - nf.cursor;
    const count = Math.min(PREPARE_CHUNK, remaining);
    for (let i = 0; i < count; i += 1) {
      this.seq += 1;
      nf.lines[nf.cursor] = makeLine(this.seq, nf.seen);
      nf.cursor += 1;
    }
    if (nf.cursor >= FILE_SIZE) {
      nf.ready = true;
      nf.seen = null; // free the dedup set; the file's lines are fixed
    }
  }
}