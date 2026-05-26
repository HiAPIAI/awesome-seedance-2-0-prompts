#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "prompts.json"), "utf8"));

const REPO_SLUG = "awesome-seedance-2-0-prompts";

function withUtm(url, medium = "readme") {
  const u = new URL(url);
  u.searchParams.set("utm_source", "github");
  u.searchParams.set("utm_medium", medium);
  u.searchParams.set("utm_campaign", REPO_SLUG);
  return u.toString();
}

const hiapi = {
  zh: {
    home: withUtm("https://www.hiapi.ai/zh"),
    key: withUtm("https://www.hiapi.ai/zh/register"),
    model: withUtm("https://www.hiapi.ai/zh/models/seedance-2-0"),
    pricing: withUtm("https://www.hiapi.ai/zh/pricing"),
    dashboard: withUtm("https://www.hiapi.ai/zh/dashboard"),
  },
  en: {
    home: withUtm("https://www.hiapi.ai/en"),
    key: withUtm("https://www.hiapi.ai/en/register"),
    model: withUtm("https://www.hiapi.ai/en/models/seedance-2-0"),
    pricing: withUtm("https://www.hiapi.ai/en/pricing"),
    dashboard: withUtm("https://www.hiapi.ai/en/dashboard"),
  },
  docs: withUtm("https://docs.hiapi.ai"),
  skill: "https://github.com/HiAPIAI/hiapi-seedance-2-0-video-skill",
  skillsHub: "https://github.com/HiAPIAI/hiapi-skills",
  promptsImage: "https://github.com/HiAPIAI/awesome-gpt-image-2-prompts",
};

function badgeImg(label, color) {
  const safe = String(label).replace(/-/g, "--").replace(/ /g, "%20");
  return `https://img.shields.io/badge/${safe}-${color}`;
}

