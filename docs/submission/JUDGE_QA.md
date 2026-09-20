# Judge Q&A

**Why Azure?** The game uses recognizable cloud roles to make architecture tradeoffs visible. Azure service badges identify roles; the game's artwork and rules are its own. No Microsoft endorsement is implied.

**Does playing deploy Azure resources?** No. Gameplay runs a browser simulation. An optional separately deployed leaderboard API is application infrastructure, not player-created Azure resources.

**Are capacity, latency and costs real Azure measurements?** No. They are deliberately bounded game assumptions documented in the simulation specification. Do not use the game to size production services or estimate Azure bills.

**Why not always buy everything?** Active infrastructure consumes funds. Only10% of successful customer revenue returns to funds. Cache helps reads, not writes; Edge filters bots but has false positives; additional App capacity can move the bottleneck to SQL. Highest availability need not yield highest overall score.

**Can players cheat scores?** Local storage is user-editable and not trusted competition. The optional server resolves a supported challenge, starts from the canonical architecture and replays validated actions to compute the score. This rejects client-supplied score manipulation but does not prevent bots, optimized offline schedules or impersonation of an unverified nickname.

**Is the global leaderboard live?** The optional API exists, but the last check rejected current 0.4 hashes (#306). Demonstrate local results honestly; historical 0.3 verified rows do not verify this run. Authorized backend rollout and fresh evidence are required. See [Current status](../CURRENT_STATUS.md).

**How is AI involved?** AI assisted implementation, original-art iteration and test/document preparation. Draft PR #316 separately implements post-run Azure OpenAI Bicep export plus curated Microsoft Learn links, but is not merged/deployed; actual model smoke is blocked on resources/settings. Do not present mocks as live AI, automated tests as human playtesting, or generated art as rights-cleared.

**Educational tool or game?** A strategy game intended to make consequences understandable through play. Learning and voluntary replay are hypotheses evaluated with real participants—not established merely by passing unit tests.

**Can you scale back down or upgrade SQL?** Yes: current App scale-in/out and tiers, SQL tiers and read replicas have delayed activation and running-cost tradeoffs. SQL starts visually compact and grows with active tier. Other clouds, functions/queues/failover, speed controls and actual provisioning remain outside current gameplay.

**Why React and Phaser?** React handles accessible controls and results; Phaser renders the fixed isometric world. A headless shared simulation owns processing and economics, so camera/art changes cannot decide outcomes. See the existing Technical Story links rather than describing a second server engine.
