# CLAUDE.md

## Project

Chrome extension (Manifest V3) that adds win rate diff analysis to the Overwatch Hero Statistics page at `https://overwatch.blizzard.com/en-us/rates/`.

## Testing with agent-browser

Use the `agent-browser` CLI to test the extension in a real browser. Always use the `mapdiff` session.

### Launch / reload the extension

Close any existing session, then reopen with the extension loaded:

```bash
AGENT_BROWSER_SESSION=mapdiff agent-browser close
AGENT_BROWSER_SESSION=mapdiff agent-browser --extension /var/home/kenneth/mapdiff open "https://overwatch.blizzard.com/en-us/rates/?input=PC&map=ilios&region=Americas&role=All&rq=2&tier=All"
```

There is no hot-reload — after changing extension files, you must close and reopen the session.

**Do NOT add `--headed`** — extensions force headed mode automatically, and combining `--headed` with `--extension` is bugged (the headed launch command preempts extension loading). If extensions aren't loading, make sure there's no stale daemon: run `agent-browser close` first.

### Wait for content scripts to run

The extension fetches data after page load. Wait a few seconds before taking screenshots:

```bash
AGENT_BROWSER_SESSION=mapdiff agent-browser wait 3000
```

### Take a screenshot

The Map Analysis panel is injected at the top of the page, above the hero table. Both are below the Overwatch banner, so scroll down before screenshotting:

```bash
AGENT_BROWSER_SESSION=mapdiff agent-browser scroll down 600
AGENT_BROWSER_SESSION=mapdiff agent-browser screenshot /tmp/mapdiff.png
```

Then use the Read tool to view the image.

### Select a specific map

The extension behaves differently on "All Maps" vs a specific map. To switch maps:

```bash
AGENT_BROWSER_SESSION=mapdiff agent-browser eval "document.getElementById('filter-map-select').value = 'havana'; document.getElementById('filter-map-select').dispatchEvent(new Event('change', {bubbles: true}))"
```

### Check for JS errors

```bash
AGENT_BROWSER_SESSION=mapdiff agent-browser errors
AGENT_BROWSER_SESSION=mapdiff agent-browser console
```

### Test the popup

The popup is at `popup.html`. Open it directly to test:

```bash
AGENT_BROWSER_SESSION=mapdiff agent-browser open "chrome-extension://<extension-id>/popup.html"
```

To find the extension ID, check `chrome://extensions` or use:

```bash
AGENT_BROWSER_SESSION=mapdiff agent-browser eval "chrome.runtime.id"
```

### Useful snapshots

Get an accessibility tree of the page to find elements:

```bash
AGENT_BROWSER_SESSION=mapdiff agent-browser snapshot -i
```
