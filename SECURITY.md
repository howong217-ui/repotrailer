# Security

## Reporting

Please report security issues privately to `howong217@gmail.com`. Do not open a
public issue for a vulnerability before a fix is available.

## Security model

RepoTrailer reads repository files and executes read-only git commands.

For public GitHub URLs it runs:

```text
git clone --depth 50 --quiet <url> <temporary-directory>
```

The static launch-kit path does not execute code from the target repository,
install its dependencies, or run package scripts.

Video rendering may execute the locally installed HyperFrames and browser
toolchain. Treat repositories and generated HTML as untrusted input. Render in
a least-privilege environment when analyzing an unfamiliar repository.
