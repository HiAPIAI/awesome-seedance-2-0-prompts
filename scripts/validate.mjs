#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "prompts.json"), "utf8"));

const requiredItemFields = [
  "id",
  "category",
  "category_case_number",
  "case_number",
  "source_title",
  "source_url",
  "title_zh",
  "title_en",
  "author",
  "author_url",
  "preview",
  "preview_kind",
  "aspect_ratio",
  "seconds",
  "resolution",
  "capability",
  "prompt_language",
  "prompt",
];

const allowedAspectRatios = new Set(["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"]);
const allowedSeconds = new Set(["4", "5", "8", "10"]);
const allowedResolutions = new Set(["480p", "720p"]);
const allowedCapabilities = new Set(["text-to-video", "image-to-video"]);

const errors = [];
const warnings = [];
const seenIds = new Set();
const seenCaseNumbers = new Map(); // category -> Set
const categoryIds = new Set(data.categories.map((c) => c.id));
const allowedPreviewKinds = new Set(["image", "video"]);

for (const [index, item] of data.items.entries()) {
  const where = `items[${index}] (${item.id ?? "no-id"})`;
  for (const field of requiredItemFields) {
    if (item[field] === undefined || item[field] === null || item[field] === "") {
      errors.push(`${where}: missing required field "${field}"`);
    }
  }
  if (item.id) {
    if (seenIds.has(item.id)) errors.push(`${where}: duplicate id`);
    seenIds.add(item.id);
  }
  if (item.case_number !== undefined && item.category) {
    if (!seenCaseNumbers.has(item.category)) seenCaseNumbers.set(item.category, new Set());
    const set = seenCaseNumbers.get(item.category);
    if (set.has(item.case_number)) {
      errors.push(`${where}: duplicate case_number ${item.case_number} within category ${item.category}`);
    }
    set.add(item.case_number);
  }
  if (item.category && !categoryIds.has(item.category)) {
    errors.push(`${where}: unknown category "${item.category}"`);
  }
  if (item.preview_kind && !allowedPreviewKinds.has(item.preview_kind)) {
    errors.push(`${where}: invalid preview_kind "${item.preview_kind}"`);
  }
  if (item.aspect_ratio && !allowedAspectRatios.has(item.aspect_ratio)) {
    warnings.push(`${where}: non-standard aspect_ratio "${item.aspect_ratio}"`);
  }
  if (item.seconds && !allowedSeconds.has(String(item.seconds))) {
    warnings.push(`${where}: non-standard seconds "${item.seconds}"`);
  }
  if (item.resolution && !allowedResolutions.has(item.resolution)) {
    warnings.push(`${where}: non-standard resolution "${item.resolution}"`);
  }
  if (item.capability && !allowedCapabilities.has(item.capability)) {
    errors.push(`${where}: invalid capability "${item.capability}"`);
  }
  if (item.source_url && !/^https?:\/\//.test(item.source_url)) {
    errors.push(`${where}: source_url must be http(s)`);
  }
  if (item.author_url && !/^https?:\/\//.test(item.author_url)) {
    errors.push(`${where}: author_url must be http(s)`);
  }
  if (item.preview && !/^https?:\/\//.test(item.preview) && !item.preview.startsWith("assets/")) {
    errors.push(`${where}: preview must be http(s) URL or assets/ path`);
  }
}

const json = JSON.stringify(data);
const secretLikePatterns = [
  /(?<![A-Za-z])sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
];
for (const p of secretLikePatterns) {
  if (p.test(json)) errors.push(`prompts.json contains secret-like string matching ${p}`);
}

if (warnings.length) {
  console.warn("Warnings:\n" + warnings.slice(0, 10).map((w) => "  - " + w).join("\n") + (warnings.length > 10 ? `\n  ... (+${warnings.length - 10} more)` : ""));
}
if (errors.length) {
  console.error("Validation failed:\n" + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}

console.log(`OK: ${data.items.length} prompts across ${data.categories.length} categories validated.`);
