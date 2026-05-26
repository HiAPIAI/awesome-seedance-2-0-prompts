# Contributing

Thanks for considering a contribution. This repository is a curated **Seedance 2.0 video prompt gallery** — every entry has a real video preview, a runnable prompt, and clear attribution.

## What kind of contribution we accept

- ✅ **New prompts with real video output.** Your own generations are best. Community references are OK if the original creator is credited and the original post link is preserved.
- ✅ **Better attribution.** Fixing a missing creator handle, a broken source link, or a license note.
- ✅ **README / docs improvements.** Typos, clearer wording, missing translations.
- ❌ **Prompts with no rendered video.** Speculation prompts will be closed.
- ❌ **Re-uploads of someone else's prompts without credit.** We mirror attribution; we don't strip it.

## Submit a new prompt

The fastest path is the [Submit a prompt issue template](https://github.com/HiAPIAI/awesome-seedance-2-0-prompts/issues/new?template=submit-a-prompt.yml). It asks for everything we need (prompt text, model, ratio, duration, resolution, video link, attribution) and a maintainer will turn it into a PR.

If you prefer to send a PR directly:

1. Fork the repo.
2. Add a new entry to `data/prompts.json` following the existing structure (`title_en`, `title_zh`, `category`, `prompt`, `ratio`, `duration`, `resolution`, `video_url`, `cover_url`, `source_url`, `author`).
3. Upload your video preview to a CDN that returns a stable URL (Cloudflare R2, Vercel Blob, or similar). MP4 ≤ 30 MB ideal. Put a still-frame cover next to it.
4. Run `node scripts/import-cases.mjs` (if you use the import path) or directly edit `data/prompts.json`, then `node scripts/build-readme.mjs`.
5. Open a PR. Use the format `prompt: <short title>` in the title.

## Quality bar

- **Real video, not promises.** Each entry must include a working video URL.
- **Reproducible.** Pasting the prompt into HiAPI `POST /v1/videos` with the listed model + ratio + duration should produce a visually similar clip.
- **Attribution preserved.** If the prompt or video originated elsewhere, link the source and the creator handle. We never strip credit.
- **English first, Chinese welcome.** Either `title_en` or `title_zh` is required; both is better.

## What happens after you submit

- We check the video link works and the attribution is correct.
- We may tighten the prompt wording or move it to a better category.
- We squash and merge with the original author credited in the commit trailer.

## Reporting problems

Open an issue with the case ID (e.g. `cinematic-realism-case-7`) and what's wrong. We treat broken attribution as a P1.

## Code of conduct

Be kind. We're all here to learn what Seedance 2.0 can actually do, not to score points.
