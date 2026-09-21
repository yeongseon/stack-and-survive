# Global submission — English draft and final checks

This is a review-ready draft, **not a completed submission or verified event-compliance report**. The official event page, exact deadline/timezone, required fields, video limit and judging criteria have not been supplied. Confirm them before changing material lengths or submitting anything.

## Ready-to-use links

- [Play Stack & Survive](https://yeongseon.github.io/stack-and-survive/)
- [Repository and illustrated overview](https://github.com/yeongseon/stack-and-survive)
- [English presentation and PDF](../../showcase/README.md)
- [English speaker notes, short version and Q&A](../../showcase/SPEAKER_NOTES.md)
- [New narrated two-minute project introduction, captions and transcript](../DEMO_VIDEO.md#two-minute-project-introduction--current-source)
- [Screenshot walkthrough](../PLAYER_GUIDE.md)
- [Technical explanation](../SUBMISSION_TECHNICAL_NOTES.md)
- [Demo fallback](DEMO_FALLBACK.md) and [known limitations](KNOWN_LIMITATIONS.md)

The deck and 120-second video now share eight slides about the developer's Azure learning experience. Actual screenshots support questions and reflection; no AI segment, product pitch or production banner appears in the main talk. Agent details are Q&A only. Current audio is a disclosed synthetic draft; prefer presenter-recorded WAVs for final delivery. Old technical clips remain historical references, not the personal presentation. No learning effect or live AI service is claimed.

Read the [dated release handoff](HACKATHON_HANDOFF.md) before presenting: rules 0.4 are implemented, but production API compatibility is blocked in #306. Historical media does not prove the current global leaderboard works.

[Current status](../CURRENT_STATUS.md) is the authority. Export/Agent and Learn code merged in #316/#323; live AI activation remains pending #325. The new video explains the agent design but does not demonstrate a live model or use mocked output.

## One-sentence pitch

Stack & Survive is a browser strategy game where players manage App capacity, Cache and Edge through a 180-second Black Friday rush and see how architecture choices affect availability, lost sales and operating costs.

## Why I built it

I work in technical support and frequently use Microsoft Learn. The services are well documented, but I wondered how a beginner would connect them: why put App, Cache, a database and Edge together, and what happens when one becomes a bottleneck? I built a game so someone could try a simplified setup first, then return to the documentation with specific questions. It is not a replacement for Microsoft Learn, and whether it improves understanding still needs user testing.

## What it does

Players face the same Black Friday workload across eight phases. Demand starts at 100 requests per second, with spikes and recovery windows; the final 20 seconds reach 600 requests per second with 45% bots. App expansion adds capacity after an eight-second delay. Cache helps eligible reads, while order writes still need SQL. Protected Edge filters bots but can reject legitimate customers. Running costs and construction time make the order of upgrades matter.

Current rules 0.4 also support App scale-in and tier changes, SQL tiers and read replicas. Replicas help reads, not writes; capacity and running cost change only after activation. The introductory deck focuses on the original App/Cache/Edge decisions; the [scaling guide](../INFRASTRUCTURE_SCALING.md) documents the additional controls and measured tradeoffs.

The objectives progress from surviving 180 seconds to completing the run with 99% and then 99.9% availability. Results appear immediately, and a fresh attempt allows a different architecture or timing. Names are optional for play and required for leaderboard entry. Local records are clearly distinguished from server-verified rankings.

## What is actually built

The frontend uses React and Phaser, backed by a shared deterministic TypeScript simulation. It is hosted on GitHub Pages. The optional leaderboard API runs on Azure App Service and verifies supported action replays instead of accepting client-supplied scores. Gameplay does not provision Azure resources; displayed dollars are simulated business values, not Azure prices. Nicknames are not authenticated accounts, and replay verification is not a complete anti-cheat system.

## AI assistance disclosure

AI assisted implementation, original-art iteration, test writing and documentation. Verification claims refer to checks that were actually executed. AI review does not substitute for participant feedback, listening/device checks or rights decisions. Adapt this disclosure to the official submission questions without adding unsupported claims.

## Evidence boundaries

- Current screenshots are local source `a6f6956`; the 9,473-point `DEMO` run is automated/local. See [provenance](../images/README.md). Old videos retain their original sources.
- The published video's recorded outcomes and observed global rows have separate provenance in [DEMO_VIDEO.md](../DEMO_VIDEO.md). Neither recorded run was submitted publicly by that capture.
- The presenter reported placing in the Korea regional event. Do not invent an award title, rank, organizer endorsement or measured learning result; add a public announcement only after its exact wording is confirmed.
- Human comprehension, voluntary replay, listening/device and rights gates remain separately tracked. A regional presentation or award does not automatically satisfy those criteria.
- Public repository visibility is not a project-wide open-source license grant. Check [rights status](../LICENSING_STATUS.md) and the event's IP/asset terms before claiming eligibility.

## Final checklist

### Event requirements — not yet verified

- [ ] Record official event/submission URL and exact deadline with timezone.
- [ ] Confirm eligibility, team requirements, required technologies and judging criteria.
- [ ] Confirm video length, language, hosting/access requirements and accepted attachments.
- [ ] Confirm AI disclosure, asset/IP/license and public-repository requirements with the owner.

### Materials and rehearsal

- [ ] Review the English copy against the actual form's field limits.
- [ ] Time the speaker's actual English delivery; the script estimate is not a rehearsal result.
- [x] Automated: eight slides at 1920×1080, 1440×900, 1366×768 and 820×1180; navigation, images, local links, print bounds, no-JavaScript order and forbidden on-screen labels. This is not physical-device or human delivery validation.
- [ ] Check all eight PDF pages and browser controls on the actual presentation device.
- [ ] Download the MP4 and PDF as offline fallbacks; do not claim silent video includes narration.
- [ ] Check links without relying on private accounts or local file paths.

### Final technical and owner gates

- [ ] Confirm exact final main SHA, Quality result and actual Pages deployment.
- [ ] Smoke-test the public game in a clean browser: start, build, pressure, result, restart and readable local/global state.
- [ ] Coordinate any production score submission or restart durability evidence with the backend owner; do not mutate the public board as a routine check.
- [ ] Record actual participant/listening results and owner rights decisions, or explicitly document their unresolved status.
- [ ] Obtain final owner approval, submit the form, and save its confirmation. Preparing these files does not mean the form has been submitted.
