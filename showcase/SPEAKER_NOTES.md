# Why I built Stack & Survive — speaker notes

The owner's personal learning account drives this eight-slide story. This is not a startup pitch, a criticism of Microsoft Learn, or evidence of measured educational improvement. Speak as yourself; take short pauses and avoid reciting feature lists. The exact canonical narration and timing live in [story.json](story.json), which also drives the video. Total allocation: **120 seconds**. Human rehearsal timing is still required.

## 1 · Motivation · 0:00–0:16

When I first started learning Azure, I mainly used Microsoft Learn and the documentation. They gave me useful concepts. But as a beginner, I found it harder to connect those concepts together.

*Gesture toward the questions, not every box. Credit the documentation rather than presenting it as inadequate.*

## 2 · The learning gap · 0:16–0:32

I understood App Service, SQL, and caching on their own. But when traffic increased, what should I change? Would more App instances help, or was the database the problem? Those connections were less clear to me.

## 3 · So I built this · 0:32–0:44

So I built this. Stack and Survive is a small game where beginners can experience a few Azure architecture decisions, rather than just read their definitions.

*Let the screenshot do the explaining. No extra feature list.*

## 4 · Experience · 0:44–0:59

Traffic comes in, and you change the architecture. You can add capacity, introduce cache, or protect the edge. The game then shows what happens to availability, lost sales, and running cost.

## 5 · The decision · 0:59–1:16

This is the part I care about. What would you change? More App instances? A stronger database? It isn't about clicking Scale Out. It's about noticing which layer is under pressure, and why.

*Leave a beat after the question. In this screenshot App is saturated; the choices are questions, not four equally correct fixes.*

## 6 · Surviving is not enough · 1:16–1:30

This run survived. But was it a good architecture? Maybe I added more capacity than I needed. Keeping the service available matters, but so does the cost of the choices I made.

*Do not say this run was proven inefficient. This is a reflection question. The visible 99.61% is full-run availability; $19.14/s in the background HUD is last-tick lost sales, not hourly infrastructure cost.*

## 7 · Learn from the run · 1:30–1:45

After the run, I want people to look back and try another choice. They can return to Microsoft Learn with a more concrete question. The idea is to play, observe, reflect, and try again.

## 8 · Goal · 1:45–2:00

This is not a replacement for Microsoft Learn. I hope it gives customers a simpler, more enjoyable first step into Azure, and helps them feel more comfortable exploring the real services afterward.

*Stop here. The URL is a quiet reference, not a sales pitch.*

## Optional questions — outside the two-minute story

**What does the Export Agent do?** It is an extension of the learning loop: a finished run provides architecture decisions, the agent generates an infrastructure candidate, and bounded tools check it and can guide a repair. Mapping, code generation and the validation/repair loop are implemented. Live Azure model/environment verification remains pending. Nothing is automatically deployed. Do not demonstrate a mocked response as a live model.

**Does it replace Microsoft Learn?** No. Documentation provides the concepts and real configuration detail. I wanted an additional experience that makes it easier to ask useful questions afterward.

**Does it teach Azure more effectively?** That is a goal, not an established result. We still need unfamiliar-player observations. Scores and automated checks do not prove learning.

**What protection service is used?** The game represents Azure Application Gateway/WAF as Protected Edge. Front Door is not a playable resource here. The simple opening diagrams omit protection rather than drawing a false implementation.

**Are costs and performance realistic Azure measurements?** No. They are game assumptions. Do not convert the game money to real Azure pricing or confuse lost-sales rate with infrastructure expense.

## Delivery and provenance (not shown on slides)

Screenshots are actual automated local game states from `a6f6956`, retained in [image provenance](../docs/images/README.md). The success and overload screenshots are separate runs. This deck intentionally juxtaposes examples; it is not continuous live gameplay. No internal production labels are burned into the deck or video.

The current video uses stock **en-US-GuyNeural** at default rate/pitch, replacing the mechanical macOS fallback. [First-slide listening sample](../docs/media/narration-sample.mp3). It is synthetic, not the developer or a cloned identity; human listening remains required. Public narration is sent to Microsoft Edge TTS through a pinned third-party media tool, not a newly provisioned Azure service.

For your own delivery, record `slide-1.wav` through `slide-8.wav`, each within its slot, then run `node scripts/render-project-video.mjs --narration-dir=/absolute/path`. Generated narration has a manifest so the renderer identifies it correctly. `--voice` still produces the basic offline fallback explicitly. Audio origin is disclosed in companion files rather than on audience frames. Rehearse, listen and check provider/event/rights requirements before submission.