function tHeader(lang) {
  if (lang === "zh") {
    return {
      title: "Awesome Seedance 2.0 Prompts",
      subtitle: "Seedance 2.0 视频提示词案例库",
      langSwitch: ["English", "README.md"],
      nav: [
        ["HiAPI", hiapi.zh.home],
        ["Seedance 2.0", hiapi.zh.model],
        ["API Key", hiapi.zh.key],
        ["Skill", hiapi.skill],
        ["Docs", hiapi.docs],
      ],
      tagline: "真实视频效果 · 完整提示词 · 一个 API Key 全部跑通",
      intro: `## 这是什么

\`Awesome Seedance 2.0 Prompts\` 是一份针对 [Seedance 2.0](${hiapi.zh.model}) 的视频提示词案例画廊。${data.items.length} 个案例覆盖 ${data.categories.length} 个分类，每条都包含**真实视频片段**、**完整 Prompt** 和**原作者署名**，复制即可在 HiAPI 跑通。

## 怎么用

1. 在下方目录里挑一个你喜欢的镜头风格。
2. 点击案例卡片，看真实效果和完整提示词。
3. 复制 Prompt，改主体 / 产品 / 城市 / 文案。
4. 把 Prompt + 参数贴进 HiAPI \`POST /v1/videos\` 请求，或安装 [Seedance 2.0 Skill](${hiapi.skill}) 让 AI Agent 直接生成。
`,
      categoryTitle: "按类型浏览",
      counts: (n) => `${n} 个案例`,
      caseLabels: {
        watch: "看效果",
        post: "原帖",
        author: "作者",
        ratio: "比例",
        duration: "时长",
        resolution: "分辨率",
        capability: "能力",
        prompt: "完整 Prompt（点击展开）",
      },
      apiTitle: "组装为 HiAPI 视频请求",
      apiBody: `从任意案例复制 prompt，下面三段代码都用同一个端点和 \`HIAPI_API_KEY\`。返回一个 task id，之后轮询拿成片 URL。

**curl**

\`\`\`bash
curl -X POST "https://api.hiapi.ai/v1/videos" \\
  -H "Authorization: Bearer $HIAPI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "seedance-2-0",
    "prompt": "把这里换成你从案例里复制的提示词",
    "seconds": "5",
    "resolution": "720p",
    "ratio": "16:9"
  }'
\`\`\`

**Python**

\`\`\`python
import os
import requests

response = requests.post(
    "https://api.hiapi.ai/v1/videos",
    headers={
        "Authorization": f"Bearer {os.environ['HIAPI_API_KEY']}",
        "Content-Type": "application/json",
    },
    json={
        "model": "seedance-2-0",
        "prompt": "把这里换成你从案例里复制的提示词",
        "seconds": "5",
        "resolution": "720p",
        "ratio": "16:9",
    },
)

print(response.json())  # task id；轮询 videos 端点获取最终 URL
\`\`\`

**Node**

\`\`\`js
const response = await fetch("https://api.hiapi.ai/v1/videos", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.HIAPI_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "seedance-2-0",
    prompt: "把这里换成你从案例里复制的提示词",
    seconds: "5",
    resolution: "720p",
    ratio: "16:9",
  }),
});

console.log(await response.json()); // task id；轮询 videos 端点获取最终 URL
\`\`\`

希望让 AI Agent 直接调用 Seedance 2.0，请安装 [hiapi-seedance-2-0-video-skill](${hiapi.skill})。

Reference: [API Docs](${hiapi.docs}) · [Pricing](${hiapi.zh.pricing}) · [Dashboard](${hiapi.zh.dashboard})`,
      ctaTitle: "开始生成",
      ctaText: "Seedance 2.0、HappyHorse 1.0、GPT Image 2 等主流模型，一个 API Key 统一接入，按量计费无需订阅。",
      ctaButtons: [
        [`在 HiAPI 生成视频 →`, hiapi.zh.model],
        [`安装 Skill`, hiapi.skill],
        [`API 文档`, hiapi.docs],
      ],
      thanksTitle: "致谢",
      thanksText: "感谢所有公开分享案例的创作者，让社区可以一起学习 Seedance 2.0 的拍法。",
      licenseTitle: "授权说明",
      licenseText: "仓库代码、脚本、JSON 字段结构和 README 排版适用 [MIT License](LICENSE)；Prompt 文本、案例视频/图片、作者署名、第三方品牌与平台名称版权归原权利人所有，详见 [NOTICE.md](NOTICE.md)。",
    };
  }
  return {
    title: "Awesome Seedance 2.0 Prompts",
    subtitle: "A curated Seedance 2.0 video prompt gallery.",
    langSwitch: ["简体中文", "README.zh-CN.md"],
    nav: [
      ["HiAPI", hiapi.en.home],
      ["Seedance 2.0", hiapi.en.model],
      ["API Key", hiapi.en.key],
      ["Skill", hiapi.skill],
      ["Docs", hiapi.docs],
    ],
    tagline: "Real video output · Full prompts · One API key",
    intro: `## What This Is

\`Awesome Seedance 2.0 Prompts\` is a curated video prompt gallery for [Seedance 2.0](${hiapi.en.model}). ${data.items.length} cases across ${data.categories.length} categories, each shipped with a **real video preview**, the **full prompt**, and the **original creator handle** — copy and run on HiAPI.

## How To Use

1. Pick a camera style from the index below.
2. Open the case card to watch the real output and read the prompt.
3. Copy the prompt and swap the subject, product, city, or copy.
4. Paste the prompt and parameters into HiAPI \`POST /v1/videos\`, or install the [Seedance 2.0 Skill](${hiapi.skill}) to let an AI agent run it.
`,
    categoryTitle: "Browse by Category",
    counts: (n) => `${n} cases`,
    caseLabels: {
      watch: "Watch",
      post: "Original post",
      author: "Author",
      ratio: "Ratio",
      duration: "Duration",
      resolution: "Resolution",
      capability: "Capability",
      prompt: "Full prompt (click to expand)",
    },
    apiTitle: "Build the HiAPI Video Request",
    apiBody: `Copy a prompt from any case and drop it into any snippet below — same endpoint, same \`HIAPI_API_KEY\`. The call returns a task id; poll the videos endpoint for the final URL.

**curl**

\`\`\`bash
curl -X POST "https://api.hiapi.ai/v1/videos" \\
  -H "Authorization: Bearer $HIAPI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "seedance-2-0",
    "prompt": "Paste a prompt copied from one of the cases above",
    "seconds": "5",
    "resolution": "720p",
    "ratio": "16:9"
  }'
\`\`\`

**Python**

\`\`\`python
import os
import requests

response = requests.post(
    "https://api.hiapi.ai/v1/videos",
    headers={
        "Authorization": f"Bearer {os.environ['HIAPI_API_KEY']}",
        "Content-Type": "application/json",
    },
    json={
        "model": "seedance-2-0",
        "prompt": "Paste a prompt copied from one of the cases above",
        "seconds": "5",
        "resolution": "720p",
        "ratio": "16:9",
    },
)

print(response.json())  # task id; poll the videos endpoint for the final URL
\`\`\`

**Node**

\`\`\`js
const response = await fetch("https://api.hiapi.ai/v1/videos", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.HIAPI_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "seedance-2-0",
    prompt: "Paste a prompt copied from one of the cases above",
    seconds: "5",
    resolution: "720p",
    ratio: "16:9",
  }),
});

console.log(await response.json()); // task id; poll the videos endpoint for the final URL
\`\`\`

If you want an AI agent to call Seedance 2.0 for you, install the [hiapi-seedance-2-0-video-skill](${hiapi.skill}).

Reference: [API Docs](${hiapi.docs}) · [Pricing](${hiapi.en.pricing}) · [Dashboard](${hiapi.en.dashboard})`,
    ctaTitle: "Generate",
    ctaText: "Seedance 2.0, HappyHorse 1.0, GPT Image 2, and more — one API key, pay-as-you-go, no subscription.",
    ctaButtons: [
      [`Generate on HiAPI →`, hiapi.en.model],
      [`Install the Skill`, hiapi.skill],
      [`API Docs`, hiapi.docs],
    ],
    thanksTitle: "Acknowledgments",
    thanksText: "Thanks to every creator who shared their Seedance 2.0 cases publicly so the community can learn together.",
    licenseTitle: "License",
    licenseText: "Repository code, scripts, JSON field structure, and README layout are released under [MIT](LICENSE). Prompt text, example media, creator attribution, third-party brand and platform names belong to their original rightsholders — see [NOTICE.md](NOTICE.md).",
  };
}

