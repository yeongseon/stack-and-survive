# Replayability design

Version: 0.3. Epic #152's identity/ladder/history/profiles/result comparisons are implemented. Only actual voluntary replay acceptance (#159) remains; #160–#163 are closed not planned. [Challenge System](CHALLENGE_SYSTEM.md) owns schemas; [Strategy Balance](ARCHITECTURE_STRATEGY_BALANCE.md) preserves version-specific evidence.

> Can I build a better architecture for the same workload?

## Three loops and current status

| Loop | Desired cycle | Current state |
|---|---|---|
| Micro | Traffic → pressure → decision → accepted delay → visible consequence | Implemented; improvement depends on actual workload, not guaranteed |
| Run | Start → growth → survive/fail → result → compare → retry/next | Implemented outcome report, compatible comparisons, fresh retry, eligible next level and records |
| Meta | Challenge → clear → personal best → new objective → new strategy | Three-objective ladder, local bests and descriptive profiles implemented; modifiers not current scope |

An illustrative 10–20s decision cadence is a playtest hypothesis, not a timer to force decisions or fabricate incidents. Current simulation duration is 180s. Progression should change constraints, not grant permanent capacity/cache/stat bonuses.

## P0 contract

After identity and strategy calibration: a small deterministic ladder, compatible-run personal bests/history, evidence-based profiles and result CTAs that encourage a new experiment. #153→#154→#155→#156→#157→#158→#159 is the execution dependency chain. Preserve the current default workload unless an approved versioned content change is required.

Implemented profiles describe, not rank, behavior: Emergency bridge, Cache-first protection, Layered capacity, Cache-led expansion and mixed/unclassified fallbacks. [Architecture Profiles](ARCHITECTURE_PROFILES.md) owns precedence/evidence. No inferred efficiency or late-scaler label follows merely from installed resources; no invented quality stars or universal best profile.

## Results and local records

Show actual completion/objective result, architecture evidence, compatible previous/best differences and one useful next experiment. Next Level only points to an existing eligible level; Try Another Architecture keeps challenge conditions but resets to a fresh baseline. Learn remains secondary. Failed short runs are labeled separately and cannot win lowest-cost records against successful full runs.

[Run history](RUN_HISTORY.md) implements bounded/versioned records, input validation, quota/corruption/disabled-storage fallback, complete challenge identity and duplicate terminal-save protection. Best eligibility and first-tie rules are explicit. Local records are not online rankings or cheat-resistant evidence. No personal identifiers/backend upload is required.

## P1 after actual replay evidence

Objectives/modifiers vary a workload under deterministic rules; boss tests expose specific weaknesses; UTC daily challenges share dated conditions for the same content version; collections reflect actual discovered profiles without permanent power. Achievements or flow streaks remain optional candidates, not required new systems. If a streak is later approved, it must describe actual time above an objective threshold rather than replace architecture outcomes.

The optional replay-verifying leaderboard was separately authorized and implemented; it is not a progression gate. Do not add accounts, multiplayer, gacha, premium currencies, artificial waits, inventory or dozens of services merely to create superficial progression.

## Human gate

#159 observes whether an unfamiliar participant voluntarily begins a second run with a different idea. Record actions, version, assistance and verbatim reasons; distinguish prompted from voluntary retry. Ask what changed, what alternative they see, which tradeoff mattered and whether the result made them want to try again. If they decline, record that rather than coach or invent success. P1 waits for evidence or explicit owner rescoping.
