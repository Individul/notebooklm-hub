# NotebookLM Hub (Companion Google Gemini & Legislație RM)

Un companion avansat și organizator pentru notebook-uri **Google NotebookLM** și interogări bazate pe modelele **Google Gemini**, cu suport specializat pentru analiza legislației și documentelor juridice.

🌐 **Demo Live:** [https://notebooklm-hub-cy4.pages.dev/](https://notebooklm-hub-cy4.pages.dev/)

---

## ✨ Funcționalități Principale

- ⚡ **Model Implicit Gemini 3.5 Flash-Lite:** Configurat nativ pentru cel mai bun raport viteză / costuri (\$0.075 per 1M tokeni de prompt). Suport suplimentar pentru Gemini 1.5 Pro, 3.5 Flash, 2.0 Flash și 1.5 Flash.
- 💰 **Monitorizare Cheltuieli API în Timp Real:** Insignă live în bara superioară care calculează costul fiecărei interogări în USD și Lei moldovenești (~MDL), plus numărul de tokeni consumați și istoric detaliat în popover.
- ☀️ **Varianta Albă & Mod Întunecat (Theme Toggle):** Interfață luminoasă implicită, cu contrast înalt pentru lectura relaxată a documentelor lungi, plus buton instant de comutare Sun/Moon.
- 💬 **Sesiuni Multiple de Chat & Arhivare Automată:** Butonul `+ Chat Nou` arhivează sesiunea curentă pentru a preveni confuzia asistentului la schimbarea subiectului, cu istoric complet accesibil în fereastra dedicată.
- ⚖️ **Motor de Căutare Juridică RM integrat:** Caută și citează instantaneu articole din Codul Penal, Codul Civil, Codul Muncii și alte legi ale Republicii Moldova direct pe marginea rețelei (Edge / in-memory).
- 🎙️ **Audio Overview (Podcast Studio):** Generare și redare a discuțiilor audio sintetizate în două voci pentru fiecare notebook.
- 📁 **Management Surse & Fișiere Locale:** Încărcare de fișiere PDF, TXT, DOC direct din calculator și procesare securizată în browser.
- 🚀 **Zero Server Backend (Edge Ready):** Compilat complet ca export static și găzduit global pe Cloudflare Pages.

---

## 🛠️ Tehnologii Utilizate

- **Framework:** Next.js 16.3 (App Router, Turbopack, Static Export)
- **UI & Styling:** React 19, Tailwind CSS v4, Lucide React
- **AI Integration:** Google Gemini API (REST SDK)
- **Deployment:** Cloudflare Pages (Wrangler v4)

---

## 🚀 Rulare Locală

1. **Instalare dependențe:**
   ```bash
   npm install
   ```

2. **Pornire server de dezvoltare:**
   ```bash
   npm run dev
   ```
   Deschideți [http://localhost:3000](http://localhost:3000) în browser.

3. **Construire export static:**
   ```bash
   npm run build
   ```

4. **Publicare pe Cloudflare Pages:**
   ```bash
   npx wrangler pages deploy out --project-name=notebooklm-hub
   ```
