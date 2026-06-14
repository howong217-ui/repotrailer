import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { writeHyperframesProject } from "./hyperframes.js";
import { escapeHtml, escapeXml, slugify } from "./utils.js";

const DEFAULT_PALETTE = {
  ink: "#0a0b0d",
  paper: "#f5f2e9",
  accent: "#c7ff45",
  hot: "#ff6247",
  muted: "#9aa0aa",
};

function wrapText(value, maxCharacters = 48, maxLines = 3) {
  const words = String(value).trim().split(/\s+/);
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharacters || current.length === 0) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines - 1) {
      break;
    }
  }
  if (current && lines.length < maxLines) {
    const consumed = lines.join(" ").split(/\s+/).filter(Boolean).length;
    const remaining = words.slice(consumed).join(" ");
    lines.push(
      remaining.length > maxCharacters
        ? `${remaining.slice(0, maxCharacters - 1).trimEnd()}…`
        : remaining,
    );
  }
  return lines.slice(0, maxLines);
}

function socialCard(repo, palette) {
  const stack = repo.stack.slice(0, 4);
  const tagline = wrapText(repo.tagline);
  const chips = stack.map((item, index) => {
    const width = Math.max(112, item.length * 12 + 36);
    const x = 72 + stack
      .slice(0, index)
      .reduce((sum, value) => sum + Math.max(112, value.length * 12 + 36) + 14, 0);
    return `
      <g transform="translate(${x} 492)">
        <rect width="${width}" height="42" rx="21" fill="#17191e" stroke="#343842"/>
        <text x="${width / 2}" y="27" text-anchor="middle" fill="${palette.paper}" font-size="17" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">${escapeXml(item)}</text>
      </g>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(repo.title)}">
  <rect width="1200" height="630" fill="${palette.ink}"/>
  <circle cx="1075" cy="92" r="190" fill="${palette.hot}" opacity=".92"/>
  <circle cx="1030" cy="130" r="118" fill="${palette.accent}"/>
  <path d="M0 574L1200 424V630H0Z" fill="#111319"/>
  <text x="72" y="86" fill="${palette.accent}" font-size="18" font-weight="800" letter-spacing="5" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">REPOTRAILER / OPEN SOURCE</text>
  <text x="72" y="235" fill="${palette.paper}" font-size="84" font-weight="900" font-family="Inter, ui-sans-serif, system-ui, sans-serif">${escapeXml(repo.title)}</text>
  ${tagline.map((line, index) => `<text x="72" y="${306 + index * 40}" fill="${palette.muted}" font-size="31" font-weight="500" font-family="Inter, ui-sans-serif, system-ui, sans-serif">${escapeXml(line)}</text>`).join("")}
  ${chips}
  <text x="72" y="590" fill="${palette.paper}" font-size="18" font-weight="700" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">README → TRAILER → LAUNCH</text>
  <text x="1128" y="590" text-anchor="end" fill="${palette.muted}" font-size="18" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">${repo.files.source} SOURCE FILES</text>
</svg>`;
}

function sceneMarkup(scene) {
  const metrics = scene.metrics
    ? `<div class="metrics">${scene.metrics.map((metric) => `
        <div><strong>${escapeHtml(metric.value)}</strong><span>${escapeHtml(metric.label)}</span></div>`).join("")}</div>`
    : "";
  return `<article class="scene scene-${escapeHtml(scene.kind)}" id="${escapeHtml(scene.id)}">
    <div class="scene-number">${String(scene.start).padStart(4, "0")}s</div>
    <p class="eyebrow">${escapeHtml(scene.eyebrow)}</p>
    <h2>${escapeHtml(scene.title)}</h2>
    <p class="body">${escapeHtml(scene.body)}</p>
    ${metrics}
    <div class="duration">${scene.duration.toFixed(1)} sec</div>
  </article>`;
}

function previewHtml(repo, scenes, palette) {
  const payload = JSON.stringify({ repo, scenes }).replaceAll("<", "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(repo.title)} · RepoTrailer</title>
  <style>
    :root { --ink:${palette.ink}; --paper:${palette.paper}; --accent:${palette.accent}; --hot:${palette.hot}; --muted:${palette.muted}; }
    * { box-sizing:border-box; }
    body { margin:0; color:var(--paper); background:var(--ink); font-family:Inter,ui-sans-serif,system-ui,sans-serif; }
    header { min-height:78vh; padding:9vw 7vw 7vw; display:flex; flex-direction:column; justify-content:flex-end; overflow:hidden; position:relative; border-bottom:1px solid #282b32; }
    header::after { content:""; width:38vw; height:38vw; border-radius:50%; background:var(--accent); position:absolute; right:-8vw; top:-14vw; box-shadow:-7vw 7vw 0 var(--hot); }
    .kicker,.eyebrow,.scene-number,.duration { font:800 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.18em; text-transform:uppercase; }
    .kicker { color:var(--accent); position:relative; z-index:1; }
    h1 { font-size:clamp(64px,12vw,164px); line-height:.82; letter-spacing:-.075em; margin:28px 0; max-width:900px; position:relative; z-index:1; }
    header p { max-width:780px; color:var(--muted); font-size:clamp(22px,3vw,38px); margin:0; position:relative; z-index:1; }
    main { padding:7vw; display:grid; gap:28px; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); }
    .scene { min-height:420px; border:1px solid #2a2d34; padding:36px; display:flex; flex-direction:column; position:relative; background:#111319; overflow:hidden; }
    .scene::before { content:""; position:absolute; width:180px; height:180px; border-radius:50%; right:-80px; top:-80px; background:var(--accent); opacity:.13; }
    .scene-number { color:var(--muted); margin-bottom:auto; }
    .eyebrow { color:var(--accent); margin:48px 0 18px; }
    h2 { font-size:clamp(38px,5vw,70px); line-height:.94; letter-spacing:-.045em; margin:0; overflow-wrap:anywhere; }
    .body { color:var(--muted); font-size:20px; line-height:1.5; max-width:640px; }
    .duration { color:var(--hot); margin-top:auto; padding-top:28px; }
    .metrics { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:20px; }
    .metrics div { border-top:1px solid #343842; padding-top:14px; }
    .metrics strong { font-size:34px; display:block; }
    .metrics span { color:var(--muted); text-transform:uppercase; font-size:11px; letter-spacing:.1em; }
    footer { padding:36px 7vw 72px; color:var(--muted); border-top:1px solid #282b32; }
    @media (max-width:700px) { header { min-height:70vh; } main { padding:24px; } .scene { min-height:360px; } }
  </style>
</head>
<body>
  <header>
    <div class="kicker">RepoTrailer · generated launch kit</div>
    <h1>${escapeHtml(repo.title)}</h1>
    <p>${escapeHtml(repo.tagline)}</p>
  </header>
  <main>${scenes.map(sceneMarkup).join("")}</main>
  <footer>Generated locally from real repository metadata. No API key. No invented metrics.</footer>
  <script type="application/json" id="repotrailer-data">${payload}</script>
</body>
</html>`;
}

function launchCopy(repo) {
  const features = repo.features.slice(0, 3).map((item) => `- ${item}`).join("\n");
  const stack = repo.stack.join(", ") || repo.languages.map((item) => item.name).join(", ");
  const url = repo.git.remote || repo.source;
  return `# Launch copy for ${repo.title}

## Short post

I just shipped **${repo.title}**: ${repo.tagline}

${repo.installCommand}

${url}

## Show HN

**Title:** Show HN: ${repo.title} – ${repo.tagline}

I built ${repo.title} because a README often explains a project but does not make people feel it.

What it does:

${features}

The project uses ${stack || "a small local-first toolchain"}. Feedback on the first-run experience and generated assets would be especially useful.

${url}

## README hero

\`\`\`markdown
![${repo.title} social card](./social-card.svg)
\`\`\`

## Suggested topics

\`github\` \`open-source\` \`developer-tools\` \`video\` \`hyperframes\` \`cli\`
`;
}

export async function writeLaunchKit(repo, scenes, outputDirectory, options = {}) {
  const palette = { ...DEFAULT_PALETTE, ...options.palette };
  const output = path.resolve(outputDirectory);
  await mkdir(output, { recursive: true });

  const files = {
    manifest: path.join(output, "repotrailer.json"),
    preview: path.join(output, "index.html"),
    socialCard: path.join(output, "social-card.svg"),
    launchCopy: path.join(output, "launch-copy.md"),
    trailer: path.join(output, "trailer.mp4"),
  };

  await Promise.all([
    writeFile(
      files.manifest,
      `${JSON.stringify({ repo, scenes, palette }, null, 2)}\n`,
    ),
    writeFile(files.preview, previewHtml(repo, scenes, palette)),
    writeFile(files.socialCard, socialCard(repo, palette)),
    writeFile(files.launchCopy, launchCopy(repo)),
  ]);
  const hyperframes = await writeHyperframesProject(
    repo,
    scenes,
    output,
    palette,
  );

  return {
    output,
    slug: slugify(repo.name),
    files,
    hyperframes,
  };
}

export const __test = {
  socialCard,
  previewHtml,
  launchCopy,
  wrapText,
};
