import assert from "node:assert/strict";
import test from "node:test";

import { __test } from "../src/hyperframes.js";
import { buildStoryboard } from "../src/storyboard.js";

const palette = {
  ink: "#0a0b0d",
  paper: "#f5f2e9",
  accent: "#c7ff45",
  hot: "#ff6247",
  muted: "#9aa0aa",
};

const repo = {
  title: "RepoTrailer",
  name: "repotrailer",
  tagline: "Turn repositories into launch trailers.",
  features: ["Local-first", "No API key", "Source-grounded"],
  stack: ["Node.js", "HyperFrames"],
  languages: [{ name: "JavaScript", percent: 100 }],
  installCommand: "npx repotrailer .",
  files: { total: 24, source: 8 },
  git: {
    commits: 42,
    contributors: 3,
    remote: "https://github.com/howong217-ui/repotrailer",
  },
  source: ".",
};

test("generates a valid HyperFrames composition contract", () => {
  const scenes = buildStoryboard(repo);
  const html = __test.compositionHtml(repo, scenes, palette);

  assert.match(html, /data-composition-id="repotrailer"/);
  assert.match(html, /window\.__timelines\["repotrailer"\]/);
  assert.match(html, /gsap\.timeline\(\{ paused: true \}\)/);
  assert.doesNotMatch(html, /repeat:\s*-1/);
  assert.match(html, /power4\.inOut/);
  assert.match(html, /transition-flash/);
});

test("uses smaller title classes for long copy", () => {
  assert.equal(__test.titleClass("Short title"), "title-short");
  assert.equal(
    __test.titleClass("A title that is definitely longer than thirty two"),
    "title-medium",
  );
  assert.equal(
    __test.titleClass(
      "A very long title that would otherwise spill outside the video frame and needs smaller type",
    ),
    "title-long",
  );
});

test("writes an explicit visual identity", () => {
  const design = __test.designMarkdown(palette);
  assert.match(design, /Swiss Pulse/);
  assert.match(design, /#c7ff45/);
  assert.match(design, /What NOT to Do/);
});
