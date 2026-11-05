/* Through the Years — galeria em JavaScript puro (sem frameworks).
   Depende de data.js (variável PHOTOS), carregado antes deste arquivo. */
(() => {
  "use strict";

  const PAGE_SIZE = 12;   // fotos mostradas por vez
  const HERO_IMAGE = "https://raw.githubusercontent.com/yaknayshvydshe/throughtheyears/refs/heads/main/dist/img/IMG_1355.jpeg";
  const ALL = "Todas";    // primeiro filtro

  const els = {
    hero: document.querySelector(".hero"),
    heroEyebrow: document.getElementById("heroEyebrow"),
    heroSubtitle: document.getElementById("heroSubtitle"),
    filters: document.getElementById("filters"),
    grid: document.getElementById("grid"),
    count: document.getElementById("count"),
    loadMore: document.getElementById("loadMore"),
    modal: document.getElementById("modal"),
    modalStage: document.getElementById("modalStage"),
    modalImg: document.getElementById("modalImg"),
    modalTitle: document.getElementById("modalTitle"),
    modalMeta: document.getElementById("modalMeta"),
    modalDesc: document.getElementById("modalDesc"),
    modalCounter: document.getElementById("modalCounter"),
    modalClose: document.getElementById("modalClose"),
    modalPrev: document.getElementById("modalPrev"),
    modalNext: document.getElementById("modalNext"),
  };

  const state = {
    city: ALL,
    visible: PAGE_SIZE,
    current: 0,      // índice, dentro da lista filtrada, da foto aberta no modal
    trigger: null,   // botão que abriu o modal (para devolver o foco)
  };

  /* ---------- Utilidades ---------- */
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
  });
  const formatDate = (iso) => dateFormatter.format(new Date(`${iso}T00:00:00Z`));

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Lista atual (sempre derivada de PHOTOS, então não há duplicação nem índices antigos)
  const getFiltered = () =>
    state.city === ALL ? PHOTOS : PHOTOS.filter((p) => p.city === state.city);

  /* ---------- Cabeçalho (gerado a partir dos dados) ---------- */
  function renderHero() {
    if (PHOTOS.length === 0) return;
    const dates = PHOTOS.map((p) => p.date).sort();
    const first = formatDate(dates[0]);
    const last = formatDate(dates[dates.length - 1]);
    els.heroEyebrow.textContent = first === last ? first : `${first} — ${last}`;
    els.heroSubtitle.textContent =
      `${PHOTOS.length} fotos. Cada uma guarda um dia, uma hora e um lugar.`;
    // Imagem de fundo do hero (fixa, independente da lista de fotos)
    els.hero.style.setProperty("--hero-img", `url("${HERO_IMAGE}")`);
  }

  /* ---------- Filtros ---------- */
  function renderFilters() {
    const cities = [...new Set(PHOTOS.map((p) => p.city))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
    const options = [ALL, ...cities];
    els.filters.innerHTML = options
      .map((city) => {
        const active = city === state.city;
        return `<button class="chip${active ? " is-active" : ""}" type="button"
                  data-city="${escapeHtml(city)}" aria-pressed="${active}">${escapeHtml(city)}</button>`;
      })
      .join("");
  }

  els.filters.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    state.city = btn.dataset.city;
    state.visible = PAGE_SIZE;
    renderFilters();
    renderGrid();
  });

  /* ---------- Grid ---------- */
  function cardTemplate(photo, index) {
    const label = `Abrir foto de ${formatDate(photo.date)} às ${photo.time}, em ${photo.city}`;
    return `
      <li class="card">
        <button class="card__btn" type="button" data-index="${index}" aria-label="${escapeHtml(label)}">
          <img class="card__img" src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.description)}"
               loading="lazy" decoding="async">
          <span class="card__overlay">
            <span class="card__date">${formatDate(photo.date)}</span>
            <span class="card__time">${escapeHtml(photo.time)} &middot; ${escapeHtml(photo.city)}</span>
          </span>
        </button>
      </li>`;
  }

  // Acrescenta cartões a partir do índice "from" (sem reconstruir os já exibidos)
  function appendCards(from) {
    const list = getFiltered();
    const to = Math.min(state.visible, list.length);
    const html = list.slice(from, to).map((p, k) => cardTemplate(p, from + k)).join("");
    els.grid.insertAdjacentHTML("beforeend", html);
  }

  function updateMeta() {
    const total = getFiltered().length;
    const shown = Math.min(state.visible, total);
    els.count.textContent = `${shown} de ${total} fotos`;
    els.loadMore.hidden = shown >= total;
  }

  // Reconstrói a grade (usado ao trocar de filtro)
  function renderGrid() {
    els.grid.innerHTML = "";
    appendCards(0);
    updateMeta();
  }

  els.loadMore.addEventListener("click", () => {
    const from = state.visible;
    state.visible += PAGE_SIZE;
    appendCards(from);
    updateMeta();
    // Se o botão sumiu, o foco iria para o body: leva o foco para a primeira foto nova
    if (els.loadMore.hidden) {
      const firstNew = els.grid.children[from]?.querySelector("button");
      if (firstNew) firstNew.focus();
    }
  });

  els.grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".card__btn");
    if (btn) openModal(Number(btn.dataset.index), btn);
  });

  /* ---------- Modal ---------- */
  function fillModal() {
    const list = getFiltered();
    const photo = list[state.current];
    if (!photo) return;
    els.modalImg.src = photo.src;
    els.modalImg.alt = photo.description;
    els.modalTitle.textContent = formatDate(photo.date);
    els.modalMeta.textContent = `${photo.time} · ${photo.city}`;
    els.modalDesc.textContent = photo.description;
    els.modalCounter.textContent = `${state.current + 1} de ${list.length}`;
  }

  function openModal(index, trigger) {
    state.current = index;
    state.trigger = trigger || null;
    fillModal();
    els.modal.showModal();
    document.body.classList.add("is-modal-open");
  }

  function closeModal() {
    els.modal.close();
  }

  // Avança (+1) ou volta (-1) dentro da lista filtrada, com volta circular
  function step(direction) {
    const total = getFiltered().length;
    if (total === 0) return;
    state.current = (state.current + direction + total) % total;
    fillModal();
  }

  els.modal.addEventListener("close", () => {
    document.body.classList.remove("is-modal-open");
    // Devolve o foco ao cartão que abriu o modal
    if (state.trigger && document.body.contains(state.trigger)) state.trigger.focus();
    state.trigger = null;
  });

  els.modalClose.addEventListener("click", closeModal);
  els.modalPrev.addEventListener("click", () => step(-1));
  els.modalNext.addEventListener("click", () => step(1));

  // Clique fora da foto fecha (o palco ocupa a área do modal; só o espaço vazio conta)
  els.modalStage.addEventListener("click", (e) => {
    if (e.target === els.modalStage) closeModal();
  });
  els.modal.addEventListener("click", (e) => {
    if (e.target === els.modal) closeModal();
  });

  // Setas do teclado (Esc já é tratado nativamente pelo <dialog>)
  document.addEventListener("keydown", (e) => {
    if (!els.modal.open) return;
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  // Swipe horizontal no celular
  let touchStartX = 0;
  let touchStartY = 0;
  els.modal.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  els.modal.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    // Só conta como swipe se for mais horizontal que vertical e passar de 50px
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
  });

  /* ---------- Início ---------- */
  renderHero();
  renderFilters();
  renderGrid();
})();