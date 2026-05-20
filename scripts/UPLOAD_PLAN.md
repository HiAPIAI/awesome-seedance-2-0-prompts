# Browser Upload Plan: Get user-attachments URLs for 160 Videos

## Goal

Replace each case's `preview_video` placeholder URL in `data/prompts.json` with a real `https://github.com/user-attachments/assets/<uuid>` URL so the `<video>` element in `README.md` plays inline on GitHub.

## Why this is needed

GitHub's README markdown renderer only embeds `<video>` when `src` points to:

- `https://github.com/user-attachments/assets/<uuid>` (only generated when a file is dropped into a GitHub web editor — issue, PR, comment, or markdown editor — for that repo)

It strips `<video>` whose `src` points at:

- the raw repo path
- the release download URL
- any other domain

So we need to manually drag each `.mp4` into a GitHub web editor, capture the UUID it gives back, and paste it into our JSON.

## Constraints discovered while testing

- **Single-file upload limit ≈ 10 MB on free plans**, ~25 MB on paid org plans. We have **17 files over 10 MB** (max ~21 MB) — those will need to be re-encoded smaller before upload, or skipped.
- **No public REST API for user-attachments uploads.** The only programmatic path is via the internal `uploads.github.com/.../timeline_assets` endpoint that the web UI uses, and it requires the per-issue upload token. Browser automation against the real DOM is the supported workflow.

## Playbook for a browser plugin (Codex / Cursor / Playwright)

### Inputs

- `scripts/upload-manifest.json` — array of 160 entries:

```json
{
  "case_id": "action-fantasy-case-1-street-rap-mv-performance-by-songguoxiansen",
  "case_number": 1,
  "category": "action-fantasy",
  "title": "Street Rap MV Performance",
  "author": "@songguoxiansen",
  "filename": "021.mp4",
  "local_path": "/Users/fhl/Documents/zimacode-network/hiapi-fullstack/awesome-seedance-2-0-prompts/.upstream-cache/public/seedance_2_prompt_images/021.mp4",
  "size_bytes": 3631054,
  "size_mb": 3.5,
  "over_10mb": false
}
```

### Browser steps for each entry

1. **Open** `https://github.com/HiAPIAI/awesome-seedance-2-0-prompts/issues/new` in a logged-in tab (the plugin must use your GitHub session cookie).
2. **Skip the title** — it doesn't matter; we'll never submit the issue.
3. **Locate the comment textarea** with selector `textarea#issue_body` and the file input adjacent to it. The "Attach files" affordance accepts `<input type="file">` programmatically.
4. **Drop one file** from `local_path`. Wait for the textarea to be appended with a marker like:
   ```
   ![021](https://github.com/user-attachments/assets/abc1234-...-uuid)
   ```
   or a `https://...` line. Capture that URL with a regex `/https:\/\/github\.com\/user-attachments\/assets\/[A-Za-z0-9-]{20,}/`.
5. **Append** `{ filename, url, captured_at: <now ISO> }` to a JSON Lines log file `scripts/upload-results.jsonl` so a crash mid-batch can resume by skipping already-captured filenames.
6. **Discard the issue** — close the tab without clicking "Submit". The asset stays valid because GitHub keeps user-attachments after the draft is abandoned.
7. **Skip files where `over_10mb === true`** — capture them in a separate `upload-skipped.jsonl` so we can decide later whether to re-encode.

### Pacing

- Sleep ~3 s between uploads to stay below GitHub's anti-abuse limits.
- Total expected runtime for 143 files of ~3 s each plus 5 s upload = ~20 minutes.

### Verification after the batch

Run locally:

```bash
node scripts/apply-upload-results.mjs
```

That script reads `scripts/upload-results.jsonl`, joins each row with the corresponding case in `data/prompts.json` by `filename`, overwrites `preview_video` with the captured URL, then re-runs `node scripts/build-readme.mjs`.

Then preview a case in `README.md` — the `<video>` element should render inline on GitHub with a real player.

## Handling the 17 oversized files

Two options for `over_10mb === true` entries:

- **Option A — re-encode under 10 MB:** ffmpeg one-shot:
  ```bash
  for f in $(jq -r '.[] | select(.over_10mb) | .filename' scripts/upload-manifest.json); do
    src=$(jq -r --arg f "$f" '.[] | select(.filename==$f) | .local_path' scripts/upload-manifest.json)
    out="$src.compressed.mp4"
    ffmpeg -y -i "$src" -vcodec libx264 -crf 28 -preset slow -vf "scale=-2:540" -an "$out"
    mv "$out" "$src"
  done
  ```
- **Option B — leave them as image-only**: keep `preview_video=""` for those 17; the README falls back to a clickable thumbnail linking to the X post.

Recommend **Option A** since it preserves user experience.

## What I (the agent) cannot do automatically

- Drive a browser session with your GitHub cookie — that has to run on your machine (the plugin you mentioned).
- Bypass the 10 MB single-file limit — it's enforced by GitHub's upload endpoint.
- Avoid the manual confirmation when GitHub shows captcha/2FA on bulk uploads — the plugin must handle that.
