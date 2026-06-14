import { mkdtemp, readFile, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { run, stripMarkdown, truncate } from "./utils.js";

const SKIP_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  ".venv",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "target",
  "vendor",
]);

const LANGUAGE_BY_EXTENSION = new Map([
  [".c", "C"],
  [".cc", "C++"],
  [".cpp", "C++"],
  [".cs", "C#"],
  [".css", "CSS"],
  [".dart", "Dart"],
  [".ex", "Elixir"],
  [".exs", "Elixir"],
  [".go", "Go"],
  [".html", "HTML"],
  [".java", "Java"],
  [".js", "JavaScript"],
  [".jsx", "JavaScript"],
  [".kt", "Kotlin"],
  [".lua", "Lua"],
  [".m", "Objective-C"],
  [".php", "PHP"],
  [".py", "Python"],
  [".rb", "Ruby"],
  [".rs", "Rust"],
  [".scala", "Scala"],
  [".sh", "Shell"],
  [".sol", "Solidity"],
  [".swift", "Swift"],
  [".ts", "TypeScript"],
  [".tsx", "TypeScript"],
  [".vue", "Vue"],
]);

const STACK_SIGNALS = [
  ["next", "Next.js"],
  ["react", "React"],
  ["vue", "Vue"],
  ["svelte", "Svelte"],
  ["astro", "Astro"],
  ["vite", "Vite"],
  ["express", "Express"],
  ["fastify", "Fastify"],
  ["tailwindcss", "Tailwind CSS"],
  ["remotion", "Remotion"],
  ["hyperframes", "HyperFrames"],
  ["playwright", "Playwright"],
  ["vitest", "Vitest"],
  ["jest", "Jest"],
];

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

function normalizeGithubSource(source) {
  if (
    !source.startsWith(".")
    && !source.startsWith("/")
    && /^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/.test(source)
  ) {
    return `https://github.com/${source}.git`;
  }
  if (/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(source)) {
    return `${source.replace(/\/$/, "")}.git`;
  }
  if (/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\.git$/.test(source)) {
    return source;
  }
  return null;
}

async function resolveRepository(source) {
  const localPath = path.resolve(source);
  if (await exists(localPath)) {
    return {
      root: localPath,
      source,
      temporary: false,
      nameHint: path.basename(localPath),
    };
  }

  const githubUrl = normalizeGithubSource(source);
  if (!githubUrl) {
    return {
      root: localPath,
      source,
      temporary: false,
      nameHint: path.basename(localPath),
    };
  }

  const root = await mkdtemp(path.join(tmpdir(), "repotrailer-"));
  const repositoryName = githubUrl
    .replace(/\.git$/, "")
    .split("/")
    .filter(Boolean)
    .at(-1);
  const clone = await run(
    "git",
    ["clone", "--depth", "50", "--quiet", githubUrl, root],
    { timeout: 120_000 },
  );
  if (!clone.ok) {
    throw new Error(`could not clone ${source}: ${clone.stderr}`);
  }
  return {
    root,
    source: githubUrl.replace(/\.git$/, ""),
    temporary: true,
    nameHint: repositoryName || path.basename(root),
  };
}

async function findReadme(root) {
  const entries = await readdir(root);
  const candidate = entries.find((entry) => /^readme(?:\.[^.]+)?$/i.test(entry));
  if (!candidate) {
    return { path: null, content: "" };
  }
  const readmePath = path.join(root, candidate);
  return {
    path: candidate,
    content: await readFile(readmePath, "utf8"),
  };
}

function readmeMetadata(markdown, fallbackName) {
  const lines = markdown.split(/\r?\n/);
  const heading = lines
    .map((line) => (
      line.match(/^#\s+(.+)$/)?.[1]
      || line.match(/^<h1\b[^>]*>(.*?)<\/h1>$/i)?.[1]
    ))
    .find(Boolean);

  const paragraphs = markdown
    .replace(/```[\s\S]*?```/g, "")
    .split(/\n\s*\n/)
    .map(stripMarkdown)
    .filter((value) => value.length >= 24)
    .filter((value) => !/^(build|install|usage|features|license)\b/i.test(value));

  const bullets = lines
    .map((line) => line.match(/^\s*[-*]\s+(.+)$/)?.[1])
    .filter(Boolean)
    .map(stripMarkdown)
    .filter((value) => value.length >= 8 && value.length <= 140);

  return {
    title: truncate(heading ? stripMarkdown(heading) : fallbackName, 64),
    description: truncate(
      paragraphs[0] || `A project called ${fallbackName}.`,
      180,
    ),
    features: [...new Set(bullets)].slice(0, 4),
  };
}

async function walkFiles(root, current = root, result = []) {
  const entries = await readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".github") {
      continue;
    }
    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(root, fullPath, result);
      continue;
    }
    if (entry.isFile()) {
      const info = await stat(fullPath);
      result.push({
        path: path.relative(root, fullPath).split(path.sep).join("/"),
        bytes: info.size,
        extension: path.extname(entry.name).toLowerCase(),
      });
    }
  }
  return result;
}

function summarizeLanguages(files) {
  const totals = new Map();
  for (const file of files) {
    const language = LANGUAGE_BY_EXTENSION.get(file.extension);
    if (!language) {
      continue;
    }
    totals.set(language, (totals.get(language) || 0) + file.bytes);
  }
  const sum = [...totals.values()].reduce((total, value) => total + value, 0);
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, bytes]) => ({
      name,
      percent: sum === 0 ? 0 : Math.max(1, Math.round((bytes / sum) * 100)),
    }));
}

