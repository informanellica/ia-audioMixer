# Tab Volume Mixer

A Chrome / Edge (Manifest V3) extension that lets you set the **volume of each
browser tab independently** — boost quiet tabs, turn down loud ones, or mute
them, all from a single popup mixer.

## Features

- **Per-tab volume** from a popup that lists your tabs.
- **Boost beyond 100%** — up to **600%** (configurable; default **500%**) using
  a Web Audio gain node.
- **Auto-capture** of the active playing tab when you open the popup, so its
  slider is live immediately — no extra click.
- **Mute / unmute** per tab (restores the previous level on unmute).
- **Settings** (gear icon): toggle the per-tab *Capture* button (hidden by
  default) and change the maximum volume ceiling.
- **Light / dark theme**, remembered across sessions.

## How it works

Chromium has no API to read a tab's volume directly, so the extension:

1. Uses **`chrome.tabCapture`** to obtain a media stream for a tab.
2. Routes that stream through a **Web Audio `GainNode`** running in an
   **offscreen document** (`chrome.offscreen`) — service workers can't use Web
   Audio, so the audio graph lives there.
3. The gain value is what you control with the slider; `1.0` = 100% (unchanged).

```
tab audio ──tabCapture──▶ offscreen: source ─▶ gain ─▶ speakers
                                                ▲
                              popup slider ─────┘ (via background service worker)
```

### Known limitations

These come from the browser, not the extension:

- **Only the active tab can be captured.** `tabCapture` requires the extension
  to have been *invoked* on a tab (the `activeTab` model). Tabs playing in the
  background can't be auto-captured until you switch to them. The popup shows a
  note when this happens.
- **`chrome://`, `edge://`, and extension pages cannot be captured.**
- **Firefox is not supported** — it has neither `tabCapture` nor `offscreen`.
  A Firefox port would require a different architecture (content-script + Web
  Audio injection).

## Install (development)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. **Load unpacked** → select this folder.

## Build a release zip

Produces `dist/ia-audioMixer-v<version>.zip` (version read from
`manifest.json`), containing only the files that ship — no `.git`, build
scripts, or `dist/`.

```bash
./build.sh          # Git Bash / macOS / Linux  (falls back to PowerShell or Python if `zip` is missing)
pwsh ./build.ps1    # PowerShell
```

Upload the resulting zip to the Chrome Web Store / Edge Add-ons dashboard.

## Permissions

| Permission   | Why |
|--------------|-----|
| `tabCapture` | Capture a tab's audio so its volume can be amplified, reduced, or muted. |
| `tabs`       | Read each tab's title, favicon, URL, and audible state to build the list. |
| `offscreen`  | Host the Web Audio processing (a service worker can't run an `AudioContext`). |
| `storage`    | Remember settings (theme, max volume, capture-button visibility). |

## Privacy

The extension does **not** collect, store, or transmit any personal data, and
makes no network requests. Audio is processed locally and only while a tab is
captured. See [PRIVACY.md](PRIVACY.md).

## License

MIT — see [LICENSE](LICENSE). © 2026 Informanellica.
