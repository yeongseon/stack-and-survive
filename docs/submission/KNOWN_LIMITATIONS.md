# Known limitations and evidence boundaries

- Balance0.3 values are game rules, not Azure performance/pricing. Three objectives reuse the same180-second workload.
- No runtime scale-in, SQL scaling, persistent FIFO or arbitrary normal-player wiring. Lost requests are not completed later.
- Local rankings are device/browser-specific and editable. Nicknames are self-reported. Server replay checks outcome consistency, not human play or anti-automation.
- Backend code/configuration does not establish that the API is deployed. Repository API settings may exist without a healthy endpoint. Verify health, allowed browser origin, persistence/restart and one authorized replay submission with the backend owner.
- The [2026-09-16 UTC release checkpoint](RELEASE_CHECKPOINT.md) records a historical browser CORS failure. Issue #260 is now closed and PR #261 merged; see [final release readiness](FINAL_RELEASE_READINESS.md) for newer browser evidence and remaining production submission/persistence gates.
- File persistence is single-instance only; do not make unsupported multi-replica durability claims. Do not erase data to hide a failed recovery.
- Progress/history survive only when browser storage works. In-progress runs are not restored after refresh. Versioned conditions do not mix old balance records with new scores.
- Phone gameplay is landscape-first; fullscreen/orientation/vibration support varies. Browser emulation is not actual hardware acceptance.
- Automated 125%/150% layout checks use the equivalent reduced CSS viewport, not a claim that browser-chrome zoom or an OS screen magnifier was exercised. Actual user-agent zoom remains part of manual accessibility review.
- The project Pages entry can inherit account-domain redirection. Static404 provides a return link; arbitrary URLs are not saved runs.
- Social metadata can be inspected without JavaScript, but third-party card caching/rendering requires actual platform checks. No claim that Slack/Discord/GitHub displays were reviewed unless recorded.
- Original SVG favicon is embedded in HTML; social preview reuses an already-approved project-art PNG. No new external art pack is introduced. #245 Iteration04 is a separate environment experiment awaiting owner review: no runtime adoption is implied.
- #164 code/art licensing, Azure icon conditions and employer/Hackathon review remain human decisions. The exact-inventory demo exception is not general rights clearance.
- #149 listening/physical haptics and #25/#195/#159 participant validation are not completed by automation. Use the worksheet and record both failures and assistance honestly.

Release record (fill with actual observations): commit ______; artifact ______; Quality run ______; Pages deploy job ______; final URL/redirect ______; API endpoint/health/replay evidence ______; browser/device ______; screenshot/video pack ______; remaining blockers ______. Do not fill these from assumptions.