function renderCaseCard(it, t, lang) {
  const title = lang === "zh" ? (it.title_zh || it.title_en) : (it.title_en || it.title_zh);
  const L = t.caseLabels;
  const lines = [];
  lines.push(`<!-- Case ${it.case_number}: ${title} (by ${it.author}) -->`);
  lines.push(`<a id="${it.id}"></a>`);
  lines.push(`#### ${it.case_number}. ${title}`);
  lines.push("");

  // Media: prefer video with poster image; fall back to image link if no video.
  if (it.preview_video && it.preview_image) {
    lines.push(
      `<video src="${it.preview_video}" poster="${it.preview_image}" width="480" controls preload="none"></video>`
    );
  } else if (it.preview_image) {
    lines.push(`<a href="${it.source_url}"><img src="${it.preview_image}" width="480" alt="${title}"></a>`);
  } else if (it.preview_video) {
    lines.push(`<video src="${it.preview_video}" width="480" controls preload="none"></video>`);
  }
  lines.push("");

  // Meta block in inline badges + small table.
  const ratioBadge = `![${L.ratio}](${badgeImg(`${L.ratio}: ${it.aspect_ratio}`, "111827")})`;
  const durBadge = `![${L.duration}](${badgeImg(`${L.duration}: ${it.seconds}s`, "111827")})`;
  const resBadge = `![${L.resolution}](${badgeImg(`${L.resolution}: ${it.resolution}`, "111827")})`;
  const capBadge = `![${L.capability}](${badgeImg(`${L.capability}: ${it.capability}`, "f97316")})`;
  lines.push(`${ratioBadge} ${durBadge} ${resBadge} ${capBadge}`);
  lines.push("");
  lines.push(`**${L.author}:** [${it.author}](${it.author_url}) · **${L.post}:** [${it.source_title}](${it.source_url})`);
  lines.push("");

  lines.push(`<details><summary><strong>${L.prompt}</strong></summary>`);
  lines.push("");
  lines.push("```text");
  lines.push(it.prompt);
  lines.push("```");
  lines.push("");
  lines.push(`</details>`);
  lines.push("");
  return lines.join("\n");
}

