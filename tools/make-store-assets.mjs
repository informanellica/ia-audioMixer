// Generate Chrome/Edge store assets from the REAL popup.
//
// Renders popup.html with mocked chrome.* APIs + sample data inside a branded
// 1280x800 promo layout, screenshots it (exact store size, no alpha), and also
// emits a 440x280 promo tile, a 128px store icon, and SUBMISSION.md.
//
// Requires Playwright and an installed Google Chrome. Run from the repo root:
//   npm install        # once (pulls playwright)
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
  uiLocale: "en",
  head: "Per-tab volume control",
  sub: "Boost quiet tabs up to 600%.\nMute the loud ones. One simple mixer.",
  jp: false,
  privacy: "https://informanellica.github.io/ia-audioMixer/PRIVACY",
  category: "Productivity / 仕事効率化",
  perms: "tabCapture, tabs, offscreen, storage",
  version: "1.0.2",
  summaryEN: "Set the volume of each tab independently — boost quiet tabs up to 600%, turn down or mute loud ones, all from one mixer.",
  summaryJA: "タブごとに音量を個別調整。小さい音は最大600%までブースト、大きい音は下げる/ミュート。ひとつのミキサーでまとめて操作できます。",
  homepage: "https://informanellica.com",
  support: "https://github.com/informanellica/ia-audioMixer",
  popupWidth: 340,
  popupHeight: 380,
  zoom: 1.6,
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

await generate(CONFIG, MOCK, ROOT, OUT);

// --- shared generator (identical across the three extensions) ---
export async function generate(cfg, mock, root, out) {
  fs.mkdirSync(out, { recursive: true });
  const fontFam = cfg.jp
    ? "'Yu Gothic UI','Yu Gothic','Meiryo',sans-serif"
    : "'Segoe UI',Arial,sans-serif";
  const popupUrl = pathToFileURL(path.join(root, "popup.html")).href;
  const iconUrl = pathToFileURL(path.join(root, "icons", "icon128.png")).href;

  const promo = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
.stage{width:1280px;height:800px;display:flex;align-items:center;
 background:linear-gradient(135deg,#0a2540,#103a8e);font-family:${fontFam};overflow:hidden}
.copy{flex:1;padding:0 72px}
.copy h1{color:#fff;font-size:50px;line-height:1.15;margin-bottom:18px;font-weight:700}
.copy p{color:#c8d6f0;font-size:27px;line-height:1.5;white-space:pre-line}
.device{margin-right:96px;border-radius:16px;overflow:hidden;
 box-shadow:0 26px 70px rgba(0,0,0,.5);flex:0 0 auto;zoom:${cfg.zoom}}
.device iframe{border:0;display:block;width:${cfg.popupWidth}px;height:${cfg.popupHeight}px;background:#fff}
</style></head><body><div class="stage">
 <div class="copy"><h1>${cfg.head}</h1><p>${cfg.sub}</p></div>
 <div class="device"><iframe src="${popupUrl}"></iframe></div>
</div></body></html>`;

  const tile = `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
.t{width:440px;height:280px;display:flex;align-items:center;gap:24px;padding:0 40px;
 background:linear-gradient(135deg,#0a2540,#103a8e);font-family:${fontFam};color:#fff}
.t img{width:96px;height:96px}
.t h2{font-size:30px;font-weight:700}
.t p{font-size:18px;color:#c8d6f0;margin-top:6px}
</style></head><body><div class="t"><img src="${iconUrl}">
 <div><h2>${cfg.storeName}</h2><p>${cfg.head}</p></div></div></body></html>`;

  fs.writeFileSync(path.join(out, "_promo.html"), promo);
  fs.writeFileSync(path.join(out, "_tile.html"), tile);

  // chrome.i18n mock so the real popup renders localized strings.
  const msgsRaw = JSON.parse(fs.readFileSync(path.join(root, "_locales", cfg.uiLocale, "messages.json"), "utf8"));
  const flat = {};
  for (const k in msgsRaw) flat[k] = msgsRaw[k].message;
  const i18nMock = `(()=>{const M=${JSON.stringify(flat)};window.chrome=window.chrome||{};window.chrome.i18n={getMessage:(k,subs)=>{let s=(M[k]||"");if(subs!=null){const a=[].concat(subs);let i=0;s=s.replace(/\\$\\w+\\$/g,()=>a[i++]??"");}return s;}};})();`;

  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript({ content: mock + "\n" + i18nMock });

  await page.goto(pathToFileURL(path.join(out, "_promo.html")).href);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(out, "screenshot-1280x800.png"), clip: { x: 0, y: 0, width: 1280, height: 800 } });

  await page.setViewportSize({ width: 440, height: 280 });
  await page.goto(pathToFileURL(path.join(out, "_tile.html")).href);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, "promo-tile-440x280.png"), clip: { x: 0, y: 0, width: 440, height: 280 } });

  await browser.close();

  fs.copyFileSync(path.join(root, "icons", "icon128.png"), path.join(out, "store-icon-128.png"));
  fs.rmSync(path.join(out, "_promo.html"), { force: true });
  fs.rmSync(path.join(out, "_tile.html"), { force: true });

  // Inline the listing + privacy text so dist/ is fully self-contained.
  const listing = fs.readFileSync(path.join(root, "store", "listing.md"), "utf8");
  const privacy = fs.readFileSync(path.join(root, "PRIVACY.md"), "utf8");
  fs.writeFileSync(path.join(out, "privacy-policy.md"), privacy);

  fs.writeFileSync(path.join(out, "SUBMISSION.md"), submissionDoc(cfg, listing));

  console.log("store assets ->", out);
}

// Field-by-field packet mirroring the Chrome Web Store / Edge listing forms,
// with the full listing text embedded so dist/ needs nothing else.
function submissionDoc(cfg, listing) {
  return `# Submission packet — ${cfg.storeName} (v${cfg.version})

Self-contained: every value for the Chrome Web Store / Edge forms is in THIS
folder. The long Description text is in section D below.

## A. Store listing form
| Field | Value |
| --- | --- |
| Title | ${cfg.storeName} |
| Summary — EN (<=132) | ${cfg.summaryEN} |
| Summary — JA (<=132) | ${cfg.summaryJA} |
| Description | paste "Detailed description" from section D (EN / 日本語) |
| Category | ${cfg.category} |
| Language | English (primary); add 日本語 as a second locale |
| Store icon (128x128) | store-icon-128.png |
| Screenshots (1280x800) | screenshot-1280x800.png |
| Promo tile, small (440x280) | promo-tile-440x280.png (optional) |
| Marquee tile (1400x560) | optional — not provided |
| Homepage URL | ${cfg.homepage} |
| Support URL | ${cfg.support} |
| Mature content | No |
| Visibility | Public |

## B. Privacy practices tab
- Single purpose: see section D ("Single purpose" / 単一目的)
- Permission justifications: see section D ("Permission justifications" / 権限の正当化)
- Permissions in this build: ${cfg.perms}
- Uses remote code? No
- Data collection: none — then tick the 3 certifications (no selling of data,
  use limited to single purpose, not used for creditworthiness)
- Privacy policy URL: ${cfg.privacy}
- Privacy policy text (already hosted; local copy): privacy-policy.md

## C. Package to upload
- ../${cfg.zip}

---

## D. Listing text — full (EN + JA)

${listing}
`;
}
