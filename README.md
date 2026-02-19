# Map Diff

A Chrome extension that adds map-specific win rate and pick rate analysis to the [Overwatch Hero Statistics](https://overwatch.blizzard.com/en-us/rates/) page.

Select a specific map and Map Diff computes the difference between each hero's stats on that map vs their all-maps average — so you can instantly see who over- or under-performs. It adds diff badges to the table, a map analysis panel with trait breakdowns and ban suggestions, per-hero best/worst maps, and sortable diff columns. Everything is toggleable from the settings popup.

## Installation (Sideloading)

Chrome extensions that aren't on the Web Store can be installed manually by loading them in developer mode.

1. **Download the extension**

   Clone this repo or click **Code > Download ZIP** on GitHub and extract it somewhere you won't accidentally delete:
   ```bash
   git clone https://github.com/AndKenneth/mapdiff.git
   ```

2. **Open the extensions page**

   In Chrome, navigate to `chrome://extensions` (type it into the address bar).

3. **Enable Developer Mode**

   In the top-right corner of the extensions page, toggle **Developer mode** on.

4. **Load the extension**

   Click the **Load unpacked** button that appears in the top-left. In the file picker, select the `mapdiff` folder (the one that contains `manifest.json`).

## How It Works

Map Diff runs entirely in your browser. It reads hero data from the page, fetches the all-maps baseline (cached for 5 minutes), computes diffs, and injects the UI. 

## Permissions

- **`storage`** — save your preferences
- **`https://overwatch.blizzard.com/*`** — fetch hero statistics data

## Privacy

No data collection, tracking, or third-party services. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md).

## License

MIT
