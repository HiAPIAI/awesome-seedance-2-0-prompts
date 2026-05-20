#!/usr/bin/env node
// One-time import: parse an upstream README cache at .upstream-cache/README.md
// (and README_zh-CN.md for filename mapping) and emit data/prompts.json.
//
// Filename mapping strategy:
//   - The English README uses anonymous github.com/user-attachments URLs
//     (which 404 when hot-linked from another repo).
//   - The localized READMEs reference the same cases with stable filenames
//     under public/seedance_2_prompt_images/<basename>.jpg, where the matching
//     mp4 lives at <basename>.mp4 in the same folder.
//   - We parse the localized README to learn the canonical basename for each
//     Case heading, then emit:
//       preview_image  -> assets/previews/<basename>.jpg
//       preview_video  -> release URL pointing at the same basename.mp4
//
// The .upstream-cache/ directory is .gitignored.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const importDir = path.join(root, ".upstream-cache");
const readmePath = path.join(importDir, "README.md");
// Multiple localized READMEs are tried in order: each replaces video tags
// with image previews, but a few cases may still be video-only. Merging
// across languages gives full coverage.
const filenameMapReadmeFiles = [
  "README_ja.md",
  "README_zh-CN.md",
  "README_ko.md",
  "README_es.md",
  "README_zh-TW.md",
];
const outPath = path.join(root, "data", "prompts.json");

if (!fs.existsSync(readmePath)) {
  console.error(`Missing ${readmePath}. Place the upstream README under .upstream-cache/ first.`);
  process.exit(1);
}

const md = fs.readFileSync(readmePath, "utf8");

// Per-case filename map: header label "Case N: Title (by @handle)" -> basename.
// We key by the HTML comment marker because it is identical across READMEs.
const filenameMap = new Map();
for (const file of filenameMapReadmeFiles) {
  const p = path.join(importDir, file);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, "utf8");
  const blocks = text.split(/^(?=<!-- Case \d+: )/m).filter((b) => /^<!-- Case /.test(b));
  let added = 0;
  for (const block of blocks) {
    const marker = block.match(/^<!--\s*(Case \d+:[^>]*?)\s*-->/);
    if (!marker) continue;
    const key = marker[1].trim();
    if (filenameMap.has(key)) continue;
    const fileMatch = block.match(/\/seedance_2_prompt_images\/([A-Za-z0-9_-]+)\.(?:jpg|png|jpeg)/i);
    if (fileMatch) {
      filenameMap.set(key, fileMatch[1]);
      added += 1;
    }
  }
  console.error(`Filename map: ${file} contributed ${added} new entries (total ${filenameMap.size})`);
}

// Release base used to construct preview_video URLs. Configurable via env so
// the same script also works after the release tag rolls forward.
const releaseTag = process.env.RELEASE_TAG || "v1.0-media";
const releaseBase = process.env.RELEASE_BASE || `https://github.com/HiAPIAI/awesome-seedance-2-0-prompts/releases/download/${releaseTag}`;

const categoryMap = [
  { heading: "## ⚔️ Action / Fantasy", id: "action-fantasy", zh: "动作与奇幻", en: "Action / Fantasy",
    description_zh: "战斗、追逐、动漫、武侠和大场面动作奇观。",
    description_en: "Combat, chase, anime, wuxia, creature, and large-scale cinematic spectacle prompts." },
  { heading: "## 🎞️ Cinematic Realism", id: "cinematic-realism", zh: "电影级写实", en: "Cinematic Realism",
    description_zh: "贴近真实场景的电影级写实视频提示词。",
    description_en: "Grounded, photoreal cinematic prompts for live-action style output." },
  { heading: "## 🥽 POV / FPV", id: "pov-fpv", zh: "第一视角与穿越机",  en: "POV / FPV",
    description_zh: "第一人称、无人机穿越和身体绑定视角。",
    description_en: "First-person, drone-through, and body-mounted footage prompts." },
  { heading: "## 🏷️ Commercial / Product", id: "commercial-product", zh: "商业广告与产品", en: "Commercial / Product",
    description_zh: "产品广告、时尚短片和品牌主视觉。",
    description_en: "Product ads, fashion films, and brand key visuals." },
  { heading: "## 🖼️ Reference-Driven", id: "reference-driven", zh: "参考图驱动",  en: "Reference-Driven",
    description_zh: "用参考图或关键帧驱动 Seedance，保持人物与场景一致。",
    description_en: "Image-conditioned and character-reference prompts." },
  { heading: "## 🌀 Surreal / VFX", id: "vfx-surreal", zh: "特效与超现实",  en: "Surreal / VFX",
    description_zh: "维度切换、变形、物理反常和合成特效。",
    description_en: "Dimensional shifts, morphs, broken physics, and compositing effects." },
  { heading: "## 📐 Templates & Structured Formats", id: "templates", zh: "模板与结构化提示", en: "Templates & Structured Formats",
    description_zh: "可复用的结构化提示词脚手架与时间码模板。",
    description_en: "Reusable structured prompt scaffolds and timecode templates." },
  { heading: "## 🎬 General Cinematic", id: "general-cinematic", zh: "通用电影叙事",  en: "General Cinematic",
    description_zh: "广义的电影叙事、镜头语言与情绪示范。",
    description_en: "Broad cinematic storytelling, camera language, and mood references." },
];

const endHeadings = [
  "## 🙏 Acknowledge",
  "## Contributing",
  "## License",
  "## Copyright Notice",
];

