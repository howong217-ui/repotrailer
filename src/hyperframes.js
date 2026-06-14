import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { escapeHtml, run } from "./utils.js";

function titleClass(value) {
  const length = String(value).length;
  if (length > 54) {
    return "title-long";
  }
  if (length > 32) {
    return "title-medium";
  }
  return "title-short";
}

function sceneBody(scene, index) {
  const metrics = scene.metrics
    ? `<div class="metrics entrance entrance-metrics">
        ${scene.metrics.map((metric) => `<div class="metric">
          <strong>${escapeHtml(metric.value)}</strong>
          <span>${escapeHtml(metric.label)}</span>
        </div>`).join("")}
      </div>`
    : "";

  const terminal = scene.kind === "install"
    ? `<div class="terminal entrance entrance-terminal">
        <span class="prompt">$</span>
        <code>${escapeHtml(scene.title)}</code>
        <span class="cursor"></span>
      </div>`
    : "";

  const title = scene.kind === "install"
    ? "One command."
    : escapeHtml(scene.title);

  return `<section
    class="hf-scene scene-${escapeHtml(scene.kind)}"
    id="scene-${index}"
    data-scene-index="${index}"
    data-layout-allow-overflow
  >
    <div class="grid" data-layout-ignore></div>
    <div class="orb orb-hot entrance entrance-orb" data-layout-allow-overflow></div>
    <div class="orb orb-accent entrance entrance-orb" data-layout-allow-overflow></div>
    <div class="index-mark entrance entrance-index">${String(index + 1).padStart(2, "0")}</div>
    <div class="scene-content">
      <p class="eyebrow entrance entrance-eyebrow">${escapeHtml(scene.eyebrow)}</p>
      <h2 class="headline ${titleClass(title)} entrance entrance-title">${title}</h2>
      ${terminal}
      <p class="copy entrance entrance-copy">${escapeHtml(scene.body)}</p>
      ${metrics}
    </div>
    <div class="rail entrance entrance-rail">
      <span>REPOTRAILER</span>
      <span>${String(scene.start).padStart(4, "0")}S</span>
    </div>
  </section>`;
}