function render(lang) {
  const t = tHeader(lang);
  const out = [];

  // Centered header with HiAPI-generated cover banner.
  out.push(`<div align="center">`);
  out.push("");
  const coverFile = lang === "zh" ? "./assets/cover.zh-CN.png" : "./assets/cover.png";
  const coverHref = lang === "zh" ? hiapi.zh.home : hiapi.en.home;
  out.push(`<a href="${coverHref}"><img src="${coverFile}" alt="${t.title}" width="100%"></a>`);
  out.push("");
  // Big shield row
  out.push([
    `[![HiAPI](https://img.shields.io/badge/HiAPI-One%20API%2C%20All%20AI%20Models-f97316?style=for-the-badge)](${lang === "zh" ? hiapi.zh.home : hiapi.en.home})`,
    `[![API Key](https://img.shields.io/badge/API%20Key-Free-111827?style=for-the-badge)](${lang === "zh" ? hiapi.zh.key : hiapi.en.key})`,
    `[![Seedance 2.0](https://img.shields.io/badge/Seedance%202.0-Open-f97316?style=for-the-badge)](${lang === "zh" ? hiapi.zh.model : hiapi.en.model})`,
    `[![Docs](https://img.shields.io/badge/Docs-HiAPI-111827?style=for-the-badge)](${hiapi.docs})`,
  ].join(" "));
  out.push("");
  // Small badges row
  out.push([
    `![${data.items.length}](${badgeImg(`${data.items.length} Prompts`, "f97316")})`,
    `![${data.categories.length}](${badgeImg(`${data.categories.length} Categories`, "111827")})`,
    `![Real Video](${badgeImg("Real Video", "16a34a")})`,
    `![Copy & Run](${badgeImg("Copy & Run", "f59e0b")})`,
  ].join(" "));
  out.push("");
  out.push(`# ${t.title}`);
  out.push("");
  out.push(`**${t.subtitle}**`);
  out.push("");
  out.push(t.nav.map(([l, u]) => `[${l}](${u})`).join(" · ") + ` · [${t.langSwitch[0]}](${t.langSwitch[1]})`);
  out.push("");
  out.push(`*${t.tagline}*`);
  out.push("");
  out.push(`</div>`);
  out.push("");
  out.push(`> **HiAPI Matrix:** 🎨 [Image Prompts](https://github.com/HiAPIAI/awesome-gpt-image-2-prompts) · 🎬 **Video Prompts (you are here)** · 🛠️ [Agent Skills](https://github.com/HiAPIAI/hiapi-skills) · 🤖 [Remote MCP](https://docs.hiapi.ai/for-ai/) · 📖 [API Docs](https://docs.hiapi.ai)`);
  out.push("");
  out.push(`> Have a Seedance 2.0 prompt with a real rendered clip? **[Submit it via issue template →](https://github.com/HiAPIAI/awesome-seedance-2-0-prompts/issues/new?template=submit-a-prompt.yml)** · [Contributing guide](./CONTRIBUTING.md)`);
  out.push("");
  out.push("---");
  out.push("");

  // Hero preview grid: one still per category, links to the case page
  const heroHeading = lang === "zh" ? "精选案例预览" : "Featured Cases";
  const cellsPerRow = 4;
  const cells = data.categories
    .map((category) => {
      const first = data.items.find((it) => it.category === category.id);
      if (!first || !first.preview_image) return null;
      const catName = lang === "zh" ? (category.zh || category.en) : (category.en || category.zh);
      const slug = category.id;
      return `    <td align="center" width="25%" valign="top"><a href="#${slug}"><img src="${first.preview_image}" width="240" alt="${catName}"></a><br><sub><b>${catName}</b></sub></td>`;
    })
    .filter(Boolean);
  if (cells.length) {
    out.push(`<div align="center">`);
    out.push("");
    out.push(`<h3>${heroHeading}</h3>`);
    out.push("");
    out.push(`<table>`);
    for (let i = 0; i < cells.length; i += cellsPerRow) {
      out.push(`  <tr>`);
      out.push(cells.slice(i, i + cellsPerRow).join("\n"));
      out.push(`  </tr>`);
    }
    out.push(`</table>`);
    out.push("");
    out.push(`</div>`);
    out.push("");
  }

  out.push(t.intro);
  out.push("");
  out.push("---");
  out.push("");

  // Category index as a 2-column table (visually different from upstream)
  out.push(`## ${t.categoryTitle}`);
  out.push("");
  out.push(`| | |`);
  out.push(`|---|---|`);
  for (let i = 0; i < data.categories.length; i += 2) {
    const c1 = data.categories[i];
    const c2 = data.categories[i + 1];
    const c1Count = data.items.filter((it) => it.category === c1.id).length;
    const c1Title = lang === "zh" ? c1.zh : c1.en;
    const c1Desc = lang === "zh" ? c1.description_zh : c1.description_en;
    const c1Cell = `**[${c1Title}](#${c1.id})** — ${t.counts(c1Count)}<br><sub>${c1Desc}</sub>`;
    let c2Cell = "";
    if (c2) {
      const c2Count = data.items.filter((it) => it.category === c2.id).length;
      const c2Title = lang === "zh" ? c2.zh : c2.en;
      const c2Desc = lang === "zh" ? c2.description_zh : c2.description_en;
      c2Cell = `**[${c2Title}](#${c2.id})** — ${t.counts(c2Count)}<br><sub>${c2Desc}</sub>`;
    }
    out.push(`| ${c1Cell} | ${c2Cell} |`);
  }
  out.push("");
  out.push("---");
  out.push("");

  // Per-category sections, each followed by all cards
  for (const c of data.categories) {
    const items = data.items
      .filter((i) => i.category === c.id)
      .sort((a, b) => a.category_case_number - b.category_case_number);
    if (items.length === 0) continue;
    const cTitle = lang === "zh" ? c.zh : c.en;
    const cDesc = lang === "zh" ? c.description_zh : c.description_en;
    out.push(`<a id="${c.id}"></a>`);
    out.push("");
    out.push(`## ${cTitle}`);
    out.push("");
    out.push(`> ${cDesc} — **${t.counts(items.length)}**`);
    out.push("");
    for (const it of items) {
      out.push(renderCaseCard(it, t, lang));
    }
    out.push("");
    out.push("---");
    out.push("");
  }

  // API section
  out.push(`## ${t.apiTitle}`);
  out.push("");
  out.push(t.apiBody);
  out.push("");
  out.push("---");
  out.push("");

  // CTA
  out.push(`## ${t.ctaTitle}`);
  out.push("");
  out.push(t.ctaText);
  out.push("");
  out.push(t.ctaButtons.map(([l, u]) => `[${l}](${u})`).join(" · "));
  out.push("");
  out.push("---");
  out.push("");

  // Thanks
  out.push(`## ${t.thanksTitle}`);
  out.push("");
  out.push(t.thanksText);
  out.push("");

  // License
  out.push(`## ${t.licenseTitle}`);
  out.push("");
  out.push(t.licenseText);
  out.push("");

  return out.join("\n");
}

const file = (lang) => (lang === "zh" ? "README.zh-CN.md" : "README.md");
for (const lang of ["en", "zh"]) {
  fs.writeFileSync(path.join(root, file(lang)), render(lang));
}
console.log(`Wrote README.md and README.zh-CN.md with ${data.items.length} cases.`);
