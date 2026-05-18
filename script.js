/* ============================================
   ЧЕМОДАН ИДЕЙ — логика
   ============================================ */

/** ВСЁ, ЧТО ТЫ ПРАВИШЬ — ЗДЕСЬ **/
const CONFIG = {
  sender: "Даниил Казакевич",
  about: "Фрилансер. Рисую комиксы, выращиваю суперострые перцы. Работал с VK, Сбером, Ozon, Yota и всеми остальными.",
  tg: "kazaks",   // без @
};

/* ============ state ============ */
const state = {
  scene: "cover",
  locksOpened: new Set(),
  artifactsViewed: new Set(),
  currentArtifact: null,
  vcardRevealed: false,
  pendingReveal: false,
};

const ARTIFACT_ORDER = ["banner", "scarf", "seat", "gallery", "map"];

/* ============ inject user data ============ */
function injectUser() {
  const sender = CONFIG.sender || "—";
  const about = CONFIG.about || "—";
  const tg = (CONFIG.tg || "").replace(/^@/, "");

  document.getElementById("metaSender").textContent = sender;
  document.getElementById("tagSender").textContent = sender;
  document.getElementById("tagAbout").textContent = about;

  const tgLink = document.getElementById("tagTg");
  if (tg) {
    tgLink.href = `https://t.me/${tg}`;
    tgLink.textContent = "@" + tg;
  } else {
    tgLink.textContent = "—";
    tgLink.removeAttribute("href");
  }
}

/* ============ scene switching ============ */
function switchScene(name) {
  document.querySelectorAll(".scene").forEach(el => {
    el.classList.toggle("is-active", el.dataset.scene === name);
  });
  state.scene = name;
}

/* ============ cover → inside ============ */
function initCover() {
  document.querySelectorAll(".cover-lock").forEach(lock => {
    lock.addEventListener("click", () => {
      const which = lock.dataset.lock;
      if (state.locksOpened.has(which)) return;

      state.locksOpened.add(which);
      lock.classList.add("clicked");

      // haptic-ish feel: slight global shake
      document.body.animate(
        [{ transform: "translate(0,0)" }, { transform: "translate(1px,-1px)" }, { transform: "translate(0,0)" }],
        { duration: 180 }
      );

      if (state.locksOpened.size === 1) {
        document.getElementById("coverHint").textContent = "ещё один";
      }

      if (state.locksOpened.size === 2) {
        const hintEl = document.getElementById("coverHint");
        hintEl.textContent = "открываем…";

        // Фаза 1 (200ms): чемодан и замки исчезают, заголовок съезжает вниз к центру
        setTimeout(() => {
          const coverInner = document.querySelector('.cover-inner');
          const coverText  = document.querySelector('.cover-text');

          coverInner.classList.add('unlocking');

          // плавно гасим подсказку
          hintEl.animate(
            [{ opacity: 0.7 }, { opacity: 0 }],
            { duration: 280, fill: 'forwards' }
          );

          // поднимаем заголовок к центру вьюпорта (текст обычно ниже центра,
          // потому что лежит под картинкой — deltaY получится отрицательным)
          const rect    = coverText.getBoundingClientRect();
          const deltaY  = (window.innerHeight / 2) - (rect.top + rect.height / 2);
          coverText.animate(
            [{ transform: 'translateY(0)' }, { transform: `translateY(${deltaY}px)` }],
            { duration: 820, easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'forwards' }
          );
        }, 200);

        // Фаза 2 (1350ms): меняем текст на «Ротор · 5 идей»
        setTimeout(() => {
          const titleEl = document.querySelector('.cover-title');
          if (!titleEl) return;
          const out = titleEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' });
          out.onfinish = () => {
            titleEl.innerHTML =
              '<span class="line intro-club">Ротор</span>' +
              '<span class="line intro-sub">5 идей для продвижения</span>';
            titleEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, fill: 'forwards' });
          };
        }, 1350);

        // Фаза 3 (3050ms): переходим внутрь чемодана
        setTimeout(() => switchScene('inside'), 3050);
      }
    });
  });
}

/* ============ inside: artifact clicks ============ */
function initInside() {
  document.querySelectorAll(".artifact").forEach(el => {
    el.addEventListener("click", () => {
      if (el.dataset.id === "vcard") {
        handleVcardClick(el);
        return;
      }
      openArtifact(el.dataset.id);
    });
  });

  // "к квитанции" — меленькая ссылка в углу, доступна всегда
  document.getElementById("hintClose").addEventListener("click", () => {
    switchScene("finale");
  });
}