function animationScript(scenes) {
  const entrances = scenes.map((scene, index) => {
    const root = `#scene-${index}`;
    const direction = index % 2 ? -1 : 1;
    const ambientStart = Number((scene.start + 0.84).toFixed(2));
    const repeats = Math.max(0, Math.ceil(scene.duration / 1.8) - 2);
    const terminalEntrance = scene.kind === "install"
      ? `
      tl.from("${root} .entrance-terminal", {
        x: -90, scale: .96, opacity: 0, duration: .5, ease: "back.out(1.7)"
      }, ${Number((scene.start + 0.3).toFixed(2))});`
      : "";
    const metricsEntrance = scene.metrics
      ? `
      tl.from("${root} .entrance-metrics .metric", {
        y: 54, opacity: 0, duration: .4, stagger: .09, ease: "back.out(1.5)"
      }, ${Number((scene.start + 0.34).toFixed(2))});`
      : "";

    return `      tl.from("${root} .entrance-eyebrow", {
        y: 46, opacity: 0, duration: .46, ease: "expo.out"
      }, ${Number((scene.start + 0.08).toFixed(2))});
      tl.from("${root} .entrance-title", {
        y: 78, rotation: ${index % 2 ? 1.8 : -1.4}, opacity: 0,
        duration: .58, ease: "power4.out"
      }, ${Number((scene.start + 0.16).toFixed(2))});${terminalEntrance}
      tl.from("${root} .entrance-copy", {
        x: ${52 * direction}, opacity: 0, duration: .44, ease: "power3.out"
      }, ${Number((scene.start + 0.36).toFixed(2))});${metricsEntrance}
      tl.from("${root} .entrance-index", {
        scale: .72, rotation: -5, opacity: 0, duration: .62, ease: "expo.out"
      }, ${Number((scene.start + 0.12).toFixed(2))});
      tl.from("${root} .entrance-rail", {
        y: -42, opacity: 0, duration: .38, ease: "power2.out"
      }, ${Number((scene.start + 0.48).toFixed(2))});
      tl.from("${root} .entrance-orb", {
        scale: .64, opacity: 0, duration: .72, stagger: .07, ease: "circ.out"
      }, ${Number((scene.start + 0.04).toFixed(2))});
      tl.to("${root} .orb-accent", {
        scale: 1.035, x: ${16 * direction}, duration: .9,
        repeat: ${repeats}, yoyo: true, ease: "sine.inOut"
      }, ${ambientStart});`;
  });

  const transitions = scenes.slice(1).map((scene, offset) => {
    const index = offset + 1;
    const previous = index - 1;
    const transitionStart = Number((scene.start - 0.34).toFixed(2));
    const direction = index % 2 === 0 ? 1 : -1;
    const flash = scene.kind === "proof"
      ? `
      tl.fromTo(".transition-flash", {
        opacity: 0
      }, {
        opacity: .82,
        duration: .11,
        ease: "expo.in",
        immediateRender: false
      }, ${transitionStart});
      tl.to(".transition-flash", {
        opacity: 0,
        duration: .17,
        ease: "expo.out"
      }, ${Number((transitionStart + 0.12).toFixed(2))});`
      : "";

    return `      tl.to("#scene-${previous}", {
        xPercent: ${-100 * direction},
        opacity: 0,
        duration: .34,
        ease: "power4.inOut"
      }, ${transitionStart});
      tl.fromTo("#scene-${index}", {
        xPercent: ${100 * direction},
        opacity: 1
      }, {
        xPercent: 0,
        opacity: 1,
        duration: .34,
        ease: "power4.inOut",
        immediateRender: false
      }, ${transitionStart});${flash}`;
  });

  const last = scenes.length - 1;
  const finalStart = Number(
    (scenes[last].start + scenes[last].duration - 0.68).toFixed(2),
  );

  return `${transitions.join("\n\n")}

${entrances.join("\n\n")}

      tl.to("#scene-${last} .entrance", {
        y: -18,
        opacity: 0,
        duration: .48,
        stagger: .025,
        ease: "power2.in"
      }, ${finalStart});`;
}

