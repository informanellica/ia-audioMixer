// Generate Chrome/Edge store assets from the REAL popup, for every UI locale.
//
// For each locale it renders popup.html with mocked chrome.* APIs + that
// locale's messages inside a branded 1280x800 promo layout, and writes:
//   dist/store-assets/<lang>/screenshot-1280x800.png
//   dist/store-assets/<lang>/promo-tile-440x280.png
// Plus, at the top level: store-icon-128.png, privacy-policy.md, SUBMISSION.md.
//
// Requires Playwright + an installed Google Chrome. Run from the repo root:
//   npm install        # once
//   npm run assets     # -> dist/store-assets/
import { chromium } from "playwright";
import { pathToFileURL, fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "dist", "store-assets");

const CONFIG = {
  storeName: "Tab Volume Mixer",
  zip: "ia-audioMixer-v1.0.2.zip",
  uiLocale: "en", // locale used for the top-level SUBMISSION packet
  privacy: "https://informanellica.github.io/ia-audioMixer/PRIVACY",
  category: "Productivity / 仕事効率化",
  perms: "tabCapture, tabs, offscreen, storage",
  version: "1.0.2",
  summaryEN: "Set the volume of each tab independently — boost quiet tabs up to 600%, turn down or mute loud ones, all from one mixer.",
  summaryJA: "タブごとに音量を個別調整。小さい音は最大600%までブースト、大きい音は下げる/ミュート。ひとつのミキサーでまとめて操作できます。",
  homepage: "https://informanellica.com",
  support: "https://github.com/informanellica/ia-audioMixer",
  singlePurpose: "Adjust the audio volume of individual browser tabs.",
  // Store "Description" (16,000 chars) per language — paste into the listing.
  desc: {
    en: "Tab Volume Mixer gives every browser tab its own volume control. Boost quiet tabs up to 600%, turn others down, or mute them — all from one simple popup mixer, with light and dark themes. Everything is processed locally: no audio is recorded, no data is collected, and no network requests are made.",
    ja: "Tab Volume Mixer は、ブラウザのタブごとに独立した音量コントロールを提供します。小さい音は最大600%までブースト、大きい音は下げる/ミュート——ひとつのシンプルなミキサーで操作でき、ライト/ダークテーマに対応。すべて端末内で処理され、音声の録音・データ収集・通信は一切行いません。",
    es: "Tab Volume Mixer da a cada pestaña su propio control de volumen. Amplifica las pestañas silenciosas hasta el 600 %, baja las demás o siléncialas, todo desde un sencillo mezclador, con temas claro y oscuro. Todo se procesa localmente: no se graba audio, no se recopilan datos ni se hacen peticiones de red.",
    pt_BR: "O Tab Volume Mixer dá a cada aba seu próprio controle de volume. Aumente as abas silenciosas até 600%, abaixe as outras ou silencie-as — tudo em um mixer simples, com temas claro e escuro. Tudo é processado localmente: nenhum áudio é gravado, nenhum dado é coletado e nenhuma requisição de rede é feita.",
    fr: "Tab Volume Mixer donne à chaque onglet son propre réglage de volume. Amplifiez les onglets faibles jusqu'à 600 %, baissez les autres ou coupez-les — le tout depuis un mélangeur simple, avec thèmes clair et sombre. Tout est traité en local : aucun audio enregistré, aucune donnée collectée, aucune requête réseau.",
    de: "Tab Volume Mixer gibt jedem Tab seine eigene Lautstärkeregelung. Verstärke leise Tabs bis 600 %, senke andere ab oder schalte sie stumm — alles in einem einfachen Mixer, mit hellem und dunklem Design. Alles wird lokal verarbeitet: keine Audioaufnahme, keine Datenerfassung, keine Netzwerkanfragen.",
    it: "Tab Volume Mixer dà a ogni scheda il proprio controllo del volume. Amplifica le schede silenziose fino al 600%, abbassa le altre o disattivale — tutto da un semplice mixer, con temi chiaro e scuro. Tutto viene elaborato in locale: nessun audio registrato, nessun dato raccolto, nessuna richiesta di rete.",
    ru: "Tab Volume Mixer даёт каждой вкладке собственный регулятор громкости. Усиливайте тихие вкладки до 600 %, убавляйте остальные или заглушайте их — всё в одном простом микшере, со светлой и тёмной темами. Всё обрабатывается локально: звук не записывается, данные не собираются, сетевые запросы не выполняются.",
    zh_CN: "Tab Volume Mixer 为每个标签页提供独立的音量控制。将安静的标签页提升至 600%，调低或静音其他标签页——全部在一个简单的混音器中完成，并支持浅色和深色主题。一切均在本地处理：不录制音频、不收集数据，也不发起网络请求。",
    zh_TW: "Tab Volume Mixer 為每個分頁提供獨立的音量控制。將安靜的分頁提升至 600%，調低或靜音其他分頁——全部在一個簡單的混音器中完成，並支援淺色與深色主題。一切皆在本機處理：不錄製音訊、不收集資料，也不發出網路請求。",
    ko: "Tab Volume Mixer는 모든 탭에 개별 볼륨 컨트롤을 제공합니다. 조용한 탭은 최대 600%까지 키우고 다른 탭은 낮추거나 음소거하세요 — 간단한 믹서 하나로, 밝은/어두운 테마와 함께. 모든 처리는 로컬에서 이루어지며 오디오를 녹음하거나 데이터를 수집하거나 네트워크 요청을 하지 않습니다.",
  },
  popupWidth: 340,
  popupHeight: 380,
  zoom: 1.6,
  // Short marketing headline per locale (the sub-line reuses the localized appDesc).
  promoHead: {
    en: "Per-tab volume control",
    ja: "タブごとの音量コントロール",
    es: "Control de volumen por pestaña",
    pt_BR: "Controle de volume por aba",
    fr: "Volume par onglet",
    de: "Lautstärke pro Tab",
    it: "Volume per scheda",
    ru: "Громкость для каждой вкладки",
    zh_CN: "逐标签音量控制",
    zh_TW: "逐分頁音量控制",
    ko: "탭별 볼륨 조절",
  },
};

