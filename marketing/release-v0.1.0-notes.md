# RepoTrailer v0.1.0

RepoTrailer turns a GitHub repository into README-ready launch assets: social
card, browser preview, release copy, JSON storyboard, editable HyperFrames
composition, and optional MP4.

It is built for maintainers who already have a useful project but need a faster
way to show why it matters.

## Try it

Generate a static launch kit from any local repository:

```bash
npx --yes --package=github:howong217-ui/repotrailer repotrailer . --no-video
```

Generate from a public GitHub repository:

```bash
npx --yes --package=github:howong217-ui/repotrailer repotrailer owner/repo --no-video
```

Omit `--no-video` to render the optional HyperFrames MP4 when Chrome/Chromium
and FFmpeg are available.

## What is included

- `index.html`: responsive storyboard preview
- `social-card.svg`: 1200x630 launch/social card
- `launch-copy.md`: short post and Show HN draft
- `repotrailer.json`: auditable source facts and scene timings
- `hyperframes/`: editable video composition
- `trailer.mp4`: optional rendered video when video mode is enabled

## Examples

The repository includes generated cards for:

- `sindresorhus/ky`
- `Textualize/rich`
- `BurntSushi/ripgrep`

See the gallery: https://github.com/howong217-ui/repotrailer/blob/main/docs/examples.md

## Design rules

- No hosted service or API key required for the default static path.
- Claims come from README, package metadata, source files, and git history.
- It does not invent stars, downloads, benchmarks, or adoption claims.
- Local repositories stay local; public GitHub URLs are cloned to a temporary
  directory.

## Feedback requested

The most useful feedback for this first release:

1. Does the generated story feel accurate for your repository?
2. Did the first command work on your machine?
3. Which output would you actually share: preview, card, copy, or video?

Full changelog: https://github.com/howong217-ui/repotrailer/commits/v0.1.0
