# ADR-002: Game Engine Selection

## Status

Proposed — pending comparative spike. No engine has been selected and no spike has been executed.

## Context

Stack & Survive requires:

- Web-first deployment and TypeScript
- Fixed 2D / 2.5D view
- Building placement, selection, and dragging
- Pan / zoom
- Traffic animation and connection visualization
- Mobile-web readiness, without requiring a mobile client for the MVP
- React HUD integration
- A renderer-independent simulation

See [Technical Design, sections 17–21](../TECHNICAL_DESIGN.md#17-game-engine-decision).

## Candidates

- Phaser
- PlayCanvas

## Spike

Timebox the combined comparison to approximately half a day to one day. Build the same small scene with each candidate:

```text
Internet → App Service → Azure SQL
```

Required checks:

- Render buildings in a fixed isometric or equivalent view.
- Select and drag App Service.
- Pan and zoom without interfering with selection.
- Draw a directional connection.
- Animate 100+ representative packets, not one object per simulated request.
- Display an explicit SQL overload state.
- Mount alongside a minimal React HUD and cleanly destroy/remount the renderer.

Use the same static architecture and synthetic snapshot fixtures for both candidates. Do not implement simulation rules inside either prototype. Production packaging, polished assets, mobile UI, and Azure deployment are outside this spike.

Record observations rather than assumed engine capabilities:

| Check | Phaser | PlayCanvas |
|---|---|---|
| TypeScript setup and React integration | Not tested | Not tested |
| Placement, selection, connections, pan / zoom | Not tested | Not tested |
| Packet animation and overload feedback | Not tested | Not tested |
| Responsiveness on the same browser / hardware | Not tested | Not tested |
| Development effort and integration obstacles | Not tested | Not tested |
| Touch-input feasibility | Not tested | Not tested |

## Decision

TBD after the spike.

Prefer Phaser if sprite-based 2D / isometric rendering meets the needs with lower implementation effort. Prefer PlayCanvas if depth and 3D transforms provide a demonstrated benefit that justifies additional complexity. These are selection criteria, not test results.

Change the status to **Accepted** only after recording the chosen engine, evidence, and trade-offs. Do not maintain two production renderers.

## Consequences

- The simulation engine remains independent from the selected engine.
- React owns the surrounding HUD and menus; the renderer owns presentation of the world, not gameplay truth.
- Only the selected adapter advances into the MVP.
- Native applications and full 3D gameplay remain outside the Hackathon scope.
