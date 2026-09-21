# Submission asset pack

Start with [Current status](../CURRENT_STATUS.md) for `c68ec0c` deployment, API #306 and draft-only Export/Learn #316. Both demo videos and the English PDF are public; event submission remains unconfirmed. Historical checkpoint reports are not current task lists.

These guides are preparation material, not proof that a submission, listening or human session occurred. Recording/capture completion is revision-specific and recorded in the [live checklist #7](https://github.com/yeongseon/stack-and-survive/issues/7). Record the exact release SHA and Pages artifact before using media. The client/release owner maintains this pack; the backend owner maintains API deployment and its evidence.

- [Global submission English draft and final checks](GLOBAL_SUBMISSION.md)
- [Dated hackathon handoff, current blockers and presenter runbook](HACKATHON_HANDOFF.md)
- [Seven-slide English presentation and PDF](../../showcase/README.md)
- [Two-minute demo script](DEMO_SCRIPT.md)
- [Current bottleneck demo, historical two-minute overview and transcripts](../DEMO_VIDEO.md)
- [Demo fallback and recovery](DEMO_FALLBACK.md)
- [Reproducible screenshot plan](SCREENSHOT_PLAN.md)
- [Judge questions and honest answers](JUDGE_QA.md)
- [Known limitations and release evidence](KNOWN_LIMITATIONS.md)
- [Dated release checkpoint and remaining owners](RELEASE_CHECKPOINT.md)
- [One-session human worksheet](HUMAN_TEST_SCRIPT.md)
- [Blank 3–5-participant summary and honest reporting rules](HUMAN_TEST_SUMMARY.md)
- [Illustrated player guide](../PLAYER_GUIDE.md) — actual screenshots and how to play.
- [Development and capture workflow](../DEVELOPMENT.md#screenshots-and-demo-evidence) — reproduce media and validate its provenance.

Technical sources: [simulation rules](../SIMULATION_SPEC.md), [submission technical notes](../SUBMISSION_TECHNICAL_NOTES.md), [leaderboard architecture](../LEADERBOARD_ARCHITECTURE.md), [deployment instructions](../LEADERBOARD_DEPLOYMENT.md), [rights status](../LICENSING_STATUS.md). The first four explain implementation; none independently proves the public API is running, a participant understood the game or rights are cleared.

Release candidate: frozen install → lint → typecheck → unit/art/asset checks → production build/player tests → QA build/browser tests → project-path Pages build/tests → captures → review actual images → successful exact-main deploy job → live smoke. Test counts and SHA belong to that run's evidence, not a permanently hardcoded success claim. Fix observed release blockers; do not add mechanics during submission preparation.
