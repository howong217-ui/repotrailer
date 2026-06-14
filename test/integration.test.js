import assert from "node:assert/strict";
import { mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { analyzeRepository } from "../src/analyze.js";
import { writeLaunchKit } from "../src/launch-kit.js";
import { buildStoryboard } from "../src/storyboard.js";

const fixture = new URL("../examples/demo-repo", import.meta.url);

test("builds a complete launch kit from a local repository", async () => {
  const output = await mkdtemp(path.join(tmpdir(), "repotrailer-test-"));
  const repo = await analyzeRepository(fixture.pathname);
  const scenes = buildStoryboard(repo);
  const kit = await writeLaunchKit(repo, scenes, output);

  assert.equal(repo.name, "patchpilot");
  assert.deepEqual(repo.stack, ["React", "Vite", "Vitest"]);
  assert.equal(repo.installCommand, "npx patchpilot");
  assert.equal(scenes[0].kind, "hook");
  assert.equal(scenes.at(-1).kind, "outro");

  await Promise.all(
    [
      kit.files.manifest,
      kit.files.preview,
      kit.files.socialCard,
      kit.files.launchCopy,
      kit.hyperframes.index,
      kit.hyperframes.design,
      kit.hyperframes.config,
      kit.hyperframes.package,
    ].map((file) => stat(file)),
  );

  const html = await readFile(kit.files.preview, "utf8");
  const svg = await readFile(kit.files.socialCard, "utf8");
  const copy = await readFile(kit.files.launchCopy, "utf8");

  assert.match(html, /PatchPilot/);
  assert.match(svg, /REPOTRAILER/);
  assert.match(svg, /five-minute/);
  assert.match(svg, /review route/);
  assert.match(copy, /Show HN/);
});

test("applies explicit metadata overrides", async () => {
  const repo = await analyzeRepository(fixture.pathname, {
    title: "PatchPilot Pro",
    tagline: "Review the risky part first.",
    install: "npx patchpilot scan",
  });

  assert.equal(repo.title, "PatchPilot Pro");
  assert.equal(repo.tagline, "Review the risky part first.");
  assert.equal(repo.installCommand, "npx patchpilot scan");
});

test("does not embed raw HTML from repository metadata", async () => {
  const output = await mkdtemp(path.join(tmpdir(), "repotrailer-xss-"));
  const repoPath = await mkdtemp(path.join(tmpdir(), "repotrailer-repo-"));
  await writeFile(
    path.join(repoPath, "README.md"),
    "# <script>alert(1)</script>\n\nA safe project description long enough to use.",
  );
  const repo = await analyzeRepository(repoPath);
  const kit = await writeLaunchKit(repo, buildStoryboard(repo), output);
  const html = await readFile(kit.files.preview, "utf8");

  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  assert.match(html, /<h1>alert\(1\)<\/h1>/);
});
