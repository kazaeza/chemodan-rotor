# Чемодан идей — ФК Ротор

One-page интерактивная презентация. Закрытый чемодан → 5 артефактов → багажная квитанция с контактами.

## Структура

```
chemodan-site/
├── index.html              основная страница + шаблоны артефактов
├── styles.css              вся стилистика (ретро-палитра в CSS-переменных)
├── script.js               логика сцен + CONFIG c твоими данными
├── package.json            serve на Railway
├── assets/images/          6 картинок (см. assets/images/README.txt)
└── README.md
```

## Что править

**Контакты** — в `script.js`, объект `CONFIG` в самом верху:
```js
const CONFIG = {
  sender: "Имя Фамилия",
  about: "одна-две строки о тебе",
  tg: "your_tg_here",   // без @
};
```

**Тексты артефактов** — в `index.html`, блок `<template id="tpl-…">`. Пять штук.

**Обложка** — заголовок и подзаголовок в `index.html`, секция `.scene-cover`.

**Палитра** — CSS-переменные в начале `styles.css` (`:root`). Кожа, латунь, бархат,
бумага, Ротор-синий.

## Картинки

См. `assets/images/README.txt` — 6 файлов, строгие имена.

## Deploy — GitHub Pages

1. Создать repo на github.com (например `chemodan-rotor`), public.

2. Локально из папки `chemodan-site`:
```bash
git init
git add .
git commit -m "chemodan v1"
git branch -M main
git remote add origin https://github.com/USER/REPO.git
git push -u origin main
```

3. На GitHub: репо → **Settings → Pages**.
   - **Source:** Deploy from a branch
   - **Branch:** `main` / `/ (root)` → **Save**
   - Через ~30 сек страница доступна по `https://USER.github.io/REPO/`

4. Каждый `git push` обновляет сайт автоматически (1-2 минуты).

## Архитектура сцен

```
cover (2 lock clicks)
  ↓
inside (5 артефактов + прогресс-штампы в крышке)
  ↓  ↑ (возврат)
detail (открытая «записка» с артефактом)
  ↓
finale (багажная квитанция + telegram-копирование)
  ↑ «открыть снова» → cover
```

Все переходы — через `switchScene()` в `script.js`. Fade 0.9s.
