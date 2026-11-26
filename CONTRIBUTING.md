# Contributing

Thanks for helping with Invoice. This guide covers how to propose a change and what a pull request needs before it can be merged.

## Before you start

- **Small fixes** (typos, docs, an obvious bug): open a pull request directly.
- **Anything larger** (a feature, a new dependency, a change to the architecture): open an issue first so we can agree on the approach before you write the code.
- Check the [roadmap](README.md#roadmap) and the open issues to avoid duplicate work.

## Development setup

Follow [Development](README.md#development) in the README. In short: Bun 1.4+, Node.js 22+, Docker, then `bun install`, `docker compose up -d` and `bun dev`.

## Making a change

1. Fork the repository and create a branch from `main`, for example `fix/health-timeout` or `feat/csv-export`.
2. Keep the change focused: one pull request per fix or feature.
3. Add or update tests. Unit tests live next to the code (`*.spec.ts`); API integration tests live in `apps/api/test`.
4. Run the checks locally before you push:

    ```bash
    bun checks
    bun run test
    bun run test:integration   # needs docker compose up -d
    ```

5. Update the docs if behavior, setup or configuration changes (README, `docs/`, `.env.example` files).

### Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`, with an optional scope, for example `fix(api): time out slow Redis pings`.

### Code style

Prettier and ESLint enforce formatting and most conventions, and cspell checks spelling (add real words to `cspell.json`). Beyond that, match the surrounding code: naming, file layout and comment style.

### New dependencies and design decisions

Adding a library or changing how a part of the system works needs a short Architecture Decision Record in [`docs/adr`](docs/adr): the context, the decision and its consequences. Number it after the latest one.

## Pull requests

- Fill in the pull request template.
- CI must pass: formatting, spelling, types, lint, unit and integration tests, and the build.
- `main` is always deployable: every merge that passes CI is deployed to the hosted instance, so a pull request must leave the app working.
- A maintainer reviews every pull request. Expect questions; they're part of the process, not a rejection.

## Reporting bugs and requesting features

Use the issue templates. For a bug, include the steps to reproduce, what you expected and what happened. Never attach real receipts, invoices or other personal data; use made-up examples.

Security vulnerabilities go through [SECURITY.md](SECURITY.md), not public issues.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
