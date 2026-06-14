import path from "node:path";

import { analyzeRepository } from "./analyze.js";
import { renderHyperframesProject } from "./hyperframes.js";
import { writeLaunchKit } from "./launch-kit.js";
import { buildStoryboard } from "./storyboard.js";

const HELP = `
RepoTrailer
Turn a GitHub repository into a launch trailer and share kit.

Usage:
  repotrailer [path | owner/repo | GitHub URL] [options]

Options:
  -o, --out <directory>   Output directory (default: ./repotrailer-out)
      --title <text>      Override the detected project title
      --tagline <text>    Override the detected tagline
      --install <command> Override the detected install command
      --accent <hex>      Accent color for generated assets
      --quality <level>   Video quality: draft, standard, high
      --workers <number>  Render workers (default: 1)
      --no-video          Generate preview assets without rendering MP4
      --json              Print the manifest JSON path only
  -h, --help              Show help
  -v, --version           Show version

Examples:
  repotrailer .
  repotrailer openai/openai-agents-js
  repotrailer https://github.com/owner/repo --out ./launch
`;

function parseArgs(argv) {
  const options = {
    source: ".",
    output: "repotrailer-out",
    video: true,
    json: false,
    overrides: {},
    palette: {},
    quality: "standard",
    workers: 1,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("-")) {
      options.source = argument;
      continue;
    }
    if (argument === "--no-video") {
      options.video = false;
      continue;
    }
    if (argument === "--json") {
      options.json = true;
      continue;
    }
    if (argument === "-h" || argument === "--help") {
      options.help = true;
      continue;
    }
    if (argument === "-v" || argument === "--version") {
      options.version = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith("-")) {
      throw new Error(`missing value for ${argument}`);
    }
    index += 1;
    if (argument === "-o" || argument === "--out") {
      options.output = value;
    } else if (argument === "--title") {
      options.overrides.title = value;
    } else if (argument === "--tagline") {
      options.overrides.tagline = value;
    } else if (argument === "--install") {
      options.overrides.install = value;
    } else if (argument === "--accent") {
      options.palette.accent = value;
    } else if (argument === "--quality") {
      if (!["draft", "standard", "high"].includes(value)) {
        throw new Error("--quality must be draft, standard, or high");
      }
      options.quality = value;
    } else if (argument === "--workers") {
      options.workers = Number.parseInt(value, 10);
      if (!Number.isInteger(options.workers) || options.workers < 1 || options.workers > 8) {
        throw new Error("--workers must be an integer from 1 to 8");
      }
    } else {
      throw new Error(`unknown option: ${argument}`);
    }
  }

  return options;
}

async function version() {
  const packageJson = new URL("../package.json", import.meta.url);
  const data = await import(packageJson, { with: { type: "json" } });
  return data.default.version;
}

export async function runCli(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(HELP.trim());
    return;
  }
  if (options.version) {
    console.log(await version());
    return;
  }

  const repo = await analyzeRepository(options.source, options.overrides);
  const scenes = buildStoryboard(repo);
  const kit = await writeLaunchKit(
    repo,
    scenes,
    path.resolve(options.output),
    { palette: options.palette },
  );

  if (options.video) {
    await renderHyperframesProject(
      kit.hyperframes.project,
      kit.files.trailer,
      {
        quality: options.quality,
        workers: options.workers,
      },
    );
  }

  if (options.json) {
    console.log(kit.files.manifest);
    return;
  }

  console.log(`\nRepoTrailer built ${repo.title}`);
  console.log(`  Preview     ${kit.files.preview}`);
  console.log(`  Social card ${kit.files.socialCard}`);
  console.log(`  Launch copy ${kit.files.launchCopy}`);
  console.log(`  Manifest    ${kit.files.manifest}\n`);
  console.log(`  HyperFrames ${kit.hyperframes.project}`);
  if (options.video) {
    console.log(`  Trailer     ${kit.files.trailer}`);
  }
  console.log("");
}

export const __test = { parseArgs };
