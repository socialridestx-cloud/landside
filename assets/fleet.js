// The Landside fleet at Dallas Love Field. Specs: 2026 manufacturer / Cars.com spec sheets.
// Photos are licensed model photos from Wikimedia Commons (see PHOTO_CREDITS), not the exact cars.
window.FLEET = [
  {
    id: "mazda-cx-90",
    name: "Mazda CX-90",
    short: "CX-90",
    color: "Dark blue",
    body: "3-row SUV",
    count: 1,
    seats: 8, hp: 280, awd: true, rows: 3, economy: 2,
    tagline: "Room for the whole crew, and an inline-six that makes I-35 feel short.",
    specs: { Seats: "8", Engine: "3.3L turbo I-6 mild hybrid", Power: "280 hp", Drive: "AWD", Gearbox: "8-speed auto", Trim: "3.3 Turbo Select" },
    turo: "https://turo.com/us/en/suv-rental/united-states/irving-tx/mazda/cx-90/3781952",
  },
  {
    id: "kia-sorento",
    name: "Kia Sorento",
    short: "Sorento",
    color: "Silver",
    body: "3-row SUV",
    count: 2,
    seats: 7, hp: 191, awd: null, rows: 3, economy: 2,
    tagline: "Two of them, both new. Three rows, seven seats, and room for a family trip.",
    // LX: drive (FWD/AWD) isn't on the Turo listing, so it isn't shown.
    specs: { Seats: "7", Engine: "2.5L 4-cylinder", Power: "191 hp", Gearbox: "8-speed auto", Trim: "LX", "In fleet": "2 cars" },
    turo: "https://turo.com/us/en/suv-rental/united-states/irving-tx/kia/sorento/3974262",
    moreTuro: ["https://turo.com/us/en/suv-rental/united-states/irving-tx/kia/sorento/3974392"],
  },
  {
    id: "nissan-pathfinder",
    name: "Nissan Pathfinder",
    short: "Pathfinder",
    color: "Dark blue",
    body: "3-row SUV",
    count: 1,
    seats: 8, hp: 284, awd: false, rows: 3, economy: 1,
    tagline: "Big-trip energy. Three rows, a strong V6, and space for everyone's bags.",
    specs: { Seats: "8", Engine: "3.5L V6", Power: "284 hp", Drive: "Front-wheel", Gearbox: "9-speed auto", Trim: "SV 2WD" },
    turo: "https://turo.com/us/en/suv-rental/united-states/irving-tx/nissan/pathfinder/3846157",
  },
  {
    id: "mazda-cx-30",
    name: "Mazda CX-30",
    short: "CX-30",
    color: "White",
    body: "Compact crossover",
    count: 1,
    seats: 5, hp: 186, awd: true, rows: 2, economy: 3,
    tagline: "Easy to park and good to drive. All-wheel drive comes standard.",
    specs: { Seats: "5", Engine: "2.5L 4-cylinder", Power: "186 hp", Drive: "AWD", Gearbox: "6-speed auto", Trim: "2.5 S AWD" },
    turo: "https://turo.com/us/en/suv-rental/united-states/irving-tx/mazda/cx-30/3769400",
  },
  {
    id: "nissan-kicks",
    name: "Nissan Kicks",
    short: "Kicks",
    color: "Black",
    body: "Compact crossover",
    count: 1,
    seats: 5, hp: 141, awd: false, rows: 2, economy: 4,
    tagline: "Light on fuel, easy in traffic, and roomy for its size.",
    specs: { Seats: "5", Engine: "2.0L 4-cylinder", Power: "141 hp", Drive: "Front-wheel", Gearbox: "CVT auto", Trim: "SV FWD" },
    turo: "https://turo.com/us/en/suv-rental/united-states/irving-tx/nissan/kicks/3846139",
  },
];

window.FLEET_SIZE = window.FLEET.reduce((n, c) => n + c.count, 0);

window.PHOTO_CREDITS = [
  { car: "Mazda CX-90", by: "Ethan Llamas", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Mazda_CX-90_KK_3.3_eSkyactiv-G_AWD_HEV_Turbo_Exclusive_Deep_Crystal_Blue.jpg" },
  { car: "Kia Sorento", by: "Kevauto", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:2024_Kia_Sorento_X-Line_SX_Prestige_(facelift),_front_12.20.24.jpg" },
  { car: "Nissan Pathfinder", by: "Elise240SX", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:2022_Nissan_Pathfinder_SV_in_Super_Black,_Front_Left,_03-22-2022.jpg" },
  { car: "Mazda CX-30", by: "Kevauto", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:2020_Mazda_CX-30_AWD,_front_1.23.20.jpg" },
  { car: "Nissan Kicks", by: "Bull-Doser", license: "Public domain", url: "https://commons.wikimedia.org/wiki/File:2027_Nissan_Kicks_au_grand_week-end_auto_Saint-Hyacinthe_2026.jpg" },
];

const LICENSE_URL = { "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/" };

/** "Book on Turo" button, or a placeholder while a listing isn't live yet. */
window.bookButton = (c) => {
  if (!c.turo) return `<span class="btn btn-ghost" aria-disabled="true">Turo listing coming soon</span>`;
  const all = [c.turo, ...(c.moreTuro || [])];
  return all
    .map(
      (url, i) =>
        `<a class="btn ${i ? "btn-ghost" : "btn-primary"}" href="${url}" target="_blank" rel="noopener">${
          all.length > 1 ? `Book ${c.short} #${i + 1}` : "Book on Turo"
        } <span class="arrow">→</span></a>`
    )
    .join(" ");
};

document.addEventListener("DOMContentLoaded", () => {
  // Photo credits in the footer (required by the CC BY-SA license).
  const slot = document.getElementById("photo-credits");
  if (slot)
    slot.innerHTML =
      "Car photos are model photos from Wikimedia Commons, not our exact cars: " +
      PHOTO_CREDITS.map(
        (p) =>
          `<a href="${p.url}" target="_blank" rel="noopener">${p.car}</a> by ${p.by}` +
          (LICENSE_URL[p.license] ? ` (<a href="${LICENSE_URL[p.license]}" target="_blank" rel="noopener">${p.license}</a>)` : ` (${p.license})`)
      ).join(" · ") +
      ". Resized.";

  // Fade sections in as they scroll into view.
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) return els.forEach((e) => e.classList.add("in"));
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
    { threshold: 0.12 }
  );
  els.forEach((e) => io.observe(e));
});

// Give the floating nav a backdrop once the page scrolls past the hero.
addEventListener("scroll", () => {
  document.querySelector(".nav")?.classList.toggle("scrolled", scrollY > 40);
}, { passive: true });
