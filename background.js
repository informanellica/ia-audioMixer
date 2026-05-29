// Track which tabs are being captured and their volume levels
const capturedTabs = new Map(); // tabId -> { streamId, volume }

// Ensure offscreen document exists
async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });
  if (contexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["USER_MEDIA"],
      justification: "Audio processing for tab volume control",
    });
  }
}

// Start capturing a tab's audio
async function startCapture(tabId) {
  if (capturedTabs.has(tabId)) return;

  await ensureOffscreen();

  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tabId,
  });

  capturedTabs.set(tabId, { streamId, volume: 1.0 });

  chrome.runtime.sendMessage({
    type: "start-capture",
    tabId,
    streamId,
    volume: 1.0,
  });
}

// Set volume for a captured tab
function setVolume(tabId, volume) {
  const entry = capturedTabs.get(tabId);
  if (entry) {
    entry.volume = volume;
  }
  chrome.runtime.sendMessage({
    type: "set-volume",
    tabId,
    volume,
  });
}

// Stop capturing a tab
function stopCapture(tabId) {
  if (!capturedTabs.has(tabId)) return;
  capturedTabs.delete(tabId);
  chrome.runtime.sendMessage({
    type: "stop-capture",
    tabId,
  });
}

// Handle messages from popup and offscreen
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "popup-start-capture") {
    startCapture(message.tabId).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (message.type === "popup-set-volume") {
    setVolume(message.tabId, message.volume);
    sendResponse({ ok: true });
  }

  if (message.type === "popup-stop-capture") {
    stopCapture(message.tabId);
    sendResponse({ ok: true });
  }

  if (message.type === "popup-get-state") {
    const state = {};
    for (const [tabId, entry] of capturedTabs) {
      state[tabId] = entry.volume;
    }
    sendResponse({ state });
  }
});

// Clean up when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  stopCapture(tabId);
});
