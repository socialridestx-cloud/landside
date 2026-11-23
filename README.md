# Landside — Lab 5 website

Static site (plain HTML/CSS/JS) for GitHub Pages.

- `index.html` — landing page: AI video (autoplay, muted, loop), button to the second page, Car Matcher (X-factor) + description at the bottom, chatbot.
- `fleet.html` — second page: the idea, the 4 cars, pickup steps, counter-vs-Landside, FAQ, chatbot.
- `assets/chatbot.js` — the chatbot (runs in the browser, no API key; chat carries across pages).
- `media/hero.mp4` — AI video made with Gemini (Veo) from the prompt below, trimmed to 5 s, muted, letterbox cropped.

## 1. The AI video (Gemini / Veo) — done

Made in Gemini (Plus plan) from this prompt:

> A cinematic 5-second shot at night on the top level of an airport parking garage. A dark blue SUV is parked under warm amber garage lights; its headlights turn on as a traveler pulling a carry-on suitcase walks toward it. A plane passes overhead in the distance. Slow push-in camera, realistic, moody. No text, no logos, no license plates visible.

Gemini's 10-second original is in `~/Downloads/landside-hero-gemini.mp4`; the site uses seconds 0.5–5.5.

## 2. Put it on GitHub Pages

1. github.com → **New repository** → name it (e.g. `landside`) → Public → Create.
2. **uploading an existing file** → drag in everything inside this folder (`index.html`, `fleet.html`, `assets`, `media`, `photos`) → Commit.
3. **Settings → Pages** → Source: *Deploy from a branch* → `main` / `/ (root)` → Save.
4. After ~1 minute the URL is `https://<your-username>.github.io/landside/`. Submit that on Canvas.
