import { formatNumber, truncate } from "./utils.js";

function featureScene(feature, index) {
  return {
    id: `feature-${index + 1}`,
    kind: "feature",
    eyebrow: `0${index + 1}`,
    title: truncate(feature, 72),
    body: index === 0
      ? "Lead with the clearest reason to care."
      : "One idea per beat. No feature-list blur.",
    duration: 2.4,
  };
}

function countLabel(value, singular, plural = `${singular}s`) {
  return `${formatNumber(value)} ${value === 1 ? singular : plural}`;
}

export function buildStoryboard(repo) {
  const signalCount = repo.stack.length || repo.languages.length;
  const scenes = [
    {
      id: "hook",
      kind: "hook",
      eyebrow: "OPEN SOURCE",
      title: repo.title,
      body: truncate(repo.tagline, 140),
      duration: 3,
    },
    ...repo.features.slice(0, 3).map(featureScene),
    {
      id: "proof",
      kind: "proof",
      eyebrow: "THE RECEIPT",
      title: `${countLabel(repo.files.source, "source file")}. ${countLabel(signalCount, "signal")}.`,
      body: repo.stack.length
        ? repo.stack.join(" · ")
        : repo.languages.map((item) => item.name).join(" · "),
      metrics: [
        { label: "commits", value: formatNumber(repo.git.commits) },
        { label: "contributors", value: formatNumber(repo.git.contributors) },
        { label: "source files", value: formatNumber(repo.files.source) },
      ],
      duration: 3,
    },
    {
      id: "install",
      kind: "install",
      eyebrow: "TRY IT",
      title: repo.installCommand,
      body: "Copy. Run. See it work.",
      duration: 2.8,
    },
    {
      id: "outro",
      kind: "outro",
      eyebrow: "SHIP YOUR README",
      title: repo.name,
      body: repo.git.remote || repo.source,
      duration: 2.8,
    },
  ];

  let start = 0;
  return scenes.map((scene) => {
    const timed = { ...scene, start };
    start = Number((start + scene.duration).toFixed(2));
    return timed;
  });
}
