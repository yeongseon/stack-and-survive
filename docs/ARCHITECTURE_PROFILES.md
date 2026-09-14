# Descriptive architecture profiles

Version 1, issue #157. Profiles describe verified local run summaries; they do not change simulation, scores, unlocks or resources. A profile is not a rank or a claim of optimality. Failed attempts explicitly retain their stopped duration and measured availability.

## Deterministic rules

Only active final resources and accepted actions count. Accepted actions are ordered by time, then sequence; simultaneous requests therefore use actual accepted ordering. Preconfigured resources alone do not imply live-action timing.

Precedence is:
1. **Emergency bridge**: active Cache and Edge, an accepted filtering boost and positive measured emergency cost.
2. **Cache-first protection**: active Cache and Edge, with accepted Cache deployment ordered before the first accepted App expansion.
3. **Layered capacity**: the same active layers, with first App expansion ordered before Cache deployment.
4. **Cache-led expansion**: active Cache and accepted App expansion without active Edge.
5. **Your own approach**: explicit mixed fallback when no named pattern matches.
6. **Unclassified operation**: no record provenance available.

The classifier consumes records already verified by the history boundary; it does not replay during rendering or independently authenticate user-supplied records. Inactive/pending resources do not count as installed capacity. No efficiency or late-scaler label is inferred from resource presence. Evidence displays actual duration, availability, capacity, cost and accepted request timing; request time is not activation time.

Tradeoff explanations use existing rules (Edge false positives, bot App consumption, Cache reads versus SQL writes). Suggested experiments are proposals, not guaranteed improvements or simulated counterfactuals. Four full 180-second live-run fixtures from App1 establish reachability on unchanged Black Friday, alongside sequence-tie, rejected-action, pending-deployment, missing-data and failure cases. Actual replay motivation remains the separate human validation in #159.