// chrome.* mock + sample data so the popup renders a realistic, full state.
const MOCK = `
const fav=c=>'data:image/svg+xml,'+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><rect width='16' height='16' rx='4' fill='"+c+"'/></svg>");
const tabs=[
 {id:1,audible:true,title:'YouTube — Lo-fi beats to relax / study to',url:'https://youtube.com',favIconUrl:fav('red')},
 {id:2,audible:true,title:'Spotify — Web Player',url:'https://open.spotify.com',favIconUrl:fav('mediumseagreen')},
 {id:3,audible:true,title:'Zoom Meeting',url:'https://zoom.us',favIconUrl:fav('dodgerblue')},
 {id:4,audible:true,title:'Twitch — Live Stream',url:'https://twitch.tv',favIconUrl:fav('blueviolet')},
];
const state={1:1.0,2:0.5,3:1.6,4:0.0};
window.chrome={
 storage:{local:{get:async()=>({theme:'light'}),set:async()=>{}}},
 tabs:{query:async()=>tabs},
 runtime:{sendMessage:async(m)=>(m&&m.type==='popup-get-state')?{state}:{ok:true}},
};
`;

// --- shared generator (identical across the three extensions) ---
const CJK = new Set(["ja", "zh_CN", "zh_TW", "ko"]);
const FONT_LATIN = "'Segoe UI',Arial,sans-serif";
const FONT_CJK = "'Segoe UI','Yu Gothic UI','Microsoft YaHei','Microsoft JhengHei','Malgun Gothic','Meiryo',sans-serif";

