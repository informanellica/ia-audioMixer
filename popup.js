const tabListEl = document.getElementById("tab-list");
const emptyStateEl = document.getElementById("empty-state");
const statusEl = document.getElementById("status");
const themeToggleEl = document.getElementById("theme-toggle");
const settingsToggleEl = document.getElementById("settings-toggle");
const settingsPanelEl = document.getElementById("settings-panel");
const captureBtnToggleEl = document.getElementById("toggle-capture-btn");
const maxVolumeEl = document.getElementById("max-volume");

// Default ceiling for the volume slider (percent). Configurable via settings.
const DEFAULT_MAX_VOLUME = 500;
let maxVolume = DEFAULT_MAX_VOLUME;

// Messaging helper: never rejects, so a dropped service-worker connection
// can't surface as an uncaught promise rejection.
async function send(message) {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch (err) {
    console.warn("message failed:", message?.type, err);
    return null;
  }
}

function showStatus(text) {
  if (!text) {
    statusEl.hidden = true;
    statusEl.textContent = "";
    return;
  }
  statusEl.textContent = text;
  statusEl.hidden = false;
}

// --- Settings ---
// Whether the per-tab "Capture" button is visible. Default: hidden.
function applyShowCaptureBtn(show) {
  document.body.classList.toggle("hide-capture", !show);
  captureBtnToggleEl.checked = show;
}

async function initSettings() {
  const { showCaptureBtn, maxVolume: storedMax } = await chrome.storage.local.get([
    "showCaptureBtn",
    "maxVolume",
  ]);
  applyShowCaptureBtn(showCaptureBtn === true);

  maxVolume = clampMaxVolume(storedMax);
  maxVolumeEl.value = String(maxVolume);
}

// Keep stored values sane regardless of how they got there.
function clampMaxVolume(value) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return DEFAULT_MAX_VOLUME;
  return Math.min(600, Math.max(100, n));
}

settingsToggleEl.addEventListener("click", () => {
  const willShow = settingsPanelEl.hasAttribute("hidden");
  settingsPanelEl.toggleAttribute("hidden", !willShow);
  settingsToggleEl.classList.toggle("active", willShow);
});

captureBtnToggleEl.addEventListener("change", async () => {
  const show = captureBtnToggleEl.checked;
  applyShowCaptureBtn(show);
  await chrome.storage.local.set({ showCaptureBtn: show });
});

maxVolumeEl.addEventListener("change", async () => {
  maxVolume = clampMaxVolume(maxVolumeEl.value);
  await chrome.storage.local.set({ maxVolume });
  // Re-render so every slider picks up the new ceiling.
  tabListEl.innerHTML = "";
  tabListEl.appendChild(emptyStateEl);
  loadTabs();
});

// --- Theme: default light, follow system, manual override remembered ---
let manualTheme; // "light" | "dark" | undefined (= follow system)

function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
}

const prefersDark = () =>
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

// Stored manual choice wins; otherwise follow the system; default light.
function resolveTheme(stored) {
  if (stored === "light" || stored === "dark") return stored;
  return prefersDark() ? "dark" : "light";
}

async function initTheme() {
  const { theme } = await chrome.storage.local.get("theme");
  manualTheme = theme;
  applyTheme(resolveTheme(theme));
  // Follow OS theme changes while no manual choice is stored.
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (manualTheme !== "light" && manualTheme !== "dark") {
        applyTheme(e.matches ? "dark" : "light");
      }
    });
  }
}

themeToggleEl.addEventListener("click", async () => {
  const current = document.documentElement.getAttribute("data-bs-theme");
  const next = current === "dark" ? "light" : "dark";
  manualTheme = next;
  applyTheme(next);
  await chrome.storage.local.set({ theme: next });
});

// Volume before mute, per tab
const preMuteVolumes = new Map();

async function getState() {
  const res = await send({ type: "popup-get-state" });
  return res?.state || {};
}

async function loadTabs() {
  // Get all tabs (show audible ones first, but list all so user can capture any)
  const tabs = await chrome.tabs.query({});
  const audibleTabs = tabs.filter((t) => t.audible);
  const otherTabs = tabs.filter(
    (t) => !t.audible && !t.url?.startsWith("chrome://") && !t.url?.startsWith("edge://") && !t.url?.startsWith("chrome-extension://")
  );

  // Get current capture state from background
  let capturedState = await getState();

  // Auto-capture: start capturing any audible tab that isn't captured yet,
  // so the user gets a live volume slider without clicking "Capture".
  const toCapture = audibleTabs.filter((t) => capturedState[t.id] === undefined);
  if (toCapture.length > 0) {
    const results = await Promise.all(
      toCapture.map((t) => send({ type: "popup-start-capture", tabId: t.id }))
    );
    const failed = results.filter((r) => !r || !r.ok).length;
    if (failed > 0) {
      // Expected for background tabs: tabCapture only allows the active tab.
      showStatus(
        `${failed} playing tab${failed > 1 ? "s" : ""} couldn't be controlled automatically — ` +
          `switch to a tab to adjust its volume.`
      );
    } else {
      showStatus("");
    }
    // Refresh state so the newly captured tabs render as active
    capturedState = await getState();
  } else {
    showStatus("");
  }

  // Show all tabs: audible (and captured) first, then the rest so any tab can be captured
  const displayTabs = [...audibleTabs];
  for (const tab of otherTabs) {
    if (!displayTabs.find((t) => t.id === tab.id)) {
      displayTabs.push(tab);
    }
  }

  if (displayTabs.length === 0) {
    emptyStateEl.style.display = "block";
    return;
  }

  emptyStateEl.style.display = "none";

  for (const tab of displayTabs) {
    const isCaptured = capturedState[tab.id] !== undefined;
    const volume = isCaptured ? capturedState[tab.id] : 1.0;
    renderTab(tab, isCaptured, volume);
  }
}

