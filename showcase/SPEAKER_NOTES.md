# Speaker notes — seven slides, about three minutes

[Slides](slides.html) · [PDF](stack-and-survive-showcase.pdf)

This seven-slide English adaptation omits the earlier deck's standalone technical-architecture section. It is adapted for spoken English rather than translated word for word. **Target: roughly 2:40–3:00 at a comfortable pace, including short pauses.** This is a planning estimate, not a timed human rehearsal. The suggested sections below total 175 seconds. Time your own reading; shorten sentences rather than rushing. A live demo needs additional time unless your actual rehearsal leaves room.

## 1. Why I built it — 0:00–0:25

I work in technical support, and I use Microsoft Learn a lot. The individual services are well explained. But I kept thinking about someone new to cloud: why would they need App, Cache and a database together? When we troubleshoot, we look across those services. I wanted a simpler way to show those connections.

## 2. So I made a game — 0:25–0:45

So I built Stack & Survive. Instead of only explaining the setup, I let the player run it. You decide when to expand App and add Cache or Edge. If you react too late, customer requests fail and you lose sales in the game.

## 3. Black Friday — 0:45–1:15

The scenario is Black Friday. A run lasts 180 seconds and starts at 100 requests per second. Then traffic spikes and bots arrive. Later, it's 560 requests per second with 40 percent bots. In the final 20 seconds, it's 600 with 45 percent bots. There are recovery windows too. Construction takes time, so you need to prepare before the next wave.

## 4. What you can do — 1:15–1:40

App adds throughput, but takes eight seconds to activate and costs money to run. Adding it can leave SQL as the next bottleneck. Cache helps eligible reads; order writes still go to SQL. Edge filters bots, but can reject legitimate customers too. Adding everything isn't automatically the best approach.

## 5. Check the result, try again — 1:40–2:05

After the run, you can review availability, lost sales, costs and your score. If App expansion was late, try it earlier next time. Or change the order of Cache and Edge. The objectives progress from surviving 180 seconds to 99 percent, then 99.9 percent availability. Qualifying runs can join the leaderboard under a player name.

## 6. How I'd like people to use it — 2:05–2:30

I'm not trying to replace Microsoft Learn. My hope is that someone plays, wonders why Cache didn't change the writes, and looks it up. Having seen the setup in action might make the documentation easier to follow. We still need testing with beginners to find out whether that actually helps.

## 7. Closing — 2:30–2:55

What I noticed in support wasn't a lack of documentation. It was how hard connecting the concepts might be when you're starting out. So I tried making that first step a little easier with a game. Give it a run and see where each facility helps. That's Stack & Survive. Thank you.

## 60-second version

### 0:00–0:15

I work in technical support and use Microsoft Learn often. I wondered whether beginners could connect the services more easily by running them in a game. So I built Stack & Survive.

### 0:15–0:30

You have 180 seconds to survive Black Friday. Traffic starts at 100 requests per second. The final wave reaches 600, with 45 percent bots. You prepare App, Cache and Edge before each wave.

### 0:30–0:45

App adds capacity but takes time and money. Cache helps reads, not order writes. Edge blocks bots but may reject customers. Review the score, then try a different order next time.

### 0:45–1:00

I hope players try it first, then return to Microsoft Learn with specific questions. Whether it helps beginners still needs testing. That's Stack & Survive. Thank you.

## Switching to a short live demo

Only do this if the slot allows another 20–30 seconds. Open the title screen beforehand. Do not assume the main script and demo fit within three minutes without rehearsing both.

“Let me show you the screen for a moment.”

