# Optional sound and feedback

Implementation scope: #149. The game remains fully playable muted. No downloaded audio file, third-party sample or runtime asset import is used.

## Original synthesis and provenance

`apps/web/src/synth-sound.ts` creates project-authored sine/triangle oscillator envelopes with Web Audio. Short note recipes cover click, accepted construction, completion, warning, first Cache/Edge activity, success and failure. A quiet 72 Hz sine provides optional running ambience. These are procedural source-code assets, not CC0 files or licensed recordings. Code/original-work licensing remains the human decision tracked in #164.

The runtime file inventory in `art/asset-manifest.json` is unchanged because no audio file is shipped; this source-code provenance complements, rather than bypasses, that inventory. The existing hash-pinned Pages demo asset exception is unchanged.

## User control and lifecycle

- Sound and vibration default off. Preferences are validated/versioned in `stack-and-survive.sound.v1`; unavailable storage falls back without blocking play.
- Learn, How to Play and About offer Enable/Mute, Volume and optional vibration controls. No AudioContext is created before an explicit enabling/start gesture, even with saved preferences.
- The game clock is independent of sound. Accepted transitions generate bounded cues; no per-request sound. Repeated snapshots do not replay completion.
- Warnings have an eight-second cooldown, click/build/etc. use independent short cooldowns. A click cannot suppress a failure or completion cue.
- Maximum eight oscillators includes ambience. A phrase is admitted as a whole, not partly truncated. Terminal cues replace occupied effect channels.
- Pause, hidden tab, reset/error and disposal stop sounds as appropriate. Hidden events are not replayed on return. Late resume/dispose and device/vibration failures cannot interrupt the controller.
- Native vibration availability is feature-detected, not guaranteed by API presence. Unsupported/declined vibration is disclosed and never required for understanding.

## Automated evidence versus manual acceptance

Unit tests use injectable sound ports and mocked Web Audio to check unlock, mute/volume, late promises, visibility, duplicate cues, voice bounds, cleanup and API failure containment. Browser tests cover opt-in settings, saved volume, corrupt/unavailable services and unchanged title/operation. They do **not** constitute listening or physical haptics evidence.

Remaining manual #149 checklist (record browser/device, volume and observations honestly):

- Listen to each cue at low/default/high volume; check harshness, clipping, overlap and relative loudness.
- Check ambient hum is optional and quiet, warning cadence tolerable, and failures/completions identifiable without misleading causation.
- Confirm mute, zero volume, pause, background tab and reset stop audible output.
- On a supporting device, separately verify optional vibration and opting out. If unsupported, record that instead of a pass.

Until those observations exist, #149 remains open for manual acceptance even after the implementation is merged. No automatic or AI review may fill this checklist as if a person listened.