function compositionHtml(repo, scenes, palette) {
  const duration = Number(
    (scenes.at(-1).start + scenes.at(-1).duration).toFixed(2),
  );
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(repo.title)} · RepoTrailer</title>
  <script src="./gsap.min.js"></script>
  <style>
    html, body {
      margin: 0;
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      background-color: ${palette.ink};
      color: ${palette.paper};
      font-family: Inter, "Helvetica Neue", Arial, sans-serif;
    }
    * { box-sizing: border-box; }
    #repotrailer {
      position: relative;
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      background-color: ${palette.ink};
    }
    .hf-scene {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: ${palette.ink};
      opacity: 0;
      will-change: transform;
    }
    .hf-scene:first-child { opacity: 1; }
    .grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(199, 255, 69, .055) 1px, rgba(199, 255, 69, 0) 1px),
        linear-gradient(90deg, rgba(199, 255, 69, .055) 1px, rgba(199, 255, 69, 0) 1px);
      background-size: 120px 120px;
    }
    .grid::after {
      content: "";
      position: absolute;
      inset: 0;
      background-image: repeating-linear-gradient(
        0deg,
        rgba(245, 242, 233, .025) 0,
        rgba(245, 242, 233, .025) 1px,
        rgba(245, 242, 233, 0) 1px,
        rgba(245, 242, 233, 0) 7px
      );
    }
    .scene-content {
      position: relative;
      z-index: 4;
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      height: 100%;
      padding: 120px 150px 150px;
      gap: 28px;
    }
    .eyebrow {
      margin: 0;
      color: ${palette.accent};
      font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
      font-size: 25px;
      font-weight: 800;
      letter-spacing: .22em;
      text-transform: uppercase;
    }
    .headline {
      max-width: 1480px;
      margin: 0;
      color: ${palette.paper};
      font-weight: 900;
      letter-spacing: -.065em;
      line-height: .88;
      text-wrap: balance;
    }
    .title-short { font-size: 168px; }
    .title-medium { font-size: 126px; }
    .title-long { font-size: 94px; line-height: .96; }
    .copy {
      max-width: 1120px;
      margin: 4px 0 0;
      color: ${palette.muted};
      font-size: 39px;
      font-weight: 450;
      line-height: 1.3;
      text-wrap: balance;
    }
    .orb {
      position: absolute;
      z-index: 2;
      border-radius: 999px;
      will-change: transform, opacity;
    }
    .orb-hot {
      top: -340px;
      right: -210px;
      width: 780px;
      height: 780px;
      background-color: ${palette.hot};
    }
    .orb-accent {
      top: -230px;
      right: -100px;
      width: 500px;
      height: 500px;
      background-color: ${palette.accent};
    }
    .index-mark {
      position: absolute;
      z-index: 3;
      right: 110px;
      bottom: 58px;
      color: rgba(245, 242, 233, .08);
      font-size: 280px;
      font-weight: 900;
      letter-spacing: -.08em;
    }
    .rail {
      position: absolute;
      z-index: 5;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: space-between;
      padding: 28px 150px 34px;
      border-top: 2px solid rgba(245, 242, 233, .18);
      color: ${palette.paper};
      font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: .16em;
    }
    .metrics {
      display: flex;
      gap: 34px;
      width: min(1240px, 100%);
      margin-top: 18px;
    }
    .metric {
      display: flex;
      flex-direction: column;
      min-width: 260px;
      padding: 26px 30px 28px;
      border: 2px solid rgba(245, 242, 233, .2);
      background-color: rgba(17, 19, 25, .9);
    }
    .metric strong {
      color: ${palette.accent};
      font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
      font-size: 86px;
      font-variant-numeric: tabular-nums;
      line-height: .95;
    }
    .metric span {
      margin-top: 14px;
      color: ${palette.muted};
      font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: .14em;
      text-transform: uppercase;
    }
    .terminal {
      display: flex;
      align-items: center;
      width: min(1500px, 100%);
      min-height: 138px;
      padding: 0 42px;
      border: 3px solid ${palette.accent};
      background-color: #111319;
      box-shadow: 18px 18px 0 ${palette.hot};
      font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
      font-size: 47px;
      overflow: hidden;
    }
    .terminal .prompt { color: ${palette.hot}; margin-right: 24px; }
    .terminal code {
      color: ${palette.paper};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cursor {
      flex: 0 0 auto;
      width: 24px;
      height: 58px;
      margin-left: 16px;
      background-color: ${palette.accent};
    }
    .scene-feature:nth-of-type(even) .scene-content {
      align-items: flex-end;
      text-align: right;
    }
    .scene-feature:nth-of-type(even) .eyebrow,
    .scene-feature:nth-of-type(even) .headline,
    .scene-feature:nth-of-type(even) .copy {
      max-width: 1320px;
    }
    .scene-feature:nth-of-type(even) .orb-hot {
      right: auto;
      left: -260px;
      top: 650px;
    }
    .scene-feature:nth-of-type(even) .orb-accent {
      right: auto;
      left: -40px;
      top: 740px;
    }
    .scene-proof .headline { max-width: 1560px; }
    .scene-proof .orb-hot { top: -180px; right: -120px; }
    .scene-proof .orb-accent { top: -80px; right: 60px; }
    .scene-outro .scene-content { align-items: center; text-align: center; }
    .scene-outro .headline { font-size: 188px; }
    .scene-outro .copy { font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 28px; }
    .transition-flash {
      position: absolute;
      z-index: 20;
      inset: 0;
      pointer-events: none;
      background-color: ${palette.hot};
      opacity: 0;
    }
  </style>
</head>
<body>
  <main
    id="repotrailer"
    data-composition-id="repotrailer"
    data-width="1920"
    data-height="1080"
    data-start="0"
    data-duration="${duration}"
  >
    ${scenes.map(sceneBody).join("")}
    <div class="transition-flash" data-layout-ignore></div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
${animationScript(scenes)}

      window.__timelines["repotrailer"] = tl;
    </script>
  </main>
</body>
</html>`;
}

function designMarkdown(palette) {
  return `# RepoTrailer Visual Identity

## Style Prompt

Swiss Pulse precision with Maximalist Type launch energy. Grid-locked developer
tool graphics on a near-black canvas, oversized heavy typography, and one toxic
lime accent balanced by a coral transition hit. Motion is fast, directional,
and decisive: elements snap into place with no floating or decorative softness.

## Colors

- Canvas: \`${palette.ink}\`
- Primary text: \`${palette.paper}\`
- Accent: \`${palette.accent}\`
- Transition hit: \`${palette.hot}\`
- Secondary text: \`${palette.muted}\`

## Typography

- Headlines: Inter Black, 900
- Labels and commands: Menlo / system monospace

## Motion

- Primary transition: 0.34-second push slide with \`power4.inOut\`
- Entrance signature: \`expo.out\`, \`power4.out\`, and restrained back easing
- Proof scene accent: one coral overexposure flash
- Final scene: simple fade to black

## What NOT to Do

- No gradients or gradient text
- No blue-purple AI palette
- No generic equal-sized card grid
- No floating glassmorphism
- No invented metrics or decorative charts
`;
}

