# Player Camera and World Interaction

Version: 1.0. **Prospective implementation contract**, established by #197 for [Epic #186](https://github.com/yeongseon/stack-and-survive/issues/186). This specifies required behavior, not shipped controls. At the reviewed merged baseline PR #185 (`abdd412`), normal play still uses responsive fixed anchors, DOM expansion pads and resource cards. Camera foundation PR #196 is unmerged at this document's introduction; it does not provide user-facing navigation. [Gameplay](GAMEPLAY_SPEC.md) remains the authority for currently supported play.

## Purpose

The data-center world is the primary interaction surface. Players notice pressure, interact with infrastructure and see actual facility changes. Camera and interaction are presentation concerns only; they must never change simulation truth.

**Camera is presentation state, not runtime state.**

This contract owns cross-layer camera/gesture/interaction rules. A narrower math or implementation note such as `PLAYER_CAMERA.md`, when merged with #187, must explain its implementation of this contract rather than establish competing ownership or promise features not yet integrated.

## State ownership and coordinates

| Owner | State or responsibility |
|---|---|
| Player presentation camera | `PlayerCameraState { centerX, centerY, userZoom }`; one shared source, not separate React/Phaser cameras |
| Viewport | Finite positive `width`, `height`; resize lifecycle |
| Derived projection | `fitZoom`, `effectiveZoom = fitZoom × userZoom`, bounds, world/screen transforms |
| Simulation/controller | Resources, capacity, topology, lifecycle ticks, action eligibility/outcomes, economy and score |

Camera state MUST NOT enter simulation state, challenge identity, replay actionLog, run history/comparison identity, scoring or persisted architecture. It may be held by a dedicated presentation store owned by the player world; renderer and React consumers subscribe to the same snapshot. Camera-only updates must not publish gameplay mutations or restart the clock.

The existing editor `Camera`, `project()` and `unproject()` mathematics may be reused without changing QA behavior. Player `tycoonPoint()` currently describes responsive screen anchors, not simulation positions. Explicitly distinguish:

1. Simulation resource coordinates: never rewritten by camera operations.
2. Responsive Fit/world presentation plane: the architecture composition at default overview.
3. Screen coordinates: the shared camera transform applied to that plane.

Resource rendering, footprint/bay hit testing, selected-action anchors and independent Azure badges must consume the same projection. Fit may reflow the composition at responsive breakpoints; resize preserves useful normalized center and user zoom, then clamps. Selected-resource focus may explicitly use the resource's new position. Do not create a second React position calculation.

Apply user camera transformation **exactly once**. Phaser camera/container transforms are acceptable on Fit-projected geometry if that geometry is not also manually transformed by user zoom. A CSS `transform: scale()` shortcut over only the canvas, or unsynchronized React/Phaser zoom state, is not acceptable. Any remaining DOM anchor uses the exported world-to-screen projection; pointer input uses the corresponding inverse. Respect canvas CSS size versus renderer coordinate size.

## Required camera operations — planned, not yet supported

- Zoom in/out using keyboard-accessible buttons.
- Pointer-anchored wheel/trackpad zoom, normalized for `deltaMode` and bounded per event.
- Two-finger pinch zoom and two-finger or empty-floor drag pan.
- Fit/Home restoring the overview; explicit focus of selected infrastructure when provided.
- Keyboard-accessible pan/focus alternatives; optional `+`/`=`/`-`/`0` shortcuts cannot be the only controls.

No camera rotation, 3D orbit, perspective changes or movement affecting traffic, latency or runtime.

### Zoom and Fit

Initial user zoom range: **0.75×–1.80× relative to responsive Fit**. Button presets: 75 / 90 / 100 / 125 / 150 / 180 percent. Wheel and pinch may be continuous. These are initial UX parameters, not simulation constants; changes require visual evidence, not balance changes. The 100% indicator means Fit-relative scale, not equal world-pixel density across phone and desktop.

