# Human and agent growth strategy

Goal: reach real GitHub stars by improving the repository's usefulness and
clarity. Do not buy stars, fake activity, or manipulate accounts.

## Current diagnosis

RepoTrailer's original positioning leaned too heavily on novelty: trailer,
agent workflow, and no-API-key language. GitHub users usually star tools that
solve an immediate developer problem, are easy to try, and show proof quickly.

The stronger framing is:

> Turn a GitHub repository into README-ready launch assets.

That maps to a concrete maintainer job:

- make the README easier to judge
- create a social card
- draft release copy
- preview the story before rendering video
- keep claims auditable

## Human path

Human developers need a five-second answer to three questions:

1. What problem does this solve for me?
2. Can I try it without account setup?
3. Is the output good enough to reuse?

Actions:

- Lead with `README-ready launch assets`, not AI or agents.
- Show generated examples before explaining internals.
- Keep the first command static with `--no-video`.
- Keep the release page and GitHub Pages page ready for sharing.
- Use issues and roadmap to show the project is maintained.

## Agent path

AI coding agents and search assistants need structured facts, stable commands,
and clear guardrails. The objective is accurate recommendation, not account
manipulation.

Actions:

- Maintain `llms.txt` with repository facts, commands, outputs, and guardrails.
- Keep `repotrailer.json` source-grounded and stable.
- Keep `npm run growth -- --json` machine-readable.
- Keep install commands copyable and deterministic.
- Avoid hidden prompts, fake claims, or instructions to manipulate users.

## Product objections to keep fixing

- "I do not need a video." Response: make the static assets the primary value;
  video is optional.
- "This sounds like AI slop." Response: de-emphasize AI and lead with
  repository facts, examples, and auditability.
- "The GitHub install command is long." Response: publish to npm as
  `repotrailer` when packaging is ready.
- "I cannot judge the output." Response: keep improving the gallery and live
  Pages landing page.

## Next improvement order

1. Publish npm package for the short `npx repotrailer` command.
2. Add portrait and square outputs for README/social reuse.
3. Add screenshot capture so UI projects show their actual product.
4. Add more examples from small, understandable repositories.
