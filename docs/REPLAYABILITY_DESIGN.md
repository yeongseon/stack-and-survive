# Replayability design

Version: 0.1 proposal. Epic #152. **Not implemented**, except the current micro/run fundamentals described below. Concrete challenge schemas belong to [Challenge System](CHALLENGE_SYSTEM.md); measured strategies to [Strategy Balance](ARCHITECTURE_STRATEGY_BALANCE.md).

> Can I build a better architecture for the same workload?

## Three loops and current status

| Loop | Desired cycle | Current state |
|---|---|---|
| Micro | Traffic → pressure → decision → accepted delay → visible consequence | Implemented; improvement depends on actual workload, not guaranteed |
| Run | Start → growth → survive/fail → result → compare → retry/next | Start/result/fresh retry implemented; normal comparison/next-level planned |
| Meta | Challenge → clear → personal best → new constraint → new strategy | Not implemented |

An illustrative 10–20s decision cadence is a playtest hypothesis, not a timer to force decisions or fabricate incidents. Current simulation duration is 180s. Progression should change constraints, not grant permanent capacity/cache/stat bonuses.

## P0 contract

After identity and strategy calibration: a small deterministic ladder, compatible-run personal bests/history, evidence-based profiles and result CTAs that encourage a new experiment. #153→#154→#155→#156→#157→#158→#159 is the execution dependency chain. Preserve the current default workload unless an approved versioned content change is required.

Profiles describe, not rank, behavior. Scale-oriented, cache-oriented, protected and balanced are candidate categories, not selected pre-run classes. Labels such as late scaler require actual accepted-action timing; efficiency needs measured outcomes, not just presence of Cache. Define deterministic thresholds/ties and a mixed/unknown fallback before implementation. No invented quality stars or universal best profile.

## Results and local records

Show actual completion/objective result, architecture evidence, compatible previous/best differences and one useful next experiment. Next Level only points to an existing eligible level; Try Another Architecture keeps challenge conditions but resets to a fresh baseline. Learn remains secondary. Failed short runs are labeled separately and cannot win lowest-cost records against successful full runs.

History must be bounded/versioned, validate inputs, handle quota/corruption/disabled storage, record challenge/rules identity and prevent duplicate terminal saves. Best eligibility and tie rules are explicit. Local records are not online rankings or cheat-resistant evidence. No personal identifiers/backend upload is required.

## P1 after actual replay evidence

Objectives/modifiers vary a workload under deterministic rules; boss tests expose specific weaknesses; UTC daily challenges share dated conditions for the same content version; collections reflect actual discovered profiles without permanent power. Achievements or flow streaks remain optional candidates, not required new systems. If a streak is later approved, it must describe actual time above an objective threshold rather than replace architecture outcomes.

Do not add accounts, multiplayer, leaderboards, gacha, premium currencies, artificial waits, inventory or dozens of services to create superficial progression.

## Human gate

#159 observes whether an unfamiliar participant voluntarily begins a second run with a different idea. Record actions, version, assistance and verbatim reasons; distinguish prompted from voluntary retry. Ask what changed, what alternative they see, which tradeoff mattered and whether the result made them want to try again. If they decline, record that rather than coach or invent success. P1 waits for evidence or explicit owner rescoping.
