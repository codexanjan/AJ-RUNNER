# AJ RUNNER

An original, responsive three-track endless runner for the browser. Play as AJ,
dodge trains, collect coins, and build score streaks through a changing rail district.

[Play AJ RUNNER](https://aj-runner.vercel.app) | [Source code](https://github.com/codexanjan/AJ-RUNNER) | [Report a bug](https://github.com/codexanjan/AJ-RUNNER/issues)

![AJ RUNNER original landing artwork](key-art.png)

An original three-track runner with AJ, an animated cinematic start page,
Daybreak and After Hours environments, and keyboard/touch controls.

## Play

Open `index.html` in a modern browser. No installation, connection, or server is
needed. The first run shows a short guide; reopen it with How to play.

Keep all files together when moving or extracting the game. Startup waits for
the renderer and bonus controls before drawing its first frame. If a required
file fails to load, the game displays a recovery message with a Reload button.

## Controls

- Left / Right arrow: switch lanes
- Up arrow or Space: jump
- Down arrow: slide
- P or Escape: pause or resume
- B or Board button: activate one rescue board per run
- On mobile, swipe or use the visible arrow buttons

## Rules And Bonuses

Each incoming obstacle row stays fixed and leaves an open track. Jump striped
barriers, slide under overhead gates, and dodge trains. Coins mark the open track.

- Rescue board: 10 seconds of protection, consumed by one crash; one per run.
- Shield pickup: absorbs one crash within 8 seconds.
- Magnet pickup: attracts nearby coins for 8 seconds.
- Double-score pickup: doubles points for 10 seconds.
- Coin streak: collect again within 3 seconds to keep it going. Every 10 coins
  raises the multiplier, up to 4x. Double score stacks with it, up to 8x.
- Coin Run: collect 25 coins for a one-time 500-point bonus each run.

Bonus timers freeze while paused. Switching tabs automatically pauses the run.
The game-over screen shows your points, coins, distance, and best coin streak.
High scores and the completed guide are stored only in the current browser.

All game art and names are original. The landing artwork is AI-generated;
gameplay uses procedural canvas art. Reduced-motion preferences disable the
landing animation, camera bob, and speed streaks.

## Development

The game is plain HTML, CSS, and JavaScript with the Canvas 2D API. It has no
runtime dependencies, API keys, backend, account system, or database.

For project checks and hosting builds, use Node.js 22 or newer:

```sh
npm ci
npm run check
npm test
npm run build
```

The build copies only public game assets into `dist/`. `index.html` also works
directly from the source folder, without running the build.

## Deploy To Vercel

Live production game: **https://aj-runner.vercel.app**

The initial release was published directly with the Vercel CLI. Automatic GitHub
deployments are not connected yet: the Vercel GitHub integration needs access to
`codexanjan/AJ-RUNNER`. The live release works independently of that connection.

Import `codexanjan/AJ-RUNNER` from GitHub into Vercel. Select the repository root,
use the **Other** framework preset, and leave the settings from `vercel.json`:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | None |
| Production branch | `main` |

After connecting the repository, pushes to `main` can deploy automatically.
Alternatively, sign in with the Vercel CLI, run `vercel link`, then `vercel --prod`.

## Project Files

| File | Purpose |
| --- | --- |
| `index.html` | Landing page, HUD, menus, guide, and controls |
| `runner.js` | Game state, input, spawning, collisions, and scoring |
| `district.js` | Canvas scenery, AJ, obstacles, and collectibles |
| `extras.js` | Guide, rescue board, bonus indicators, and keyboard focus |
| `bootstrap.js` | Ordered startup, animation loop, and load-error recovery |
| `*.css` | Responsive appearance, motion, and loading states |
| `key-art.png` | Original generated landing artwork |
| `scripts/` | Static checks and deployment build |
| `tests/gameplay.cjs` | Dependency-free gameplay regression tests |

## Verification And Limits

Regression tests cover the first-run guide, rescue-board protection, bonus
stacking and expiry, paused timers, jump landing, safe obstacle rows, and finite
canvas drawing coordinates. They use a simulated DOM and do not replace browser
testing. The startup fix was also checked in desktop and mobile-sized Chromium,
including delayed and missing renderer files.

Scores are device-local and editable by the player; there is no online leaderboard
or anti-cheat service. Gameplay uses stylized 2D perspective, not photorealistic 3D.
No open-source license has been selected; no additional reuse rights are granted
by this repository. See [CONTRIBUTING.md](CONTRIBUTING.md) and [CHANGELOG.md](CHANGELOG.md).

---

<div align="center">

Made with ❤️ by [Anjan Shetty](https://github.com/codexanjan)

[![GitHub](https://img.shields.io/badge/GitHub-codexanjan-181717?style=flat&logo=github)](https://github.com/codexanjan)

</div>
