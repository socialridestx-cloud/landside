// Landside Assistant — a self-contained chatbot that answers guest questions about
// the fleet, pickup at Dallas Love Field, and booking. Runs fully in the browser
// (no API key), so it works on GitHub Pages. Conversation carries across pages.
(function () {
  const FLEET = window.FLEET || [];
  const STORE = "landside-chat-v1";
  const OPEN = "landside-chat-open";
  const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
  const byId = (id) => FLEET.find((c) => c.id === id);
  const turoLink = (c, text = "Book on Turo") => {
    if (!c.turo) return "Turo listing coming soon";
    const all = [c.turo, ...(c.moreTuro || [])];
    return all.length > 1 ? all.map((u, i) => link(u, `Book #${i + 1}`)).join(" · ") : link(c.turo, text);
  };
  const carLine = (c) =>
    c.specs.Power
      ? `• ${c.name}${c.count > 1 ? ` ×${c.count}` : ""} (${c.color}): ${c.seats} seats, ${[c.specs.Power, c.specs.Drive].filter(Boolean).join(", ")}. ${turoLink(c)}`
      : `• ${c.name} ×${c.count} (${c.color}, ${c.specs.Year}): ${c.body}. ${turoLink(c)}`;

  // Each intent: keywords (any match scores), answer (string or fn).
  const INTENTS = [
    { k: ["hi", "hello", "hey", "yo", "sup", "good morning", "good evening"],
      a: "Hey! I'm the Landside assistant. Ask me about our cars, where to find them at Love Field, or how booking works." },
    { k: ["thank", "thanks", "thx", "appreciate", "awesome", "perfect", "great"],
      a: "Anytime. Safe travels! ✈️" },
    { k: ["bye", "goodbye", "see you", "later"],
      a: "Bye! If anything comes up during your trip, message us in the Turo app." },
    { k: ["book", "reserve", "reservation", "rent", "booking", "checkout", "sign up"],
      a: "Booking happens on Turo. Pick a car, choose your dates, and check out there — Turo handles payment, driver verification and trip protection.\n\nWant me to suggest a car? Tell me how many people are coming." },
    { k: ["where is", "where's the car", "where are", "where do i pick", "pick up", "pickup", "location", "find the car", "find my car", "garage", "level", "row", "spot", "directions", "walk"],
      a: "Your car waits at Dallas Love Field, Garage C, Level 6 — rows G–H, at the beginning of the row in the far part of the level.\n\nFrom the terminal: take the skybridge to Garage C (it arrives on Level 3), then the elevator up to Level 6. About a 5-minute walk. Your Turo trip shows the exact spot." },
    { k: ["key", "lockbox", "code", "unlock"],
      a: "The key is in a lockbox on the car's window. The code comes with your Turo trip." },
    { k: ["exit", "ticket", "leave the garage", "get out", "gate", "parking fee", "pay parking"],
      a: "The parking ticket is inside the car. Scan it at the garage exit and you're out." },
    { k: ["return", "drop off", "drop-off", "bring back", "end trip", "give back"],
      a: "Bring the car back to Garage C, Level 6 at Love Field — same place you picked it up. Then message us in the Turo app with where you parked." },
    { k: ["fuel", "gas", "tank", "refuel", "fill"],
      a: "Return the car with the same fuel level you started with, unless the listing says otherwise." },
    { k: ["insurance", "protection", "coverage", "damage", "accident"],
      a: "Turo offers protection plans at checkout and sets the coverage details. If anything happens on the road, report it in the Turo app." },
    { k: ["age", "license", "who can drive", "driver", "requirements", "young", "under 25"],
      a: "Turo sets the driver requirements and verifies every driver when you book." },
    { k: ["price", "cost", "how much", "rate", "cheap", "expensive", "per day", "$", "fee", "deposit"],
      a: () => `Prices change with dates and demand, so the live price is always on the Turo listing:\n${FLEET.map((c) => `• ${c.name}: ${turoLink(c, "see price")}`).join("\n")}` },
    { k: ["turo", "are you turo", "company", "who are you", "independent", "host"],
      a: "Landside is an independent host that lists cars on Turo. You book and pay through Turo; we keep the cars clean, serviced and waiting at the airport." },
    { k: ["clean", "detail", "inspect", "maintenance", "serviced", "new", "year", "2026", "old"],
      a: "Every car is a 2026 model, professionally cleaned before each rental, and checked between trips." },
    { k: ["photo", "check-in", "pictures", "check in"],
      a: "Take check-in photos in the Turo app before you drive off. It protects you and us." },
    { k: ["time", "when", "hours", "late", "early", "flight delayed", "delay"],
      a: "Pickup and return times are set in your Turo trip. If your flight is delayed, message us in the Turo app and we'll sort it out." },
    { k: ["dfw", "fort worth", "love field", "dal", "airport"],
      a: "We're based at Dallas Love Field (DAL). The cars are in Garage C, Level 6 — no counter, no shuttle." },
    { k: ["shuttle", "counter", "line", "faster", "vs", "compared", "hertz", "enterprise", "rental company"],
      a: "At a typical rental counter you find the counter, wait in line, do paperwork, then ride a shuttle to the lot. With Landside you walk to Garage C, grab the key from the lockbox, and drive." },
    { k: ["contact", "phone", "call", "email", "message", "support", "help"],
      a: "The fastest way to reach us is messaging in the Turo app on your trip." },
    { k: ["pet", "dog", "cat", "smoke", "smoking", "vape"],
      a: "House rules like pets and smoking are listed on each car's Turo page — check the listing before you book." },
    { k: ["car seat", "child seat", "booster", "baby", "kids seat"],
      a: "Ask about extras like child seats in the Turo app before your trip." },
    { k: ["cars", "fleet", "vehicles", "options", "what do you have", "which cars", "lineup", "models", "list"],
      a: () => `We have ${FLEET_SIZE} cars, all 2026 models:\n${FLEET.map(carLine).join("\n")}` },
    { k: ["awd", "all wheel", "all-wheel", "4wd", "rain", "ice", "snow"],
      a: () => `All-wheel drive: ${FLEET.filter((c) => c.awd).map((c) => c.name).join(" and ")}. Both are great when the weather turns.` },
    { k: ["mpg", "economy", "efficient", "fuel efficient", "save gas", "best on gas"],
      a: "For the lightest fuel use, the Nissan Kicks is our pick, followed by the Mazda CX-30." },
    { k: ["fast", "power", "powerful", "horsepower", "hp", "fun", "sporty"],
      a: "Most power: Nissan Pathfinder (284 hp V6) and Mazda CX-90 (280 hp turbo inline-six). Most fun in the city: the CX-30." },
    { k: ["bag", "bags", "luggage", "suitcase", "cargo", "golf", "trunk", "space"],
      a: "Lots of luggage? Go with a 3-row SUV — the Mazda CX-90, Nissan Pathfinder, or one of our two Kia Sorentos. For two people with a couple of bags, the CX-30 or Kicks is plenty." },
  ];

  const CAR_ALIASES = {
    "mazda-cx-90": ["cx-90", "cx90", "cx 90"],
    "nissan-pathfinder": ["pathfinder"],
    "mazda-cx-30": ["cx-30", "cx30", "cx 30"],
    "nissan-kicks": ["kicks"],
    "kia-sorento": ["sorento", "kia"],
  };

  function norm(s) { return " " + s.toLowerCase().replace(/[^\w$\s-]/g, " ").replace(/\s+/g, " ") + " "; }

  function peopleCount(t) {
    const g = t.match(/(?:we are|we re|party of|group of|there are|there will be)\s*(\d+)/);
    if (g) return parseInt(g[1], 10);
    const m = t.match(/(\d+)\s*(people|persons|of us|passengers|adults|ppl|guests|friends|kids|family members)?/);
    if (m && (m[2] || /seat|people|passeng|us|group|family/.test(t))) return parseInt(m[1], 10);
    const words = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    for (const [w, n] of Object.entries(words)) if (t.includes(` ${w} `) && /people|of us|passeng|adults|guests|friends|family/.test(t)) return n;
    if (/\bfamily\b/.test(t)) return 5;
    if (/\b(couple|me and my (wife|husband|partner|girlfriend|boyfriend))\b/.test(t)) return 2;
    if (/\b(solo|just me|alone|myself)\b/.test(t)) return 1;
    return null;
  }

  function reply(raw) {
    const t = norm(raw);
    // A specific car?
    const car = FLEET.find((c) => CAR_ALIASES[c.id].some((a) => t.includes(a)));
    // Party size → recommendation
    const n = peopleCount(t);
    if (n != null && (/(seat|people|of us|passeng|adult|guest|friend|family|fit|need|recommend|which|best|suggest|group|couple|solo|just me)/.test(t) || !car)) {
      const cx90 = byId("mazda-cx-90"), pf = byId("nissan-pathfinder"), sor = byId("kia-sorento"), cx30 = byId("mazda-cx-30"), kicks = byId("nissan-kicks");
      if (n > 8) return `For ${n} people you'll want two cars — say the CX-90 and the Pathfinder (8 seats each):\n${carLine(cx90)}\n${carLine(pf)}`;
      if (n === 8) return `For 8 people, take one of our 8-seaters:\n${carLine(cx90)}\n${carLine(pf)}\nPick the CX-90 for all-wheel drive, the Pathfinder for the V6.`;
      if (n >= 6) return `For ${n} people, take a 3-row SUV:\n${carLine(cx90)}\n${carLine(pf)}\n${carLine(sor)}`;
      if (n >= 3) return `For ${n} people, any car works. With lots of bags, pick a 3-row SUV (CX-90, Pathfinder, or Sorento); for easy city driving, the CX-30:\n${carLine(cx30)}`;
      return `Just ${n === 1 ? "you" : "the two of you"}? The Kicks is light on fuel and easy to park, and the CX-30 adds all-wheel drive:\n${carLine(kicks)}\n${carLine(cx30)}`;
    }
    if (car) {
      const s = car.specs;
      const line = s.Power ? [`${s.Seats} seats`, s.Engine, s.Power, s.Drive, s.Gearbox, car.count > 1 ? `${car.count} in the fleet` : ""].filter(Boolean).join(" · ") : `${car.year || "2026"} · ${car.count} in the fleet · 3 rows`;
      return `The ${car.name} (${car.color}, ${car.body}): ${car.tagline}\n\n${line}\n\n${turoLink(car, "See it on Turo →")}`;
    }
    // Best keyword intent
    let best = null, bestScore = 0;
    for (const it of INTENTS) {
      let score = 0;
      for (const k of it.k) if (t.includes(k.length <= 3 ? ` ${k} ` : k)) score += k.includes(" ") ? 3 : k.length > 4 ? 2 : 1;
      if (score > bestScore) { best = it; bestScore = score; }
    }
    if (best) return typeof best.a === "function" ? best.a() : best.a;
    return "I'm not sure about that one. I can help with our cars, pickup at Love Field (Garage C, Level 6), returns, fuel, and booking on Turo. For anything else, message us in the Turo app.";
  }

  // ── UI ──────────────────────────────────────────────
  const QUICK = ["Where is the car?", "Which car for 6 people?", "How do I get the key?", "Show me the cars", "How do I return it?"];
  const icon = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="#1a1208" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  };

  const fab = document.createElement("button");
  fab.className = "chat-fab";
  fab.setAttribute("aria-label", "Open the Landside assistant chat");
  fab.innerHTML = `${icon.chat}<span class="label">Ask Landside</span><span class="ping"></span>`;

  const panel = document.createElement("div");
  panel.className = "chat-panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Landside assistant");
  panel.innerHTML = `
    <div class="chat-head">
      <div class="chat-avatar">L</div>
      <div class="chat-title"><b>Landside Assistant</b><span>Online · replies instantly</span></div>
      <button class="chat-x" aria-label="Close chat">×</button>
    </div>
    <div class="chat-log" aria-live="polite"></div>
    <div class="chat-quick"></div>
    <form class="chat-form" autocomplete="off">
      <input name="q" placeholder="Ask about cars, pickup, returns…" aria-label="Your message" />
      <button type="submit" aria-label="Send">${icon.send}</button>
    </form>`;
  document.body.append(fab, panel);

  const log = panel.querySelector(".chat-log");
  const form = panel.querySelector("form");
  const input = form.elements.q;
  const quick = panel.querySelector(".chat-quick");
  QUICK.forEach((q) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = q;
    b.onclick = () => send(q);
    quick.append(b);
  });

  let history = [];
  try { history = JSON.parse(sessionStorage.getItem(STORE) || "[]"); } catch (_) {}
  const save = () => { try { sessionStorage.setItem(STORE, JSON.stringify(history.slice(-40))); } catch (_) {} };

  function add(who, html, persist = true) {
    const el = document.createElement("div");
    el.className = `msg ${who}`;
    if (who === "me") el.textContent = html; else el.innerHTML = html;
    log.append(el);
    log.scrollTop = log.scrollHeight;
    if (persist) { history.push([who, html]); save(); }
  }

  function send(text) {
    text = text.trim();
    if (!text) return;
    add("me", text);
    input.value = "";
    const typing = document.createElement("div");
    typing.className = "msg bot typing";
    typing.innerHTML = "<i></i><i></i><i></i>";
    log.append(typing);
    log.scrollTop = log.scrollHeight;
    setTimeout(() => { typing.remove(); add("bot", reply(text)); }, 450 + Math.min(text.length * 12, 600));
  }

  if (history.length) history.forEach(([w, h]) => add(w, h, false));
  else add("bot", "Hi! I'm the Landside assistant 👋\nAsk me anything about our cars or picking one up at Dallas Love Field.");

  function setOpen(open) {
    panel.hidden = !open;
    fab.style.visibility = open ? "hidden" : "visible";
    try { sessionStorage.setItem(OPEN, open ? "1" : ""); } catch (_) {}
    if (open) { fab.querySelector(".ping")?.remove(); setTimeout(() => input.focus(), 200); log.scrollTop = log.scrollHeight; }
  }
  fab.onclick = () => setOpen(true);
  panel.querySelector(".chat-x").onclick = () => setOpen(false);
  document.addEventListener("keydown", (e) => e.key === "Escape" && !panel.hidden && setOpen(false));
  form.onsubmit = (e) => { e.preventDefault(); send(input.value); };
  let wasOpen = false;
  try { wasOpen = sessionStorage.getItem(OPEN) === "1"; } catch (_) {}
  if (wasOpen) setOpen(true);

  // Let other parts of the page open the chat with a question.
  window.landsideChat = { reply, open: () => setOpen(true), ask: (q) => { setOpen(true); send(q); } };
})();