Zoom preserves the world point underneath its pointer/pinch anchor within documented numerical tolerance unless bounds require clamping. A button may use the viewport center. Clamp precedence must be explicit and tested. Fit shows Intake, Edge footprint/facility, App, Cache footprint/facility, SQL and processing routes together whenever viewport geometry reasonably permits, including visual building extents and unobscured critical controls.

### Pan, focus and lifecycle

Bound pan using world extents with approximately 8–12% viewport margin (initially 10%). The architecture cannot be permanently lost outside the viewport. Center an axis that cannot meaningfully pan at a zoomed-out scale. Fit always recovers overview.

Run start/retry resets to Fit. Pause/resume preserves camera. Resize preserves useful center/zoom and clamps; it does not move simulation resources. Explicit focus may center a selected resource subject to bounds; ordinary selection need not steal the camera. Provisioning completion never auto-pans. Renderer recovery should preserve a valid presentation snapshot or explicitly recover to Fit without changing the run.

Wheel/pinch response is immediate. Optional button Fit/focus easing is short (120–200ms) and disabled under reduced motion. Navigation never automatically pauses/ticks the game. Dispose all listeners, pointer capture and animations when the world is removed; no late callbacks may affect the next run.

## Direct world interaction — required target

| World target | Required behavior |
|---|---|
| Intake machinery/zone | Inspect; Limit intake / Restore intake using current controller contract |
| Absent Edge footprint | Request deployment through local confirmation/acknowledgement |
| Active Edge gateway | Inspect; Boost filtering when actually eligible |
| Active App facility | Inspect real instances/pressure |
| Physically empty next App bay | Expand through existing scale-out contract; locked/pending bays cannot promise capacity |
| Absent Cache footprint | Request deployment through local confirmation/acknowledgement |
| Provisioning Cache/Edge | Inspect inactive construction and real remaining time, not active work |
| Active Cache facility | Inspect real read-processing state |
| SQL core | Inspect separate read/write pressure; no scaling action |

Sighted pointer play must not require floating Add Cache/Add Edge/+ App Capacity/SQL Processing/Traffic Intake rectangles. Empty bays and construction footprints may use subtle floor markers that read as facility parts. Accessible DOM equivalents remain, including discoverable keyboard entry and visible focus; merely hiding essential controls from sighted keyboard users is insufficient.

Hit areas should be associated with the actual silhouette/footprint, with roughly 8–12 screen-pixel padding and usable minimum targets at low zoom. Define deterministic overlap priority, especially active App versus empty bay. Resolve pointer and keyboard operations through the **same** controller `select`, `actionReason` and `queueAction` boundaries. No direct mutation of resource state in React or Phaser.

Hover indicates target, not an invented available action. Focus uses a strong non-color outline. Selection uses a halo and a small projected/clamped action chip; detailed modal analysis requires explicit intent. Retain real cost/delay and unavailable-action reasons. Acknowledgement may be immediate; construction/activation/work must follow authoritative state.

## Gesture arbitration

Single tap resolves on release after gesture intent is known, not as a gameplay action on pointerdown. Movement beyond a documented CSS-pixel threshold changes the gesture to pan; a second pointer changes it to pinch/pan. Once a gesture is classified as navigation, releasing either pointer cannot synthesize a facility action.

Use pointer capture as appropriate and clean up on pointerup, pointercancel, lost capture, blur/visibility changes and disposal. Cancelled/outside releases must not purchase or expand anything. Keep multi-pointer tracking bounded and test one pointer remaining after pinch. Scope `touch-action` and cancellable non-passive wheel listeners to the playable surface, not the document. Browser page scrolling/zoom outside that surface remains normal. Shortcuts must not intercept typing or controls in Learn/results.

## React / Phaser boundary

```text
One PlayerCamera + Viewport snapshot
              │
     Fit / effective zoom / bounds
     worldToScreen / screenToWorld
              │
       Phaser world and hit testing
              │
    selection / requested existing action
              │
           Controller
```

