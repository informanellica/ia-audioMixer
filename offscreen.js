// Audio processing for each captured tab
const audioStreams = new Map(); // tabId -> { stream, audioCtx, gainNode, source }

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "start-capture") {
    handleStartCapture(message.tabId, message.streamId, message.volume);
  }

  if (message.type === "set-volume") {
    handleSetVolume(message.tabId, message.volume);
  }

  if (message.type === "stop-capture") {
    handleStopCapture(message.tabId);
  }
});

async function handleStartCapture(tabId, streamId, volume) {
  try {
    // Get the media stream using the stream ID from tabCapture
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
    });

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;

    // Connect: source -> gain -> destination (speakers)
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    audioStreams.set(tabId, { stream, audioCtx, gainNode, source });
  } catch (err) {
    console.error(`Failed to capture tab ${tabId}:`, err);
  }
}

function handleSetVolume(tabId, volume) {
  const entry = audioStreams.get(tabId);
  if (entry) {
    // Use exponential ramp for smooth volume changes
    entry.gainNode.gain.setTargetAtTime(volume, entry.audioCtx.currentTime, 0.05);
  }
}

function handleStopCapture(tabId) {
  const entry = audioStreams.get(tabId);
  if (entry) {
    entry.source.disconnect();
    entry.gainNode.disconnect();
    entry.stream.getTracks().forEach((t) => t.stop());
    entry.audioCtx.close();
    audioStreams.delete(tabId);
  }
}
