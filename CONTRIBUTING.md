# Contributing

Use Node.js 22 or newer. No third-party runtime packages are required.

1. Run `npm ci`.
2. Open `index.html` to play locally.
3. Run `npm run check`, `npm test`, and `npm run build` before submitting changes.
4. For rendering or input changes, also test in a real desktop and mobile browser.

Keep the startup order in `index.html`: runner, district, extras, then bootstrap.
Only bootstrap owns the animation loop. A delayed renderer must never leave a
blank playfield. Keep obstacles and scenery on the shared track projection.

Do not commit credentials, `.env` files, local Vercel account files, or `dist/`.
Report bugs with the browser, viewport/device, steps to reproduce, and a screenshot.
