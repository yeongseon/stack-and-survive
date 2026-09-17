# Stack & Survive — demo video

[Back to README](../README.md) · [Play the game](https://yeongseon.github.io/stack-and-survive/)

[![Open the gameplay video](media/demo-preview.jpg)](https://raw.githubusercontent.com/yeongseon/stack-and-survive/main/docs/media/stack-and-survive-demo.mp4)

**[Watch / download MP4](https://raw.githubusercontent.com/yeongseon/stack-and-survive/main/docs/media/stack-and-survive-demo.mp4)** · [Repository file](media/stack-and-survive-demo.mp4)

GitHub Markdown does not reliably provide an inline player for a committed MP4. Click the preview or video link to open the file; if the browser downloads it, play it locally. The video is not loaded by the game, so it does not increase gameplay asset downloads.

## What the video shows

This is a **120-second, silent, edited recording of actual ordinary-player gameplay**, prepared for live narration. It begins with an actual title-screen still held for15seconds. Moving clips remain at original speed; cuts omit parts of the180second operation and pauses. The footage was captured from the public Pages build, not the development editor or a mockup.

| Time | Picture | Suggested Korean narration / descriptive transcript |
|---|---|---|
| 0:00–0:15 | Actual title screenshot | “Stack & Survive는 실시간 클라우드 아키텍처 전략 게임입니다. 같은 트래픽에도 무엇을 언제 확장하느냐에 따라 결과가 달라집니다.” |
| 0:15–0:30 | Opening camera and countdown | “Internet, App, SQL로 시작합니다. 화면의 달러는 가상 비즈니스 금액이며 실제 Azure 가격이 아닙니다.” |
| 0:30–0:55 | Normal operation and construction | “확장을 눌러도 즉시 용량이 생기지는 않습니다. 건설이 끝나야 App, Cache, Edge가 부하를 처리합니다.” |
| 0:55–1:15 | Customer spike and expanded infrastructure | “App은 처리 용량을 늘리고, Cache는 읽기 부하를 줄입니다. 비용과 준비 시간을 함께 고려해야 합니다.” |
| 1:15–1:35 | Bot attack and changed traffic paths | “Edge는 봇 부하를 걸러내지만 정상 요청 오탐도 있습니다. 무조건 많이 짓는 대신 어떤 부하를 줄일지 선택합니다.” |
| 1:35–1:50 | Real completed result, score9454 | “이 실행은 180초 운영을 완료했습니다. 가용성과 비즈니스 결과를 보고 다음 전략을 판단합니다.” |
| 1:50–2:00 | Player Name, existing global rows and pending/local fallback transition | “이름으로 기록을 남길 수 있습니다. 서버는 점수 숫자가 아니라 행동 기록을 재실행해 검증합니다. 여기 보이는 글로벌 순위는 기존 검증 기록이며, 이번 실행은 공개 제출하지 않았습니다.” |

The transcript is suggested narration, **not an audio track**. On-screen labels identify edited gameplay, the title still and the existing-global-score limitation. Narration and any actual listening/haptic acceptance remain separate.

## Recording identity and verification

| Property | Value |
|---|---|
| Released source / Pages SHA | `24ca38805015cf87de710cb2ce9ffa5904ffc14f` |
| Capture started | 2026-09-17T19:48:52.611Z |
| Public game | https://yeongseon.github.io/stack-and-survive/ |
| Browser | Chromium153.0.8010.12, automated ordinary-player inputs |
| Source recording | 239.48seconds; includes startup, real180second operation and result interaction |
| MP4 | H.264,1440×900,25fps,120.000seconds; no audio stream |
| File size | 5,672,442bytes (about5.4MiB) |
| MP4 SHA256 | `3f25999e31d12c5b733dedb7af8580c24a1f268c7a6b2798d279a6bcb3861cf9` |
| Raw recording SHA256 | `dbfa723433fb08c25ea59309fd144795f871f0fad4e2814d49b623e440a79d3f` |
| Title still SHA256 | `38ac281c29c81202622e2573ea7f2597e1331ac0f25e59b4bbbee1ee7bff937b` |

The MP4 is remuxed with `faststart` for browser delivery, without changing the encoded video. Full-file FFmpeg decode and ffprobe duration/codec checks succeeded. This verifies decoding, not human acceptance or all-device playback. The preview is extracted from the video at55seconds.

### Edit provenance

Output uses: title still15s; raw video0–15s,15–40s,40–60s,105–125s,216–231s,228–238s. The last two clips overlap by3seconds intentionally. Source cuts do not follow an invented action timeline. The raw recording and capture manifest are retained in PC3 evidence; they are not bundled into gameplay assets.

## Demonstration boundaries

- No injected score, accelerated simulation or invented participant. Automation drove real player controls.
- Existing server rows were read successfully. Before saving YS, the capture runner deliberately aborted API requests in its browser context to demonstrate local fallback. That is not evidence of a successful public submission for this run.
- The visible result and the server board are different: score9454 belongs to this local run; the displayed8500point entries belong to previously verified server runs.
- This video does not establish unfamiliar-player comprehension, voluntary replay, listening, physical vibration or rights clearance.
- Recording a released demo does not grant broader reuse rights. See [licensing status](LICENSING_STATUS.md), [asset attribution](../apps/web/public/assets/ATTRIBUTION.md) and the [demo exception](PAGES_DEMO_EXCEPTION.md).

For presentation fallback, download the MP4 before the event. For a live demonstration, use the game link. See the [demo fallback guide](submission/DEMO_FALLBACK.md) and [submission checklist](submission/README.md).