1. Open the [public game](https://yeongseon.github.io/stack-and-survive/) and press Start Game. Count the opening sequence as part of the demo time.
2. Point at Demand, Next and Funds: “This is the current demand, the next wave, and the money I can spend.”
3. Click an empty App bay once: “Clicking doesn't increase capacity immediately. It needs time to finish building.”
4. If time permits, add Cache: “This helps eligible reads, not every request.” Do not claim a benefit before activation.
5. Pause within 20–30 seconds: “A full run takes 180 seconds, so I'll show the result from a run I completed earlier.” Return to slide 5.

Label paused gameplay and recorded footage honestly. If the API is unavailable, explain that the score is local and use the [fallback plan](../docs/submission/DEMO_FALLBACK.md). Do not repeatedly submit demo scores to the public board.

## Questions you may be asked

### Why build this when Microsoft Learn already exists?

“Microsoft Learn is where I go for accurate information. I thought running a simplified setup first might make the role of Cache or Edge more concrete when someone returns to the documentation. The game isn't a replacement.”

### Have you shown that it improves learning?

“Not yet. I've built the idea into a game, but whether beginners understand more or choose to replay still needs actual user testing.”

### Why a game?

“Some details are easy to miss in an explanation. If you expand App and SQL becomes the bottleneck, you can see it and try something else. Limited time and funds make those tradeoffs visible.”

### Does playing create Azure resources?

“No. Gameplay is a browser simulation. The optional leaderboard API is separately hosted on Azure App Service, but adding an App in the game doesn't provision a real cloud resource.”

### Are the dollar amounts actual Azure prices?

“No. They are simulated business values. One internal credit is shown as one thousand dollars. The game isn't pricing or capacity-planning guidance.”

### Why not keep adding App instances?

“They cost money and take time to activate, and there is a four-instance limit. More App capacity won't fix a SQL bottleneck. Cache helps reads but not writes, and Edge filtering can reject legitimate traffic. Each option has a cost.”

### How do you handle score manipulation?

“Local browser records can be edited. The global server receives an action history for a supported challenge and calculates the outcome again, rather than trusting the client's score. That doesn't make nicknames authenticated accounts or provide complete anti-cheat protection.”

### Does the global leaderboard work in production?

“Earlier rules 0.3 production submissions were verified. The current rules 0.4 API compatibility check is blocked in #306, so I won't claim current global submission works until it is resolved. Local results remain available. The DEMO screenshot is an automated local run, not a public submission.” Check the [dated handoff](../docs/submission/HACKATHON_HANDOFF.md) for any subsequently verified resolution before presenting.

### How did you use AI?

“It helped with implementation, art iteration, test writing and documentation. We ran the tests and checked the output. AI review doesn't replace real player feedback, listening checks or rights decisions.”

If asked about Export to Azure: “There is an implemented draft for post-run Bicep generation through Azure OpenAI and curated Microsoft Learn links. It is not deployed; real-model generation/compilation needs verification and server resources/settings.” Do not show mock output as a live response. [Current status](../docs/CURRENT_STATUS.md) owns the boundary.

### Can you reduce capacity or strengthen SQL?

“Yes. App scaling controls instance count and tier; SQL scaling controls tier and read replicas. Changes take time and alter running cost. Read replicas do not add write capacity.” The 53.4-second clip shows this current tradeoff; slides retain older screenshot provenance.

### Is this official Microsoft training material?

“No. This is my own idea from working in support. It isn't Microsoft's assessment of Microsoft Learn or an endorsed training product. The presentation includes no identifying customer information or private support cases.”

## Rehearsal and factual boundaries

- **Actual human read-aloud duration: not measured.** The English main script is approximately 370 words; at 140–150 words per minute plus brief pauses, plan roughly 2:40–3:00. These are assumptions, not evidence of a completed rehearsal.
- The shortened script targets 60 seconds; time it yourself. Leave room for numbers, service names and slide changes.
- The 100 → 560 → 600 progression summarizes eight phases with recovery windows. Demand does not rise continuously.
- Screenshots were refreshed from local production source `a6f6956` / rules 0.4; `DEMO` denotes automation, not a participant or verified global entry. The new [two-minute introduction transcript](../docs/media/PROJECT_INTRO_NARRATION.md) is separate from this seven-slide talk and uses disclosed synthetic narration.
- Deployment, rights and evidence details live in the [showcase guide](README.md) and [technical notes](../docs/SUBMISSION_TECHNICAL_NOTES.md), not in the main talk.
