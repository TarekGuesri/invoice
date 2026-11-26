# Security policy

## Supported versions

Invoice is in early development. Security fixes go to `main` and the latest release; older releases are not patched.

## Reporting a vulnerability

Please don't open a public issue, pull request or discussion for a security problem.

Report it privately through GitHub: go to the repository's **Security** tab and choose **Report a vulnerability**. Include:

- what is affected (web app, API, worker, deployment setup) and the version or commit,
- steps to reproduce or a proof of concept,
- the impact you expect.

You'll get an acknowledgement within 7 days. Once the issue is confirmed, a fix is prepared privately, released, and then disclosed in a GitHub Security Advisory that credits you unless you prefer otherwise.

## Scope

In scope: this repository's code, its Docker image and the deployment configuration in `.github/` and `infra/`.

Out of scope: vulnerabilities in third-party services (Google Cloud, Vercel, Neon, Redis Cloud, Cloudflare, Gemini) and findings that need physical access to a user's device. Don't run load tests or automated scanners against the hosted instance; it runs on free tiers with small quotas.
