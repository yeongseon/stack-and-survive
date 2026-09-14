# Player camera coordinate contract

Issue #187, first code child of [Game-first Visual Reframe #186](https://github.com/yeongseon/stack-and-survive/issues/186), after documentation prerequisite #197 (merged in #198). This is a subordinate implementation note for [Player Camera and World Interaction](PLAYER_CAMERA_AND_WORLD_INTERACTION.md), which owns cross-layer behavior and state boundaries. This foundation preserves the existing Fit view. User-facing navigation and nonidentity renderer transforms follow in #188; direct bay/footprint dispatch follows in #190. It does not establish a second camera authority.

## Three spaces, one transform

1. **Simulation positions**: fixed `tycoonPositions`, used by architecture/action/replay. Camera code never changes these.
2. **Responsive Fit plane**: the current `tycoonPoint` composition, normalized by `fitZoom = min(viewport.width / 1440, viewport.height / 900)`. Its aspect ratio follows the viewport and its resource anchors retain the existing desktop/portrait layout. These coordinates are visual, not persisted simulation positions.
3. **Screen**: the Fit plane projected by the shared editor `project`/`unproject` math, using negative center translation and `effectiveZoom = fitZoom * userZoom`.

`player-camera.ts` owns pure `PlayerCameraState { centerX, centerY, userZoom }`, projection, inverse, Fit reset, anchored zoom, pan, resize and resource focus. Its `resourceScreen` projection is currently used at identity Fit by renderer, hit tests and React overlay anchors; projections are reused per viewport instead of recreated per resource/frame. The existing editor camera and controller camera API are unchanged.

`fitToScreen`/`screenToFit` bridge existing preprojected geometry. In #188, apply this transform exactly once to scene objects and the same transform to DOM anchors/hit testing. A native Phaser camera can transform the existing Fit-coordinate geometry if manual user reprojection is not also applied. Do not transform resources manually and then apply the same camera again. Camera-only changes must not enter structure/texture/environment regeneration signatures.

## Bounds and input

Viewport dimensions must be finite and positive. Camera/point/delta inputs must be finite; invalid inputs throw rather than poisoning renderer geometry. User zoom clamps to .75–1.8; these are presentation defaults, not game balance. Viewport center is the default anchor for buttons; wheel/pinch may supply a pointer anchor.

Pan retains a viewport-half extent minus 10% of the visible extent inside each world axis. When the viewport is too large to pan an axis meaningfully (e.g. zoomed out), that axis stays centered. Thus the world cannot be permanently lost. Edge clamping takes precedence over exact pointer anchoring/focus; no promise is made that an edge resource always reaches exact center.

Resize preserves normalized center within the old/new Fit bounds and the user's zoom, then clamps. Responsive layout may reflow across the 900px breakpoint; a selected-resource focus command can explicitly center its new position but resize never dispatches an action. Fit and resource focus are pure functions; animation or UI-store ownership is deferred to navigation integration.

## Verification

Navigation integration shipped in #199: GameFloor owns one `createPlayerNavigation` store shared with Phaser and React. Native camera transforms Fit geometry; screenToFit resolves hits, fitToScreen anchors independent badges/plaques. Pointer release arbitrates taps versus drag/pinch/cancel. Keyboard/buttons provide pan/Fit/focus/zoom; camera state is not persisted. The original foundation paragraphs above describe #187 historically, not current absence of navigation. All response is immediate, including reduced motion.

Roundtrip numerical tolerance: 1e-9 for representative viewport and resource points. Tests cover five widths, relative/effective zoom, identity Fit compatibility, bounds, invalid input, pointer anchor, screen-space pan delta, portrait resize and focus. A controller isolation test verifies 100 camera calculations produce no publication or runtime/identity mutation. Existing editor and tycoon-layout tests stay unchanged. Browser foundation coverage checks actual Fit resource clicks and alignment; min/max rendered hits, touch/gesture cancellation, retry/pause and full identical-action replay tests belong to #188/#195.

No camera state is added to simulation, challenge, persisted architecture or history. No navigation UI or visual quality completion is claimed by this foundation.