function sliceCategory(md, heading, nextHeading) {
  const start = md.indexOf(heading);
  if (start < 0) return "";
  const afterHeading = start + heading.length;
  const next = md.indexOf(nextHeading, afterHeading);
  return next < 0 ? md.slice(afterHeading) : md.slice(afterHeading, next);
}

function slug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "case";
}

const githubRawBase = "";

// rewritePreview is no longer used; preview is derived from the filename map.

const caseRegex = /^### Case (\d+):\s*\[([^\]]+)\]\(([^)]+)\)\s*\(by\s*\[([^\]]+)\]\(([^)]+)\)\)\s*$/m;

function parseCases(slice, category) {
  // Split keeping markers and headings as separate chunks, then merge each
  // standalone marker with the immediately following heading block.
  const raw = slice
    .split(/^(?=<!-- Case \d+: |### Case \d+:)/m)
    .filter((b) => /^(<!-- Case |### Case )/.test(b));
  const blocks = [];
  for (let i = 0; i < raw.length; i++) {
    const b = raw[i];
    if (b.startsWith("<!-- Case ") && raw[i + 1] && raw[i + 1].startsWith("### Case ")) {
      blocks.push(b + raw[i + 1]);
      i += 1;
    } else if (b.startsWith("### Case ")) {
      blocks.push(b);
    }
    // Stand-alone marker without a following heading is skipped.
  }
  const items = [];
  for (const block of blocks) {
    const m = block.match(caseRegex);
    if (!m) continue;
    const [, num, title, sourceUrl, authorRaw, authorUrl] = m;
    const author = authorRaw.trim();
    // Look up the canonical filename via the HTML comment marker.
    const markerMatch = block.match(/<!--\s*(Case \d+:[^>]*?)\s*-->/);
    const markerKey = markerMatch ? markerMatch[1].trim() : "";
    const filename = filenameMap.get(markerKey) || "";
    let prompt = "";
    const promptStart = block.indexOf("**Prompt:**");
    const searchFrom = promptStart >= 0 ? promptStart : 0;
    const fenceMatch = block.slice(searchFrom).match(/```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```/);
    if (fenceMatch) prompt = fenceMatch[1];
    items.push({
      caseNum: parseInt(num, 10),
      title,
      sourceUrl,
      author,
      authorUrl,
      filename,
      prompt,
      category: category.id,
    });
  }
  return items;
}

const allItems = [];
const headings = categoryMap.map((c) => c.heading).concat(endHeadings);

for (let i = 0; i < categoryMap.length; i++) {
  const cat = categoryMap[i];
  const next = headings[i + 1];
  const slice = sliceCategory(md, cat.heading, next);
  const cases = parseCases(slice, cat);
  let n = 0;
  for (const c of cases) {
    n += 1;
    allItems.push({ ...c, categoryCaseNum: n });
  }
}

// Build the JSON
// Detect which filenames are video-backed by inspecting the upstream cache;
// when an mp4 is missing we leave preview_video empty so the README falls back
// to the image link.
const cacheMediaDir = path.join(importDir, "public", "seedance_2_prompt_images");
const hasMp4 = (filename) => filename && fs.existsSync(path.join(cacheMediaDir, `${filename}.mp4`));

const items = [];
for (const c of allItems) {
  const idBase = `${c.category}-case-${c.categoryCaseNum}-${slug(c.title)}-by-${slug(c.author.replace(/^@/, ""))}`;
  const previewImage = c.filename ? `assets/previews/${c.filename}.jpg` : "";
  const previewVideo = hasMp4(c.filename) ? `${releaseBase}/${c.filename}.mp4` : "";
  items.push({
    id: idBase,
    category: c.category,
    category_case_number: c.categoryCaseNum,
    case_number: c.caseNum,
    source_title: c.title,
    source_url: c.sourceUrl,
    title_en: c.title,
    title_zh: c.title,
    author: c.author,
    author_url: c.authorUrl,
    preview_filename: c.filename,
    preview_image: previewImage,
    preview_video: previewVideo,
    aspect_ratio: "16:9",
    seconds: "5",
    resolution: "720p",
    capability: c.category === "reference-driven" ? "image-to-video" : "text-to-video",
    prompt_language: /[一-鿿]/.test(c.prompt) ? "zh" : "en",
    prompt: c.prompt,
  });
}

const out = {
  name: "Awesome Seedance 2.0 Prompts",
  model: "seedance-2-0",
  updated_at: new Date().toISOString().slice(0, 10),
  source: {
    name: "Curated by HiAPI from public X / Twitter posts",
    note: "Each case keeps the original creator handle and original X / Twitter post link. Preview images live under assets/previews/. Preview videos are hot-linked from anonymous GitHub user-attachments CDN URLs.",
  },
  categories: categoryMap.map((c) => ({
    id: c.id,
    zh: c.zh,
    en: c.en,
    description_zh: c.description_zh,
    description_en: c.description_en,
  })),
  items,
};

fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.log(`Imported ${items.length} cases across ${categoryMap.length} categories into ${outPath}`);
const byCat = new Map();
for (const it of items) byCat.set(it.category, (byCat.get(it.category) || 0) + 1);
for (const [k, v] of byCat) console.log(`  - ${k}: ${v}`);
const missingFile = items.filter((i) => !i.preview_filename).length;
console.log(`Filename mapping: ${items.length - missingFile}/${items.length} cases have a preview_filename`);
if (missingFile) {
  console.warn(`  ${missingFile} case(s) missing a filename — they will render with no preview.`);
}
