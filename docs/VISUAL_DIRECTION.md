# Stack & Survive — Visual Direction

Version: 0.7. Reviewed merged main: `9421e74` (PR #253). **Game-first interaction and original V3 art are delivered**, followed by balance0.3 and Settings/Pause. #202 is completed implementation history, not the next task. [Gameplay](GAMEPLAY_SPEC.md) owns supported controls; [camera/world interaction](PLAYER_CAMERA_AND_WORLD_INTERACTION.md) remains the cross-layer guardrail. [Resource Visual States](RESOURCE_VISUAL_STATES.md) and [Simulation](SIMULATION_SPEC.md) own truthful states and outcomes. The [checkpoint](submission/RELEASE_CHECKPOINT.md) separates local presentation follow-ups from deployed evidence.

> The world is the primary interface.
>
> Official Azure icons identify the service. Custom game assets create the game world.

## Game-first principles

1. **World-first composition.** The data center dominates meaningful visual attention. Approximately 80–90% is a design guide, not a quality score or rigid test threshold.
2. **Direct manipulation.** Interact with the facility, empty bay or construction footprint, not a rectangular application control standing in for it.
3. **Playable diorama.** A coherent indoor 2.5D/isometric facility with foreground, playable middle and background; no full 3D rewrite.
4. **Zoom rewards inspection.** Close view reveals real facility activity and read/write pressure; camera moves presentation, never the simulation.
5. **Fit rewards architecture understanding.** Overview shows traffic origin, protected ingress, modular App, Cache branch and SQL together where geometry permits.
6. **HUD supports, never dominates.** Compact global numbers/short warnings; detailed capacity, history and explanations remain on demand.
7. **Physical construction over abstract controls.** Immediate input acknowledgement, real inactive construction, then activation and changed work on the actual tick.
8. **Outcome first, analysis second.** First show challenge result, score, availability, architecture and next action; preserve rich #185 evidence under Details.

These principles are implemented by the completed #197/#187–#194 sequence. Pointer play uses world targets, DOM equivalents reveal on keyboard focus, and analytical results remain under Details. #195 is actual unfamiliar-player acceptance, not missing interaction code. Keep those foundations while improving production art.

## Delivered direction: Production Art V3

Direction: **stylized-realistic 2.5D isometric industrial data-center game art**. Not flat SaaS/vector-diagram styling, pixel art, cinematic3D, photorealism or unrelated sci-fi packs. #203 facilities, #204 indoor kit and #205 integration are delivered through the original V3 runtime/refinement track. Do not reopen those groups as missing implementation.

Prioritize distinguishable silhouettes, coherent materials, bright hero facilities against subordinate surroundings and truthful moving state. App retains four physical bays; SQL retains separate read/write regions; Edge is a checkpoint, Cache compact memory and Intake ingress machinery. Actual labels-hidden identification at1440x900 requires human evidence; no invented commercial-quality score.

Editable source → >=512px raster master → optimized runtime PNG → Phaser plus small state overlays remains the production approach. Record provenance/manifest before runtime import. The exact-inventory Pages exception explicitly includes reviewed original V3 bytes, not arbitrary new assets. PR #245 Iteration04 is a separate environment experiment awaiting owner review, with no automatic merge or runtime adoption. Do not overlap that work with client HUD polish or silently extend approval.

Fast loop: affected tests + build + inspect1440x900 + adjust, then390/1920. Run final five-width/full regression/asset checks before grouped merge; measure hardware performance after major integration, not every art tweak. No new simulation systems or unrelated refactors.

## World and facilities

An indoor data-center game, not a portal, floating diagram or unrelated sci-fi collage. Intake → Edge → central App → Cache/read branch and dominant SQL keep the same canonical landscape geography on narrow screens; camera framing changes, not facility positions. Frame the playable aisle with subordinate racks, cooling, PDUs, vents, trays and walls; foreground utilities/cables provide depth. No outdoor roads/trees/cars/trucks/forklifts/warehouse/city scene. Props must not obscure packets, physical interaction affordances or badges.

| Resource | Required visual grammar |
|---|---|
| App | Central modular facility; one solid module per actual instance, empty next bay, locked later bays and one inactive construction scaffold; no phantom servers |
| SQL | Heavy persistent data core; distinguish read/write pressure sides without implying an upgrade |
| Cache | World footprint → inactive frame/boot → compact bright memory facility; actual hits terminate, misses/overflow continue, writes stay direct |
| Edge | Checkpoint footprint → inactive gateway construction → active ingress; queued/scheduled boost is not actual filtering |
| Intake | Distinct offered-traffic origin machinery/zone with truthful limiter cue |

Use contact shadows, service corridors, layered props, floor occlusion and restrained light pools for depth. At Fit, silhouettes and architecture routes matter more than tiny decoration. Close zoom should reward inspection without requiring it to recognize facilities.

Reference scenes cite attainable architecture/tick fixtures. App1 at 220 RPS overloads App, not SQL. An active Cache cannot coexist with an absent Cache build affordance. Runtime scale-in and SQL scaling are not actions.

## Physical interaction affordances

Expansion uses physical world affordances. Empty bays and construction footprints may use subtle floor markers, but the marker must read as part of the facility rather than a floating UI button. Hover/focus/selected states use outlines or halos; unavailable targets must not imply capacity or eligibility. Selected local action chips reveal actual costs/delays and reasons; detailed modal analysis requires explicit intent.

DOM semantic equivalents remain discoverable and visible on keyboard focus, using the same actions and camera projection as pointer interaction. Minimum targets and focus treatment survive zoom-out, reduced motion and touch. Pan/pinch never trigger construction on release. The [interaction contract](PLAYER_CAMERA_AND_WORLD_INTERACTION.md) owns gesture and coordinate details.

## Traffic, lights and motion

Cyan/blue Browse blocks, amber Order blocks and corrupted red Bot blocks differ by shape/detail, not only color. Lanes use dark bed/translucent activity/bright directional center. Cache hit, Edge filtering, intake limiting and downstream failure have distinct endpoint cues. Representative pressure is not a FIFO waiting count or eventual-completion promise.

Use reusable textures, bounded pooled effects and lightweight shadow/light-pool/emissive overlays. Camera movement transforms existing geometry; do not regenerate textures/environment for every wheel event. Warning/critical require shape/icon/text beyond orange/red. Relief/filtering feedback follows actual processing. Reduced motion retains static meaning; pause/terminal does not replay rewards, and activation cannot steal camera focus.

## HUD, outcome and title

Budget/demand/availability/short pressure plus Learn/Pause and camera controls remain accessible with minimal chrome. No permanent meter dashboard, construction sidebar, historical analysis or long advice panel. The world should communicate the bottleneck before detailed analysis explains it.

The implemented result first communicates actual success/failure and objective attainment, score, availability, architecture and real next/fresh-retry action. NBV/cost/profile/evidence/tradeoffs/experiment/comparison/bests/history remain available in Details, not discarded. Survival is not synonymous with satisfying every objective; no unreviewed stars or efficiency labels.

Decorative TitleWorld previews the theme without running a scenario; Start Game remains strongest. Preserve the improved title while bringing actual interactions to the same quality standard. The reference is a game-world experience, not a copied competitor interface.

## Asset and delivery policy

[Asset Strategy](ASSET_STRATEGY.md): free-only, CC0 preferred, justified verified CC-BY when useful, no paid dependency. Core buildings remain original/custom; provenance precedes runtime import. The existing exact-inventory Pages demo exception is not general rights clearance.

Building/environment updates, lighting, resource activity, opt-in audio/haptics software and contextual guidance are implemented (#145–#150). Audio remains default-muted/gesture-unlocked with bounded cadence, cleanup and visual equivalents; manual listening and physical haptic validation remain #149. Historical software epics #123/#142 are completed. #151 is not planned because its independent pre-change baseline was never collected; do not reconstruct obsolete builds for it. Current-build human review lives in #25/#195/#159.

Azure badges remain separate, original and unchanged: no recolor/crop/distortion, texture baking or product-logo use. Do not copy competitor art, UI, characters or sounds. [Design References](GAME_DESIGN_REFERENCES.md) is text-only pattern commentary, not reuse permission.

## Evidence

Inspect real title/normal/provisioning/pressure/Cache-Edge activity/outcome scenes at 320/390/1024/1440/1920, including implemented Fit/min/max zoom, keyboard/touch, reduced motion and asset fallback. Verify exact activation, pointer hit alignment, camera invariance and representative object bounds. Record actual renderer/workload/frame measurements; software CI is not hardware FPS evidence.

#195 asks an unfamiliar participant whether this looks and feels like a game before reading text, plus traffic/pressure/action/navigation/growth questions. Use the delivered build for one session covering #25 comprehension, #195 game-first acceptance and #159 voluntary replay; retain distinct criteria and verbatim answers. Do not ask them to replay: observe the choice and record a failed criterion if they decline. Neither screenshots nor automation close human gates. #132/#160–#163 are closed not planned; future implementation requires explicit new authorization.
