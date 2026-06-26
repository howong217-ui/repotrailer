# RepoTrailer outreach kit

Use one artifact per post. The goal is to make a developer understand the value
within five seconds.

## Short post

Most open-source projects launch as a wall of README text.

RepoTrailer turns any GitHub repo into README-ready launch assets:

```bash
npx --yes --package=github:howong217-ui/repotrailer repotrailer owner/repo
```

Social card, browser preview, release copy, JSON storyboard, and optional video.
Source-grounded. No account setup for the static path.

Repo: https://github.com/howong217-ui/repotrailer

## Technical post

I built RepoTrailer to test a simple idea: a repository already contains enough
signal to explain itself visually.

It reads README, package metadata, file types, install command, and git history,
then generates:

- browser preview
- 1200x630 social card
- launch copy
- JSON storyboard
- editable HyperFrames composition
- optional MP4

It does not invent stars, downloads, or benchmarks.

Repo: https://github.com/howong217-ui/repotrailer

## Show HN draft

Title: Show HN: RepoTrailer - generate README-ready launch assets from a GitHub repo

I built RepoTrailer because useful open-source projects often look inert when
their whole launch is a README link.

It reads a local repo or public GitHub URL, extracts the pitch, features, stack,
install command, and git history, then generates a browser preview, social card,
release copy, JSON storyboard, and optional HyperFrames video.

The default static path needs no account setup. It intentionally refuses to
invent stars, downloads, benchmarks, or adoption claims.

The project demonstrates itself: its README cover and demo are generated from
its own repository.

I would value feedback on whether the generated story feels accurate and whether
the first-run experience is clear.

## Direct feedback ask

I launched a small open-source tool that turns a GitHub repo into README-ready
launch assets:

https://github.com/howong217-ui/repotrailer

If you have 3 minutes, could you run this on any small repo and tell me where
the first-run experience breaks?

```bash
npx --yes --package=github:howong217-ui/repotrailer repotrailer . --no-video
```

No pressure to promote it. I am looking for friction before wider launch.
