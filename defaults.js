// Shared constants for Map Diff extension
// Consumed by both content.js and popup.js via window.MapDiffDefaults
(function () {
  "use strict";

  const HERO_TAGS = {
    // Tanks
    "doomfist":     ["mobility", "dive"],
    "dva":          ["mobility", "dive", "verticality"],
    "junkerqueen":  ["mobility", "brawl"],
    "mauga":        ["brawl", "mobility"],
    "orisa":        ["immobile", "brawl"],
    "ramattra":     ["brawl", "shield"],
    "reinhardt":    ["brawl", "shield", "immobile"],
    "roadhog":      ["immobile", "brawl"],
    "sigma":        ["range", "shield"],
    "hazard":       ["mobility", "dive", "verticality"],
    "winston":      ["mobility", "dive", "verticality"],
    "wreckingball": ["mobility", "dive"],
    "zarya":        ["brawl", "immobile"],
    // DPS
    "ashe":         ["range", "hitscan"],
    "bastion":      ["range", "immobile"],
    "cassidy":      ["range", "hitscan"],
    "echo":         ["mobility", "verticality"],
    "fara":         ["mobility", "verticality"],
    "genji":        ["mobility", "dive", "verticality"],
    "hanzo":        ["range", "verticality"],
    "junkrat":      ["close-range", "immobile"],
    "mei":          ["close-range", "brawl"],
    "reaper":       ["close-range", "mobility"],
    "sojourn":      ["range", "hitscan", "mobility"],
    "soldier76":    ["range", "hitscan", "mobility"],
    "sombra":       ["mobility", "dive"],
    "symmetra":     ["close-range", "immobile"],
    "torbjorn":     ["range"],
    "tracer":       ["mobility", "dive"],
    "venture":      ["mobility", "dive"],
    "widowmaker":   ["range", "hitscan", "verticality"],
    // Supports
    "ana":          ["range", "immobile"],
    "baptiste":     ["range", "verticality"],
    "brigitte":     ["close-range", "brawl"],
    "illari":       ["range"],
    "juno":         ["range", "mobility"],
    "kiriko":       ["mobility", "verticality"],
    "lifeweaver":   ["range", "verticality"],
    "lucio":        ["mobility", "close-range"],
    "mercy":        ["mobility", "verticality"],
    "moira":        ["mobility", "close-range"],
    "weaver":       ["mobility"],
    "zenyatta":     ["range", "immobile"],
  };

  const TRAIT_LABELS = {
    "mobility": "Mobility",
    "dive": "Dive",
    "verticality": "Verticality",
    "range": "Range",
    "hitscan": "Hitscan",
    "close-range": "Close-range",
    "brawl": "Brawl",
    "immobile": "Immobile",
    "shield": "Shield",
  };

  const FEATURE_TOGGLES = {
    outlierBar:      { label: "Map Analysis",        default: true },
    diffBadges:      { label: "Diff Badges",        default: true },
    topBottomMaps:   { label: "Top/Bottom Maps",    default: true },
    pickRateMaps:    { label: "Pick Rate Maps",     default: true },
    progressMarkers: { label: "Progress Markers",   default: true },
    sortButtons:     { label: "Sort Buttons",       default: true },
  };

  const HERO_ROLES = {
    tank: [
      "doomfist", "dva", "junkerqueen", "mauga", "orisa",
      "ramattra", "reinhardt", "roadhog", "sigma", "hazard",
      "winston", "wreckingball", "zarya",
    ],
    damage: [
      "ashe", "bastion", "cassidy", "echo", "fara", "genji",
      "hanzo", "junkrat", "mei", "reaper", "sojourn", "soldier76",
      "sombra", "symmetra", "torbjorn", "tracer", "venture", "widowmaker",
    ],
    support: [
      "ana", "baptiste", "brigitte", "illari", "juno", "kiriko",
      "lifeweaver", "lucio", "mercy", "moira", "weaver", "zenyatta",
    ],
  };

  // Hero display names for the popup grid
  const HERO_NAMES = {};
  for (const heroes of Object.values(HERO_ROLES)) {
    for (const id of heroes) {
      // Convert id to title case, handle special cases
      if (id === "dva") HERO_NAMES[id] = "D.Va";
      else if (id === "soldier76") HERO_NAMES[id] = "Soldier: 76";
      else if (id === "wreckingball") HERO_NAMES[id] = "Wrecking Ball";
      else if (id === "junkerqueen") HERO_NAMES[id] = "Junker Queen";
      else HERO_NAMES[id] = id.charAt(0).toUpperCase() + id.slice(1);
    }
  }

  window.MapDiffDefaults = {
    HERO_TAGS,
    TRAIT_LABELS,
    FEATURE_TOGGLES,
    HERO_ROLES,
    HERO_NAMES,
  };
})();
