# Privacy Policy — Tab Volume Mixer

_Last updated: 2026-05-30_

Tab Volume Mixer is designed to work entirely on your device.

## Data we collect

**None.** The extension does not collect, store, sell, or transmit any
personal or usage data. It makes no network requests and contains no
analytics, tracking, or advertising code.

## Audio

To change a tab's volume, the extension captures that tab's audio stream and
routes it through a local Web Audio gain node. This audio is **processed only
in memory, only while the tab is being controlled, and never recorded, saved,
or sent anywhere.** Capturing stops when you stop control or close the tab.

## Local settings

Your preferences (theme, maximum volume, and whether the capture button is
shown) are stored locally via the browser's `storage` API. They remain on your
device and are never transmitted.

## Permissions

- **tabCapture** — capture a tab's audio so its volume can be adjusted.
- **tabs** — read tab titles, favicons, URLs, and audible state to list tabs.
- **offscreen** — run the audio processing outside the service worker.
- **storage** — save your settings locally.

None of these are used to gather information about you.

## Contact

Questions about this policy: [support@informanellica.com](mailto:support@informanellica.com)
