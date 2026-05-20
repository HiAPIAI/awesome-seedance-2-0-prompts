#!/usr/bin/env node
// Apply browser-captured user-attachments URLs back into data/prompts.json.
// Reads scripts/upload-results.jsonl (one JSON object per line:
// { filename: "021.mp4", url: "https://github.com/user-attachments/assets/<uuid>" })
// then overwrites the matching item's preview_video.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const promptsPath = path.join(root, "data", "prompts.json");
const resultsPath = path.join(root, "scripts", "upload-results.jsonl");

if (!fs.existsSync(resultsPath)) {
  console.error(`Missing ${resultsPath}. Run the browser uploader first.`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(promptsPath, "utf8"));
const lines = fs.readFileSync(resultsPath, "utf8").split(/\n+/).filter(Boolean);
const map = new Map();
for (const line of lines) {
  try {
    const r = JSON.parse(line);
    if (r.filename && r.url && /^https:\/\/github\.com\/user-attachments\/assets\//.test(r.url)) {
      map.set(r.filename, r.url);
    }
  } catch {
    // ignore malformed lines
  }
}

let updated = 0;
let unmatched = 0;
for (const it of data.items) {
  const fn = it.preview_filename ? `${it.preview_filename}.mp4` : "";
  if (!fn) continue;
  if (map.has(fn)) {
    it.preview_video = map.get(fn);
    updated += 1;
  } else if (it.preview_video) {
    unmatched += 1;
  }
}

fs.writeFileSync(promptsPath, JSON.stringify(data, null, 2) + "\n");
console.log(`Updated ${updated} items.`);
if (unmatched) console.log(`${unmatched} items still have a non-empty preview_video without a captured URL.`);
console.log(`Run \`node scripts/build-readme.mjs\` to regenerate the README.`);
