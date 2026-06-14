# Contributing

RepoTrailer should stay easy to trust and easy to run.

## Principles

- Repository facts must remain distinguishable from generated presentation.
- Do not add hosted AI as a requirement for the default workflow.
- Keep the static launch kit usable when video dependencies are missing.
- Avoid new runtime dependencies unless they remove substantial complexity.
- Add or update tests for behavior changes.

## Setup

```bash
git clone https://github.com/howong217-ui/repotrailer
cd repotrailer
npm test
npm run demo
```

Open `examples/generated/index.html` and inspect the social card before
submitting visual changes.

## Pull requests

Explain:

- the user problem
- the behavioral change
- how it was verified
- whether generated output changed

Do not include generated stars, downloads, benchmark claims, or testimonials.
