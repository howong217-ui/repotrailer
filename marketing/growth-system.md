# RepoTrailer growth system

Objective: reach 100 GitHub stars from real developers during the first launch
week. Stars are an external behavior, so the operating rule is simple: inspect
the funnel every day, remove one blocker, and ship one visible reason to care.

## Daily cockpit

Run:

```bash
npm run growth
```

The check reports:

- current stars, forks, watchers, and open issues
- gap to 100 stars
- elapsed launch days and required stars per day
- latest release and recent GitHub Actions status

## Cadence

Morning:

- Check `npm run growth`.
- Check the latest CI and release status.
- Pick one visible improvement or one distribution action.

Midday:

- Share one concrete artifact, not a generic link: GIF, generated social card,
  launch-copy diff, or before/after README example.

Evening:

- Record the star count and what was tried.
- Keep the best-performing hook.
- Remove one confusing sentence from README, docs, or launch copy.

## Escalation rules

0-10 stars:

- Do not optimize internals. Fix first-run friction and prove the output.
- Ask trusted developers for feedback before public amplification.

10-30 stars:

- Show range with three different repositories.
- Turn successful outputs into an examples gallery.

30-70 stars:

- Push the GitHub Action story and agent workflow story.
- Convert feedback into issues with small contribution paths.

70-100 stars:

- Publish a concise recap with real numbers, failures, and generated assets.
- Ask users who tried it to star only if the tool saved launch prep time.

## Non-goals

- Do not buy stars.
- Do not spam maintainers.
- Do not fake usage, benchmarks, downloads, or endorsements.
- Do not post from the owner's account without explicit confirmation.
