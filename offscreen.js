// Audio processing for each captured tab
const audioStreams = new Map(); // tabId -> { stream, audioCtx, gainNode, source }

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message?.type) {
    case "start-capture":
      handleStartCapture(message.tabId, message.streamId, message.volume)
        .then(() => sendResponse({ ok: true }))
        .catch((err) => sendResponse({ ok: false, error: String(err?.message || err) }));
      return true; // async response

    case "set-volume":
      sendResponse(handleSetVolume(message.tabId, message.volume));
      return false;

    case "stop-capture":
      handleStopCapture(message.tabId);
      sendResponse({ ok: true });
      return false;

    default:
      return false;
  }
});

async function handleStartCapture(tabId, streamId, volume) {
  // Re-capturing the same tab: tear down the old graph first to avoid leaks.
  if (audioStreams.has(tabId)) handleStopCapture(tabId);

  // Get the media stream using the stream ID from tabCapture.
  // Throws on failure — the caller reports it back to the background.
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
  });

  let audioCtx, source, gainNode;
  try {
    audioCtx = new AudioContext();
    source = audioCtx.createMediaStreamSource(stream);
    gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;

    // Connect: source -> gain -> destination (speakers)
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
  } catch (err) {
    // Wiring failed — release the captured tracks so the tab isn't left muted.
    stream.getTracks().forEach((t) => t.stop());
    if (audioCtx) {
      try {
        await audioCtx.close();
      } catch (_) {}
    }
    throw err;
  }

  // If the tab stops producing audio (navigation, close), drop the entry
  // and let the background reconcile its own state.
  stream.getAudioTracks().forEach((track) => {
    track.addEventListener("ended", () => {
      handleStopCapture(tabId);
      chrome.runtime.sendMessage({ type: "capture-ended", tabId }).catch(() => {});
    });
  });

  audioStreams.set(tabId, { stream, audioCtx, gainNode, source });
}

function handleSetVolume(tabId, volume) {
  const entry = audioStreams.get(tabId);
  if (!entry) return { ok: false, error: "no audio stream" };
  // Use a short ramp for smooth, click-free volume changes.
  entry.gainNode.gain.setTargetAtTime(volume, entry.audioCtx.currentTime, 0.05);
  return { ok: true };
}

function handleStopCapture(tabId) {
  const entry = audioStreams.get(tabId);
  if (!entry) return;
  try {
    entry.source.disconnect();
    entry.gainNode.disconnect();
    entry.stream.getTracks().forEach((t) => t.stop());
    entry.audioCtx.close();
  } catch (err) {
    console.warn(`Cleanup error for tab ${tabId}:`, err);
  }
  audioStreams.delete(tabId);
}
