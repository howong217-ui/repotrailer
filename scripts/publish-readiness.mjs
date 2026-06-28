#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const requiredFiles = new Set([
  "bin/repotrailer.js",
  "src/cli.js",
  "src/index.js",
  "README.md",
  "LICENSE",
  "llms.txt",
  ".codex-plugin/plugin.json",
  "action.yml",
]);

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: options.timeoutMs ?? 60000,
  }).trim();
}

function tryRun(command, args, options) {
  try {
    return { ok: true, stdout: run(command, args, options), stderr: "" };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout?.trim?.() ?? "",
      stderr: error.stderr?.trim?.() ?? error.message,
    };
  }
}

function classifyRegistryResult(result) {
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.ok) {
    return { status: "exists", output };
  }
  if (/E404|404 Not Found|not found/i.test(output)) {
    return { status: "available", output };
  }
  if (/ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|network|proxy|socket hang up/i.test(output)) {
    return { status: "unknown", output };
  }
  return { status: "unknown", output };
}

function fail(message) {
  console.error(`publish readiness failed: ${message}`);
  process.exitCode = 1;
}

function readJson(command, args) {
  return JSON.parse(run(command, args));
}

const packageInfo = readJson("node", [
  "-e",
  "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync('package.json', 'utf8'))))",
]);

if (packageInfo.name !== "repotrailer") {
  fail(`package name must be repotrailer, received ${packageInfo.name}`);
}
if (!packageInfo.bin?.repotrailer) {
  fail("package must expose the repotrailer bin");
}
if (!packageInfo.homepage?.includes("howong217-ui.github.io/repotrailer")) {
  fail("package homepage must point to the GitHub Pages landing page");
}

const pack = readJson("npm", ["pack", "--dry-run", "--json"])[0];
const packedFiles = new Set(pack.files.map((file) => file.path));
for (const file of requiredFiles) {
  if (!packedFiles.has(file)) {
    fail(`npm tarball is missing ${file}`);
  }
}

const registry = tryRun("npm", ["view", packageInfo.name, "name", "--json"], {
  timeoutMs: 30000,
});
const registryStatus = classifyRegistryResult(registry);
const nameAvailable = registryStatus.status === "available";
if (registryStatus.status === "exists") {
  fail(`npm package name appears to exist: ${packageInfo.name}`);
} else if (!nameAvailable) {
  fail(`could not verify npm package availability due to registry error: ${registryStatus.output.split("\n").find(Boolean) ?? "unknown error"}`);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log(JSON.stringify({
  package: `${packageInfo.name}@${packageInfo.version}`,
  nameAvailable,
  packedFiles: pack.entryCount,
  unpackedSize: pack.unpackedSize,
  status: "ready",
}, null, 2));
