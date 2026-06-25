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

As of 2026-06-25:

- Stars: 0/100.
- Primary blocker: proof problem plus no external reach.
- Response: add a real examples gallery, improve growth-check fallback, and keep
  outbound posts in `marketing/outreach-kit.md` until the maintainer explicitly
  confirms where to post.

## Rule

Every check should end with one of:

- a safe repo/content improvement,
- a prepared outbound action awaiting confirmation,
- or a clear reason to stay quiet.
