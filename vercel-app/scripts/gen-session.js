// Run this ONCE on your own machine to generate a Telegram StringSession for
// your personal account. The printed string goes into Vercel as TG_SESSION.
//
//   cd vercel-app
//   npm install
//   node scripts/gen-session.js <api_id> <api_hash>
//
// Get api_id / api_hash from https://my.telegram.org → API development tools.
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import readline from "node:readline";

const apiId = parseInt(process.argv[2], 10);
const apiHash = process.argv[3];
if (!apiId || !apiHash) {
  console.error("Usage: node scripts/gen-session.js <api_id> <api_hash>");
  process.exit(1);
}

const ask = (q) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(q, (a) => {
      rl.close();
      resolve(a.trim());
    });
  });

(async () => {
  const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () => ask("ফোন নম্বর (+880...): "),
    password: async () => ask("২FA পাসওয়ার্ড (না থাকলে Enter): "),
    phoneCode: async () => ask("কোড: "),
    onError: (err) => console.error(err),
  });
  console.log("\n✅ নিচের স্ট্রিংটি Vercel-এ TG_SESSION হিসেবে বসাও:\n");
  console.log(client.session.save());
  console.log("\n(এই স্ট্রিং গোপন রাখো — এটি তোমার অ্যাকাউন্টের লগইন।)");
  process.exit(0);
})();