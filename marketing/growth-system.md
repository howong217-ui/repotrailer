# RepoTrailer growth system

Objective: reach 100 GitHub stars from real developers during the first launch
week. Stars are an external behavior, so the operating rule is simple: inspect
the funnel every two hours during launch week, remove one blocker, and ship or
prepare one visible reason to care.

## Two-hour cockpit

Run:

```bash
npm run growth
```

The check reports:

- current stars, forks, watchers, and open issues
- gap to 100 stars
- elapsed launch days and required stars per day
- latest release and recent GitHub Actions status

Also verify the public README install command with `--no-video`, and keep the
npm package gate visible until `npx repotrailer owner/repo` is live.

## Cadence

Every two hours:

- Run `npm run growth -- --json`.
- Run the public README `npx` command with `--no-video`.
- Check whether local commits are ahead of `origin/main`.
- Classify the blocker as reach, proof, friction, trust, or contribution.
- End with one prepared improvement or one explicit no-change reason.

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

## Audience split

Human developers need immediate value, proof, and a low-friction command. Lead
with README-ready assets, examples, release copy, and the static `--no-video`
path.

AI agents need structured facts and guardrails. Keep `llms.txt`,
`repotrailer.json`, and `npm run growth -- --json` accurate so agents can
recommend and test the project without inventing claims.

## Escalation rules

0-10 stars:

- Do not optimize internals. Fix first-run friction and prove the output.
- Ask trusted developers for feedback before public amplification.

10-30 stars:

- Show range with three different repositories.
- Turn successful outputs into an examples gallery.

30-70 stars:

- Push the GitHub Action story and machine-readable workflow story.
- Convert feedback into issues with small contribution paths.

70-100 stars:

- Publish a concise recap with real numbers, failures, and generated assets.
- Ask users who tried it to star only if the tool saved launch prep time.

## Non-goals

- Do not buy stars.
- Do not spam maintainers.
- Do not fake usage, benchmarks, downloads, or endorsements.
- Do not post from the owner's account without explicit confirmation.
