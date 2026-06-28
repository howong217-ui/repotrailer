# RepoTrailer reflection loop

After each growth check, do not stop at the number. Classify the blocker and
ship or prepare one response.

## Classify

Use the first matching diagnosis:

1. **Reach problem:** target users are not seeing the repository.
2. **Proof problem:** visitors see the repository but cannot judge the output.
3. **Friction problem:** visitors want to try it but the install path is too hard.
4. **Trust problem:** visitors are unsure whether the tool is accurate, maintained,
   or safe.
5. **Contribution problem:** interested developers cannot find a small way to help.

## Decide

| Signal | Diagnosis | Default response |
|---|---|---|
| 0 stars after launch | Reach + proof | Improve examples, then prepare one specific post |
| Stars but no forks/issues | Contribution | Add `good first issue` tasks and clearer roadmap |
| Public install fails | Friction | Fix install path before any promotion |
| Demo looks samey | Proof | Add examples from different project types |
| CI/release stale | Trust | Fix automation before asking for attention |

## Current decision

As of 2026-06-28 09:25 UTC:

- Stars: 0/100.
- Required pace: 30.8 stars/day with 3.3 launch days remaining.
- Primary blocker: friction plus reach. The public GitHub install path works,
  but the npm package is not published, so the short `npx repotrailer owner/repo`
  command is unavailable. Local `main` is also ahead of `origin/main` by two
  commits, with local reflection edits still uncommitted.
- Smoke status: public README `npx --package=github:howong217-ui/repotrailer`
  passed this run for a public GitHub target, but GitHub API and npm registry
  checks still saw connection resets.
- Local improvement: `scripts/publish-readiness.mjs` now distinguishes an npm
  registry network error from a real package-name collision.
- Response: push the two local commits, publish `repotrailer@0.1.0` from the
  maintainer npm account, then update README, Pages, release notes, and outreach
  copy to lead with the short npm command.

## Rule

Every check should end with one of:

- a safe repo/content improvement,
- a prepared outbound action awaiting confirmation,
- or a clear reason to stay quiet.
