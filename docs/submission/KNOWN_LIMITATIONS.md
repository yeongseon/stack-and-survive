# Known limitations and evidence boundaries

- Rules 0.4 values are game rules, not Azure performance/pricing. Three objectives reuse the same 180-second workload.
- App scale-in/out/tiers and SQL tiers/read replicas are implemented. Persistent FIFO, arbitrary normal-player wiring, Cache scaling and failover are not. Lost requests are not completed later.
- Local rankings are device/browser-specific and editable. Nicknames are self-reported. Server replay checks outcome consistency, not human play or anti-automation.
- Backend code/configuration does not establish that the API is deployed. Repository API settings may exist without a healthy endpoint. Verify health, allowed browser origin, persistence/restart and one authorized replay submission with the backend owner.
- Historical CORS #260 is resolved. Current #306 is a different failure: the configured MCAPS API returns 400 for the 0.4 hash. Health/legacy scores do not prove current compatibility. [Current status](../CURRENT_STATUS.md) owns current deployment evidence; old checkpoints remain historical.
- File persistence is single-instance only; do not make unsupported multi-replica durability claims. Do not erase data to hide a failed recovery.
- Progress/history survive only when browser storage works. In-progress runs are not restored after refresh. Versioned conditions do not mix old balance records with new scores.
- Phone gameplay is landscape-first; fullscreen/orientation/vibration support varies. Browser emulation is not actual hardware acceptance.
- Automated 125%/150% layout checks use the equivalent reduced CSS viewport, not a claim that browser-chrome zoom or an OS screen magnifier was exercised. Actual user-agent zoom remains part of manual accessibility review.
- The verified public `github.io` entry no longer redirects to the former account domain. Recheck redirects after hosting changes. Static 404 provides a return link; arbitrary URLs are not saved runs.
- Social metadata can be inspected without JavaScript, but third-party card caching/rendering requires actual platform checks. No claim that Slack/Discord/GitHub displays were reviewed unless recorded.
- Original SVG favicon is embedded in HTML; social preview reuses approved project art. #245 is merged archived experiment evidence, not runtime adoption.
- Export to Azure and Microsoft Learn result links are implemented only in unmerged draft #316. Its 718-test/AI-mock evidence is not main's 672-test release or a real model invocation. MCAPS OpenAI resources/settings were absent; actual generated-template compilation and human review remain pending.
- #164 code/art licensing, Azure icon conditions and employer/Hackathon review remain human decisions. The exact-inventory demo exception is not general rights clearance.
- #149 listening/physical haptics and #25/#195/#159 participant validation are not completed by automation. Use the worksheet and record both failures and assistance honestly.

Release record (fill with actual observations): commit ______; artifact ______; Quality run ______; Pages deploy job ______; final URL/redirect ______; API endpoint/health/replay evidence ______; browser/device ______; screenshot/video pack ______; remaining blockers ______. Do not fill these from assumptions.
