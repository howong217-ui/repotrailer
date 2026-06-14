import assert from "node:assert/strict";
import test from "node:test";

import { buildStoryboard } from "../src/storyboard.js";

test("storyboard is short, ordered, and ends with a call to action", () => {
  const scenes = buildStoryboard({
    title: "Example",
    name: "example",
    tagline: "An example project.",
    features: ["Fast", "Local", "Shareable"],
    stack: ["Node.js"],
    languages: [],
    installCommand: "npx example",
    files: { total: 12, source: 8 },
    git: { commits: 20, contributors: 2, remote: "https://github.com/x/y" },
    source: ".",
  });

  assert.equal(scenes[0].start, 0);
  assert.equal(scenes.at(-1).kind, "outro");
  assert.ok(
    scenes.every((scene, index) => (
      index === 0 || scene.start >= scenes[index - 1].start
    )),
  );
  const duration = scenes.at(-1).start + scenes.at(-1).duration;
  assert.ok(duration < 25);
  assert.deepEqual(
    scenes.find((scene) => scene.kind === "proof").metrics[2],
    { label: "source files", value: "8" },
  );
});

test("proof scene uses singular labels for one source file and signal", () => {
  const scenes = buildStoryboard({
    title: "Tiny",
    name: "tiny",
    tagline: "A tiny project.",
    features: ["Small"],
    stack: ["Node.js"],
    languages: [],
    installCommand: "npx tiny",
    files: { total: 1, source: 1 },
    git: { commits: 1, contributors: 1, remote: null },
    source: ".",
  });

  assert.equal(
    scenes.find((scene) => scene.kind === "proof").title,
    "1 source file. 1 signal.",
  );
});
