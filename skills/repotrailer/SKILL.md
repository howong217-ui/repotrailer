---
name: repotrailer
description: Create a launch trailer, social card, browser preview, and release copy from the current local repository or a GitHub URL. Use when the user wants to promote, launch, showcase, announce, or make a demo video for an open-source project.
---

# RepoTrailer

Turn repository facts into launch assets. Never invent stars, downloads,
benchmarks, contributors, or adoption claims.

## Workflow

1. Identify the source repository. Use the current directory unless the user
   supplies a local path or GitHub URL.
2. Run the local RepoTrailer CLI:

   ```bash
   npx repotrailer@latest . --out ./repotrailer-out
   ```

   During local plugin development, run:

   ```bash
   node bin/repotrailer.js . --out ./repotrailer-out
   ```

3. Review `repotrailer-out/repotrailer.json`. Check that the title, tagline,
   features, install command, and repository URL are accurate.
4. If metadata needs correction, rerun with `--title`, `--tagline`, or
   `--install`. Do not edit generated metrics into stronger claims.
5. Open `repotrailer-out/index.html` in the browser and inspect the visual
   hierarchy. When video rendering is available, render only after the static
   preview is correct.
6. Return links to the generated preview, social card, launch copy, manifest,
   and video.

## Output Contract

- `index.html`: static scene-by-scene preview
- `social-card.svg`: 1200x630 README and social image
- `launch-copy.md`: short post, Show HN draft, README snippet, topics
- `repotrailer.json`: source-grounded repository metadata and storyboard
- `trailer.mp4`: rendered video when HyperFrames is available

## Guardrails

- Prefer the repository README and package metadata over creative inference.
- Phrase missing facts as unknown; never fill them with plausible numbers.
- Keep the trailer under 25 seconds unless the user requests a longer format.
- Lead with one benefit, show at most three features, then show how to try it.
- Treat generated launch copy as a draft. Do not post it without the user's
  explicit request.
