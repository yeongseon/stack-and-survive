# Judge Q&A

**Why Azure?** The game uses recognizable cloud roles to make architecture tradeoffs visible. Azure service badges identify roles; the game's artwork and rules are its own. No Microsoft endorsement is implied.

**Does playing deploy Azure resources?** No. Gameplay runs a browser simulation. An optional separately deployed leaderboard API is application infrastructure, not player-created Azure resources.

**Are capacity, latency and costs real Azure measurements?** No. They are deliberately bounded game assumptions documented in the simulation specification. Do not use the game to size production services or estimate Azure bills.

**Why not always buy everything?** Active infrastructure consumes funds. Only10% of successful customer revenue returns to funds. Cache helps reads, not writes; Edge filters bots but has false positives; additional App capacity can move the bottleneck to SQL. Highest availability need not yield highest overall score.

**Can players cheat scores?** Local storage is user-editable and not trusted competition. The optional server resolves a supported challenge, starts from the canonical architecture and replays validated actions to compute the score. This rejects client-supplied score manipulation but does not prevent bots, optimized offline schedules or impersonation of an unverified nickname.

**Is the global leaderboard live?** Answer from current deployment evidence, not repository contents. The code and deployment wiring exist; show global results only when the configured API actually responds and verifies submissions. Otherwise explicitly demonstrate local scores. The backend owner is responsible for endpoint/persistence verification.

**How is AI involved?** AI assisted implementation, original artwork iteration and test/document preparation. Engineering checks and screenshot review are recorded. Do not portray automated tests as human playtesting or claim generated art is licensed beyond documented decisions.

**Educational tool or game?** A strategy game intended to make consequences understandable through play. Learning and voluntary replay are hypotheses evaluated with real participants—not established merely by passing unit tests.

**Other clouds, SQL scaling or more resources?** Possible future projects, not current functionality or promised roadmap. This release deliberately keeps one workload family and a small supported action set. No scale-in, permanent FIFO, speed controls or actual Azure deployment.

**Why React and Phaser?** React handles accessible controls and results; Phaser renders the fixed isometric world. A headless shared simulation owns processing and economics, so camera/art changes cannot decide outcomes. See the existing Technical Story links rather than describing a second server engine.
