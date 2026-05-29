# Store Listing — Tab Volume Mixer

Copy/paste into the Chrome Web Store / Edge Add-ons dashboards. English is the
primary listing; add Japanese as an additional locale.

---

## English

**Name**
Tab Volume Mixer

**Short summary** (≤132 chars)
Set the volume of each tab independently — boost quiet tabs up to 600%, turn down or mute loud ones, all from one mixer.

**Detailed description**

Tab Volume Mixer gives every browser tab its own volume control.

Open the popup and you get a simple mixer for your tabs:

• Per-tab volume slider — quieter or louder, independently
• Boost past 100%, up to 600% (adjustable in settings; default 500%) for tabs that are too quiet
• One-click mute / unmute per tab
• Playing tabs are picked up automatically when you open the popup
• Light and dark themes

Perfect when a video call is too soft, an ad is too loud, or you want music in
one tab quieter than a stream in another.

Everything runs locally on your device. The extension collects no data, makes
no network requests, and never records or sends your audio.

Note: due to a Chrome restriction, audio can only be captured for the tab you
are currently on (the active tab). Background tabs can be controlled once you
switch to them. Browser system pages (chrome://, edge://) cannot be adjusted.

**Category**: Productivity (or Accessibility)

**Permission justifications**

- tabCapture: Capture a tab's audio so its volume can be amplified, reduced, or muted via Web Audio. No audio is recorded or transmitted.
- tabs: Read each tab's title, favicon, URL, and audible state to build the tab list and detect which tabs are playing sound.
- offscreen: Host the Web Audio processing; a Manifest V3 service worker cannot run an AudioContext.
- storage: Save user settings (theme, maximum volume, capture-button visibility) locally.

**Single purpose**
Adjust the audio volume of individual browser tabs.

---

## 日本語 (Japanese)

**名前**
Tab Volume Mixer

**短い概要** (132字以内)
タブごとに音量を個別調整。小さい音は最大600%までブースト、大きい音は下げる/ミュート。ひとつのミキサーでまとめて操作できます。

**詳細な説明**

Tab Volume Mixer は、ブラウザのタブごとに独立した音量コントロールを提供します。

ポップアップを開くだけで、タブ用のシンプルなミキサーが使えます:

• タブごとの音量スライダー(個別に大小を調整)
• 100%超のブースト、最大600%(設定で変更可・初期値500%)で小さすぎる音を増幅
• タブごとのワンクリック・ミュート/解除
• 再生中のタブはポップアップを開くと自動で取り込み
• ライト/ダークテーマ対応

ビデオ通話の声が小さい、広告がうるさい、別タブの音楽を配信より小さくしたい——そんなときに便利です。

すべて端末内で動作します。データ収集・通信は一切行わず、音声を録音・送信することもありません。

ご注意: Chrome の制約により、音声を取り込めるのは現在開いているタブ(アクティブタブ)のみです。背景のタブはそのタブに切り替えれば操作できます。ブラウザのシステムページ(chrome://、edge://)は調整できません。

**カテゴリ**: 生産性(または アクセシビリティ)

**権限の正当化**

- tabCapture: タブ音声を取り込み、Web Audio で増幅・減衰・ミュートするため。音声の録音・送信は行いません。
- tabs: タブ一覧表示と音声再生中タブの判定のため、各タブのタイトル・ファビコン・URL・再生状態を取得。
- offscreen: Web Audio 処理の実行のため。Manifest V3 のサービスワーカーは AudioContext を実行できないため。
- storage: ユーザー設定(テーマ・最大音量・キャプチャボタン表示)をローカル保存するため。

**単一目的**
個々のブラウザタブの音量を調整する。
