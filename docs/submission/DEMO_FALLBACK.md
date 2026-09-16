# Demo fallback

1. Verify the project entry `https://yeongseon.github.io/stack-and-survive/` and note any inherited account-domain redirect. Do not change account-wide DNS to repair a project link.
2. Confirm the exact main Quality run succeeded **and** its Pages deploy job executed successfully. A skipped stale-main job can have a successful workflow conclusion without publishing anything.
3. If network/API is unavailable, describe the board as **local scores**. The browser game does not require the optional leaderboard server. Never fake a server badge or successful global submission.
4. If WebGL fails, use **Rebuild graphics** and confirm the current run was preserved. If it fails again, **Return to title** and disclose the interruption.
5. If phone orientation/fullscreen is unsupported, rotate manually or use desktop. Do not claim physical-device support from browser emulation.
6. If live presentation cannot proceed, show labeled prerecorded excerpts from the capture manifest. Do not imply the recorded run is live. A local production build can be served with the documented Vite preview command; do not deploy the QA/editor artifact as a fallback.
7. An unknown URL serves a simple404 recovery page with a project-home link. Refreshing the actual game entry returns to title; it does not restore an in-progress run. The game is not a multi-route SPA and arbitrary paths are not saved challenges.

Before presentation: retain a local production build, reviewed screenshots, a labeled video and this script. Keep them associated with a specific commit and artifact hash. Do not delete leaderboard persistence files or change hosting/storage settings as a quick fix; involve the backend owner.
