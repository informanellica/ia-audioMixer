const tabListEl = document.getElementById("tab-list");
const emptyStateEl = document.getElementById("empty-state");

// Volume before mute, per tab
const preMuteVolumes = new Map();

async function loadTabs() {
  // Get all tabs (show audible ones first, but list all so user can capture any)
  const tabs = await chrome.tabs.query({});
  const audibleTabs = tabs.filter((t) => t.audible);
  const otherTabs = tabs.filter(
    (t) => !t.audible && !t.url?.startsWith("chrome://") && !t.url?.startsWith("edge://") && !t.url?.startsWith("chrome-extension://")
  );

  // Get current capture state from background
  const { state: capturedState } = await chrome.runtime.sendMessage({
    type: "popup-get-state",
  });

  // Show audible tabs, then captured-but-not-audible tabs
  const displayTabs = [...audibleTabs];
  for (const tab of otherTabs) {
    if (capturedState[tab.id] !== undefined && !displayTabs.find((t) => t.id === tab.id)) {
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

  item.innerHTML = `
    <div class="tab-info">
      ${tab.favIconUrl ? `<img class="tab-favicon" src="${tab.favIconUrl}" alt="">` : `<div class="tab-favicon"></div>`}
      <span class="tab-title" title="${escapeHtml(tab.title)}">${escapeHtml(tab.title)}</span>
      <button class="capture-btn ${isCaptured ? "active" : ""}">${isCaptured ? "ON" : "Capture"}</button>
    </div>
    <div class="tab-controls" style="${isCaptured ? "" : "opacity: 0.4; pointer-events: none;"}">
      <button class="mute-btn ${isMuted ? "muted" : ""}" title="${isMuted ? "Unmute" : "Mute"}">${isMuted ? "🔇" : volume > 0.5 ? "🔊" : "🔈"}</button>
      <input type="range" class="volume-slider ${isBoosted ? "boosted" : ""}" min="0" max="200" value="${percentage}">
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
      await chrome.runtime.sendMessage({
        type: "popup-start-capture",
        tabId: tab.id,
      });
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
      await chrome.runtime.sendMessage({
        type: "popup-stop-capture",
        tabId: tab.id,
      });
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

    chrome.runtime.sendMessage({
      type: "popup-set-volume",
      tabId: tab.id,
      volume: vol,
    });
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

loadTabs();