function handleVcardClick() {
  // pointer-events:none до unseal, так что сюда долетает только кликабельная визитка
  if (!state.vcardRevealed) return;
  switchScene("finale");
}

function revealVcard() {
  if (state.vcardRevealed) return;
  state.vcardRevealed = true;
  document.querySelector('.artifact.vcard')?.classList.add("unsealed");
}

function openArtifact(id) {
  const tpl = document.getElementById("tpl-" + id);
  if (!tpl) return;

  const node = tpl.content.cloneNode(true);

  // harvest parts from template
  const title = node.querySelector("h2")?.textContent || "";
  const tag = node.querySelector(".note-tag")?.textContent || "";
  const body = node.querySelector(".note-body");

  // apply to scene-detail
  document.getElementById("noteTitle").textContent = title;
  document.getElementById("noteTag").textContent = tag;
  const bodyEl = document.getElementById("noteBody");
  bodyEl.innerHTML = "";
  if (body) bodyEl.append(...body.childNodes);

  // image
  const img = document.getElementById("noteImage");
  img.src = `assets/images/artifact-${id}.jpg`;
  img.alt = title;

  // numbering
  const idx = ARTIFACT_ORDER.indexOf(id) + 1;
  document.getElementById("noteNo").textContent = `№ ${idx} / 5`;

  // mark as viewed (stamp + artifact grayscale)
  markViewed(id);

  state.currentArtifact = id;
  switchScene("detail");
}

function markViewed(id) {
  if (state.artifactsViewed.has(id)) return;
  state.artifactsViewed.add(id);

  document.querySelector(`.artifact[data-id="${id}"]`)?.classList.add("viewed");
  document.querySelector(`.stamp[data-stamp="${id}"]`)?.classList.add("marked");

  // 5/5 — на следующем возврате внутрь покажется визитка
  if (state.artifactsViewed.size === ARTIFACT_ORDER.length && !state.vcardRevealed) {
    state.pendingReveal = true;
  }
}

/* ============ detail → back ============ */
function initDetail() {
  const backBtn = document.getElementById("noteBack");
  const sceneDetail = document.querySelector('[data-scene="detail"]');

  const closeNote = () => {
    if (state.scene !== "detail") return;
    switchScene("inside");
    // визитка появляется ТОЛЬКО после того, как юзер только что закрыл последнюю
    // непросмотренную идею — повторный вход в уже открытую идею ничего не меняет
    if (state.pendingReveal) {
      state.pendingReveal = false;
      setTimeout(() => revealVcard(), 650);
    }
  };

  backBtn.addEventListener("click", closeNote);

  // клик по тёмному фону вокруг записки — тоже закрывает
  sceneDetail.addEventListener("click", (e) => {
    if (!e.target.closest(".note")) closeNote();
  });

  // Escape — closenote
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNote();
  });
}

