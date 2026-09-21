# Why I built Stack & Survive — 120-second narration

A two-second silent project title precedes the same eight-slide personal story in the deck, PDF and video. Neural synthetic narration: en-US-GuyNeural, Microsoft Edge online text-to-speech via edge-tts (third-party client, not Azure Speech provisioning), unchanged rate/pitch. Not the developer recording his own voice; no cloning. Human listening and usage review required. Provenance is kept in the JSON manifest, not audience-facing frames.

## 00:00:00–00:00:02 · Stack & Survive



## 00:00:02–00:00:16 · Learning Azure for the first time felt overwhelming.

When I first started learning Azure, I mainly used Microsoft Learn and the documentation. They gave me useful concepts. But as a beginner, I found it harder to connect those concepts together.

## 00:00:16–00:00:32 · I knew what the services were. I didn't know how they behaved together.

I understood App Service, SQL, and caching on their own. But when traffic increased, what should I change? Would more App instances help, or was the database the problem? Those connections were less clear to me.

## 00:00:32–00:00:44 · So I built this.

So I built this. Stack and Survive is a small game where beginners can experience a few Azure architecture decisions, rather than just read their definitions.

## 00:00:44–00:00:59 · You make a change. The system reacts.

Traffic comes in, and you change the architecture. You can add capacity, introduce cache, or protect the edge. The game then shows what happens to availability, lost sales, and running cost.

## 00:00:59–00:01:16 · What would you change?

This is the part I care about. What would you change? More App instances? A stronger database? It isn't about clicking Scale Out. It's about noticing which layer is under pressure, and why.

## 00:01:16–00:01:30 · It survived.

This run survived. But was it a good architecture? Maybe I added more capacity than I needed. Keeping the service available matters, but so does the cost of the choices I made.

## 00:01:30–00:01:45 · What would you change next time?

After the run, I want people to look back and try another choice. They can return to Microsoft Learn with a more concrete question. The idea is to play, observe, reflect, and try again.

## 00:01:45–00:02:00 · Making the first step into Azure easier.

This is not a replacement for Microsoft Learn. I hope it gives customers a simpler, more enjoyable first step into Azure, and helps them feel more comfortable exploring the real services afterward.
