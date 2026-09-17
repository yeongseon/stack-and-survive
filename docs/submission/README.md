# Submission asset pack

This is preparation material, not a claim that the submission, recording, listening or human session is complete. Record the exact release SHA and Pages artifact before using it. The client/release owner maintains this pack; the backend owner maintains API deployment and its evidence.

- [Two-minute demo script](DEMO_SCRIPT.md)
- [Demo fallback and recovery](DEMO_FALLBACK.md)
- [Reproducible screenshot plan](SCREENSHOT_PLAN.md)
- [Judge questions and honest answers](JUDGE_QA.md)
- [Known limitations and release evidence](KNOWN_LIMITATIONS.md)
- [Dated release checkpoint and remaining owners](RELEASE_CHECKPOINT.md)
- [One-session human worksheet](HUMAN_TEST_SCRIPT.md)

Technical sources: [simulation rules](../SIMULATION_SPEC.md), [submission technical notes](../SUBMISSION_TECHNICAL_NOTES.md), [leaderboard architecture](../LEADERBOARD_ARCHITECTURE.md), [deployment instructions](../LEADERBOARD_DEPLOYMENT.md), [rights status](../LICENSING_STATUS.md). The first four explain implementation; none independently proves the public API is running, a participant understood the game or rights are cleared.

Release candidate: frozen install → lint → typecheck → unit/art/asset checks → production build/player tests → QA build/browser tests → project-path Pages build/tests → captures → review actual images → successful exact-main deploy job → live smoke. Test counts and SHA belong to that run's evidence, not a permanently hardcoded success claim. Fix observed release blockers; do not add mechanics during submission preparation.
