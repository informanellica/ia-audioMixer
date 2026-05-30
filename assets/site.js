// Client-side i18n for this extension's detail page (GitHub Pages).
(function () {
  const LANGS = [
    ["en", "English"], ["ja", "日本語"], ["es", "Español"], ["pt_BR", "Português"],
    ["fr", "Français"], ["de", "Deutsch"], ["it", "Italiano"], ["ru", "Русский"],
    ["zh_CN", "简体中文"], ["zh_TW", "繁體中文"], ["ko", "한국어"],
  ];
  const T = {
    tagline: { en: "Per-tab volume control", ja: "タブごとの音量コントロール", es: "Control de volumen por pestaña", pt_BR: "Controle de volume por aba", fr: "Volume par onglet", de: "Lautstärke pro Tab", it: "Volume per scheda", ru: "Громкость для каждой вкладки", zh_CN: "逐标签音量控制", zh_TW: "逐分頁音量控制", ko: "탭별 볼륨 조절" },
    desc: { en: "Set the volume of each tab independently — boost quiet tabs up to 600%, mute the loud ones. One simple popup mixer, with light and dark themes. Everything is processed locally; no audio is recorded and no data is collected.", ja: "ブラウザのタブごとに音量を個別調整。小さい音は最大600%までブースト、大きい音は下げる/ミュート。ひとつのシンプルなミキサーで操作でき、ライト/ダークテーマに対応。すべて端末内で処理し、音声の録音やデータ収集は行いません。", es: "Ajusta el volumen de cada pestaña por separado: amplifica las silenciosas hasta el 600 % y silencia las ruidosas. Un mezclador sencillo, con temas claro y oscuro. Todo se procesa localmente; no se graba audio ni se recopilan datos.", pt_BR: "Ajuste o volume de cada aba individualmente — aumente as silenciosas até 600% e silencie as barulhentas. Um mixer simples, com temas claro e escuro. Tudo é processado localmente; nenhum áudio é gravado e nenhum dado é coletado.", fr: "Réglez le volume de chaque onglet individuellement — amplifiez les onglets faibles jusqu'à 600 % et coupez les bruyants. Un mélangeur simple, avec thèmes clair et sombre. Tout est traité en local ; aucun audio enregistré, aucune donnée collectée.", de: "Stelle die Lautstärke jedes Tabs einzeln ein — leise Tabs bis 600 % verstärken, laute stummschalten. Ein einfacher Mixer, mit hellem und dunklem Design. Alles wird lokal verarbeitet; keine Audioaufnahme, keine Datenerfassung.", it: "Regola il volume di ogni scheda singolarmente: amplifica quelle silenziose fino al 600% e disattiva quelle rumorose. Un mixer semplice, con temi chiaro e scuro. Tutto è elaborato in locale; nessun audio registrato, nessun dato raccolto.", ru: "Регулируйте громкость каждой вкладки отдельно — усиливайте тихие до 600 % и заглушайте громкие. Простой микшер со светлой и тёмной темами. Всё обрабатывается локально; звук не записывается, данные не собираются.", zh_CN: "单独调节每个标签页的音量——将安静的标签页提升至 600%，将吵闹的静音。一个简单的混音器，支持浅色和深色主题。全部本地处理，不录制音频、不收集数据。", zh_TW: "個別調整每個分頁的音量——將安靜的分頁提升至 600%，將吵雜的靜音。一個簡單的混音器，支援淺色與深色主題。全部在本機處理，不錄製音訊、不收集資料。", ko: "탭마다 볼륨을 개별 조절 — 조용한 탭은 최대 600%까지 키우고 시끄러운 탭은 음소거. 간단한 믹서와 밝은/어두운 테마. 모든 처리는 로컬에서 이루어지며 오디오 녹음이나 데이터 수집을 하지 않습니다." },
    apps: { en: "All apps", ja: "アプリ一覧", es: "Aplicaciones", pt_BR: "Aplicativos", fr: "Applications", de: "Apps", it: "App", ru: "Приложения", zh_CN: "应用", zh_TW: "應用程式", ko: "앱" },
    support: { en: "Support", ja: "サポート", es: "Soporte", pt_BR: "Suporte", fr: "Assistance", de: "Support", it: "Assistenza", ru: "Поддержка", zh_CN: "支持", zh_TW: "支援", ko: "지원" },
    releases: { en: "Download (releases)", ja: "ダウンロード（リリース）", es: "Descargar (versiones)", pt_BR: "Baixar (versões)", fr: "Télécharger (versions)", de: "Download (Releases)", it: "Scarica (release)", ru: "Скачать (релизы)", zh_CN: "下载（发布）", zh_TW: "下載（發行）", ko: "다운로드(릴리스)" },
    source: { en: "Source code", ja: "ソースコード", es: "Código fuente", pt_BR: "Código-fonte", fr: "Code source", de: "Quellcode", it: "Codice sorgente", ru: "Исходный код", zh_CN: "源代码", zh_TW: "原始碼", ko: "소스 코드" },
    privacy: { en: "Privacy policy", ja: "プライバシーポリシー", es: "Política de privacidad", pt_BR: "Política de privacidade", fr: "Confidentialité", de: "Datenschutz", it: "Privacy", ru: "Конфиденциальность", zh_CN: "隐私政策", zh_TW: "隱私權政策", ko: "개인정보처리방침" },
    note: { en: "For Chrome & Edge · No data collected · Open source", ja: "Chrome・Edge 対応 · データ収集なし · オープンソース", es: "Para Chrome y Edge · Sin recopilación de datos · Código abierto", pt_BR: "Para Chrome e Edge · Sem coleta de dados · Código aberto", fr: "Pour Chrome et Edge · Aucune donnée collectée · Open source", de: "Für Chrome & Edge · Keine Datenerfassung · Open Source", it: "Per Chrome ed Edge · Nessun dato raccolto · Open source", ru: "Для Chrome и Edge · Данные не собираются · Открытый код", zh_CN: "支持 Chrome 与 Edge · 不收集数据 · 开源", zh_TW: "支援 Chrome 與 Edge · 不收集資料 · 開源", ko: "Chrome·Edge 지원 · 데이터 미수집 · 오픈소스" },
  };

  const tr = (k, l) => (T[k] ? (T[k][l] || T[k].en) : "");
  function resolveLang() {
    const s = localStorage.getItem("site_lang");
    if (s && LANGS.some(([c]) => c === s)) return s;
    const n = (navigator.language || "en").toLowerCase();
    if (n.startsWith("ja")) return "ja";
    if (n.startsWith("pt")) return "pt_BR";
    if (n.startsWith("ko")) return "ko";
    if (n.startsWith("zh")) return (n.includes("tw") || n.includes("hant") || n.includes("hk") || n.includes("mo")) ? "zh_TW" : "zh_CN";
    for (const [c] of LANGS) if (n.startsWith(c.split("_")[0])) return c;
    return "en";
  }
  function apply(l) {
    document.documentElement.lang = l.replace("_", "-");
    document.querySelectorAll("[data-i18n]").forEach((el) => { const v = tr(el.dataset.i18n, l); if (v) el.textContent = v; });
    document.querySelectorAll("[data-i18n-content]").forEach((el) => { const v = tr(el.dataset.i18nContent, l); if (v) el.setAttribute("content", v); });
  }
  function switcher(l) {
    const host = document.getElementById("lang-switcher"); if (!host) return;
    const g = document.createElement("div"); g.className = "input-group input-group-sm"; g.style.width = "auto";
    const ic = document.createElement("span"); ic.className = "input-group-text"; ic.innerHTML = '<i class="bi bi-translate"></i>';
    const sel = document.createElement("select"); sel.className = "form-select form-select-sm"; sel.style.maxWidth = "10rem";
    sel.setAttribute("aria-label", "Language / 言語"); sel.title = "Language / 言語";
    for (const [c, n] of LANGS) { const o = document.createElement("option"); o.value = c; o.textContent = n; if (c === l) o.selected = true; sel.appendChild(o); }
    sel.addEventListener("change", () => { localStorage.setItem("site_lang", sel.value); apply(sel.value); });
    g.appendChild(ic); g.appendChild(sel); host.appendChild(g);
  }
  const lang = resolveLang(); apply(lang); switcher(lang);
})();
