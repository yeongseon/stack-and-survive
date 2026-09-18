# Showcase — 고객지원 경험에서 시작한 발표

**[PDF 다운로드](stack-and-survive-showcase.pdf)** · [브라우저 슬라이드](slides.html) · [발표 대본](SPEAKER_NOTES.md) · [게임 플레이](https://yeongseon.github.io/stack-and-survive/)

발표는 고객지원 경험에서 출발해, 공식 문서 이전에 개념 간 관계를 경험하게 하려는 교육용 게임의 **motivation → gameplay → tradeoff → engineering → learning position** 순서로 구성됩니다. 한국어 중심의 8장·약 3분이며, 대본에 60초 압축 버전과 20–30초 라이브 전환 문구를 포함합니다.

**개인적인 제품 동기이며 Microsoft Learn에 대한 Microsoft의 공식 평가가 아닙니다.** 공식 문서의 품질을 비판하거나 대체하려는 자료가 아니며, 공식 교육 자료·보증·검증된 교육 효과를 주장하지 않습니다. 고객 식별 정보, 내부 사례나 비공개 시스템 화면은 사용하지 않습니다.

> Same workload. Different architectures. Different outcomes.<br>
> Build. Scale. Keep the business flowing.

## 슬라이드 실행

GitHub에서는 `slides.html`이 소스로 보입니다. 저장소를 내려받아 브라우저로 직접 열거나, **저장소 루트**에서 실행하세요. 외부 CDN·폰트·발표 프레임워크는 필요하지 않습니다.

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

`http://127.0.0.1:8080/showcase/slides.html`을 엽니다. 이미지가 `../docs/images/`를 참조하므로 HTML만 따로 옮기지 마세요. 서버는 loopback에서만 사용하고 Ctrl+C로 종료합니다. Python은 선택적 문서 서버용이지 게임 의존성이 아닙니다.

| 조작 | 기능 |
|---|---|
| ← / →, PageUp / PageDown | 이전 / 다음 슬라이드 |
| Home / End | 처음 / 마지막 슬라이드 |
| 이전 / 다음 버튼 | 마우스·터치·키보드로 이동 |
| 인쇄 / PDF | 전체 슬라이드를 가로 페이지로 인쇄 |
| PDF 다운로드 | 포함된 8페이지 PDF 저장 |

`#slide-3`처럼 슬라이드 번호가 URL에 표시됩니다. JavaScript를 끄면 모든 슬라이드가 문서 순서대로 보입니다. 자동 넘김·음악·자동 전체화면은 없습니다.

## PDF와 재생성

`stack-and-survive-showcase.pdf`는 이미지가 포함된 **A4 가로 8페이지**입니다. PDF만 따로 전달해도 됩니다. GitHub PDF 화면의 다운로드 버튼으로 원본 파일을 저장할 수 있습니다.

내용·스타일 변경 후 저장소 루트에서 다시 생성하세요:

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
node showcase/export-pdf.mjs
```

내보내기는 로컬 HTML·폰트·이미지를 읽으며 게임/API를 호출하지 않습니다. 브라우저 인쇄에서도 전체 8페이지를 저장할 수 있습니다. 머리글/바닥글을 끄고 필요하면 배경 그래픽을 켭니다. PDF와 소스가 다른 버전이 되지 않도록 함께 갱신하세요.

## 발표 운영과 안전한 대체 시연

- 본문 시간 예산: **25 + 20 + 20 + 25 + 20 + 25 + 25 + 20 = 180초**. 실제 발표자가 2:50–3:10으로 리허설해야 하며, 아직 실제 낭독 완료로 기록하지 않습니다.
- 한 판 전체는 **180초 + 시작·결과 시간**입니다. 본문 3분 안에 한 판을 더 넣지 않습니다. 라이브는 별도 20–30초로 멈추고, 결과는 녹화된 별도 시점임을 밝힙니다.
- API가 없어도 로컬 게임·결과를 사용합니다. 로컬 기록을 서버 검증 순위처럼 설명하지 않습니다. [대체 시연 계획](../docs/submission/DEMO_FALLBACK.md)을 준비하세요.
- 공개 리더보드에 테스트 점수를 반복 제출하지 않습니다. 운영 확인은 담당자와 조율합니다.
- 슬라이드의 기존 실제 캡처는 `24ca388`입니다. [이미지 출처](../docs/images/README.md)를 유지하고, 로컬 `DEMO` 점수를 공개 서버 사람 참가 결과로 설명하지 않습니다.
- 실제 사용자 이해도·자발적 재시도·청취/기기·권리 승인은 자동 테스트와 구분합니다. 관련 기록은 [#7](https://github.com/yeongseon/stack-and-survive/issues/7)을 참고하세요.

## 발표 전 체크

- [ ] 1920×1080, 1440×900, 1366×768에서 1–8장 모두 제목·캡션·조작부가 잘리지 않음.
- [ ] 방향키·PageUp/PageDown·Home/End와 대본/PDF 링크 정상.
- [ ] PDF 8페이지, 가로 방향, 배경·이미지·한글 및 텍스트 잘림 확인.
- [ ] 대본 실제 낭독 2:50–3:10 확인. 길면 문장을 줄이고 더 빨리 말하지 않기.
- [ ] 당일 공개 게임과 API 상태 확인, 실패 시 로컬/녹화 대체임을 공개.

## 편집 범위

`slides.html`은 이야기, `slides.css`는 화면/인쇄 스타일, `slides.js`는 기존 탐색 동작을 담당합니다. 대본은 같은 8장 순서를 따릅니다. 게임·시뮬레이션·서버·캡처 원본은 여기서 변경하지 않습니다.

이 자료는 새 라이선스나 Microsoft 승인을 부여하지 않습니다. 공개 공유·제출 전 [권리 상태](../docs/LICENSING_STATUS.md)와 해당 조건을 확인하세요.