async function packageMetadata(root) {
  const packagePath = path.join(root, "package.json");
  if (!(await exists(packagePath))) {
    return { package: null, stack: [], install: null };
  }

  try {
    const pkg = JSON.parse(await readFile(packagePath, "utf8"));
    const dependencies = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };
    const stack = STACK_SIGNALS
      .filter(([dependency]) => dependency in dependencies)
      .map(([, label]) => label)
      .slice(0, 6);
    const install = (await exists(path.join(root, "pnpm-lock.yaml")))
      ? "pnpm install"
      : (await exists(path.join(root, "yarn.lock")))
        ? "yarn"
        : (await exists(path.join(root, "bun.lock")))
          ? "bun install"
          : "npm install";

    return { package: pkg, stack, install };
  } catch {
    return { package: null, stack: [], install: null };
  }
}

async function detectStack(root, files, packageInfo) {
  const stack = [...packageInfo.stack];
  const names = new Set(files.map((file) => file.path.toLowerCase()));
  const add = (condition, value) => {
    if (condition && !stack.includes(value)) {
      stack.push(value);
    }
  };

  add(names.has("pyproject.toml") || names.has("requirements.txt"), "Python");
  add(names.has("cargo.toml"), "Rust");
  add(names.has("go.mod"), "Go");
  add(names.has("dockerfile"), "Docker");
  add(names.has("compose.yml") || names.has("docker-compose.yml"), "Compose");
  add(names.has(".github/workflows/ci.yml"), "GitHub Actions");

  if (stack.length === 0) {
    stack.push(...summarizeLanguages(files).map((item) => item.name));
  }
  return stack.slice(0, 6);
}

async function gitMetadata(root) {
  const branch = await run("git", ["branch", "--show-current"], { cwd: root });
  if (!branch.ok) {
    return {
      isGit: false,
      branch: null,
      commits: 0,
      contributors: 0,
      latest: [],
      remote: null,
    };
  }

  const [commitCount, contributors, latest, remote] = await Promise.all([
    run("git", ["rev-list", "--count", "HEAD"], { cwd: root }),
    run("git", ["shortlog", "-sne", "HEAD"], { cwd: root }),
    run("git", ["log", "-5", "--pretty=format:%h%x09%s"], { cwd: root }),
    run("git", ["remote", "get-url", "origin"], { cwd: root }),
  ]);

  return {
    isGit: true,
    branch: branch.stdout || "main",
    commits: Number.parseInt(commitCount.stdout, 10) || 0,
    contributors: contributors.stdout
      ? contributors.stdout.split(/\r?\n/).filter(Boolean).length
      : 0,
    latest: latest.stdout
      ? latest.stdout.split(/\r?\n/).map((line) => {
          const [hash, ...subject] = line.split("\t");
          return { hash, subject: subject.join("\t") };
        })
      : [],
    remote: remote.ok ? remote.stdout.replace(/\.git$/, "") : null,
  };
}

function suggestedCommand(root, packageInfo, files) {
  const names = new Set(files.map((file) => file.path.toLowerCase()));
  if (packageInfo.package?.bin) {
    const bin = typeof packageInfo.package.bin === "string"
      ? packageInfo.package.name
      : Object.keys(packageInfo.package.bin)[0];
    if (bin) {
      return `npx ${bin}`;
    }
  }
  if (packageInfo.package) {
    return `${packageInfo.install || "npm install"} && npm run dev`;
  }
  if (names.has("pyproject.toml")) {
    return "pip install -e .";
  }
  if (names.has("cargo.toml")) {
    return "cargo run";
  }
  if (names.has("go.mod")) {
    return "go run .";
  }
  return `git clone ${path.basename(root)}`;
}

export async function analyzeRepository(source = ".", overrides = {}) {
  const repository = await resolveRepository(source);
  if (!(await exists(repository.root))) {
    throw new Error(`repository path does not exist: ${repository.root}`);
  }

  const fallbackName = repository.nameHint || path.basename(repository.root);
  const [readme, files, git, packageInfo] = await Promise.all([
    findReadme(repository.root),
    walkFiles(repository.root),
    gitMetadata(repository.root),
    packageMetadata(repository.root),
  ]);
  const readmeInfo = readmeMetadata(readme.content, fallbackName);
  const languages = summarizeLanguages(files);
  const stack = await detectStack(repository.root, files, packageInfo);

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: repository.source,
    root: repository.root,
    temporary: repository.temporary,
    name: overrides.title || packageInfo.package?.name || readmeInfo.title,
    title: overrides.title || readmeInfo.title,
    tagline: overrides.tagline || packageInfo.package?.description || readmeInfo.description,
    description: readmeInfo.description,
    features: readmeInfo.features.length
      ? readmeInfo.features
      : [
          "Built from real repository metadata",
          "Ready to share in minutes",
          "Runs locally with no API key",
        ],
    stack,
    languages,
    installCommand: overrides.install || suggestedCommand(
      repository.root,
      packageInfo,
      files,
    ),
    files: {
      total: files.length,
      source: files.filter((file) => LANGUAGE_BY_EXTENSION.has(file.extension)).length,
    },
    readme: {
      path: readme.path,
      characters: readme.content.length,
    },
    git,
  };
}

export const __test = {
  normalizeGithubSource,
  readmeMetadata,
  summarizeLanguages,
};
