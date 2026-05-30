// Generates _locales/<lang>/messages.json for every language below.
// Edit the table, then run:  node tools/build-locales.mjs
// _locales/ is shipped in the extension (committed, not gitignored).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BRAND = "Tab Volume Mixer"; // appName (brand, kept across locales)

// Keys: appDesc, settings, toggleTheme, showCaptureBtn, maxVolume, noAudible,
//       capture, on, mute, unmute, captureFailed, autoCaptureNote ($count$)
const L = {
  en: {
    appDesc: "Set the volume of each tab independently — boost quiet tabs up to 600%, mute the loud ones.",
    settings: "Settings",
    toggleTheme: "Toggle light/dark theme",
    showCaptureBtn: "Show capture button",
    maxVolume: "Max volume (boost)",
    noAudible: "No audible tabs found",
    capture: "Capture",
    on: "ON",
    mute: "Mute",
    unmute: "Unmute",
    captureFailed: "Can't capture this tab. Switch to it (make it active) and try again.",
    autoCaptureNote: "$count$ playing tab(s) couldn't be controlled automatically — switch to a tab to adjust its volume.",
  },
  ja: {
    appDesc: "タブごとに音量を個別に調整。小さい音は最大600%までブースト、大きい音はミュート。",
    settings: "設定",
    toggleTheme: "ライト/ダークテーマ切替",
    showCaptureBtn: "キャプチャボタンを表示",
    maxVolume: "最大音量(ブースト)",
    noAudible: "再生中のタブがありません",
    capture: "キャプチャ",
    on: "ON",
    mute: "ミュート",
    unmute: "ミュート解除",
    captureFailed: "このタブはキャプチャできません。タブを切り替えて(アクティブにして)もう一度お試しください。",
    autoCaptureNote: "$count$個の再生中タブを自動制御できませんでした。タブを切り替えて音量を調整してください。",
  },
  es: {
    appDesc: "Ajusta el volumen de cada pestaña por separado: amplifica las silenciosas hasta el 600 % y silencia las ruidosas.",
    settings: "Configuración",
    toggleTheme: "Cambiar tema claro/oscuro",
    showCaptureBtn: "Mostrar botón de captura",
    maxVolume: "Volumen máximo (refuerzo)",
    noAudible: "No se encontraron pestañas con sonido",
    capture: "Capturar",
    on: "ON",
    mute: "Silenciar",
    unmute: "Activar sonido",
    captureFailed: "No se puede capturar esta pestaña. Cámbiate a ella (actívala) e inténtalo de nuevo.",
    autoCaptureNote: "No se pudieron controlar automáticamente $count$ pestaña(s) en reproducción: cambia a una pestaña para ajustar su volumen.",
  },
  pt_BR: {
    appDesc: "Ajuste o volume de cada aba individualmente — aumente as silenciosas até 600% e silencie as barulhentas.",
    settings: "Configurações",
    toggleTheme: "Alternar tema claro/escuro",
    showCaptureBtn: "Mostrar botão de captura",
    maxVolume: "Volume máximo (reforço)",
    noAudible: "Nenhuma aba com áudio encontrada",
    capture: "Capturar",
    on: "ON",
    mute: "Silenciar",
    unmute: "Reativar som",
    captureFailed: "Não é possível capturar esta aba. Mude para ela (deixe-a ativa) e tente novamente.",
    autoCaptureNote: "Não foi possível controlar automaticamente $count$ aba(s) em reprodução — mude para uma aba para ajustar o volume.",
  },
  fr: {
    appDesc: "Réglez le volume de chaque onglet individuellement — amplifiez les onglets faibles jusqu'à 600 % et coupez les bruyants.",
    settings: "Paramètres",
    toggleTheme: "Basculer thème clair/sombre",
    showCaptureBtn: "Afficher le bouton de capture",
    maxVolume: "Volume maximal (amplification)",
    noAudible: "Aucun onglet audio trouvé",
    capture: "Capturer",
    on: "ON",
    mute: "Couper le son",
    unmute: "Réactiver le son",
    captureFailed: "Impossible de capturer cet onglet. Passez dessus (activez-le) puis réessayez.",
    autoCaptureNote: "Impossible de contrôler automatiquement $count$ onglet(s) en lecture — passez sur un onglet pour régler son volume.",
  },
  de: {
    appDesc: "Stelle die Lautstärke jedes Tabs einzeln ein — leise Tabs bis 600 % verstärken, laute stummschalten.",
    settings: "Einstellungen",
    toggleTheme: "Helles/dunkles Design umschalten",
    showCaptureBtn: "Aufnahme-Schaltfläche anzeigen",
    maxVolume: "Maximale Lautstärke (Verstärkung)",
    noAudible: "Keine Tabs mit Ton gefunden",
    capture: "Aufnehmen",
    on: "ON",
    mute: "Stummschalten",
    unmute: "Stummschaltung aufheben",
    captureFailed: "Dieser Tab kann nicht erfasst werden. Wechsle zu ihm (aktiviere ihn) und versuche es erneut.",
    autoCaptureNote: "$count$ wiedergebende Tab(s) konnten nicht automatisch gesteuert werden — wechsle zu einem Tab, um die Lautstärke anzupassen.",
  },
  it: {
    appDesc: "Regola il volume di ogni scheda singolarmente: amplifica quelle silenziose fino al 600% e disattiva quelle rumorose.",
    settings: "Impostazioni",
    toggleTheme: "Attiva/disattiva tema chiaro/scuro",
    showCaptureBtn: "Mostra pulsante di cattura",
    maxVolume: "Volume massimo (boost)",
    noAudible: "Nessuna scheda con audio trovata",
    capture: "Cattura",
    on: "ON",
    mute: "Disattiva audio",
    unmute: "Riattiva audio",
    captureFailed: "Impossibile catturare questa scheda. Passa a essa (rendila attiva) e riprova.",
    autoCaptureNote: "Impossibile controllare automaticamente $count$ scheda/e in riproduzione: passa a una scheda per regolarne il volume.",
  },
  ru: {
    appDesc: "Регулируйте громкость каждой вкладки отдельно — усиливайте тихие до 600 % и заглушайте громкие.",
    settings: "Настройки",
    toggleTheme: "Светлая/тёмная тема",
    showCaptureBtn: "Показывать кнопку захвата",
    maxVolume: "Макс. громкость (усиление)",
    noAudible: "Вкладки со звуком не найдены",
    capture: "Захват",
    on: "ON",
    mute: "Заглушить",
    unmute: "Включить звук",
    captureFailed: "Не удаётся захватить эту вкладку. Переключитесь на неё (сделайте активной) и повторите попытку.",
    autoCaptureNote: "Не удалось автоматически управлять $count$ воспроизводящимися вкладками — переключитесь на вкладку, чтобы настроить громкость.",
  },
  zh_CN: {
    appDesc: "单独调节每个标签页的音量——将安静的标签页提升至 600%，将吵闹的静音。",
    settings: "设置",
    toggleTheme: "切换浅色/深色主题",
    showCaptureBtn: "显示捕获按钮",
    maxVolume: "最大音量（增强）",
    noAudible: "未找到有声音的标签页",
    capture: "捕获",
    on: "ON",
    mute: "静音",
    unmute: "取消静音",
    captureFailed: "无法捕获此标签页。请切换到该标签页（设为活动）后重试。",
    autoCaptureNote: "有 $count$ 个正在播放的标签页无法自动控制——请切换到该标签页以调节音量。",
  },
  zh_TW: {
    appDesc: "個別調整每個分頁的音量——將安靜的分頁提升至 600%，將吵雜的靜音。",
    settings: "設定",
    toggleTheme: "切換淺色/深色主題",
    showCaptureBtn: "顯示擷取按鈕",
    maxVolume: "最大音量（增強）",
    noAudible: "找不到有聲音的分頁",
    capture: "擷取",
    on: "ON",
    mute: "靜音",
    unmute: "取消靜音",
    captureFailed: "無法擷取此分頁。請切換到該分頁（設為使用中）後再試一次。",
    autoCaptureNote: "有 $count$ 個正在播放的分頁無法自動控制——請切換到該分頁以調整音量。",
  },
  ko: {
    appDesc: "탭마다 볼륨을 개별 조절하세요 — 조용한 탭은 최대 600%까지 증폭하고 시끄러운 탭은 음소거.",
    settings: "설정",
    toggleTheme: "밝은/어두운 테마 전환",
    showCaptureBtn: "캡처 버튼 표시",
    maxVolume: "최대 볼륨(부스트)",
    noAudible: "소리 나는 탭이 없습니다",
    capture: "캡처",
    on: "ON",
    mute: "음소거",
    unmute: "음소거 해제",
    captureFailed: "이 탭은 캡처할 수 없습니다. 해당 탭으로 전환(활성화)한 후 다시 시도하세요.",
    autoCaptureNote: "재생 중인 탭 $count$개를 자동으로 제어하지 못했습니다 — 탭으로 전환하여 볼륨을 조절하세요.",
  },
};

for (const [lang, m] of Object.entries(L)) {
  const out = { appName: { message: BRAND } };
  for (const [k, v] of Object.entries(m)) {
    out[k] = { message: v };
    if (k === "autoCaptureNote") out[k].placeholders = { count: { content: "$1" } };
  }
  const dir = path.join(ROOT, "_locales", lang);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "messages.json"), JSON.stringify(out, null, 2) + "\n");
}
console.log("locales:", Object.keys(L).join(", "));
