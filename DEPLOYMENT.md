# Deployment

- Production: https://aj-runner.vercel.app
- Source: https://github.com/codexanjan/AJ-RUNNER
- Published: 2026-09-12
- Vercel project: `aj-runner`
- Vercel workspace: `krotrex-2830s-projects`
- Build: `npm run build`
- Output: `dist`
- Environment variables: none

The first production deployment completed with Vercel status `READY`.
Only the public game assets are served; documentation and tests stay in GitHub.

## Future Updates

The Vercel GitHub integration currently lacks access to `codexanjan/AJ-RUNNER`,
so automatic deployments are not enabled. To enable them, grant the Vercel
GitHub integration access to this repository and connect it in the project's
Git settings. The production branch should be `main`.

Until then, publish changes from a signed-in Vercel CLI:

```sh
vercel link --project aj-runner --scope krotrex-2830s-projects
vercel deploy --prod --scope krotrex-2830s-projects
```

Do not commit `.vercel/`, account credentials, or environment files.
