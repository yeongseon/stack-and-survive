# Player camera implementation

Canonical landscape integration #208 supersedes the responsive Fit plane introduced in #187/#196. This is subordinate to [Player Camera and World Interaction](PLAYER_CAMERA_AND_WORLD_INTERACTION.md). Navigation/direct interaction shipped in #199; the map/landscape/intro changes ship with #208.

## One world, different cameras

`playerMap` is 2400×1350 presentation units. `tycoonPoint` returns fixed Intake (580,640), Edge (875,725), App (1190,790), Cache (1510,600), SQL (1830,825). The separately persisted `tycoonPositions` remain unchanged. Facilities, physical bay geometry, art scale, protected areas and the surrounding hall do not reflow at breakpoints. Map dimensions and art scales are presentation tuning, not simulation rules.

`fitZoom = min(viewport.width / 2400, viewport.height / 1350)`; `effectiveZoom = fitZoom × userZoom`. Fit is center (1200,675), userZoom1. Viewport may letterbox. The native Phaser camera applies effectiveZoom and canonical center to existing world objects exactly once. `worldToScreen`/`screenToWorld` use the shared editor math; compatibility aliases `fitToScreen`/`screenToFit` now refer to the canonical plane. DOM plaques/badges consume the same projection; hit padding is screen-space, converted by effectiveZoom. Frame effects stay screen-fixed. QA retains its independent editor camera and geometry.

`TycoonGame` owns one `createPlayerNavigation` store shared by GameFloor and renderer. Resize preserves canonical center and user zoom, then clamps. Each axis retains 40% of its visible world extent inside the map; if an axis cannot pan usefully it stays centered. Bounds override exact pointer anchoring/focus at edges. Finite positive viewport and finite state inputs remain required; relative zoom stays .75–1.8. Camera-only updates do not regenerate structural/background geometry or textures.

## Opening and landscape gate

After explicit Start and renderer readiness, show Fit for750ms and ease to operating center (1210,620), zoom1.45 over1050ms. Only after this presentation completes does the existing five-second countdown begin. Reduced motion jumps directly to that same operating camera. Fit later restores the familiar whole hall. Hidden introduction restarts its establishing sequence on return; no catch-up or authoritative ticks occur during it.

Viewports ≤900px wide and taller than wide require landscape for starting/continuing an operation. Portrait Start opens a rotation gate without mounting gameplay; title/help remain accessible after returning to title. Coarse-pointer Start/Continue attempts fullscreen and landscape lock as best-effort enhancement. Missing/rejected APIs cannot block manual landscape play. Late enhancement results are invalidated on restart/unmount.

During an operation, portrait holds clock callbacks and pauses RUNNING via the existing controller. The gate remembers whether it interrupted RUNNING: Continue resumes that case only, not a prior manual Pause. Returning to landscape never auto-resumes. Countdown callbacks are held in portrait and while the page is hidden in PREPARATION. Once RUNNING, hidden-tab advancement keeps the existing policy; camera animation alone does not redefine it. Result/title/help can remain readable in portrait because no active gameplay is advancing. Gate focus is contained, background controls are inert/hidden, Escape returns to title.

No camera coordinates, orientation or opening animation enter architecture persistence, challenge identity, queued actionLog, history or scoring. `createLandscapeClock` is a presentation timer adapter, not a new simulation state machine. Restart clears the held timer and cancels animation; renderer recovery preserves the session camera.

## Evidence

Unit tests cover identical geography/art dimensions across viewports, canonical Fit/inverse projection (1e-9 tolerance), bounded navigation, fixed-center resize, identical terminal replay with camera operations and held clock without catch-up. Browser tests cover 1440×900,1920 desktop,844×390 and740×390 landscape operations; separate390/320 portrait-start gates; no tick/budget/countdown during introduction; hidden/countdown interruption; rejected enhancement; manual versus orientation-induced pause; Fit/min/max physical hits; context recovery and full fresh operating-camera reset followed by whole-map Fit. Human acceptance remains #195 after final V3 art; automated tests do not certify real-device orientation support or game feel.
