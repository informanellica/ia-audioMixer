// Track which tabs are being captured and their volume levels
const capturedTabs = new Map(); // tabId -> { streamId, volume }

// Serialize offscreen-document creation so concurrent startCapture() calls
// (e.g. auto-capturing several tabs at once) don't race into multiple
// createDocument() calls — Chrome allows only one offscreen document.
let creatingOffscreen = null;

async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
  });
  if (contexts.length > 0) return;

  if (!creatingOffscreen) {
    creatingOffscreen = chrome.offscreen
      .createDocument({
        url: "offscreen.html",
        reasons: ["USER_MEDIA"],
        justification: "Audio processing for tab volume control",
      })
      .finally(() => {
        creatingOffscreen = null;
      });
  }
  await creatingOffscreen;
}

// Send a message to the offscreen document, tolerating "no receiver" races.
async function sendToOffscreen(message) {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch (err) {
    // Offscreen document not ready / already gone.
    return { ok: false, error: String(err?.message || err) };
  }
}

// Start capturing a tab's audio.
// Returns { ok } / { ok: false, error }. tabCapture only allows capturing a tab
// the extension has been invoked on (activeTab) — background/chrome:// tabs throw,
// so callers must tolerate failure rather than let it become an uncaught rejection.
async function startCapture(tabId) {
  if (capturedTabs.has(tabId)) return { ok: true };

  try {
    await ensureOffscreen();
  } catch (err) {
    return { ok: false, error: "offscreen: " + String(err?.message || err) };
  }

  let streamId;
  try {
    streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }

  // Provisionally record so a concurrent call for the same tab is deduped,
  // then reconcile against the offscreen result below.
  capturedTabs.set(tabId, { streamId, volume: 1.0 });

  const res = await sendToOffscreen({
    type: "start-capture",
    tabId,
    streamId,
    volume: 1.0,
  });

  if (!res || !res.ok) {
    // Audio graph failed to start — roll back so state stays truthful.
    capturedTabs.delete(tabId);
    return { ok: false, error: res?.error || "audio setup failed" };
  }

  return { ok: true };
}

// Set volume for a captured tab
async function setVolume(tabId, volume) {
  const entry = capturedTabs.get(tabId);
  if (!entry) return { ok: false, error: "tab not captured" };
  entry.volume = volume;
  await sendToOffscreen({ type: "set-volume", tabId, volume });
  return { ok: true };
}

// Stop capturing a tab
async function stopCapture(tabId) {
  if (!capturedTabs.has(tabId)) return { ok: true };
  capturedTabs.delete(tabId);
  await sendToOffscreen({ type: "stop-capture", tabId });
  return { ok: true };
}

// Handle messages from popup. Each branch returns true to keep the message
// channel open for the async sendResponse.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message?.type) {
    case "popup-start-capture":
      startCapture(message.tabId).then(sendResponse);
      return true;

    case "popup-set-volume":
      setVolume(message.tabId, message.volume).then(sendResponse);
      return true;

    case "popup-stop-capture":
      stopCapture(message.tabId).then(sendResponse);
      return true;

    case "capture-ended":
      // Offscreen reports a tab's audio track ended on its own.
      capturedTabs.delete(message.tabId);
      return false;

    case "popup-get-state": {
      const state = {};
      for (const [tabId, entry] of capturedTabs) {
        state[tabId] = entry.volume;
      }
      sendResponse({ state });
      return false;
    }

    default:
      return false;
  }
});

// Clean up when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  stopCapture(tabId);
});
