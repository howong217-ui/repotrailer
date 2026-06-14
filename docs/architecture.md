# Architecture

RepoTrailer separates repository evidence from presentation.

## Pipeline

```text
local path / GitHub URL
          |
          v
     repository resolver
          |
          v
 README + package + files + git
          |
          v
   normalized repository facts
          |
          v
       storyboard
          |
    +-----+------+-------------+
    |            |             |
    v            v             v
 preview HTML  social SVG  launch Markdown
    |
    v
 HyperFrames project and MP4
```

## Modules

- `src/analyze.js` resolves repositories and extracts source-grounded facts.
- `src/storyboard.js` maps those facts into a timed narrative under 25 seconds.
- `src/launch-kit.js` creates deterministic static assets.
- `src/hyperframes.js` writes and validates the offline-capable video composition.
- `src/cli.js` owns argument parsing and orchestration.

The analyzer does not execute target code or package scripts.

## Evidence boundary

These values may come from the repository:

- title and description
- feature bullets
- package name and install command
- detected language and framework signals
- file, commit, and contributor counts

These values are presentation choices:

- scene order and duration
- palette
- typography
- animation and transitions
- launch-copy phrasing

Presentation may simplify evidence, but it must not strengthen it. For example,
three detected framework signals may be shown as three technology chips; they
must not become "used by three teams."

## Static-first rendering

The HTML preview and SVG card are generated without browser automation or
FFmpeg. The generated HyperFrames project carries its own GSAP runtime, so
rendering does not depend on a CDN. HyperFrames rendering is intentionally
downstream so a machine without the video toolchain still receives a useful
launch kit with `--no-video`.
