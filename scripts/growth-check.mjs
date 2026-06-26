#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const arg = process.argv[index];
  if (arg.startsWith("--")) {
    const [key, inlineValue] = arg.split("=", 2);
    const value = inlineValue ?? process.argv[index + 1];
    args.set(key, value);
    if (inlineValue === undefined) index += 1;
  }
}

const repo = args.get("--repo") ?? "howong217-ui/repotrailer";
const goal = Number(args.get("--goal") ?? 100);
const launchDate = new Date(args.get("--launch-date") ?? "2026-06-24T15:28:23Z");
const launchDays = Number(args.get("--days") ?? 7);
const outputJson = process.argv.includes("--json");

function run(command, commandArgs) {
  try {
    return execFileSync(command, commandArgs, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

function runJson(command, commandArgs) {
  const output = run(command, commandArgs);
  if (!output) return null;
  try {
    return JSON.parse(output);
  } catch {
    return null;
  }
}

function parseRepo(input) {
  const [owner, name] = input.split("/");
  if (!owner || !name) {
    throw new Error(`Expected owner/name repository, received: ${input}`);
  }
  return { owner, name };
}

async function fetchJson(path) {
  const response = await fetch(`https://api.github.com/${path}`, {
    headers: { "User-Agent": "repotrailer-growth-check" },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status} ${path}`);
  }
  return response.json();
}

async function fetchLatestRelease(repository) {
  const release = await fetchJson(`repos/${repository}/releases/latest`);
  if (!release) return null;
  return {
    name: release.name,
    tagName: release.tag_name,
    url: release.html_url,
    body: release.body ?? "",
  };
}

async function getRepoMetrics() {
  const ghMetrics = runJson("gh", [
    "repo",
    "view",
    repo,
    "--json",
    "stargazerCount,forkCount,watchers,issues,latestRelease,url,pushedAt,defaultBranchRef,homepageUrl,repositoryTopics",
  ]);
  if (ghMetrics) {
    if (!ghMetrics.latestRelease) {
      ghMetrics.latestRelease = await fetchLatestRelease(repo).catch(() => null);
    }
    return ghMetrics;
  }

  const data = await fetchJson(`repos/${repo}`);
  if (!data) throw new Error(`Repository not found: ${repo}`);
  return {
    stargazerCount: data.stargazers_count,
    forkCount: data.forks_count,
    watchers: { totalCount: data.subscribers_count ?? data.watchers_count },
    issues: { totalCount: data.open_issues_count },
    latestRelease: await fetchLatestRelease(repo).catch(() => null),
    url: data.html_url,
    homepageUrl: data.homepage,
    repositoryTopics: data.topics ?? [],
    pushedAt: data.pushed_at,
    defaultBranchRef: { name: data.default_branch },
  };
}

async function getPagesQuality(homepageUrl) {
  const pages = runJson("gh", ["api", `repos/${repo}/pages`])
    ?? await fetchJson(`repos/${repo}/pages`).catch(() => null);
  const url = pages?.html_url ?? homepageUrl ?? null;
  if (!url) return null;

  const result = {
    url,
    githubStatus: pages?.status ?? null,
    source: pages?.source ?? null,
    homepageUrl: homepageUrl ?? null,
    httpStatus: null,
    hasStarCallToAction: false,
    status: "missing",
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const output = run("curl", ["-L", "-s", "-w", "\n%{http_code}", url]);
    const splitAt = output.lastIndexOf("\n");
    if (splitAt === -1) continue;

    const html = output.slice(0, splitAt);
    result.httpStatus = Number.parseInt(output.slice(splitAt + 1), 10) || null;
    result.hasStarCallToAction =
      /Star on GitHub|github\.com\/howong217-ui\/repotrailer/i.test(html);
    if (result.httpStatus === 200 && result.hasStarCallToAction) {
      break;
    }
  }
  result.status = result.httpStatus === 200 && result.hasStarCallToAction
    ? "ready"
    : "needs-work";
  return result;
}

async function getReleaseQuality(latestRelease) {
  if (!latestRelease?.tagName) return null;
  let details = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    details = runJson("gh", [
      "release",
      "view",
      latestRelease.tagName,
      "--repo",
      repo,
      "--json",
      "body",
    ]);
    if (details?.body) break;
  }
  const release = details?.body
    ? details
    : await fetchJson(`repos/${repo}/releases/tags/${latestRelease.tagName}`)
      .catch(() => null);
  const body = release?.body ?? latestRelease.body ?? "";
  const bodyCharacters = body.length;
  const hasInstallCommand = /npx|npm|pnpm|yarn|bun/i.test(body);
  const hasExamplesLink = /examples|demo|gallery/i.test(body);
  return {
    bodyCharacters,
    hasInstallCommand,
    hasExamplesLink,
    status: bodyCharacters >= 500 && hasInstallCommand && hasExamplesLink
      ? "ready"
      : "thin",
  };
}

function getLocalState(defaultBranch) {
  if (run("git", ["rev-parse", "--is-inside-work-tree"]) !== "true") {
    return null;
  }
  const branch = run("git", ["branch", "--show-current"]) || null;
  const head = run("git", ["rev-parse", "--short", "HEAD"]) || null;
  const remoteRef = `origin/${defaultBranch || "main"}`;
  const ahead = Number.parseInt(
    run("git", ["rev-list", "--count", `${remoteRef}..HEAD`]),
    10,
  ) || 0;
  const behind = Number.parseInt(
    run("git", ["rev-list", "--count", `HEAD..${remoteRef}`]),
    10,
  ) || 0;
  return {
    branch,
    head,
    remoteRef,
    ahead,
    behind,
    hasUncommittedChanges: run("git", ["status", "--short"]).length > 0,
  };
}

async function getRuns() {
  const ghRuns = runJson("gh", [
    "run",
    "list",
    "--repo",
    repo,
    "--limit",
    "5",
    "--json",
    "workflowName,status,conclusion,headBranch,event,createdAt,databaseId",
  ]);
  if (ghRuns) return ghRuns;

  const runs = await fetchJson(`repos/${repo}/actions/runs?per_page=5`).catch(() => null);
  if (!runs?.workflow_runs) return [];
  return runs.workflow_runs.map((run) => ({
    workflowName: run.name,
    status: run.status,
    conclusion: run.conclusion,
    headBranch: run.head_branch,
    event: run.event,
    createdAt: run.created_at,
    databaseId: run.id,
  }));
}

function round(value) {
  return Math.round(value * 10) / 10;
}

parseRepo(repo);
const metrics = await getRepoMetrics();
const runs = await getRuns();
const releaseQuality = await getReleaseQuality(metrics.latestRelease);
const pagesQuality = await getPagesQuality(metrics.homepageUrl);
const localState = getLocalState(metrics.defaultBranchRef?.name);
const now = new Date();
const elapsedDays = Math.max((now - launchDate) / 86400000, 0);
const remainingDays = Math.max(launchDays - elapsedDays, 0);
const stars = metrics.stargazerCount ?? 0;
const gap = Math.max(goal - stars, 0);
const pace = elapsedDays > 0 ? stars / elapsedDays : 0;
const requiredDaily = remainingDays > 0 ? gap / remainingDays : gap;
const status =
  gap === 0
    ? "done"
    : pace >= requiredDaily
      ? "on-track"
      : stars > 0
        ? "behind"
        : "needs-launch";

const report = {
  repo,
  url: metrics.url,
  generatedAt: now.toISOString(),
  launchDate: launchDate.toISOString(),
  goal,
  launchDays,
  stars,
  forks: metrics.forkCount ?? 0,
  watchers: metrics.watchers?.totalCount ?? 0,
  openIssues: metrics.issues?.totalCount ?? 0,
  gap,
  elapsedDays: round(elapsedDays),
  remainingDays: round(remainingDays),
  starsPerDay: round(pace),
  requiredStarsPerDay: round(requiredDaily),
  status,
  latestRelease: metrics.latestRelease
    ? {
        name: metrics.latestRelease.name,
        tagName: metrics.latestRelease.tagName,
        url: metrics.latestRelease.url,
      }
    : null,
  releaseQuality,
  pagesQuality,
  topics: metrics.repositoryTopics?.map((topic) => topic.name ?? topic) ?? [],
  localState,
  recentRuns: runs.map((run) => ({
    workflow: run.workflowName,
    status: run.status,
    conclusion: run.conclusion,
    branch: run.headBranch,
    event: run.event,
    createdAt: run.createdAt,
    id: run.databaseId,
  })),
};

if (outputJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`# RepoTrailer growth check`);
  console.log("");
  console.log(`Repo: ${report.url}`);
  console.log(`Generated: ${report.generatedAt}`);
  console.log("");
  console.log(`- Stars: ${stars}/${goal} (${gap} to go)`);
  console.log(`- Forks: ${report.forks}`);
  console.log(`- Watchers: ${report.watchers}`);
  console.log(`- Open issues: ${report.openIssues}`);
  console.log(`- Elapsed launch days: ${report.elapsedDays}/${launchDays}`);
  console.log(`- Current pace: ${report.starsPerDay} stars/day`);
  console.log(`- Required pace: ${report.requiredStarsPerDay} stars/day`);
  console.log(`- Status: ${status}`);
  if (report.latestRelease) {
    console.log(`- Latest release: ${report.latestRelease.tagName}`);
    if (report.releaseQuality) {
      console.log(
        `- Release page: ${report.releaseQuality.status} `
          + `(${report.releaseQuality.bodyCharacters} chars)`,
      );
    }
  }
  if (report.localState) {
    console.log(`- Local branch: ${report.localState.branch ?? "detached"} @ ${report.localState.head}`);
    console.log(
      `- Local ahead/behind ${report.localState.remoteRef}: `
        + `${report.localState.ahead}/${report.localState.behind}`,
    );
    console.log(
      `- Uncommitted changes: ${
        report.localState.hasUncommittedChanges ? "yes" : "no"
      }`,
    );
  }
  if (report.pagesQuality) {
    console.log(
      `- Pages: ${report.pagesQuality.status} `
        + `(${report.pagesQuality.httpStatus ?? "no HTTP"})`,
    );
  }
  if (report.recentRuns.length > 0) {
    console.log("");
    console.log("Recent runs:");
    for (const run of report.recentRuns) {
      console.log(`- ${run.workflow}: ${run.status}/${run.conclusion ?? "pending"} (${run.branch})`);
    }
  }
}
