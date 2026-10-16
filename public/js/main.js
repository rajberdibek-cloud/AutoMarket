const carGrid = document.getElementById("carGrid");
const searchInput = document.getElementById("searchInput");
const brandFilter = document.getElementById("brandFilter");
const carCount = document.getElementById("carCount");
const toast = document.getElementById("toast");
let allCars = [];
const favorites = new Set(JSON.parse(localStorage.getItem("automarket-favorites") || "[]"));

function money(value) {
  return new Intl.NumberFormat("kk-KZ").format(value) + " ₸";
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}
async function loadCars() {
  carGrid.innerHTML = '<div class="loading">Көліктер жүктелуде...</div>';
  try {
    const params = new URLSearchParams();
    if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
    if (brandFilter.value) params.set("brand", brandFilter.value);
    const response = await fetch("/api/cars?" + params.toString());
    const cars = await response.json();
    allCars = cars;
    renderCars(cars);
  } catch (error) {
    carGrid.innerHTML = '<div class="empty-state">Серверге қосылу мүмкін болмады. README нұсқаулығымен сайтты іске қосыңыз.</div>';
  }
}
function renderCars(cars) {
  carCount.textContent = `${cars.length} көлік табылды`;
  if (!cars.length) {
    carGrid.innerHTML = '<div class="empty-state">Сәйкес көлік табылмады. Іздеуді өзгертіп көр.</div>';
    return;
  }
  carGrid.innerHTML = cars.map(car => `
    <article class="car-card">
      <div class="car-image" data-details="${car.id}">
        <img src="${escapeHtml(car.image)}" alt="${escapeHtml(car.brand + " " + car.model)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80'">
        <span class="year-tag">${car.year} жыл</span>
      </div>
      <div class="car-info">
        <div class="car-title-row"><div><h3 class="car-title">${escapeHtml(car.brand)} ${escapeHtml(car.model)}</h3><div class="car-city">⌖ ${escapeHtml(car.city)}</div></div>
        <button class="favorite ${favorites.has(car.id) ? "active" : ""}" data-favorite="${car.id}" aria-label="Таңдаулыға қосу">${favorites.has(car.id) ? "♥" : "♡"}</button></div>
        <div class="car-specs"><span>◷ ${car.year}</span><span>↗ ${Number(car.mileage).toLocaleString("kk-KZ")} км</span><span>⦿ Қолданылған</span></div>
        <div class="car-bottom"><div class="price">${money(car.price)}<small>Бағасы</small></div><button class="details-button" data-details="${car.id}">Толығырақ ↗</button></div>
      </div>
    </article>`).join("");
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}
function fillBrands(cars) {
  const selected = brandFilter.value;
  const brands = [...new Set(cars.map(car => car.brand))].sort();
  brandFilter.innerHTML = '<option value="">Барлық маркалар</option>' + brands.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join("");
  brandFilter.value = selected;
}
async function openDetails(id) {
  try {
    const res = await fetch("/api/cars/" + id);
    if (!res.ok) throw new Error();
    const car = await res.json();
    document.getElementById("modalContent").innerHTML = `
      <img class="modal-car-image" src="${escapeHtml(car.image)}" alt="${escapeHtml(car.brand + " " + car.model)}">
      <p class="eyebrow">АВТОКӨЛІК ТУРАЛЫ</p><h2 id="modalTitle">${escapeHtml(car.brand)} ${escapeHtml(car.model)}</h2>
      <div class="modal-price">${money(car.price)}</div>
      <div class="modal-specs"><span>Шыққан жылы: ${car.year}</span><span>Жүрісі: ${Number(car.mileage).toLocaleString("kk-KZ")} км</span><span>Қала: ${escapeHtml(car.city)}</span></div>
      <p>${escapeHtml(car.description || "Қосымша ақпарат берілмеген.")}</p>
      <button class="primary-button" id="contactSeller">Сатушыға хабарласу ↗</button>`;
    document.getElementById("carModal").classList.remove("hidden");
    document.getElementById("contactSeller").addEventListener("click", () => {
      document.getElementById("carModal").classList.add("hidden");
      document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
      showToast("Байланыс формасын толтырыңыз.");
    });
  } catch { showToast("Көлік ақпаратын ашу мүмкін болмады."); }
}
carGrid.addEventListener("click", event => {
  const favoriteButton = event.target.closest("[data-favorite]");
  const detailsButton = event.target.closest("[data-details]");
  if (favoriteButton) {
    const id = Number(favoriteButton.dataset.favorite);
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    localStorage.setItem("automarket-favorites", JSON.stringify([...favorites]));
    favoriteButton.classList.toggle("active", favorites.has(id));
    favoriteButton.textContent = favorites.has(id) ? "♥" : "♡";
    showToast(favorites.has(id) ? "Таңдаулыларға қосылды ♥" : "Таңдаулылардан алынды");
  } else if (detailsButton) openDetails(Number(detailsButton.dataset.details));
});
let searchTimer;
searchInput.addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadCars, 250); });
brandFilter.addEventListener("change", loadCars);
document.getElementById("resetFilters").addEventListener("click", () => {
  searchInput.value = ""; brandFilter.value = ""; loadCars();
});
document.getElementById("modalClose").addEventListener("click", () => document.getElementById("carModal").classList.add("hidden"));
document.getElementById("carModal").addEventListener("click", e => { if (e.target.id === "carModal") e.currentTarget.classList.add("hidden"); });
document.getElementById("menuButton").addEventListener("click", () => document.getElementById("nav").classList.toggle("open"));
document.querySelectorAll("#nav a").forEach(a => a.addEventListener("click", () => document.getElementById("nav").classList.remove("open")));

document.getElementById("openAddForm").addEventListener("click", () => {
  document.getElementById("addSection").classList.remove("hidden");
  document.getElementById("addSection").scrollIntoView({ behavior: "smooth" });
});
document.getElementById("closeAddForm").addEventListener("click", () => document.getElementById("addSection").classList.add("hidden"));
document.getElementById("addCarForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch("/api/cars", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Қате шықты");
    form.reset();
    document.getElementById("formMessage").textContent = "Хабарландыру сәтті қосылды!";
    await loadCars();
    showToast("Көлік тізімге қосылды!");
    document.getElementById("cars").scrollIntoView({ behavior: "smooth" });
  } catch (error) { document.getElementById("formMessage").textContent = error.message; }
});
document.getElementById("contactForm").addEventListener("submit", event => {
  event.preventDefault();
  event.currentTarget.reset();
  document.getElementById("contactMessage").textContent = "Оқу жобасында хабарлама тексерілді. Нақты жіберу үшін email қызметі қажет.";
});
fetch("/api/cars").then(r => r.json()).then(cars => { fillBrands(cars); loadCars(); }).catch(loadCars);
