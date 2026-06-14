import assert from "node:assert/strict";
import test from "node:test";

import { __test } from "../src/analyze.js";

test("normalizes GitHub repository inputs", () => {
  assert.equal(
    __test.normalizeGithubSource("openai/openai-node"),
    "https://github.com/openai/openai-node.git",
  );
  assert.equal(
    __test.normalizeGithubSource("https://github.com/openai/openai-node"),
    "https://github.com/openai/openai-node.git",
  );
  assert.equal(__test.normalizeGithubSource("./local"), null);
});

test("extracts source-grounded README metadata", () => {
  const metadata = __test.readmeMetadata(
    `# Bright Tool

Bright Tool removes the boring setup from local demos and keeps every file on
your machine.

## Features

- Creates a working demo in one command
- Never uploads source code
`,
    "fallback",
  );

  assert.equal(metadata.title, "Bright Tool");
  assert.match(metadata.description, /removes the boring setup/);
  assert.deepEqual(metadata.features, [
    "Creates a working demo in one command",
    "Never uploads source code",
  ]);
});

test("reads centered HTML headings used by polished READMEs", () => {
  const metadata = __test.readmeMetadata(
    `<h1 align="center">RepoTrailer</h1>

A sufficiently long description for the generated launch story.
`,
    "fallback",
  );

  assert.equal(metadata.title, "RepoTrailer");
});

test("summarizes source languages by byte weight", () => {
  const languages = __test.summarizeLanguages([
    { extension: ".ts", bytes: 900 },
    { extension: ".css", bytes: 100 },
    { extension: ".png", bytes: 10_000 },
  ]);

  assert.deepEqual(languages, [
    { name: "TypeScript", percent: 90 },
    { name: "CSS", percent: 10 },
  ]);
});
