(function () {
  "use strict";

  const MAP_SELECT_ID = "filter-map-select";
  const TABLE_SELECTOR = "blz-data-table.herostats-data-table";

  function buildURL(mapValue) {
    const url = new URL(window.location.href);
    url.searchParams.set("map", mapValue);
    return url.toString();
  }

  function getFilterKey() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.searchParams);
    params.delete("map");
    return params.toString();
  }

  function parseTableData(table) {
    const raw = table.getAttribute("allrows");
    if (!raw) return null;
    try {
      const rows = JSON.parse(raw);
      const data = {};
      for (const row of rows) {
        data[row.id] = {
          name: row.cells.name,
          winrate: row.cells.winrate,
          pickrate: row.cells.pickrate,
        };
      }
      return data;
    } catch {
      return null;
    }
  }

  async function fetchMapData(mapValue) {
    const url = buildURL(mapValue);
    const resp = await fetch(url);
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const table = doc.querySelector(TABLE_SELECTOR);
    if (!table) return null;
    return parseTableData(table);
  }

  const cache = {};

  async function fetchMapDataCached(mapValue) {
    const key = getFilterKey();
    if (!cache[key]) cache[key] = {};
    if (cache[key][mapValue]) return cache[key][mapValue];
    const data = await fetchMapData(mapValue);
    if (data) cache[key][mapValue] = data;
    return data;
  }

  function getMapSlugs() {
    const select = document.getElementById(MAP_SELECT_ID);
    if (!select) return [];
    return [...select.options]
      .map((o) => ({ value: o.value, text: o.text }))
      .filter((o) => o.value !== "all-maps");
  }

  function formatDiff(diff) {
    const sign = diff >= 0 ? "+" : "";
    return sign + diff.toFixed(1);
  }

  // Select a map via the dropdown (triggers the page's own change handler)
  function selectMap(slug) {
    const select = document.getElementById(MAP_SELECT_ID);
    if (!select) return;
    select.value = slug;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Store per-hero diffs for sort functionality
  let heroDiffs = {};
  let heroPickDiffs = {};

  // ── Cleanup ──

  function cleanup() {
    document
      .querySelectorAll(".mapdiff-badge, .mapdiff-maps, .mapdiff-loading")
      .forEach((el) => el.remove());
    heroDiffs = {};
    heroPickDiffs = {};
  }

  // ── Badge: plain text after a percentage ──

  function injectBadge(heroId, type, diff) {
    const valEl = document.getElementById(`${heroId}-${type}-value`);
    if (!valEl) return;
    const existing = valEl.parentElement.querySelector(".mapdiff-badge");
    if (existing) existing.remove();

    const badge = document.createElement("span");
    badge.className = "mapdiff-badge";
    if (diff > 0.05) badge.classList.add("positive");
    else if (diff < -0.05) badge.classList.add("negative");
    else badge.classList.add("neutral");
    badge.textContent = formatDiff(diff);
    valEl.after(badge);

    if (type === "winrate") heroDiffs[heroId] = diff;
    else heroPickDiffs[heroId] = diff;
  }

  // ── Top/Bottom maps: two clean rows ──

  function makeMapRow(label, cssClass, maps) {
    const row = document.createElement("div");
    row.className = "mapdiff-maps-row";

    const lbl = document.createElement("span");
    lbl.className = `mapdiff-maps-label ${cssClass}`;
    lbl.textContent = cssClass === "best" ? "▲" : "▼";
    row.appendChild(lbl);

    const entries = document.createElement("span");
    entries.className = "mapdiff-maps-entries";

    for (const m of maps) {
      const entry = document.createElement("span");
      entry.className = "mapdiff-map-entry";
      entry.title = `${m.name}: ${formatDiff(m.diff)}% vs average`;

      const name = document.createElement("a");
      name.className = "mapdiff-map-name";
      name.textContent = m.name;
      name.href = "#";
      name.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectMap(m.slug);
      });

      const diff = document.createElement("span");
      diff.className = `mapdiff-map-diff ${cssClass}`;
      diff.textContent = formatDiff(m.diff);

      entry.appendChild(name);
      entry.appendChild(diff);
      entries.appendChild(entry);
    }

    row.appendChild(entries);
    return row;
  }

  function injectTopBottom(heroId, mapDiffs) {
    const heroCell = document.querySelector(
      `div.hero-cell[slot="cell-${heroId}-name"]`
    );
    if (!heroCell) return;
    const existing = heroCell.querySelector(".mapdiff-maps");
    if (existing) existing.remove();

    const sorted = [...mapDiffs]
      .filter((m) => m.diff !== null && !isNaN(m.diff))
      .sort((a, b) => b.diff - a.diff);
    if (sorted.length === 0) return;

    const best = sorted.slice(0, 3);
    const worst = sorted.slice(-3).reverse();

    const container = document.createElement("div");
    container.className = "mapdiff-maps";
    container.appendChild(makeMapRow("best", "best", best));
    container.appendChild(makeMapRow("worst", "worst", worst));
    heroCell.appendChild(container);
  }

  // ── Loading state ──

  function showLoading(heroId) {
    const heroCell = document.querySelector(
      `div.hero-cell[slot="cell-${heroId}-name"]`
    );
    if (!heroCell || heroCell.querySelector(".mapdiff-loading")) return;
    const el = document.createElement("div");
    el.className = "mapdiff-loading";
    el.textContent = "loading map data\u2026";
    heroCell.appendChild(el);
  }

  function removeLoading(heroId) {
    const heroCell = document.querySelector(
      `div.hero-cell[slot="cell-${heroId}-name"]`
    );
    if (!heroCell) return;
    heroCell.querySelectorAll(".mapdiff-loading").forEach((el) => el.remove());
  }

  // ── Sort-by-diff toggle ──

  let sortActive = null; // null | "winrate" | "pickrate"
  let sortDir = "desc";
  let originalRows = null;

  function injectShadowStyles(shadow) {
    if (shadow.querySelector(".mapdiff-shadow-styles")) return;
    const style = document.createElement("style");
    style.className = "mapdiff-shadow-styles";
    style.textContent = `
      .mapdiff-sort-toggle {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: 6px;
        padding: 3px 8px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 4px;
        background: transparent;
        color: rgba(255, 255, 255, 0.55);
        font-family: Config, sans-serif;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        cursor: pointer;
        transition: background 0.15s, color 0.15s, border-color 0.15s;
        vertical-align: middle;
        white-space: nowrap;
      }
      .mapdiff-sort-toggle:hover {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.8);
        border-color: rgba(255, 255, 255, 0.25);
      }
      .mapdiff-sort-toggle.active {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.3);
      }
      .mapdiff-sort-toggle .mapdiff-sort-arrow {
        font-size: 10px;
        opacity: 0.7;
      }
    `;
    shadow.appendChild(style);
  }

  function createSortBtn(shadow, cellIndex, type) {
    const headerCells = shadow.querySelectorAll(".data-table-header-cell");
    const cell = headerCells[cellIndex];
    if (!cell) return;
    const innerSpan = cell.querySelector("span");
    if (!innerSpan || innerSpan.querySelector(".mapdiff-sort-toggle")) return;

    const btn = document.createElement("button");
    btn.className = "mapdiff-sort-toggle";
    btn.dataset.sortType = type;
    btn.innerHTML = '<span class="mapdiff-sort-arrow">▼</span> Diff';
    btn.title = `Sort by map ${type === "winrate" ? "win" : "pick"} rate difference`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      toggleDiffSort(type);
    });
    innerSpan.appendChild(btn);
  }

  function injectSortToggle() {
    const table = document.querySelector(TABLE_SELECTOR);
    if (!table || !table.shadowRoot) return;
    const shadow = table.shadowRoot;
    injectShadowStyles(shadow);
    createSortBtn(shadow, 1, "pickrate"); // Pick Rate column
    createSortBtn(shadow, 2, "winrate");  // Win Rate column
  }

  function getSortToggleBtns() {
    const table = document.querySelector(TABLE_SELECTOR);
    if (!table?.shadowRoot) return {};
    const btns = {};
    for (const b of table.shadowRoot.querySelectorAll(".mapdiff-sort-toggle")) {
      btns[b.dataset.sortType] = b;
    }
    return btns;
  }

  function resetAllSortBtns() {
    const btns = getSortToggleBtns();
    for (const b of Object.values(btns)) {
      b.classList.remove("active");
      b.innerHTML = '<span class="mapdiff-sort-arrow">▼</span> Diff';
    }
  }

  function toggleDiffSort(type) {
    const table = document.querySelector(TABLE_SELECTOR);
    if (!table) return;

    const btns = getSortToggleBtns();
    const btn = btns[type];
    if (!btn) return;

    if (sortActive === type) {
      if (sortDir === "desc") {
        sortDir = "asc";
        btn.innerHTML = '<span class="mapdiff-sort-arrow">▲</span> Diff';
        applyDiffSort(table, type);
      } else {
        // Deactivate
        sortActive = null;
        sortDir = "desc";
        resetAllSortBtns();
        if (originalRows) {
          table.setAttribute("rows", originalRows);
          table.requestUpdate();
        }
      }
    } else {
      // Activate this type (deactivate other)
      resetAllSortBtns();
      sortActive = type;
      sortDir = "desc";
      btn.classList.add("active");
      btn.innerHTML = '<span class="mapdiff-sort-arrow">▼</span> Diff';
      if (!originalRows) originalRows = table.getAttribute("rows");
      applyDiffSort(table, type);
    }
  }

  function applyDiffSort(table, type) {
    const source = type === "pickrate" ? heroPickDiffs : heroDiffs;
    const rowsAttr = originalRows || table.getAttribute("rows");
    if (!rowsAttr) return;
    try {
      const rows = JSON.parse(rowsAttr);
      rows.sort((a, b) => {
        const da = source[a.id] ?? 0;
        const db = source[b.id] ?? 0;
        return sortDir === "desc" ? db - da : da - db;
      });
      table.setAttribute("rows", JSON.stringify(rows));
      table.requestUpdate();
    } catch {
      // ignore
    }
  }

  // ── Main logic ──

  async function run() {
    const table = document.querySelector(TABLE_SELECTOR);
    if (!table) return;

    const currentData = parseTableData(table);
    if (!currentData) return;

    const mapSelect = document.getElementById(MAP_SELECT_ID);
    if (!mapSelect) return;
    const currentMap = mapSelect.value;

    cleanup();

    // Reset sort state on data change
    sortActive = null;
    sortDir = "desc";
    originalRows = null;
    resetAllSortBtns();

    const heroIds = Object.keys(currentData);

    // Phase 1: Diff badges (current map vs all-maps)
    if (currentMap !== "all-maps") {
      const allMapsData = await fetchMapDataCached("all-maps");
      if (allMapsData) {
        for (const heroId of heroIds) {
          const cur = currentData[heroId];
          const avg = allMapsData[heroId];
          if (cur?.winrate != null && avg?.winrate != null) {
            injectBadge(heroId, "winrate", cur.winrate - avg.winrate);
          }
          if (cur?.pickrate != null && avg?.pickrate != null) {
            injectBadge(heroId, "pickrate", cur.pickrate - avg.pickrate);
          }
        }
      }
      injectSortToggle();
    }

    // Phase 2: Fetch all maps, show top/bottom 3
    for (const heroId of heroIds) showLoading(heroId);

    const maps = getMapSlugs();
    const allMapsBaseline = await fetchMapDataCached("all-maps");
    if (!allMapsBaseline) {
      for (const heroId of heroIds) removeLoading(heroId);
      return;
    }

    const BATCH_SIZE = 5;
    const allMapData = {};
    for (let i = 0; i < maps.length; i += BATCH_SIZE) {
      const batch = maps.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((m) => fetchMapDataCached(m.value))
      );
      for (let j = 0; j < batch.length; j++) {
        if (results[j]) allMapData[batch[j].value] = results[j];
      }
    }

    for (const heroId of heroIds) {
      const baseline = allMapsBaseline[heroId]?.winrate;
      if (baseline == null) {
        removeLoading(heroId);
        continue;
      }

      const mapDiffs = [];
      for (const map of maps) {
        const mapData = allMapData[map.value];
        if (!mapData || !mapData[heroId]) continue;
        const mapWin = mapData[heroId].winrate;
        if (mapWin == null) continue;
        mapDiffs.push({
          slug: map.value,
          name: map.text,
          diff: mapWin - baseline,
        });
      }

      removeLoading(heroId);
      injectTopBottom(heroId, mapDiffs);
    }
  }

  // ── Observers ──

  function observe() {
    const table = document.querySelector(TABLE_SELECTOR);
    if (table) {
      const observer = new MutationObserver(() => {
        clearTimeout(observe._timer);
        observe._timer = setTimeout(run, 500);
      });
      observer.observe(table, {
        attributes: true,
        attributeFilter: ["allrows"],
      });
    }
  }

  function waitForTable() {
    const table = document.querySelector(TABLE_SELECTOR);
    if (table) {
      run();
      observe();
      return;
    }
    const bodyObserver = new MutationObserver(() => {
      const table = document.querySelector(TABLE_SELECTOR);
      if (table) {
        bodyObserver.disconnect();
        run();
        observe();
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  let lastURL = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastURL) {
      lastURL = window.location.href;
      cleanup();
      setTimeout(run, 1000);
    }
  }, 500);

  waitForTable();
})();