function initFinale() {
  // клик по фону квитанции → назад к идеям; Escape тоже
  const sceneFinale = document.querySelector('[data-scene="finale"]');
  const closeFinale = () => {
    if (state.scene !== "finale") return;
    switchScene("inside");
  };
  sceneFinale.addEventListener("click", (e) => {
    if (!e.target.closest(".tag")) closeFinale();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.scene === "finale") closeFinale();
  });

  document.getElementById("tagCopy").addEventListener("click", async () => {
    const tg = (CONFIG.tg || "").replace(/^@/, "");
    if (!tg) return;

    const text = `t.me/${tg}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }

    const btn = document.getElementById("tagCopy");
    const original = btn.textContent;
    btn.textContent = "скопировано ✓";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove("copied");
    }, 1800);
  });

  document.getElementById("tagReopen").addEventListener("click", () => {
    // reset
    state.locksOpened.clear();
    state.artifactsViewed.clear();
    state.currentArtifact = null;
    state.vcardRevealed = false;
    state.pendingReveal = false;

    document.querySelectorAll(".cover-lock").forEach(l => l.classList.remove("clicked"));
    document.querySelectorAll(".artifact").forEach(a => a.classList.remove("viewed"));
    document.querySelectorAll(".stamp").forEach(s => s.classList.remove("marked"));
    document.querySelector(".artifact.vcard")?.classList.remove("unsealed");
    document.getElementById("coverHint").textContent = "щёлкните оба замка";

    // отменяем кинематографические анимации обложки
    const coverInner = document.querySelector('.cover-inner');
    const coverText  = document.querySelector('.cover-text');
    const titleEl    = document.querySelector('.cover-title');
    const hintEl     = document.getElementById('coverHint');

    coverText?.getAnimations().forEach(a => a.cancel());
    titleEl?.getAnimations().forEach(a => a.cancel());
    hintEl?.getAnimations().forEach(a => a.cancel());
    coverInner?.classList.remove('unlocking');

    if (titleEl) {
      titleEl.innerHTML =
        '<span class="line">Пора в РПЛ.</span>' +
        '<span class="line">Чемодан уже собран.</span>';
    }

    switchScene("cover");
  });
}

/* ============ THUMB ICONS (превью артефактов в чемодане) ============ */
/* Клубная палитра: белая карточка + синие/голубые линии. Красный — один акцент. */
const THUMB_ICONS = {
  banner: `
    <rect x="-110" y="-80" width="220" height="160" fill="#e8eef7" stroke="#003f87" stroke-width="3"/>
    <path d="M -85 -45 q 15 -8 30 0 t 30 0 t 30 0" stroke="#0d1b2e" fill="none" stroke-width="2"/>
    <path d="M -75 -10 q 15 -8 30 0 t 30 0 t 30 0" stroke="#0d1b2e" fill="none" stroke-width="2"/>
    <path d="M -65 25 q 15 -8 30 0 t 30 0 t 30 0" stroke="#0d1b2e" fill="none" stroke-width="2"/>
    <path d="M -80 55 q 15 -8 30 0 t 30 0" stroke="#0d1b2e" fill="none" stroke-width="2"/>`,
  scarf: `
    <g transform="rotate(-6)">
      <rect x="-130" y="-26" width="260" height="52" rx="3" fill="#003f87" stroke="#0d1b2e" stroke-width="2.5"/>
      <rect x="-130" y="-22" width="260" height="5" fill="#ffffff"/>
      <rect x="-130" y="-12" width="260" height="2.5" fill="#4aa8e8"/>
      <rect x="-130" y="7" width="260" height="2.5" fill="#4aa8e8"/>
      <rect x="-130" y="17" width="260" height="5" fill="#ffffff"/>
      <text x="0" y="3" text-anchor="middle" font-family="'PT Serif', serif" font-size="14" font-weight="700" fill="#ffffff" letter-spacing="3">РОТОР</text>
      <g fill="#0d1b2e">
        <rect x="-140" y="-26" width="2" height="14"/>
        <rect x="-136" y="-26" width="2" height="14"/>
        <rect x="-132" y="-26" width="2" height="14"/>
        <rect x="-140" y="14" width="2" height="14"/>
        <rect x="-136" y="14" width="2" height="14"/>
        <rect x="-132" y="14" width="2" height="14"/>
        <rect x="132" y="-26" width="2" height="14"/>
        <rect x="136" y="-26" width="2" height="14"/>
        <rect x="140" y="-26" width="2" height="14"/>
        <rect x="132" y="14" width="2" height="14"/>
        <rect x="136" y="14" width="2" height="14"/>
        <rect x="140" y="14" width="2" height="14"/>
      </g>
    </g>`,
  seat: `
    <path d="M -60 55 L -60 -25 Q -60 -48 -36 -48 L 36 -48 Q 60 -48 60 -25 L 60 55 Z"
      fill="#4aa8e8" stroke="#0d1b2e" stroke-width="3"/>
    <rect x="-72" y="55" width="144" height="16" fill="#003f87" stroke="#0d1b2e" stroke-width="2"/>
    <rect x="-22" y="-20" width="44" height="6" rx="2" fill="#ffffff" opacity="0.85"/>
    <rect x="-14" y="-6" width="28" height="3" rx="1" fill="#ffffff" opacity="0.55"/>`,
  gallery: `
    <rect x="-95" y="-90" width="190" height="190" fill="#e8eef7" stroke="#003f87" stroke-width="6"/>
    <rect x="-83" y="-78" width="166" height="166" fill="#1b4aa8"/>
    <circle cx="0" cy="-22" r="26" fill="#4aa8e8"/>
    <path d="M -48 60 Q -48 12 0 12 Q 48 12 48 60 Z" fill="#4aa8e8"/>
    <rect x="-22" y="-2" width="44" height="14" rx="2" fill="#003f87" opacity="0.85"/>
    <text x="0" y="-58" text-anchor="middle" font-family="'PT Serif', serif" font-size="11" fill="#ffffff" letter-spacing="2">№ 10</text>
    <text x="0" y="78" text-anchor="middle" font-family="'Special Elite', monospace" font-size="9" fill="#ffffff" letter-spacing="2" opacity="0.85">АРТЁМ</text>`,
  map: `
    <path d="M -110 -65 L 85 -80 L 112 40 L -60 82 Z"
      fill="#e8eef7" stroke="#003f87" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="-72" cy="-32" r="7" fill="#003f87"/>
    <circle cx="-22" cy="-54" r="7" fill="#003f87"/>
    <circle cx="32" cy="-42" r="7" fill="#003f87"/>
    <circle cx="72" cy="-12" r="7" fill="#003f87"/>
    <circle cx="-42" cy="12" r="7" fill="#003f87"/>
    <circle cx="12" cy="22" r="9" fill="#c8102e"/>
    <circle cx="52" cy="42" r="7" fill="#003f87"/>
    <circle cx="-12" cy="58" r="7" fill="#003f87"/>`,
};

function renderThumbSvg(id) {
  const icon = THUMB_ICONS[id];
  if (!icon) return "";
  return `<svg class="thumb-svg" xmlns="http://www.w3.org/2000/svg" viewBox="-150 -110 300 220" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${icon}</svg>`;
}

function initThumbs() {
  ARTIFACT_ORDER.forEach(id => {
    const thumb = document.querySelector(`.artifact[data-id="${id}"] .artifact-thumb`);
    if (thumb) thumb.innerHTML = renderThumbSvg(id);
  });
}

/* ============ FALLBACK PLACEHOLDERS (для cover/note если фото не нашлось) ============ */
/* Тёмно-синий фон, белые/голубые иконки. */
const FALLBACK_ICONS = {
  "cover-chemodan": `
    <g transform="translate(0,20)">
      <rect x="-160" y="-70" width="320" height="150" rx="10" fill="#1b4aa8" stroke="#ffffff" stroke-width="3"/>
      <rect x="-34" y="-90" width="68" height="22" rx="11" fill="none" stroke="#ffffff" stroke-width="3"/>
      <circle cx="-90" cy="-20" r="8" fill="#ffffff"/>
      <circle cx="90" cy="-20" r="8" fill="#ffffff"/>
      <line x1="-160" y1="30" x2="160" y2="30" stroke="#001428" stroke-width="2"/>
    </g>`,
  "artifact-banner": `
    <rect x="-110" y="-80" width="220" height="160" fill="#ffffff" stroke="#4aa8e8" stroke-width="3"/>
    <path d="M -85 -40 q 15 -8 30 0 t 30 0 t 30 0" stroke="#0d1b2e" fill="none" stroke-width="2"/>
    <path d="M -75 0 q 15 -8 30 0 t 30 0 t 30 0" stroke="#0d1b2e" fill="none" stroke-width="2"/>
    <path d="M -65 40 q 15 -8 30 0 t 30 0 t 30 0" stroke="#0d1b2e" fill="none" stroke-width="2"/>`,
  "artifact-scarf": `
    <g transform="rotate(-6)">
      <rect x="-150" y="-30" width="300" height="60" rx="3" fill="#1b4aa8" stroke="#ffffff" stroke-width="2.5"/>
      <rect x="-150" y="-25" width="300" height="6" fill="#ffffff"/>
      <rect x="-150" y="19" width="300" height="6" fill="#ffffff"/>
      <text x="0" y="5" text-anchor="middle" font-family="'PT Serif', serif" font-size="18" font-weight="700" fill="#ffffff" letter-spacing="4">РОТОР</text>
      <g fill="#ffffff">
        <rect x="-160" y="-30" width="2" height="16"/>
        <rect x="-156" y="-30" width="2" height="16"/>
        <rect x="-152" y="-30" width="2" height="16"/>
        <rect x="-160" y="14" width="2" height="16"/>
        <rect x="-156" y="14" width="2" height="16"/>
        <rect x="-152" y="14" width="2" height="16"/>
        <rect x="152" y="-30" width="2" height="16"/>
        <rect x="156" y="-30" width="2" height="16"/>
        <rect x="160" y="-30" width="2" height="16"/>
        <rect x="152" y="14" width="2" height="16"/>
        <rect x="156" y="14" width="2" height="16"/>
        <rect x="160" y="14" width="2" height="16"/>
      </g>
    </g>`,
  "artifact-seat": `
    <path d="M -60 60 L -60 -20 Q -60 -40 -40 -40 L 40 -40 Q 60 -40 60 -20 L 60 60 Z"
      fill="#4aa8e8" stroke="#ffffff" stroke-width="3"/>
    <rect x="-70" y="60" width="140" height="16" fill="#1b4aa8" stroke="#ffffff" stroke-width="2"/>`,
  "artifact-gallery": `
    <rect x="-95" y="-100" width="190" height="200" fill="#ffffff" stroke="#4aa8e8" stroke-width="5"/>
    <rect x="-83" y="-88" width="166" height="176" fill="#1b4aa8"/>
    <circle cx="0" cy="-28" r="28" fill="#4aa8e8"/>
    <path d="M -50 70 Q -50 14 0 14 Q 50 14 50 70 Z" fill="#4aa8e8"/>
    <rect x="-24" y="-2" width="48" height="16" rx="2" fill="#003f87" opacity="0.85"/>
    <text x="0" y="-66" text-anchor="middle" font-family="'PT Serif', serif" font-size="13" fill="#ffffff" letter-spacing="2">№ 10</text>`,
  "artifact-map": `
    <path d="M -110 -60 L 80 -80 L 110 40 L -60 80 Z"
      fill="#ffffff" stroke="#4aa8e8" stroke-width="2.5" opacity="0.95"/>
    <circle cx="-70" cy="-30" r="6" fill="#1b4aa8"/>
    <circle cx="-20" cy="-50" r="6" fill="#1b4aa8"/>
    <circle cx="30" cy="-40" r="6" fill="#1b4aa8"/>
    <circle cx="70" cy="-10" r="6" fill="#1b4aa8"/>
    <circle cx="-40" cy="10" r="6" fill="#1b4aa8"/>
    <circle cx="10" cy="20" r="8" fill="#c8102e"/>
    <circle cx="50" cy="40" r="6" fill="#1b4aa8"/>
    <circle cx="-10" cy="55" r="6" fill="#1b4aa8"/>`,
};

function buildPlaceholder(filename, altText) {
  const baseName = filename.replace(/\.(jpg|jpeg|png|webp)$/i, "");
  const icon = FALLBACK_ICONS[baseName] || "";
  const isCover = baseName === "cover-chemodan";
  const w = isCover ? 800 : 500;
  const h = isCover ? 500 : 500;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
    <defs>
      <pattern id="g" x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
        <rect width="3" height="3" fill="#031f42"/>
        <rect width="1" height="1" fill="#001428"/>
      </pattern>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <rect x="10" y="10" width="${w-20}" height="${h-20}" fill="none" stroke="#4aa8e8" stroke-width="1.5" stroke-dasharray="7 5" opacity="0.55"/>
    <g transform="translate(${w/2}, ${h/2})" opacity="0.9">${icon}</g>
    <text x="20" y="32" font-family="'Courier New', monospace" font-size="13" fill="#4aa8e8" letter-spacing="2">${filename}</text>
    <text x="${w-20}" y="32" text-anchor="end" font-family="'Courier New', monospace" font-size="11" fill="#ffffff" opacity="0.55" letter-spacing="3">ЗАГЛУШКА</text>
    <text x="${w/2}" y="${h-24}" text-anchor="middle" font-family="'Courier New', monospace" font-size="12" fill="#ffffff" opacity="0.55" letter-spacing="2">${altText || ""}</text>
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function initPlaceholders() {
  document.querySelectorAll("img").forEach(img => {
    // already has data URI — skip
    if (img.src.startsWith("data:")) return;

    const fallback = () => {
      const filename = img.getAttribute("src").split("/").pop();
      img.src = buildPlaceholder(filename, img.alt);
    };

    // probe: if real image fails — swap
    const probe = new Image();
    probe.onload = () => { /* real image exists, keep */ };
    probe.onerror = fallback;
    probe.src = img.src;

    // if browser already fired error before we attached — handle immediately
    if (img.complete && img.naturalWidth === 0) fallback();
    img.addEventListener("error", fallback, { once: true });
  });

  // detail-scene image подгружается динамически — перехватываем
  const noteImage = document.getElementById("noteImage");
  if (noteImage) {
    noteImage.addEventListener("error", () => {
      const filename = noteImage.getAttribute("src").split("/").pop();
      noteImage.src = buildPlaceholder(filename, noteImage.alt);
    });
  }
}

/* ============ boot ============ */
document.addEventListener("DOMContentLoaded", () => {
  injectUser();
  initThumbs();
  initPlaceholders();
  initCover();
  initInside();
  initDetail();
  initFinale();
});
