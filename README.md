# Stack & Survive

### Build. Scale. Keep the business flowing.

A real-time cloud infrastructure strategy game: survive a 180-second traffic surge by expanding App capacity, caching reads and filtering malicious traffic.

**Same workload. Different architectures. Different outcomes.**

[**Play the game →**](https://yeongseon.github.io/stack-and-survive/) · [Illustrated guide](docs/PLAYER_GUIDE.md) · [Run locally](#run-locally) · [Development](docs/DEVELOPMENT.md) · [Contributing](CONTRIBUTING.md)

**Implementation status:** [Current release and activation gates](docs/CURRENT_STATUS.md). Export, Agent and Microsoft Learn code merged through #316/#323 (`a6f6956`). Live AI configuration/verification remains pending in #325; code merge is not activation. Current global API compatibility is blocked in #306; local play works independently.

## Watch the two-minute project introduction

[![Stack & Survive project introduction and gameplay](docs/media/project-introduction-preview.jpg)](https://raw.githubusercontent.com/yeongseon/stack-and-survive/main/docs/media/project-introduction-120s.mp4)

**[Watch / download the personal introduction (MP4, 2:00)](https://raw.githubusercontent.com/yeongseon/stack-and-survive/main/docs/media/project-introduction-120s.mp4)** · [Transcript, English captions and regeneration](docs/DEMO_VIDEO.md)

**Why I built it:** Microsoft Learn gave me the concepts; I wanted an easier way to experience how they work together. This eight-slide, two-minute presentation follows a personal learning experience, real game screenshots, decisions and reflection. It is not live gameplay or a product commercial. The previous dark navy/teal/gold palette is restored without changing the personal story. Audio now uses stock **en-US-GuyNeural**, not macOS Samantha: [listen to a short sample](docs/media/narration-sample.mp3). It remains disclosed synthetic narration, not the developer's voice; the renderer also accepts personal recordings. Internal production labels and the AI-focused segment stay removed. [Screenshot provenance](docs/images/README.md) remains separate.

The official game URL is the GitHub Pages link above. No custom domain is required.

**Presenting the project?** [Open the showcase](showcase/README.md) for a brief project-title cover followed by the same eight-slide English story, personal notes and [nine-page PDF](showcase/stack-and-survive-showcase.pdf). The video opens with two seconds of title, keeping the approved GuyNeural speech and total 120 seconds unchanged.

![Stack & Survive gameplay: a unified command HUD above App, Cache, Edge and SQL facilities during a bot attack.](docs/images/gameplay.webp)

## Why play?

More servers are not always the best answer. App expansion takes time; Cache helps eligible reads but not SQL writes; Protected Edge filters bots but can reject legitimate customers. Your choices change availability, operating costs and the final score.

**See one decision change the outcome:** [53-second current-feature demo and narration](docs/DEMO_VIDEO.md#current-rules-04-the-bottleneck-tradeoff) — App expansion leaves a SQL bottleneck; a delayed SQL tier change restores service at a higher running cost. Continuous automated local gameplay, not a human learning study.

**Current rules 0.4:** App scale-in/out and tiers, SQL tiers/read replicas are available through visible scaling controls. [Scaling guide](docs/INFRASTRUCTURE_SCALING.md). Images and the new introduction show source `a6f6956`; separate old videos retain their original revisions. See [capture provenance](docs/images/README.md) and [release boundaries](docs/CURRENT_STATUS.md).

- **One living data center:** click facilities and empty bays directly; routes are automatic.
- **Eight traffic phases:** anticipate spikes, bot attacks, recovery windows and the final wave.
- **Three objectives:** finish the operation, then reach 99% and 99.9% availability on the same workload.
- **Clear consequences:** watch pressure, lost sales and Upgrade Funds; inspect the result to plan another strategy.
- **Play without an account:** local records work without a backend; the optional global leaderboard verifies submitted action replays.

## How to play

**[Follow the screenshot walkthrough →](docs/PLAYER_GUIDE.md)** — refreshed screens covering opening, construction, scaling, attacks, recovery, results, Learn and settings.

1. Open the [browser demo](https://yeongseon.github.io/stack-and-survive/). A desktop browser is recommended; phone gameplay requires landscape.
2. Optionally set **Player name**, choose an unlocked challenge and select **Start Game**. A name is never required to play.
3. Watch **Demand**, **System pressure** and **Next**. Click an empty App bay or the Cache/Edge footprint once to request construction. Capacity becomes available only after its activation delay.
4. Use **Learn** for capacity and routing explanations. **Pause** or **Escape** opens the game menu; **Inspect paused world** keeps time stopped. **Resume** restarts it explicitly.
   Use bottom **App scaling / SQL scaling** for instance, tier and read-replica controls; the upper-right **Azure service guide** explains all represented roles and opens inspection. SQL starts compact and grows only after tier activation. Scale-in/down reduces future capacity/cost; it does not refund past expense.
5. Inspect the score and **Details**. A qualifying result shows **Player name → Join Leaderboard** when no valid name is saved. A saved name may submit the next qualifying run automatically; it is shown beside the result. Name changes do not rename old entries.
6. Try another architecture or advance to the next unlocked objective. Each attempt starts with fresh infrastructure; history and unlocked challenges remain on this device.

### What does the money mean?

Dollar amounts are **simulated business value, not actual Azure prices**. One internal credit is displayed as **$1K**: starting funds are **$75K**, and a loss of 0.25 credit/second is **$250/s**. Only **10% of successful customer sales** returns to Upgrade Funds; bots earn nothing.

At the base tier, each App instance costs **$5K/min**; Cache and Edge cost **$8K/min** and **$3K/min**, respectively—not one-time purchase prices. Higher App/SQL tiers and SQL read replicas have separate [running costs and activation delays](docs/INFRASTRUCTURE_SCALING.md#mechanics). The emergency filtering boost costs **$8K** once. Display formatting does not change simulation values or scoring.

## Screenshots

| Start a fresh operation | Review the outcome and your score |
|---|---|
| ![Title screen with Start Game and optional player-name controls.](docs/images/title.webp) | ![Completed operation with an explicit local leaderboard and the recorded DEMO identity.](docs/images/result.webp) |

These are actual automated local production captures of **`a6f6956`**, not mockups. Runtime source was clean; capture tooling was in the working tree and is disclosed. The result is **local**, and `DEMO` denotes automation—not a participant. Images are resized without cropping. [Capture provenance](docs/images/README.md) · [Regenerate images/video](docs/DEMO_VIDEO.md#automatic-regeneration).

| Build before demand rises | Pause without losing your place |
|---|---|
| ![App expansion under construction before activation.](docs/images/construction.webp) | ![Pause menu keeps the operation stopped while inspecting or opening settings.](docs/images/pause.webp) |

## Run locally

Use **Node.js 22** (`>=22.12.0 <23`; reference version 22.22.0) and **pnpm 10.32.1**. No Azure account or API is needed for local gameplay.

```bash
git clone https://github.com/yeongseon/stack-and-survive.git
cd stack-and-survive
pnpm install --frozen-lockfile
pnpm build
pnpm --filter @stack-and-survive/web exec vite preview --host 127.0.0.1
```

Open the **root URL `/` printed by Vite** and choose **Start Game**. This ordinary production build does **not** need `?tycoon`.

For hot-reload development, run `pnpm dev` and append **`/?tycoon`** to the printed origin. The development root opens the QA/editor, not ordinary play. Production builds never enable the QA inspector through URL parameters. See [development modes and tests](docs/DEVELOPMENT.md).

## Built with

```text
React controls / results  →  shared deterministic simulation  →  Phaser world
                                      ↑
                         optional API replays actions
```

| Area | Technology / responsibility |
|---|---|
| Player UI | React, TypeScript, Vite; keyboard-accessible controls and results |
| Game world | Phaser 3; fixed isometric facilities and state-driven feedback |
| Rules | Shared headless simulation and versioned challenge definitions |
| Verification | Vitest, Playwright, asset integrity and replay regression tests |
| Hosting | Static GitHub Pages frontend; optional Azure App Service API (leaderboard + AI export proxy) |

Gameplay **does not provision cloud resources**. Azure badges identify represented service roles; capacities, timing and economics are game assumptions. The optional API is real application infrastructure, not infrastructure created by the player. Local scores and nicknames are not authenticated identities; server replay verification is not a complete anti-cheat system.

**Export to Azure** turns the final architecture of a finished run into Bicep and a per-resource rationale using Azure OpenAI via the optional API. The export is text only; it never deploys, and it never changes simulation, scoring or replay. It is available only for rules 0.4 with an API configured; generation remains unavailable until the API's server-only Azure OpenAI settings are supplied. Generated scaffolds need human review, real identity parameters, application integration and local compilation before any independently authorized deployment.

**Validation status (#315):** implementation is tested with mocked AI responses and a hand-authored compiled fixture. Actual Azure OpenAI credentials were unavailable during implementation, so a real played-run → model generation → Bicep compilation smoke is still required. No live export service or Azure configuration change is claimed.

The result also links to **Microsoft Learn** for each service present in your final architecture and for Bicep. These fixed official links work without an API or AI configuration; the model cannot choose their destinations.

**Agent implementation (#322/#323 merged; activation #325 pending):** the [Architecture Export Agent](docs/ARCHITECTURE_EXPORT_AGENT.md) implements model-selected mapping/validation and bounded repair. Mocked-model tests with a real compiler verify the flow; live Azure model behavior remains unverified. Downloads require exact-artifact compilation and property checks. Public enablement still needs authorized AI configuration, compiler isolation and real-model smoke. Code merge creates no Azure resources and changes no game outcome.

## Develop and contribute

Start with [CONTRIBUTING.md](CONTRIBUTING.md) for issue selection, small PRs, verification and rights boundaries. The [development guide](docs/DEVELOPMENT.md) covers workspace structure, player/QA modes, API configuration, tests and screenshot generation.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

These are the fast baseline checks, not a substitute for relevant browser tests. Keep changes focused: UI, world rendering, simulation and backend work have different owners and acceptance criteria.

## Documentation

- [Documentation index](docs/README.md) — authoritative contracts and reading order.
- [Gameplay](docs/GAMEPLAY_SPEC.md) · [Simulation rules](docs/SIMULATION_SPEC.md) · [Technical design](docs/TECHNICAL_DESIGN.md).
- [Leaderboard architecture](docs/LEADERBOARD_ARCHITECTURE.md) · [API contract](docs/LEADERBOARD_API_CONTRACT.md) · [Backend evidence](docs/BACKEND_PRODUCTION_EVIDENCE.md).
- [Demo and submission pack](docs/submission/README.md) — script, fallback, screenshots and participant worksheet.
- [Current work and remaining acceptance](https://github.com/yeongseon/stack-and-survive/issues/7).

## Project status and rights

The game, final command HUD, simulated-dollar display and player-name UX are implemented. The `github.io` demo no longer redirects to the former account domain. Check the [latest workflows](https://github.com/yeongseon/stack-and-survive/actions) for the exact deployed revision; a merge or successful skipped workflow is not deployment evidence. Actual participant, listening/device and rights decisions remain separately tracked in #25, #195, #159, #149 and #164.

**Public source is not the same as licensed open source.** No project-wide code or original-art license has been selected. The existing demo is owner-authorized under a narrow [exact-inventory exception](docs/PAGES_DEMO_EXCEPTION.md), not general redistribution clearance. Microsoft Azure assets remain separately attributed under their own terms; no Microsoft endorsement is implied. Read the [licensing status](docs/LICENSING_STATUS.md) and [asset attribution](apps/web/public/assets/ATTRIBUTION.md) before reusing or contributing assets.