export async function writeHyperframesProject(
  repo,
  scenes,
  outputDirectory,
  palette,
) {
  const project = path.join(path.resolve(outputDirectory), "hyperframes");
  await mkdir(project, { recursive: true });
  const files = {
    project,
    index: path.join(project, "index.html"),
    design: path.join(project, "DESIGN.md"),
    config: path.join(project, "hyperframes.json"),
    package: path.join(project, "package.json"),
    gsap: path.join(project, "gsap.min.js"),
  };

  await Promise.all([
    writeFile(files.index, compositionHtml(repo, scenes, palette)),
    writeFile(files.design, designMarkdown(palette)),
    copyFile(
      fileURLToPath(import.meta.resolve("gsap/dist/gsap.min.js")),
      files.gsap,
    ),
    writeFile(
      files.config,
      `${JSON.stringify({
        $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
        registry: "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
        paths: {
          blocks: "compositions",
          components: "compositions/components",
          assets: "assets",
        },
      }, null, 2)}\n`,
    ),
    writeFile(
      files.package,
      `${JSON.stringify({
        name: "repotrailer-render",
        private: true,
        scripts: {
          lint: "npx hyperframes lint",
          inspect: "npx hyperframes inspect --samples 18",
          render: "npx hyperframes render --output ../trailer.mp4 --workers 1 --quality standard",
        },
      }, null, 2)}\n`,
    ),
  ]);

  return files;
}

export async function renderHyperframesProject(
  projectDirectory,
  trailerPath,
  options = {},
) {
  const npxArgs = ["--yes", "hyperframes"];
  const lint = await run("npx", [...npxArgs, "lint"], {
    cwd: projectDirectory,
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (!lint.ok) {
    throw new Error(`HyperFrames lint failed:\n${lint.stdout}\n${lint.stderr}`);
  }

  const inspect = await run(
    "npx",
    [...npxArgs, "inspect", "--samples", "18", "--strict"],
    {
      cwd: projectDirectory,
      timeout: 180_000,
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  if (!inspect.ok) {
    throw new Error(
      `HyperFrames layout inspection failed:\n${inspect.stdout}\n${inspect.stderr}`,
    );
  }

  const render = await run(
    "npx",
    [
      ...npxArgs,
      "render",
      "--output",
      trailerPath,
      "--workers",
      String(options.workers ?? 1),
      "--quality",
      options.quality ?? "standard",
      "--strict",
    ],
    {
      cwd: projectDirectory,
      timeout: options.timeout ?? 900_000,
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  if (!render.ok) {
    throw new Error(
      `HyperFrames render failed:\n${render.stdout}\n${render.stderr}`,
    );
  }

  return {
    trailer: trailerPath,
    lint: lint.stdout,
    inspect: inspect.stdout,
    render: render.stdout,
  };
}

export const __test = {
  compositionHtml,
  designMarkdown,
  titleClass,
};
