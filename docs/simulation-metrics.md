# Simulation Metrics Derivation

All operational metrics are read-only projections of existing simulation state. They do not modify gameplay or scoring.

These values do NOT represent real Azure Monitor telemetry. They are educational approximations derived from the game simulation.

## Metric Derivations

| Metric | Source | Formula |
|--------|--------|---------|
| `requestsPerSecond` | `RequestSnapshot.offered` | `browse + order + bot` |
| `successRate` | `RequestSnapshot.successful` / `offered` | `(successful.browse + successful.order) / (offered.browse + offered.order)` |
| `p95LatencyMs` | `ServiceMetrics.peakLatency` | `peakLatency * 0.8` (approximation: p95 is typically ~80% of peak under load) |
| `appCpuPercent` | `RequestSnapshot.app.utilization` | `min(100, utilization * 100)` |
| `databaseUtilizationPercent` | `RequestSnapshot.sql` | `min(100, max(readUtilization, writeUtilization) * 100)` |
| `cacheHitRatioPercent` | `RequestSnapshot.cache.hitRatio` | `hitRatio * 100` (only when cache is active) |
| `blockedBotRequests` | `RequestSnapshot.edge.filtered.bot` | Direct value (only when edge is active) |
| `estimatedCostUnits` | `Economy.infrastructureCost` | Cumulative cost in educational units |

## Resource Health Thresholds

| Threshold | Value | Source |
|-----------|-------|--------|
| Healthy | utilization < 0.7 | Matches existing world-guide hint threshold |
| Warning | 0.7 <= utilization < 1.0 | Matches existing latency multiplier breakpoint |
| Critical | utilization >= 1.0 | Matches existing overload detection |
| Offline | resource.remaining > 0 | Resource still provisioning |

## Alert Thresholds

| Alert | Threshold | Source |
|-------|-----------|--------|
| App Warning | utilization >= 0.7 | Reuses world-guide threshold |
| App Critical | utilization >= 1.0 | Reuses overload detection |
| Database Warning | utilization >= 0.7 | Consistent with app threshold |
| Database Critical | utilization >= 1.0 | Reuses overload detection |
| Bot Detection | bot ratio >= 5% | First meaningful bot phase |
| Traffic Surge | rps > 1.5x previous tick | Significant increase |

## Cost Model

Uses existing simulation educational cost units. NOT based on Azure pricing.

Infrastructure costs per minute: App Service 5, Azure SQL 12, Redis Cache 8, WAF/Edge 3.
Emergency WAF: 8 units per activation (30-tick duration).
Revenue: browse 0.002 per request, order 0.05 per request.