export async function generate(cfg, mock, root, out) {
  fs.mkdirSync(out, { recursive: true });
  const popupUrl = pathToFileURL(path.join(root, "popup.html")).href;
  const iconUrl = pathToFileURL(path.join(root, "icons", "icon128.png")).href;

  const browser = await chromium.launch({ channel: "chrome" });

  for (const lang of Object.keys(cfg.promoHead)) {
    const msgsRaw = JSON.parse(fs.readFileSync(path.join(root, "_locales", lang, "messages.json"), "utf8"));
    const flat = {};
    for (const k in msgsRaw) flat[k] = msgsRaw[k].message;
    const head = cfg.promoHead[lang];
    const sub = flat.appDesc || "";
    const fontFam = CJK.has(lang) ? FONT_CJK : FONT_LATIN;
    const i18nMock = `(()=>{const M=${JSON.stringify(flat)};window.chrome=window.chrome||{};window.chrome.i18n={getMessage:(k,subs)=>{let s=(M[k]||"");if(subs!=null){const a=[].concat(subs);let i=0;s=s.replace(/\\$\\w+\\$/g,()=>a[i++]??"");}return s;}};})();`;

    const promo = `<!doctype html><html lang="${lang.replace("_", "-")}"><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
.stage{width:1280px;height:800px;display:flex;align-items:center;
 background:linear-gradient(135deg,#0a2540,#103a8e);font-family:${fontFam};overflow:hidden}
.copy{flex:1;padding:0 72px}
.copy h1{color:#fff;font-size:50px;line-height:1.15;margin-bottom:18px;font-weight:700}
.copy p{color:#c8d6f0;font-size:26px;line-height:1.5}
.device{margin-right:96px;border-radius:16px;overflow:hidden;
 box-shadow:0 26px 70px rgba(0,0,0,.5);flex:0 0 auto;zoom:${cfg.zoom}}
.device iframe{border:0;display:block;width:${cfg.popupWidth}px;height:${cfg.popupHeight}px;background:#fff}
</style></head><body><div class="stage">
 <div class="copy"><h1>${escapeHtml(head)}</h1><p>${escapeHtml(sub)}</p></div>
 <div class="device"><iframe src="${popupUrl}"></iframe></div>
</div></body></html>`;

    const tile = `<!doctype html><html lang="${lang.replace("_", "-")}"><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
.t{width:440px;height:280px;display:flex;align-items:center;gap:24px;padding:0 40px;
 background:linear-gradient(135deg,#0a2540,#103a8e);font-family:${fontFam};color:#fff}
.t img{width:96px;height:96px}
.t h2{font-size:28px;font-weight:700}
.t p{font-size:17px;color:#c8d6f0;margin-top:6px}
</style></head><body><div class="t"><img src="${iconUrl}">
 <div><h2>${escapeHtml(cfg.storeName)}</h2><p>${escapeHtml(head)}</p></div></div></body></html>`;

    const dir = path.join(out, lang);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "_promo.html"), promo);
    fs.writeFileSync(path.join(dir, "_tile.html"), tile);

    // Fresh context per locale so init scripts don't accumulate.
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.addInitScript({ content: mock + "\n" + i18nMock });
    await page.goto(pathToFileURL(path.join(dir, "_promo.html")).href);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(dir, "screenshot-1280x800.png"), clip: { x: 0, y: 0, width: 1280, height: 800 } });

    await page.setViewportSize({ width: 440, height: 280 });
    await page.goto(pathToFileURL(path.join(dir, "_tile.html")).href);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(dir, "promo-tile-440x280.png"), clip: { x: 0, y: 0, width: 440, height: 280 } });
    await ctx.close();

    fs.rmSync(path.join(dir, "_promo.html"), { force: true });
    fs.rmSync(path.join(dir, "_tile.html"), { force: true });

    // The primary UI locale doubles as the top-level default screenshot/tile.
    if (lang === cfg.uiLocale) {
      fs.copyFileSync(path.join(dir, "screenshot-1280x800.png"), path.join(out, "screenshot-1280x800.png"));
      fs.copyFileSync(path.join(dir, "promo-tile-440x280.png"), path.join(out, "promo-tile-440x280.png"));
    }
    console.log("  shot", lang);
  }

  await browser.close();

  fs.copyFileSync(path.join(root, "icons", "icon128.png"), path.join(out, "store-icon-128.png"));

  const listing = fs.readFileSync(path.join(root, "store", "listing.md"), "utf8");
  const privacy = fs.readFileSync(path.join(root, "PRIVACY.md"), "utf8");
  fs.writeFileSync(path.join(out, "privacy-policy.md"), privacy);
  fs.writeFileSync(path.join(out, "SUBMISSION.md"), submissionDoc(cfg, listing));

  console.log("store assets ->", out);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Field-by-field packet mirroring the Chrome Web Store / Edge listing forms,
