# Store-asset tooling

`make-store-assets.mjs` renders the **real popup** (with mocked `chrome.*` APIs
and sample data) inside a branded layout and writes Chrome / Edge submission
assets to `dist/store-assets/`:

- `screenshot-1280x800.png` — store screenshot (exact size, no alpha)
- `promo-tile-440x280.png` — small promo tile
- `store-icon-128.png` — store icon
- `SUBMISSION.md` — per-app submission checklist

## Run

```bash
npm install      # once — pulls Playwright
npm run assets   # uses your installed Google Chrome (Playwright channel: chrome)
```

Outputs land in `dist/` (gitignored). The published copies are attached to the
matching GitHub Release.
