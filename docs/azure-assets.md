# Azure service identity and asset provenance

This workstream keeps Stack & Survive's independent text wordmark and original game facilities. It does not reproduce Azure portal chrome, attach Microsoft/Azure logos to the project name, or imply endorsement. Icons identify represented services, not the game itself.

## Existing official icons reused unchanged

Source: [Microsoft Azure Architecture Center icons](https://learn.microsoft.com/en-us/azure/architecture/icons/).
Archive: `https://arch-center.azureedge.net/icons/Azure_Public_Service_Icons_V24.zip`.
Archive SHA256: `921594ccd1bf3d9c0a1bd7b6d924e050551a59342f2b353bb74bdcf761c35141`.
The repository retrieved it on 2026-09-12. The source guidance was checked again on 2026-09-18.

| Existing local asset | Official service / original archive suffix | Use in this change |
|---|---|---|
| `app-service.svg` | Azure App Service — `Icons/app services/10035-icon-service-App-Services.svg` | Application-tier identity beside full service name in node and existing world |
| `azure-sql.svg` | Azure SQL Database — `Icons/databases/10130-icon-service-SQL-Database.svg` | Data-tier identity; fixed game SQL capacity, no scale action |
| `managed-redis.svg` | Azure Managed Redis — `Icons/databases/03675-icon-service-Azure-Managed-Redis.svg` | Eligible-read cache identity, not a renamed legacy Redis icon |
| `application-gateway.svg` | Azure Application Gateway — `Icons/networking/10076-icon-service-Application-Gateways.svg` | Existing Protected Edge/WAF abstraction; no new independent Application Gateway gameplay resource |

Local directory: `apps/web/public/assets/azure-icons/`. Exact individual file hashes and retained `Microsoft_Terms_of_Use.pdf` are documented in [existing attribution](../apps/web/public/assets/ATTRIBUTION.md) and pinned by `art/asset-manifest.json`. No runtime asset file or manifest changed in this workstream. No SVG contents were copied into custom art. Images retain color, orientation, shape and aspect ratio with `object-fit: contain`; no filter, recolor, crop, outline of artwork, rotation or icon combination.

Microsoft's published architecture-icon scope covers architectural diagrams, training and documentation; other uses may require explicit permission. The existing interactive-demo usage is an owner-directed exact-inventory exception, **not independently verified Microsoft permission or a general redistribution license**. This feature does not widen that exception or settle #164. The official import script remains unchanged.

## Neutral concept definitions — no new official assets

| Service name | Presentation | Gameplay status / outstanding asset work |
|---|---|---|
| Azure Front Door | Text-only edge concept | Not simulated/selectable. TODO: confirm exact official asset and interactive-use scope before importing. |
| Azure Web Application Firewall | Text-only security concept | Represented within existing Protected Edge, not an independent deployment. TODO: verify standalone icon and use scope. |
| Azure Monitor | Text-only operations concept | No actual monitoring integration or generated telemetry. TODO: verify icon and use scope. |
| Application Insights | Text-only operations concept | Not deployed/simulated. TODO: verify icon and use scope. |

These are neutral text definitions, **not invented Azure-like artwork**. A missing official resource image falls back to a plain role abbreviation alongside the full service name. Unsupported items are non-interactive; the reusable node also disables their selection if a caller supplies an action accidentally.

## Screenshots, not production assets

Before/after PNGs live in `docs/workstreams/azure-visual-experience/`. They are real browser captures, not new runtime art. The capture script blocks external requests and uses the local production build, reduced motion and actual Pause → Inspect controls. No game-state injection or sped-up ticks are used. Original screenshot pixels are retained. These captures do not establish human comprehension, aesthetic approval, or rights clearance.