// with the full listing text embedded so dist/ needs nothing else.
const LANG_NAME = {
  en: "English", ja: "日本語", es: "Español", pt_BR: "Português (BR)", fr: "Français",
  de: "Deutsch", it: "Italiano", ru: "Русский", zh_CN: "简体中文", zh_TW: "繁體中文", ko: "한국어",
};

// Top-to-bottom, all-language submission walkthrough.
function submissionDoc(cfg, listing) {
  const langs = Object.keys(cfg.promoHead);
  const rows = langs
    .map((l) => `| ${l} — ${LANG_NAME[l] || l} | \`${l}/screenshot-1280x800.png\` | \`${l}/promo-tile-440x280.png\` |`)
    .join("\n");
  const descs = langs
    .map((l) => `### ${LANG_NAME[l] || l} (${l})\n\n${cfg.desc[l] || cfg.desc.en}`)
    .join("\n\n");

  return `# Submission — ${cfg.storeName} (v${cfg.version}) — step by step

Follow top to bottom. The **Title** and **Summary** are taken automatically from
the extension package (already localized into all ${langs.length} languages), so
per language you only set the **Description** and upload the **localized
screenshot**. Everything you need is in this folder (per-locale images in
\`<lang>/\` subfolders).

## Step 0 — Before you start
- Host the privacy policy and confirm the URL opens: ${cfg.privacy}
  (text: \`privacy-policy.md\` in this folder)
- Accounts: Chrome Web Store developer (\$5 one-time) / Edge Partner Center (free).

## Step 1 — Create the item & upload the package
1. Chrome Web Store Developer Dashboard → **New item**.
2. Upload \`../${cfg.zip}\`.

## Step 2 — All-languages (default) assets  [required, once]
Under **「全言語向けアセット」 / All-languages assets**:
- Store icon (128×128): \`store-icon-128.png\`
- All-languages screenshot (fallback for any language): \`en/screenshot-1280x800.png\`
- Promo tile 440×280 (optional): \`en/promo-tile-440x280.png\`
- Marquee 1400×560: skip

## Step 3 — Other fields (set once, 「すべての言語用」)
- Category: ${cfg.category}
- Homepage URL: ${cfg.homepage}
- Support URL: ${cfg.support}
- Mature content: **No**
- Visibility: **Public**

## Step 4 — Per-language listing (repeat for each language)
Switch **「編集中の言語」 / Editing language**, then for that language:
1. Description: paste the text from Step 5 for that language.
2. Localized screenshot (「ローカライズ版スクリーンショット」): upload that language's file.
(Title & Summary fill in automatically.)

| Language | Localized screenshot | Localized tile |
| --- | --- | --- |
${rows}

Minimum: do **English + 日本語**. The other languages can be added anytime —
until then those users see the auto-localized title/summary + the all-languages
(English) screenshot.

## Step 5 — Descriptions to paste (per language)

${descs}

## Step 6 — Privacy practices tab
- Single purpose: ${cfg.singlePurpose}
- Permissions in this build: ${cfg.perms} — justification wording is in the Appendix.
- Uses remote code? **No**
- Data collection: **none** → tick the 3 certifications (no selling, single-purpose only, not for creditworthiness)
- Privacy policy URL: ${cfg.privacy}

## Step 7 — Submit
Click **Submit for review**. Review takes hours–days (broad permissions take longer).

## Step 8 — Microsoft Edge Add-ons (same package)
1. Partner Center → new extension → upload \`../${cfg.zip}\`.
2. Reuse the same descriptions / screenshots / URLs above.
3. Privacy: same policy URL, no data collected → **Publish**.

---

## Appendix — EN/JA listing reference (summaries + permission justifications)

${listing}
`;
}

await generate(CONFIG, MOCK, ROOT, OUT);