function renderTab(tab, isCaptured, volume) {
  const item = document.createElement("div");
  item.className = "tab-item";
  item.dataset.tabId = tab.id;

  const isMuted = volume === 0;
  const percentage = Math.round(volume * 100);
  const isBoosted = volume > 1.0;
  // Never hide a tab's current level even if it exceeds the configured ceiling.
  const sliderMax = Math.max(maxVolume, percentage);

  item.innerHTML = `
    <div class="tab-info">
      ${tab.favIconUrl ? `<img class="tab-favicon" src="${tab.favIconUrl}" alt="">` : `<div class="tab-favicon"></div>`}
      <span class="tab-title" title="${escapeHtml(tab.title)}">${escapeHtml(tab.title)}</span>
      <button class="capture-btn ${isCaptured ? "active" : ""}">${isCaptured ? "ON" : "Capture"}</button>
    </div>
    <div class="tab-controls" style="${isCaptured ? "" : "opacity: 0.4; pointer-events: none;"}">
      <button class="mute-btn ${isMuted ? "muted" : ""}" title="${isMuted ? "Unmute" : "Mute"}">${isMuted ? "🔇" : volume > 0.5 ? "🔊" : "🔈"}</button>
      <input type="range" class="volume-slider ${isBoosted ? "boosted" : ""}" min="0" max="${sliderMax}" value="${percentage}">
      <span class="volume-value ${isBoosted ? "boosted" : ""}">${percentage}%</span>
    </div>
  `;

  const captureBtn = item.querySelector(".capture-btn");
  const slider = item.querySelector(".volume-slider");
  const valueLabel = item.querySelector(".volume-value");
  const muteBtn = item.querySelector(".mute-btn");
  const controls = item.querySelector(".tab-controls");

  captureBtn.addEventListener("click", async () => {
    if (!isCaptured) {
      captureBtn.textContent = "...";
      captureBtn.disabled = true;
      const res = await send({ type: "popup-start-capture", tabId: tab.id });
      if (!res?.ok) {
        // tabCapture refused (e.g. not the active tab, or a chrome:// page)
        captureBtn.textContent = "Capture";
        captureBtn.disabled = false;
        captureBtn.title =
          "Can't capture this tab. Switch to it (make it active) and try again.";
        return;
      }
      captureBtn.title = "";
      // Short delay for offscreen to initialize
      setTimeout(() => {
        captureBtn.textContent = "ON";
        captureBtn.classList.add("active");
        captureBtn.disabled = false;
        controls.style.opacity = "";
        controls.style.pointerEvents = "";
        isCaptured = true;
      }, 300);
    } else {
      await send({ type: "popup-stop-capture", tabId: tab.id });
      captureBtn.textContent = "Capture";
      captureBtn.classList.remove("active");
      controls.style.opacity = "0.4";
      controls.style.pointerEvents = "none";
      slider.value = 100;
      valueLabel.textContent = "100%";
      isCaptured = false;
    }
  });

  slider.addEventListener("input", () => {
    const vol = parseInt(slider.value) / 100;
    valueLabel.textContent = `${slider.value}%`;

    const boosted = vol > 1.0;
    slider.classList.toggle("boosted", boosted);
    valueLabel.classList.toggle("boosted", boosted);

    muteBtn.textContent = vol === 0 ? "🔇" : vol > 0.5 ? "🔊" : "🔈";
    muteBtn.classList.toggle("muted", vol === 0);

    send({ type: "popup-set-volume", tabId: tab.id, volume: vol });
  });

  muteBtn.addEventListener("click", () => {
    const currentVol = parseInt(slider.value) / 100;
    if (currentVol > 0) {
      preMuteVolumes.set(tab.id, currentVol);
      slider.value = 0;
    } else {
      const restore = preMuteVolumes.get(tab.id) || 1.0;
      slider.value = Math.round(restore * 100);
    }
    slider.dispatchEvent(new Event("input"));
  });

  tabListEl.appendChild(item);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

// Boot
initSettings().then(loadTabs);
initTheme();
