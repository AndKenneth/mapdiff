// Runs in the MAIN world so it can access component JS properties.
// Content scripts (isolated world) communicate via custom DOM events.
(function () {
  "use strict";
  const SEL = "blz-data-table.herostats-data-table";

  document.addEventListener("mapdiff-clear-sort", () => {
    const t = document.querySelector(SEL);
    if (!t) return;
    t.currentSortColumnId = null;
    t.currentSortDirection = null;
    t.requestUpdate();
  });
})();
