#!/usr/bin/env node
// One-time import: parse an upstream README cache at .upstream-cache/README.md
// and emit data/prompts.json.
//
// Media handling:
//   - <video> tags: keep the anonymous github.com/user-attachments/assets/<uuid>
//     URL as-is (these are GitHub's anonymous CDN; they do not leak the source
//     repository).
//   - <img> tags: rewrite the basename to ./assets/previews/<basename> and rely
//     on the locally copied image (see assets/previews/, 11MB total).
//
// The .upstream-cache/ directory is .gitignored.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const importDir = path.join(root, ".upstream-cache");
const readmePath = path.join(importDir, "README.md");
const outPath = path.join(root, "data", "prompts.json");

if (!fs.existsSync(readmePath)) {
  console.error(`Missing ${readmePath}. Place the upstream README under .upstream-cache/ first.`);
  process.exit(1);
}

const md = fs.readFileSync(readmePath, "utf8");

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

function rewritePreview(html) {
  // Prefer anonymous GitHub user-attachments video URLs.
  const v = html.match(/<video[^>]*\ssrc="(https:\/\/github\.com\/user-attachments\/assets\/[^"]+)"/i);
  if (v) return { kind: "video", url: v[1] };
  // <img src="..."> — rewrite to local assets/previews/<basename>.
  const img = html.match(/<img[^>]*\ssrc="([^"]+)"/i);
  if (img) {
    const base = path.basename(img[1].split("?")[0]);
    return { kind: "image", url: `assets/previews/${base}` };
  }
  return { kind: null, url: "" };
}

const caseRegex = /^### Case (\d+):\s*\[([^\]]+)\]\(([^)]+)\)\s*\(by\s*\[([^\]]+)\]\(([^)]+)\)\)\s*$/m;

function parseCases(slice, category) {
  // Split slice by case headings
  const blocks = slice.split(/^(?=### Case \d+:)/m).filter((b) => /^### Case /.test(b));
  const items = [];
  for (const block of blocks) {
    const m = block.match(caseRegex);
    if (!m) continue;
    const [, num, title, sourceUrl, authorRaw, authorUrl] = m;
    const author = authorRaw.trim();
    // preview: first <video> or <img> after the heading
    const preview = rewritePreview(block);
    // prompt: first fenced code block after **Prompt:**
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
      preview,
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
const items = [];
for (const c of allItems) {
  const idBase = `${c.category}-case-${c.categoryCaseNum}-${slug(c.title)}-by-${slug(c.author.replace(/^@/, ""))}`;
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
    preview: c.preview.url || "",
    preview_kind: c.preview.kind || "image",
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