Phaser owns world geometry, hit testing, camera projection application and interaction visuals. React owns global HUD, accessible semantic equivalents, Learn, results and optional detailed dialogs. Pure camera math may be shared; the snapshot and transformations must not fork. DOM action-chip/badge placement is a consumer of projection, not an independent coordinate authority. No new backend/protocol package or simulation state is needed.

## Accessibility and presentation

Provide compact focusable `[-] [100%] [+] [Fit]` controls with meaningful accessible names; the percentage is a readout, not a required extra action. Camera use is optional: keyboard users can reach every critical action and recover overview. Preserve focus across selection/close/retry and expose unavailable reasons. Touch targets, pinch/pan alternatives, reduced motion and shape/text state cues are required.

World-first composition, direct manipulation and physical growth replace console controls as the design target. Zoom rewards facility inspection; Fit rewards architecture understanding. HUD supports, never dominates. Outcome comes first; existing #185 analysis remains in Details. An 80–90% world-area/attention goal is design guidance only, not proof of game quality.

## Simulation invariants and performance

For navigation-only operations with the clock paused or deterministically held, architecture, queued actions/actionLog, budget/economy, runtime time and challenge identity remain exactly unchanged. While the game is running, time may advance **only through its existing clock**, not because of navigation. Compare identical action schedules with/without navigation for identical terminal results, scores and history comparability. Do not assert a running wall-clock snapshot stays frozen or pause automatically to make a test pass.

Transform existing scene objects/camera projection on navigation. Do not regenerate packet textures, rebuild every resource or redraw all environment geometry for each wheel delta. Keep representative packet/object bounds and cache ownership intact; invalidate geometry on actual relevant scene/viewport changes. Measure redraw counters/allocations and peak-traffic performance at Fit and close zoom, including active animation and reduced motion. Software CI timing is not real-device FPS evidence.

## Verification and staged documentation

Unit: projection roundtrip (document tolerance), Fit/effective zoom, finite inputs, min/max, pointer anchoring/clamp precedence, pan bounds, resize/focus and gesture cancellation. Browser: 320/390/1024/1440/1920, min/Fit/max hits for every facility/footprint/bay, 100 navigation operations with held runtime invariants, resize while zoomed, retry/pause/recovery, real keyboard buttons, supported touch gestures, scrolling outside world and reduced motion. State which touch coverage is emulated versus real hardware.

Before implementation (#197): update this contract, Visual Direction v0.5, PRD principles, roadmap, execution plan and authority index. Preserve current control descriptions in gameplay/technical/state docs and root README.

After the relevant implementation merges:
- #187/#188: update implemented coordinate ownership and camera integration in TECHNICAL_DESIGN; add actual supported navigation to GAMEPLAY_SPEC and root README only when integrated.
- #190–#192: update GAMEPLAY_SPEC direct-world actions and RESOURCE_VISUAL_STATES hover/focus/selected/construction projection, preserving existing lifecycle truth.
- #194: update current result hierarchy without discarding #185 evidence/eligibility semantics.
- #195: record current verified commands/counts and screenshots in root README as appropriate; do not convert a design-area goal into an absolute automated quality gate.

SIMULATION_SPEC, strategy balance, run-history/challenge semantics and asset policy/inventory need no changes for this epic. A proposed change there requires separate scope review, not a camera shortcut. Archives remain historical.

Actual unfamiliar-person review asks whether this looks/feels like a game before reading text and records the #195 questions verbatim. Coordinate #25/#151/#159, disclose the missing historical baseline, and never replace human evidence with AI scores or screenshots. Gated P1 remains separate.

## Reference basis

- [Phaser 3.90 BaseCamera](https://docs.phaser.io/api-documentation/3.90.0/class/cameras-scene2d-basecamera): camera transforms and inverse point conversion; use one coordinate space consistently.
- [MDN Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events): capture/cancellation and multi-pointer lifetime.
- [MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action): scoped browser gesture ownership.
- [MDN wheel event](https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event): delta normalization and cancellable listener behavior.
