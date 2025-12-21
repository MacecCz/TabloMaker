// ==============================
// Arrow (1 SVG + rotace)
// ve složce ./fonty/arrow.svg (základní šipka míří doprava)
// ==============================
const ARROW_BASE_FILE = "./fonty/arrow.svg";

const ARROW_DEFS = {
  right: { label: "→", deg: 0 },
  right_up: { label: "↗", deg: -45 },
  up: { label: "↑", deg: -90 },
  left_up: { label: "↖", deg: -135 },
  left: { label: "←", deg: 180 },
  left_down: { label: "↙", deg: 135 },
  down: { label: "↓", deg: 90 },
  right_down: { label: "↘", deg: 45 },
};

const arrowSvgCache = new Map(); // url -> Promise<string>

async function loadSvgText(url) {
  if (arrowSvgCache.has(url)) return arrowSvgCache.get(url);
  const p = fetch(url).then((r) => {
    if (!r.ok) throw new Error(`SVG fetch failed: ${r.status}`);
    return r.text();
  });
  arrowSvgCache.set(url, p);
  return p;
}

function injectArrowSvg(container, key) {
  const def = ARROW_DEFS[key] || ARROW_DEFS.right;
  container.style.setProperty("--arrow-rot", `${def.deg}deg`);
  container.dataset.reqArrow = key;

  loadSvgText(ARROW_BASE_FILE)
    .then((svgText) => {
      if (container.dataset.reqArrow !== key) return;
      container.innerHTML = svgText;
    })
    .catch(() => {
      if (container.dataset.reqArrow !== key) return;
      container.textContent = def.label;
    });
}

// ---- helpers ----
function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function mmVar(el, name) {
  const raw = getComputedStyle(el).getPropertyValue(name).trim(); // "20mm"
  const v = parseFloat(raw.replace("mm", "").trim());
  return Number.isFinite(v) ? v : 0;
}

function getRules() {
  // fallback, když rules.js není načtený
  const fallbackOptions = [
    { value: "tram_day", label: "Tram denní" },
    { value: "tram_night", label: "Tram noční" },
  ];

  const fallbackStyles = {
    tram_day: { bg: "#ffffff", fg: "#7A2011" },
    tram_night: { bg: "#7A2011", fg: "#ffffff" },
  };

  const options = window.LINE_TYPE_OPTIONS || fallbackOptions;
  const styles = window.LINE_STYLE_RULES || fallbackStyles;
  const defaultType =
    window.DEFAULT_LINE_TYPE || (options[0] ? options[0].value : "tram_day");
  return { options, styles, defaultType };
}

function getIconOptions() {
  const fallback = [];
  return window.ICON_OPTIONS || fallback;
}

const PASMO_ICON = "./fonty/icon_big_pasmo.svg";
const NASTUPISTE_ICON = "./fonty/icon_big_nastupiste.svg";

function getInfoOptions() {
  const fallback = [
    { value: "placeholder_a", label: "Placeholder A" },
    { value: "placeholder_b", label: "Placeholder B" },
  ];
  return window.INFO_TYPE_OPTIONS || fallback;
}

function ensureInfoRowShape(row) {
  if (row.type !== "info") return;

  const opts = getInfoOptions();
  const allowed = new Set(opts.map((o) => o.value));
  const def = opts[0] ? opts[0].value : "placeholder_a";

  if (typeof row.infoType !== "string") row.infoType = def;
  if (!allowed.has(row.infoType)) row.infoType = def;

  const rule =
    (window.INFO_TYPE_RULES && window.INFO_TYPE_RULES[row.infoType]) || null;

  if (rule && rule.needsText) {
    if (typeof row.infoText !== "string") row.infoText = "";
  } else {
    // pro ostatní typy to necháme uložené, ale editor se nebude zobrazovat
    if (typeof row.infoText !== "string") row.infoText = "";
  }

  const supportsIcons = Boolean(
    rule && Array.isArray(rule.iconOptions) && rule.iconOptions.length
  );

  if (supportsIcons) {
    if (!Array.isArray(row.infoIcons)) row.infoIcons = [];

    const allowed = new Set(rule.iconOptions.map((o) => o.value));
    row.infoIcons = row.infoIcons.filter((v) => allowed.has(v)).slice(0, 3);
  } else {
    row.infoIcons = [];
  }
}

function getNameRules() {
  // fallback, když NAME_RULES není v rules.js
  return (
    window.NAME_RULES || {
      defaultLayout: "one",
      defaultSize: 140,
      layouts: {
        one: { heightMm: 70, bottomMm: 6, sizes: [140, 115] },
        two15: {
          heightMm: 106.5,
          topBottomMm: 55,
          bottomBottomMm: 10,
          fontPt: 105,
        },
        two2: {
          heightMm: 143,
          topBottomMm: 70,
          bottomBottomMm: 15,
          sizes: [140, 115],
        },
        three: {
          heightMm: 143,
          topBottomMm: 70,
          midBottomMm: 43,
          bottomBottomMm: 15,
          fontPt: 105,
        },
      },
    }
  );
}

// Linky: limity a font-size
function maxCharsForCols(cols) {
  return cols === 3 ? 4 : 3; // široké 4, úzké 3
}
function fontSizeForColsAndText(cols, text) {
  const len = (text || "").trim().length;
  if (cols === 3) return len >= 4 ? 140 : 195; // široké: 4 => 140, jinak 195
  return len >= 3 ? 140 : 195; // úzké: 3 => 140, jinak 195
}

// Název: výška dle layoutu
function nameRowHeightMm(layout) {
  const R = getNameRules();
  return R.layouts?.[layout]?.heightMm ?? R.layouts?.one?.heightMm ?? 70;
}

// ---- row shape ----
function ensureNameRowShape(row) {
  if (row.type !== "name") return;

  const NR = getNameRules();

  if (!NR.layouts?.[row.nameLayout]) row.nameLayout = NR.defaultLayout || "one";

  const layout = NR.layouts[row.nameLayout];

  // outage flag
  row.outage = Boolean(row.outage);

  // velikost jen tam, kde je volitelná
  if (layout?.sizes) {
    if (!layout.sizes.includes(row.nameSize))
      row.nameSize = NR.defaultSize ?? 140;
  } else {
    // u fixních layoutů (two15, three) nameSize necháme uložené, ale neřeší se
    if (row.nameSize !== 115 && row.nameSize !== 140)
      row.nameSize = NR.defaultSize ?? 140;
  }

  if (typeof row.line1 !== "string") row.line1 = "";
  if (typeof row.line2 !== "string") row.line2 = "";
  if (typeof row.line3 !== "string") row.line3 = "";
}

function ensureLinesRowShape(row, fallbackColumns) {
  if (row.type !== "lines") return;

  const { defaultType } = getRules();

  if (row.columnsOverride !== 3 && row.columnsOverride !== 4)
    row.columnsOverride = fallbackColumns;
  const cols = row.columnsOverride;
  const maxLen = maxCharsForCols(cols);

  if (row.linesHeight !== "075") row.linesHeight = "1";

  if (!Array.isArray(row.cells)) row.cells = [];
  while (row.cells.length < cols)
    row.cells.push({
      lineType: defaultType,
      text: "",
      mode: "line",
      arrow: "right",
      cancelled: false,
    });
  while (row.cells.length > cols) row.cells.pop();

  row.cells.forEach((c) => {
    if (!c.lineType) c.lineType = defaultType;
    if (typeof c.text !== "string") c.text = "";
    if (typeof c.pasmo !== "string") c.pasmo = "";
    c.text = c.text.slice(0, maxLen);

    if (c.mode !== "line" && c.mode !== "arrow") c.mode = "line";
    if (!ARROW_DEFS[c.arrow]) c.arrow = "right";
    if (typeof c.cancelled !== "boolean") c.cancelled = false;
  });
}

function ensureIconRowShape(row) {
  if (row.type !== "icons") return;

  // Ikona řada je vždy 4 sloupce
  row.columnsOverride = 4;

  const iconOptions = getIconOptions();
  const allowed = new Set(iconOptions.map((o) => o.value));

  if (!Array.isArray(row.cells)) row.cells = [];
  while (row.cells.length < 4)
    row.cells.push({ icon: "", cancelled: false, pasmo: "" });
  while (row.cells.length > 4) row.cells.pop();

  row.cells.forEach((c) => {
    if (typeof c.icon !== "string") c.icon = "";
    if (c.icon && !allowed.has(c.icon)) c.icon = "";
    if (typeof c.cancelled !== "boolean") c.cancelled = false;
    if (typeof c.pasmo !== "string") c.pasmo = "";
  });
}

function getRowHeightMm(row, fallbackColumns) {
  if (row.type === "name") {
    ensureNameRowShape(row);
    return nameRowHeightMm(row.nameLayout);
  }
  if (row.type === "lines") {
    ensureLinesRowShape(row, fallbackColumns);
    // 0.75 = stejné jako "Název 1 řádek (0.75)"
    return row.linesHeight === "075" ? 51.75 : 70;
  }
  if (row.type === "icons") {
    ensureIconRowShape(row);
    return 33.5;
  }
  if (row.type === "info") {
    ensureInfoRowShape(row);

    const rule =
      (window.INFO_TYPE_RULES && window.INFO_TYPE_RULES[row.infoType]) || null;
    return rule && typeof rule.heightMm === "number" ? rule.heightMm : 70;
  }
  return 70;
}

function clipSummaryText(s, maxLen) {
  const t = (s || "").trim();
  if (!t) return "–";
  return t.length > maxLen ? t.slice(0, maxLen) + "…" : t;
}

function rowSummary(row, fallbackColumns) {
  if (row.type === "name") {
    ensureNameRowShape(row);

    const prefix = row.outage ? "Název (Výluka)" : "Název";

    if (
      row.nameLayout === "one" ||
      row.nameLayout === "one075" ||
      row.nameLayout === "one15"
    ) {
      const t = (row.line1 || "").trim();
      if (!t) return prefix;
      return `${prefix}: ${clipSummaryText(t, 18)}`;
    }

    if (row.nameLayout === "three") {
      const a = clipSummaryText(row.line1, 10);
      const b = clipSummaryText(row.line2, 10);
      const c = clipSummaryText(row.line3, 10);
      const joined = `${a} / ${b} / ${c}`;
      return `${prefix}: ${
        joined.length > 28 ? joined.slice(0, 28) + "…" : joined
      }`;
    }

    // two15 / two2
    const a = clipSummaryText(row.line1, 12);
    const b = clipSummaryText(row.line2, 12);
    const joined = `${a} / ${b}`;
    return `${prefix}: ${
      joined.length > 28 ? joined.slice(0, 28) + "…" : joined
    }`;
  }

  if (row.type === "icons") {
    ensureIconRowShape(row);
    const iconOptions = getIconOptions();
    const map = new Map(iconOptions.map((o) => [o.value, o.label]));
    const parts = row.cells.map((c) => {
      const v = (c.icon || "").trim();
      if (!v) return "–";
      return map.get(v) || "?";
    });
    let content = parts.join(" | ");
    if (content.length > 28) content = content.slice(0, 28) + "…";
    return `Ikona: ${content}`;
  }

  if (row.type === "info") {
    ensureInfoRowShape(row);

    const opts = getInfoOptions();
    const map = new Map(opts.map((o) => [o.value, o.label]));
    const lbl = map.get(row.infoType) || "–";
    return `Linková informace: ${lbl}`;
  }

  ensureLinesRowShape(row, fallbackColumns);
  const cols = row.columnsOverride === 4 ? 4 : 3;

  const parts = row.cells.map((c) => {
    if (c.mode === "arrow")
      return (ARROW_DEFS[c.arrow] || ARROW_DEFS.right).label;
    const v = (c.text || "").trim();
    return v.length ? v : "–";
  });

  let content = parts.join(" | ");
  if (content.length > 28) content = content.slice(0, 28) + "…";

  const hSuffix = row.linesHeight === "075" ? " (0.75)" : "";
  return `Linky ${cols}s${hSuffix}: ${content}`;
}

// ---- state ----
const { defaultType: INITIAL_DEFAULT_TYPE } = getRules();
const NR_INIT = getNameRules();

const state = {
  columns: 3, // globální default (pro nové řady)
  trainzMode: false,
  signHeightUnits: 0,
  rows: [
    {
      id: uid(),
      type: "name",
      outage: false,
      nameLayout: NR_INIT.defaultLayout || "one",
      nameSize: NR_INIT.defaultSize ?? 140,
      line1: "",
      line2: "",
      line3: "",
    },
  ],
  selectedRowId: null,
};

// ---- DOM refs ----
const exportJpgBtn = document.getElementById("exportJpgBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const exportJpgTrsBtn = document.getElementById("exportJpgTrsBtn");
const trainzModeCheckbox = document.getElementById("trainzModeCheckbox");
const signHeightInfoEl = document.getElementById("signHeightInfo");

const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomResetBtn = document.getElementById("zoomResetBtn");

const rowsListEl = document.getElementById("rowsList");
const addRowBtn = document.getElementById("addRowBtn");
const signEl = document.getElementById("sign");
const signFrameEl = document.getElementById("signFrame") || signEl;
const editorMetaEl = document.getElementById("editorMeta");
const editorInfoEl = document.getElementById("editorInfo");
const infoTypeSelect = document.getElementById("infoTypeSelect");
const infoTextField = document.getElementById("infoTextField");
const infoTextInput = document.getElementById("infoTextInput");

const infoIconsField = document.getElementById("infoIconsField");
const infoIconsAddBtn = document.getElementById("infoIconsAddBtn");
const infoIconsList = document.getElementById("infoIconsList");

const columnsRadios = Array.from(
  document.querySelectorAll('input[name="columns"]')
);
const rowTypeSelect = document.getElementById("rowTypeSelect");

const editorNameEl = document.getElementById("editorName");
const editorLinesEl = document.getElementById("editorLines");
const cellsEditorEl = document.getElementById("cellsEditor");

// Název editor
const nameLayoutSelect = document.getElementById("nameLayoutSelect");
const nameSizeRadios = Array.from(
  document.querySelectorAll('input[name="nameSize"]')
);
const nameSizeField = document.getElementById("nameSizeField");
const nameOutageCheckbox = document.getElementById("nameOutageCheckbox");

const nameLine1Input = document.getElementById("nameLine1Input");
const nameLine2Input = document.getElementById("nameLine2Input");
const nameLine2Field = document.getElementById("nameLine2Field");

const nameLine3Input = document.getElementById("nameLine3Input");
const nameLine3Field = document.getElementById("nameLine3Field");

// Pomocné: labely pro size radios (aby šly skrýt)
const nameSizeLabels = nameSizeRadios
  .map((r) => r.closest("label"))
  .filter(Boolean);

let previewZoom = 1;
const PREVIEW_BASE_SCALE = 0.6; // 100% v UI bude reálně 80% (menší náhled)

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// ===== Trainz režim =====
const TRAINZ_TRS_WIDTH_PX = 752;
const TRAINZ_MAX_UNITS = 7;

// 1 řádek = 70mm, výšky zaokrouhlujeme na 0.25 řádku
function unitsFromHeightMm(heightMm) {
  return Math.round((heightMm / 70) * 4) / 4;
}

function computeSignHeightUnits() {
  return state.rows.reduce((sum, r) => {
    const h = getRowHeightMm(r, state.columns);
    return sum + unitsFromHeightMm(h);
  }, 0);
}

function formatRowsCs(n) {
  if (!Number.isFinite(n)) return "–";
  const s = n
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.[0-9]*?)0+$/, "$1");
  return s.replace(".", ",");
}

function rowsWordCs(n) {
  if (!Number.isFinite(n)) return "řádků";

  // Desetinná čísla: 1,5 řádku; 2,25 řádku; 5,5 řádku...
  if (!Number.isInteger(n)) return "řádku";

  // Celá čísla
  if (n === 1) return "řádek";
  if (n >= 2 && n <= 4) return "řádky";
  return "řádků"; // 0, 5+ a všechno ostatní
}

function updateSignHeightInfo(units) {
  if (!signHeightInfoEl) return;

  const v = Number.isFinite(units) ? units : computeSignHeightUnits();
  signHeightInfoEl.textContent = `Výška cedule: ${formatRowsCs(v)} ${rowsWordCs(
    v
  )}`;

  applyTrainzHeightColor(v);
}

function updateTrainzUi() {
  if (exportJpgTrsBtn) {
    exportJpgTrsBtn.classList.toggle("isHidden", !state.trainzMode);
  }
}

function formatRowsCs(n) {
  if (!Number.isFinite(n)) return "–";
  const s = n
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.[0-9]*?)0+$/, "$1");
  return s.replace(".", ",");
}

function rowsWordCs(n) {
  if (!Number.isFinite(n)) return "řádků";

  // Desetinná čísla: 1,5 řádku; 2,25 řádku; 5,5 řádku...
  if (!Number.isInteger(n)) return "řádku";

  // Celá čísla
  if (n === 1) return "řádek";
  if (n >= 2 && n <= 4) return "řádky";
  return "řádků"; // 0, 5+ a všechno ostatní
}

function updateSignHeightInfo(units) {
  if (!signHeightInfoEl) return;
  const v = Number.isFinite(units)
    ? units
    : state.rows.reduce((sum, r) => {
        const h = getRowHeightMm(r, state.columns);
        return sum + unitsFromHeightMm(h);
      }, 0);

  const suffix = state.trainzMode
    ? ` (Doporučená výška: Max ${TRAINZ_MAX_UNITS} řádků)`
    : "";

  signHeightInfoEl.textContent =
    `Výška cedule: ${formatRowsCs(v)} ${rowsWordCs(v)}` + suffix;
}

function updateZoomLabel() {
  if (!zoomResetBtn) return;
  zoomResetBtn.textContent = `${Math.round(previewZoom * 100)}%`;
}

function updatePreviewScale() {
  const viewport = document.getElementById("previewViewport");
  const stage = document.getElementById("previewStage");
  const content = document.getElementById("previewContent");
  if (!viewport || !stage || !content) return;

  // vnitřní prostor bez paddingů viewportu
  const cs = getComputedStyle(viewport);
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  const available = Math.max(0, viewport.clientWidth - padL - padR);

  // měříme previewContent (zahrne i tmavý podklad/padding)
  const w = content.offsetWidth;
  const h = content.offsetHeight;
  if (!w || !h) return;

  const fitScale = available / w;

  // 100% v UI (previewZoom=1) bude menší díky PREVIEW_BASE_SCALE
  const scale = clamp(fitScale * previewZoom * PREVIEW_BASE_SCALE, 0.05, 1);

  content.style.setProperty("--preview-scale", String(scale));
  stage.style.width = `${w * scale}px`;
  stage.style.height = `${h * scale}px`;

  updateZoomLabel();
}

// ---- actions ----
function moveRow(id, delta) {
  const idx = state.rows.findIndex((r) => r.id === id);
  if (idx === -1) return;
  const nextIdx = idx + delta;
  if (nextIdx < 0 || nextIdx >= state.rows.length) return;

  const [row] = state.rows.splice(idx, 1);
  state.rows.splice(nextIdx, 0, row);
  renderAll();
}

function addRow() {
  const { defaultType } = getRules();
  const cols = state.columns === 4 ? 4 : 3;

  const newRow = {
    id: uid(),
    type: "lines",
    columnsOverride: cols,
    cells: Array.from({ length: cols }, () => ({
      lineType: defaultType,
      text: "",
      mode: "line",
      arrow: "right",
      cancelled: false,
    })),
  };

  state.rows.push(newRow);
  state.selectedRowId = newRow.id;
  renderAll();
}

function removeRow(id) {
  if (state.rows.length <= 1) return;

  const idx = state.rows.findIndex((r) => r.id === id);
  if (idx === -1) return;

  state.rows.splice(idx, 1);

  if (state.selectedRowId === id) {
    const fallback = state.rows[Math.min(idx, state.rows.length - 1)];
    state.selectedRowId = fallback ? fallback.id : null;
  }
  renderAll();
}

function setColumns(cols) {
  state.columns = cols === 4 ? 4 : 3;
  renderAll();
}

function setSelectedRowPreset(value) {
  const selected = state.rows.find((r) => r.id === state.selectedRowId);
  if (!selected) return;

  const { defaultType } = getRules();
  const NR = getNameRules();

  if (value === "name") {
    selected.type = "name";
    selected.outage = Boolean(selected.outage);

    selected.nameLayout = selected.nameLayout || NR.defaultLayout || "one";
    selected.nameSize = selected.nameSize || (NR.defaultSize ?? 140);

    selected.line1 = typeof selected.line1 === "string" ? selected.line1 : "";
    selected.line2 = typeof selected.line2 === "string" ? selected.line2 : "";
    selected.line3 = typeof selected.line3 === "string" ? selected.line3 : "";

    delete selected.cells;
    delete selected.columnsOverride;
    renderAll();
    return;
  }

  if (value === "icons") {
    selected.type = "icons";
    selected.columnsOverride = 4;

    if (!Array.isArray(selected.cells)) selected.cells = [];
    while (selected.cells.length < 4)
      selected.cells.push({
        icon: "",
        cancelled: false,
        pasmo: "",
      });
    while (selected.cells.length > 4) selected.cells.pop();

    selected.cells.forEach((c) => {
      if (typeof c.icon !== "string") c.icon = "";
      if (typeof c.cancelled !== "boolean") c.cancelled = false;
      if (typeof c.pasmo !== "string") c.pasmo = "";
    });

    // zrušíme políčka pro "name" i "lines"
    delete selected.outage;
    delete selected.nameLayout;
    delete selected.nameSize;
    delete selected.line1;
    delete selected.line2;
    delete selected.line3;

    renderAll();
    return;
  }

  if (value === "info") {
    const opts = getInfoOptions();
    const def = opts[0] ? opts[0].value : "placeholder_a";

    selected.type = "info";
    selected.infoType =
      typeof selected.infoType === "string" ? selected.infoType : def;

    ensureInfoRowShape(selected);

    // zrušíme políčka pro "name" i "lines" i "icons"
    delete selected.outage;
    delete selected.nameLayout;
    delete selected.nameSize;
    delete selected.line1;
    delete selected.line2;
    delete selected.line3;

    delete selected.cells;
    delete selected.columnsOverride;

    renderAll();
    return;
  }

  if (value === "lines3" || value === "lines4" || value === "lines4_075") {
    const cols = value === "lines3" ? 3 : 4;

    selected.type = "lines";
    selected.columnsOverride = cols;
    selected.linesHeight = value === "lines4_075" ? "075" : "1";

    if (!Array.isArray(selected.cells)) selected.cells = [];
    while (selected.cells.length < cols)
      selected.cells.push({
        lineType: defaultType,
        text: "",
        mode: "line",
        arrow: "right",
        cancelled: false,
      });
    while (selected.cells.length > cols) selected.cells.pop();

    selected.cells.forEach((c) => {
      if (!c.lineType) c.lineType = defaultType;
      if (typeof c.text !== "string") c.text = "";
      if (c.mode !== "line" && c.mode !== "arrow") c.mode = "line";
      if (!ARROW_DEFS[c.arrow]) c.arrow = "right";
      if (typeof c.cancelled !== "boolean") c.cancelled = false;
    });

    delete selected.outage;
    delete selected.nameLayout;
    delete selected.nameSize;
    delete selected.line1;
    delete selected.line2;
    delete selected.line3;

    renderAll();
    return;
  }
}

// ---- rendering ----
function renderRowsList() {
  rowsListEl.innerHTML = "";

  state.rows.forEach((row, idx) => {
    const item = document.createElement("div");
    item.className =
      "rowItem" + (row.id === state.selectedRowId ? " rowItem--active" : "");

    const left = document.createElement("div");
    left.className = "rowItem__left";

    const title = document.createElement("div");
    title.className = "rowItem__title";
    title.textContent = `Řada ${idx + 1}`;

    const meta = document.createElement("div");
    meta.className = "rowItem__meta";
    meta.textContent = rowSummary(row, state.columns);

    left.appendChild(title);
    left.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "rowItem__actions";

    const upBtn = document.createElement("button");
    upBtn.className = "btn";
    upBtn.type = "button";
    upBtn.textContent = "↑";
    upBtn.title = "Posunout nahoru";
    upBtn.disabled = idx === 0;
    upBtn.addEventListener("click", () => moveRow(row.id, -1));

    const downBtn = document.createElement("button");
    downBtn.className = "btn";
    downBtn.type = "button";
    downBtn.textContent = "↓";
    downBtn.title = "Posunout dolů";
    downBtn.disabled = idx === state.rows.length - 1;
    downBtn.addEventListener("click", () => moveRow(row.id, +1));

    const selectBtn = document.createElement("button");
    selectBtn.className = "btn";
    selectBtn.type = "button";
    selectBtn.textContent = "Upravit";
    selectBtn.addEventListener("click", () => {
      state.selectedRowId = row.id;
      renderAll();
    });

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn btn--danger";
    removeBtn.type = "button";
    removeBtn.textContent = "–";
    removeBtn.title = "Odebrat řadu";
    removeBtn.addEventListener("click", () => removeRow(row.id));

    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(selectBtn);
    actions.appendChild(removeBtn);

    item.appendChild(left);
    item.appendChild(actions);

    rowsListEl.appendChild(item);
  });
}

function renderCellsEditor(row) {
  const { options, defaultType } = getRules();

  ensureLinesRowShape(row, state.columns);
  const cols = row.columnsOverride === 4 ? 4 : 3;
  const maxLen = maxCharsForCols(cols);

  cellsEditorEl.innerHTML = "";

  row.cells.forEach((cell, i) => {
    const wrap = document.createElement("div");
    wrap.className = "cellEditorRow";

    const colLabel = document.createElement("div");
    colLabel.className = "cellEditorRow__label";
    colLabel.textContent = `Sloupec ${i + 1}`;

    // mode: Linka / Šipka
    const modeWrap = document.createElement("div");
    modeWrap.className = "cellMode";
    const modeName = `cellMode-${row.id}-${i}`;

    const lineLbl = document.createElement("label");
    lineLbl.className = "radio radio--pill radio--pill-sm";
    lineLbl.innerHTML = `<input type="radio" name="${modeName}" value="line"><span>Linka</span>`;
    const lineInput = lineLbl.querySelector("input");
    lineInput.checked = cell.mode === "line";

    const arrowLbl = document.createElement("label");
    arrowLbl.className = "radio radio--pill radio--pill-sm";
    arrowLbl.innerHTML = `<input type="radio" name="${modeName}" value="arrow"><span>Šipka</span>`;
    const arrowInput = arrowLbl.querySelector("input");
    arrowInput.checked = cell.mode === "arrow";

    lineInput.addEventListener("change", () => {
      cell.mode = "line";
      renderRowEditor();
      renderSign();
      renderRowsList();
      requestAnimationFrame(updatePreviewScale);
    });

    arrowInput.addEventListener("change", () => {
      cell.mode = "arrow";
      if (!ARROW_DEFS[cell.arrow]) cell.arrow = "right";
      renderRowEditor();
      renderSign();
      renderRowsList();
      requestAnimationFrame(updatePreviewScale);
    });

    modeWrap.appendChild(lineLbl);
    modeWrap.appendChild(arrowLbl);

    // zrušena (přeškrtnutí)
    const cancelledLbl = document.createElement("label");
    cancelledLbl.className = "check";
    cancelledLbl.innerHTML = `<input type="checkbox"><span>Zrušena</span>`;
    const cancelledInput = cancelledLbl.querySelector("input");
    cancelledInput.checked = Boolean(cell.cancelled);
    cancelledInput.addEventListener("change", () => {
      cell.cancelled = cancelledInput.checked;
      renderSign();
      renderRowsList();
      requestAnimationFrame(updatePreviewScale);
    });

    modeWrap.appendChild(cancelledLbl);

    // typ linky (jen pro Linka)
    const typeSelect = document.createElement("select");
    typeSelect.className = "select";
    typeSelect.innerHTML = options
      .map((o) => `<option value="${o.value}">${o.label}</option>`)
      .join("");
    typeSelect.value = cell.lineType || defaultType;
    typeSelect.addEventListener("change", (e) => {
      cell.lineType = e.target.value;
      renderSign();
      renderRowsList();
      requestAnimationFrame(updatePreviewScale);
    });

    // text input (jen pro Linka)
    const textInput = document.createElement("input");
    textInput.className = "input";
    textInput.type = "text";
    textInput.placeholder = "text v buňce (např. 16)";
    textInput.value = cell.text || "";
    textInput.maxLength = maxLen;
    textInput.autocomplete = "off";
    textInput.spellcheck = false;

    textInput.addEventListener("input", (e) => {
      const v = e.target.value.slice(0, maxLen);
      if (v !== e.target.value) e.target.value = v;
      cell.text = v;

      renderSign();
      renderRowsList();
      requestAnimationFrame(updatePreviewScale);
    });

    // šipky grid (jen pro Šipka)
    const arrowGrid = document.createElement("div");
    arrowGrid.className = "arrowGrid";
    const arrowKeys = [
      "up",
      "down",
      "left",
      "right",
      "left_up",
      "left_down",
      "right_up",
      "right_down",
    ];

    arrowKeys.forEach((k) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "arrowBtn" + (cell.arrow === k ? " arrowBtn--active" : "");
      btn.textContent = (ARROW_DEFS[k] || ARROW_DEFS.right).label;
      btn.addEventListener("click", () => {
        cell.arrow = k;
        renderRowEditor();
        renderSign();
        renderRowsList();
        requestAnimationFrame(updatePreviewScale);
      });
      arrowGrid.appendChild(btn);
    });

    const right = document.createElement("div");
    right.className = "cellEditorRow__right";

    right.appendChild(modeWrap);

    // typ linky se NEZOBRAZÍ, pokud je Šipka
    if (cell.mode === "line") {
      right.appendChild(typeSelect);
      right.appendChild(textInput);
    } else {
      right.appendChild(arrowGrid);
    }

    wrap.appendChild(colLabel);
    wrap.appendChild(right);
    cellsEditorEl.appendChild(wrap);
  });
}

function renderIconsEditor(row) {
  const iconOptions = getIconOptions();
  ensureIconRowShape(row);

  cellsEditorEl.innerHTML = "";

  row.cells.forEach((cell, i) => {
    const wrap = document.createElement("div");
    wrap.className = "cellEditorRow";

    const colLabel = document.createElement("div");
    colLabel.className = "cellEditorRow__label";
    colLabel.textContent = `Sloupec ${i + 1}`;

    const right = document.createElement("div");
    right.className = "cellEditorRow__right";

    const line = document.createElement("div");
    line.className = "field field--inline";

    const select = document.createElement("select");
    select.className = "select";
    select.innerHTML =
      `<option value="">(prázdné)</option>` +
      iconOptions
        .map((o) => `<option value="${o.value}">${o.label}</option>`)
        .join("");
    select.value = cell.icon || "";
    select.addEventListener("change", (e) => {
      cell.icon = e.target.value || "";
      renderRowEditor();
      renderSign();
      renderRowsList();
      requestAnimationFrame(updatePreviewScale);
    });

    const cancelledLbl = document.createElement("label");
    cancelledLbl.className = "check";
    cancelledLbl.innerHTML = `<input type="checkbox"><span>Zrušena</span>`;
    const cancelledInput = cancelledLbl.querySelector("input");
    cancelledInput.checked = Boolean(cell.cancelled);
    cancelledInput.addEventListener("change", () => {
      cell.cancelled = cancelledInput.checked;
      renderSign();
      renderRowsList();
      requestAnimationFrame(updatePreviewScale);
    });

    line.appendChild(select);
    line.appendChild(cancelledLbl);

    right.appendChild(line);

if (cell.icon === PASMO_ICON || cell.icon === NASTUPISTE_ICON) {
  const fields = document.createElement("div");
  fields.className = "pasmoFields";

  const mk = (labelText, key) => {
    const lbl = document.createElement("label");
    lbl.className = "field";

    const cap = document.createElement("span");
    cap.textContent = labelText;

    const inp = document.createElement("input");
    inp.className = "input";
    inp.type = "text";
    inp.value = cell[key] || "";
    inp.autocomplete = "off";

    inp.addEventListener("input", () => {
      const v = (inp.value || "").slice(0, 2);
      if (inp.value !== v) inp.value = v;
      cell[key] = v;

      renderSign();
      renderRowsList();
      requestAnimationFrame(updatePreviewScale);
    });

    lbl.appendChild(cap);
    lbl.appendChild(inp);
    return lbl;
  };

  const label = cell.icon === NASTUPISTE_ICON ? "Nástupiště" : "Pásmo";
  fields.appendChild(mk(label, "pasmo"));

  right.appendChild(fields);
}


    wrap.appendChild(colLabel);
    wrap.appendChild(right);
    cellsEditorEl.appendChild(wrap);
  });
}

function renderRowEditor() {
  const selected = state.rows.find((r) => r.id === state.selectedRowId);
  editorNameEl.classList.add("isHidden");
  editorLinesEl.classList.add("isHidden");
  if (editorInfoEl) editorInfoEl.classList.add("isHidden");

  if (!selected) {
    editorMetaEl.textContent = "Vyber řadu v seznamu";
    if (rowTypeSelect) {
      rowTypeSelect.disabled = true;
      rowTypeSelect.value = "name";
    }
    if (nameLayoutSelect) {
      nameLayoutSelect.disabled = true;
      nameLayoutSelect.value = "one";
    }
    editorNameEl.classList.add("isHidden");
    editorLinesEl.classList.add("isHidden");
    return;
  }

  const idx = state.rows.findIndex((r) => r.id === selected.id);
  editorMetaEl.textContent = `Řada ${idx + 1}`;

  if (rowTypeSelect) rowTypeSelect.value = "name";

  if (selected.type === "name") {
    ensureNameRowShape(selected);

    if (rowTypeSelect) rowTypeSelect.value = "name";
    editorNameEl.classList.remove("isHidden");
    editorLinesEl.classList.add("isHidden");

    // layout select
    if (nameLayoutSelect) {
      nameLayoutSelect.disabled = false;
      nameLayoutSelect.value = selected.nameLayout;
    }

    const isTwo =
      selected.nameLayout === "two15" || selected.nameLayout === "two2";
    const isThree = selected.nameLayout === "three";

    nameLine2Field.classList.toggle("isHidden", !(isTwo || isThree));
    nameLine3Field.classList.toggle("isHidden", !isThree);

    // checkbox Výluka
    if (nameOutageCheckbox)
      nameOutageCheckbox.checked = Boolean(selected.outage);

    // velikost písma: jen one + two2 (three a two15 jsou fixní)
    const sizeSelectable =
      selected.nameLayout === "one" || selected.nameLayout === "two2";

    // pole vedle checkboxu necháme viditelné vždy (kvůli Výluce),
    // ale radio velikostí skryjeme, pokud se nehodí
    if (nameSizeField) nameSizeField.classList.remove("isHidden");
    nameSizeLabels.forEach((lbl) => {
      lbl.style.display = sizeSelectable ? "" : "none";
    });
    nameSizeRadios.forEach((r) => {
      r.disabled = !sizeSelectable;
    });

    if (sizeSelectable) {
      nameSizeRadios.forEach(
        (r) => (r.checked = Number(r.value) === selected.nameSize)
      );
    }

    nameLine1Input.value = selected.line1 ?? "";
    if (isTwo || isThree) nameLine2Input.value = selected.line2 ?? "";
    if (isThree) nameLine3Input.value = selected.line3 ?? "";

    return;
  }

  if (selected.type === "icons") {
    ensureIconRowShape(selected);
    if (rowTypeSelect) rowTypeSelect.value = "icons";

    editorNameEl.classList.add("isHidden");
    editorLinesEl.classList.remove("isHidden");

    renderIconsEditor(selected);
    return;
  }

  if (selected.type === "info") {
    ensureInfoRowShape(selected);

    if (rowTypeSelect) rowTypeSelect.value = "info";

    editorNameEl.classList.add("isHidden");
    editorLinesEl.classList.add("isHidden");
    if (editorInfoEl) editorInfoEl.classList.remove("isHidden");

    if (infoTypeSelect) {
      const opts = getInfoOptions();
      infoTypeSelect.innerHTML = opts
        .map((o) => `<option value="${o.value}">${o.label}</option>`)
        .join("");
      infoTypeSelect.value =
        selected.infoType || (opts[0] ? opts[0].value : "");

      const rule =
        (window.INFO_TYPE_RULES && window.INFO_TYPE_RULES[selected.infoType]) ||
        null;

      if (infoTextField && infoTextInput) {
        if (rule && rule.needsText) {
          infoTextField.classList.remove("isHidden");
          infoTextInput.value = selected.infoText || "";
        } else {
          infoTextField.classList.add("isHidden");
          infoTextInput.value = "";
        }
      }

      // --- volitelná ikona ---
      const supportsIcons = Boolean(
        rule && Array.isArray(rule.iconOptions) && rule.iconOptions.length
      );

      if (infoIconsField)
        infoIconsField.classList.toggle("isHidden", !supportsIcons);

      if (supportsIcons) {
        if (!Array.isArray(selected.infoIcons)) selected.infoIcons = [];
        selected.infoIcons = selected.infoIcons.slice(0, 3);

        if (infoIconsAddBtn)
          infoIconsAddBtn.disabled = selected.infoIcons.length >= 3;

        if (infoIconsList) {
          const optionsHtml =
            `<option value="">(vyber ikonu)</option>` +
            rule.iconOptions
              .map((o) => `<option value="${o.value}">${o.label}</option>`)
              .join("");

          infoIconsList.innerHTML = selected.infoIcons
            .map((val, i) => {
              const upDisabled = i === 0 ? "disabled" : "";
              const downDisabled =
                i === selected.infoIcons.length - 1 ? "disabled" : "";
              return `
                <div class="iconsList__row" data-index="${i}">
                  <select class="select" data-role="icon-select" data-index="${i}">
                    ${optionsHtml}
                  </select>
                  <button type="button" class="btn iconsList__btn" data-action="up" data-index="${i}" ${upDisabled}>↑</button>
                  <button type="button" class="btn iconsList__btn" data-action="down" data-index="${i}" ${downDisabled}>↓</button>
                  <button type="button" class="btn iconsList__btn" data-action="remove" data-index="${i}">✕</button>
                </div>
              `;
            })
            .join("");

          // nastavení selected hodnot (aby to sedělo i po innerHTML)
          infoIconsList
            .querySelectorAll('select[data-role="icon-select"]')
            .forEach((sel) => {
              const idx = Number(sel.dataset.index);
              sel.value = selected.infoIcons[idx] || "";
            });
        }
      }
    }

    return;
  }

  // lines
  const cols = selected.columnsOverride === 4 ? 4 : 3;
  if (rowTypeSelect) {
    if (cols === 4 && selected.linesHeight === "075") {
      rowTypeSelect.value = "lines4_075";
    } else {
      rowTypeSelect.value = cols === 4 ? "lines4" : "lines3";
    }
  }

  editorNameEl.classList.add("isHidden");
  editorLinesEl.classList.remove("isHidden");

  renderCellsEditor(selected);
}

function computeAndSetSignHeight() {
  const padV = mmVar(signEl, "--pad-v");
  const gapY = mmVar(signEl, "--gap-y");

  const sumRowsMm = state.rows.reduce(
    (sum, r) => sum + getRowHeightMm(r, state.columns),
    0
  );
  const gaps = Math.max(0, state.rows.length - 1) * gapY;

  const heightMm = padV * 2 + sumRowsMm + gaps;
  signEl.style.height = `${heightMm}mm`;

  // výška v "řádcích"
  state.signHeightUnits = computeSignHeightUnits();
  updateSignHeightInfo(state.signHeightUnits);
}

function renderSign() {
  const { styles, defaultType } = getRules();

  signEl.innerHTML = "";

  const rowsWrap = document.createElement("div");
  rowsWrap.className = "signRows";

  state.rows.forEach((row) => {
    const rowH = getRowHeightMm(row, state.columns);

    // =========================
    // NAME ROW
    // =========================
    if (row.type === "name") {
      ensureNameRowShape(row);

      const NR = getNameRules();
      const L = NR.layouts[row.nameLayout] || NR.layouts.one;

      const nameRow = document.createElement("div");
      nameRow.className = "nameRow";
      nameRow.style.height = `${L.heightMm ?? rowH}mm`;
      nameRow.style.background = row.outage ? "#fdcc1a" : "#fff";

      if (row.nameLayout === "one075") {
        const line = document.createElement("div");
        line.className = "nameRow__line";

        line.style.bottom = `${L.bottomMm ?? 0}mm`;
        line.style.fontSize = `${L.fontPt ?? 110}pt`;
        line.textContent = row.line1 || "";

        nameRow.appendChild(line);
      } else if (row.nameLayout === "one") {
        const allowed = Array.isArray(L.sizes) ? L.sizes : [140, 115];
        const size = allowed.includes(row.nameSize)
          ? row.nameSize
          : NR.defaultSize ?? 140;

        const line = document.createElement("div");
        line.className = "nameRow__line";

        // Spec: 115pt -> bottom 11mm, jinak bottom z rules (typicky 6mm)
        const bottomMm = size === 115 ? 11 : L.bottomMm ?? 6;
        line.style.bottom = `${bottomMm}mm`;

        line.style.fontSize = `${size}pt`;
        line.textContent = row.line1 || "";
        nameRow.appendChild(line);
      } else if (row.nameLayout === "one15") {
        const allowed = Array.isArray(L.sizes) ? L.sizes : [140, 115];
        const size = allowed.includes(row.nameSize)
          ? row.nameSize
          : NR.defaultSize ?? 140;

        const line = document.createElement("div");
        line.className = "nameRow__line";

        // baseline z rules, u 115pt o kousek výš (podobně jako u "one")
        const base = L.bottomMm ?? 32.5;
        const bottomMm = size === 115 ? base + 5 : base;

        line.style.bottom = `${bottomMm}mm`;
        line.style.fontSize = `${size}pt`;
        line.textContent = row.line1 || "";

        nameRow.appendChild(line);
      } else if (row.nameLayout === "two15") {
        const top = document.createElement("div");
        top.className = "nameRow__line";
        top.style.bottom = `${L.topBottomMm ?? 55}mm`;
        top.style.fontSize = `${L.fontPt ?? 105}pt`;
        top.textContent = row.line1 || "";

        const bottom = document.createElement("div");
        bottom.className = "nameRow__line";
        bottom.style.bottom = `${L.bottomBottomMm ?? 10}mm`;
        bottom.style.fontSize = `${L.fontPt ?? 105}pt`;
        bottom.textContent = row.line2 || "";

        nameRow.appendChild(top);
        nameRow.appendChild(bottom);
      } else if (row.nameLayout === "three") {
        const fixedPt = L.fontPt ?? 105;

        const top = document.createElement("div");
        top.className = "nameRow__line";
        top.style.bottom = `${L.topBottomMm ?? 70}mm`;
        top.style.fontSize = `${fixedPt}pt`;
        top.textContent = row.line1 || "";

        const mid = document.createElement("div");
        mid.className = "nameRow__line";
        mid.style.bottom = `${L.midBottomMm ?? 43}mm`;
        mid.style.fontSize = `${fixedPt}pt`;
        mid.textContent = row.line2 || "";

        const bottom = document.createElement("div");
        bottom.className = "nameRow__line";
        bottom.style.bottom = `${L.bottomBottomMm ?? 15}mm`;
        bottom.style.fontSize = `${fixedPt}pt`;
        bottom.textContent = row.line3 || "";

        nameRow.appendChild(top);
        nameRow.appendChild(mid);
        nameRow.appendChild(bottom);
      } else {
        // two2
        const allowed = Array.isArray(L.sizes) ? L.sizes : [140, 115];
        const size = allowed.includes(row.nameSize)
          ? row.nameSize
          : NR.defaultSize ?? 140;

        const top = document.createElement("div");
        top.className = "nameRow__line";
        top.style.bottom = `${L.topBottomMm ?? 70}mm`;
        top.style.fontSize = `${size}pt`;
        top.textContent = row.line1 || "";

        const bottom = document.createElement("div");
        bottom.className = "nameRow__line";
        bottom.style.bottom = `${L.bottomBottomMm ?? 15}mm`;
        bottom.style.fontSize = `${size}pt`;
        bottom.textContent = row.line2 || "";

        nameRow.appendChild(top);
        nameRow.appendChild(bottom);
      }

      rowsWrap.appendChild(nameRow);
      return;
    }
    // =========================
    // ICONS ROW (půlřádek)
    // =========================
    if (row.type === "icons") {
      ensureIconRowShape(row);

      const rowEl = document.createElement("div");
      rowEl.className = "row cols-4 row--icons";
      rowEl.style.height = `${rowH}mm`;

      row.cells.forEach((cell) => {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.style.height = `${rowH}mm`;

        tile.style.setProperty("--tile-bg", "#ffffff");

        if (cell.cancelled) tile.classList.add("tile--cancelled");

        const clip = document.createElement("div");
        clip.className = "tile__clip";
        tile.appendChild(clip);

        if (cell.icon) {
          const img = document.createElement("img");
          img.className = "tile__iconImg";
          img.src = cell.icon;
          img.alt = "";
          img.draggable = false;
          clip.appendChild(img);
        }

if (cell.icon === PASMO_ICON || cell.icon === NASTUPISTE_ICON) {
  const t = (cell.pasmo || "").trim().slice(0, 2);

  if (t) {
    const overlay = document.createElement("div");
    overlay.className =
  "pasmo-overlay pasmo-overlay--right" +
  (cell.icon === NASTUPISTE_ICON ? " pasmo-overlay--nastupiste" : "");

    const txt = document.createElement("span");
    txt.className = "pasmo-overlay__text";
    txt.textContent = t;

    overlay.appendChild(txt);
    tile.appendChild(overlay);
  }
}

        rowEl.appendChild(tile);
      });

      rowsWrap.appendChild(rowEl);
      return;
    }

    // =========================
    // LINK INFO ROW (linková informace)
    // =========================
    if (row.type === "info") {
      ensureInfoRowShape(row);

      const infoRow = document.createElement("div");
      infoRow.className = "infoRow";
      infoRow.style.height = `${rowH}mm`;

      const rule =
        (window.INFO_TYPE_RULES && window.INFO_TYPE_RULES[row.infoType]) ||
        null;

      const opts = getInfoOptions();
      const map = new Map(opts.map((o) => [o.value, o.label]));
      const lbl = map.get(row.infoType) || "";

      // pravidlové vykreslení (např. "Na znamení")
      if (rule && rule.layout === "requestStop") {
        infoRow.classList.add("infoRow--requestStop");
        if (typeof rule.bottomPaddingMm === "number") {
          infoRow.style.paddingBottom = `${rule.bottomPaddingMm}mm`;
        }

        const text = document.createElement("div");
        text.className = "infoRow__text";
        text.style.color = rule.color || "#000";
        text.style.fontFamily = `"${
          rule.fontFamily || "Stroudley-bold"
        }", sans-serif`;

        const parts = rule.parts || [];
        const maxPt = parts.reduce(
          (m, p) => Math.max(m, typeof p.sizePt === "number" ? p.sizePt : 0),
          0
        );

        parts.forEach((p) => {
          const span = document.createElement("span");
          span.className = "infoRow__part";
          span.textContent = p.text || "";

          if (typeof p.sizePt === "number") {
            span.style.fontSize = `${p.sizePt}pt`;

            // menší část má být regular (ne bold)
            if (p.sizePt < maxPt) {
              span.style.fontFamily = '"Stroudley-regular", sans-serif';
            }
          }

          text.appendChild(span);
        });

        infoRow.appendChild(text);
        rowsWrap.appendChild(infoRow);
        return;
      }

      if (rule && rule.layout === "platform") {
        infoRow.classList.add("infoRow--platform");
        infoRow.style.background = rule.bg || "#00a662";
        infoRow.style.paddingBottom = `${rule.bottomPaddingMm ?? 0}mm`;

        const text = document.createElement("div");
        text.className = "infoRow__text";
        text.style.color = rule.color || "#fff";
        text.style.fontFamily = `"${
          rule.fontFamily || "Stroudley-bold"
        }", sans-serif`;

        (rule.parts || []).forEach((p) => {
          const span = document.createElement("span");
          span.className = "infoRow__part";

          if (p.bind === "userText") {
            const val = row.infoText || "";
            const pre = typeof p.prefix === "string" ? p.prefix : "";
            const suf = typeof p.suffix === "string" ? p.suffix : "";
            span.textContent = val ? `${pre}${val}${suf}` : "";
          } else {
            span.textContent = p.text || "";
          }

          if (typeof p.sizePt === "number")
            span.style.fontSize = `${p.sizePt}pt`;
          text.appendChild(span);
        });

        infoRow.appendChild(text);
        rowsWrap.appendChild(infoRow);
        return;
      }

      if (rule && rule.layout === "tempChange") {
        infoRow.classList.add("infoRow--tempChange");

        const iconSize =
          typeof rule.iconSizeMm === "number" ? rule.iconSizeMm : 33.5;
        const gapMm = typeof rule.gapMm === "number" ? rule.gapMm : 5;
        const leftPadMm =
          typeof rule.leftPadMm === "number" ? rule.leftPadMm : 5;

        const iconWrap = document.createElement("div");
        iconWrap.className = "infoRow__icon";
        iconWrap.style.width = `${iconSize}mm`;
        iconWrap.style.height = `${iconSize}mm`;

        if (rule.icon) {
          const img = document.createElement("img");
          img.src = rule.icon;
          img.alt = "";
          img.draggable = false;
          iconWrap.appendChild(img);
        }

        const gap = document.createElement("div");
        gap.className = "infoRow__gap";
        gap.style.width = `${gapMm}mm`;

        const panel = document.createElement("div");
        panel.className = "infoRow__panel";
        panel.style.background = rule.bg || "#fdcc1a";
        panel.style.color = rule.color || "#000";
        panel.style.fontFamily = `"${
          rule.fontFamily || "Stroudley-bold"
        }", sans-serif`;

        const line1 = document.createElement("div");
        line1.className = "infoRow__line infoRow__line--top";
        line1.style.left = `${leftPadMm}mm`;
        line1.style.right = `${leftPadMm}mm`;
        line1.style.bottom = `${rule.line1BottomMm ?? 37}mm`;

        (rule.line1Parts || []).forEach((p) => {
          const span = document.createElement("span");
          span.className = "infoRow__part";
          span.textContent = p.text || "";
          if (typeof p.sizePt === "number")
            span.style.fontSize = `${p.sizePt}pt`;
          if (typeof p.fontFamily === "string" && p.fontFamily.trim()) {
            span.style.fontFamily = `"${p.fontFamily}", sans-serif`;
          }
          line1.appendChild(span);
        });

        const line2 = document.createElement("div");
        line2.className = "infoRow__line infoRow__line--bottom";
        line2.style.left = `${leftPadMm}mm`;
        line2.style.right = `${leftPadMm}mm`;
        line2.style.bottom = `${rule.line2BottomMm ?? 0}mm`;
        line2.style.fontSize = `${rule.line2SizePt ?? 78}pt`;
        line2.textContent = row.infoText || "";

        panel.appendChild(line1);
        panel.appendChild(line2);

        infoRow.appendChild(iconWrap);
        infoRow.appendChild(gap);
        infoRow.appendChild(panel);

        rowsWrap.appendChild(infoRow);
        return;
      }

      if (rule && rule.layout === "direction") {
        const icons = Array.isArray(row.infoIcons)
          ? row.infoIcons.filter(Boolean).slice(0, 3)
          : [];

        infoRow.classList.add("infoRow--direction");
        infoRow.style.background = rule.bg || "#fff";
        infoRow.style.color = rule.color || "#000";
        infoRow.style.paddingLeft = `${rule.leftPadMm ?? 5}mm`;
        infoRow.style.paddingRight = `${
          icons.length ? 0 : rule.rightPadMm ?? 5
        }mm`;

        const left = document.createElement("div");
        left.className = "infoDir__left";

        const t1 = document.createElement("div");
        t1.className = "infoDir__title";
        t1.textContent = rule.titleText ?? "Směr";
        t1.style.fontFamily = `"${
          rule.titleFontFamily || "Stroudley-bold"
        }", sans-serif`;
        t1.style.fontSize = `${rule.titleSizePt ?? 34}pt`;

        const t2 = document.createElement("div");
        t2.className = "infoDir__subtitle";
        t2.textContent = rule.subtitleText ?? "direction";
        t2.style.fontFamily = `"${
          rule.subtitleFontFamily || "Stroudley-regular"
        }", sans-serif`;
        t2.style.fontSize = `${rule.subtitleSizePt ?? 18}pt`;

        left.appendChild(t1);
        left.appendChild(t2);

        const spacer = document.createElement("div");
        spacer.className = "infoDir__spacer";
        spacer.style.width = `${rule.labelGapMm ?? 10}mm`;

        const text = document.createElement("div");
        text.className = "infoDir__text";
        text.textContent = row.infoText || "";
        text.style.fontFamily = `"${
          rule.textFontFamily || "Stroudley-bold"
        }", sans-serif`;
        text.style.fontSize = `${rule.textSizePt ?? 60}pt`;

        infoRow.appendChild(left);
        infoRow.appendChild(spacer);
        infoRow.appendChild(text);

        if (icons.length) {
          const iconGroupGapMm =
            typeof rule.iconGroupGapMm === "number"
              ? rule.iconGroupGapMm
              : rule.iconGapMm ?? 3; // mezera mezi textem a blokem ikon
          const betweenGapMm =
            typeof rule.iconBetweenGapMm === "number"
              ? rule.iconBetweenGapMm
              : 0; // mezera MEZI ikonami
          const rowH =
            typeof rule.iconCellSizeMm === "number"
              ? rule.iconCellSizeMm
              : 33.5;
          const padMm = typeof rule.iconPadMm === "number" ? rule.iconPadMm : 5; // 5mm jen na okrajích CELÉHO bloku ikon
          const iconSizeMm =
            typeof rule.iconSizeMm === "number" ? rule.iconSizeMm : 23.5;

          const iconGroupGap = document.createElement("div");
          iconGroupGap.className = "infoDir__iconGap";
          iconGroupGap.style.width = `${iconGroupGapMm}mm`;
          infoRow.appendChild(iconGroupGap);

          const iconsWrap = document.createElement("div");
          iconsWrap.className = "infoDir__icons";
          iconsWrap.style.display = "flex";
          iconsWrap.style.alignItems = "center";
          iconsWrap.style.height = `${rowH}mm`;
          iconsWrap.style.padding = `${padMm}mm`;
          iconsWrap.style.boxSizing = "border-box";
          iconsWrap.style.gap = `${betweenGapMm}mm`;

          icons.forEach((src) => {
            const img = document.createElement("img");
            img.src = src;
            img.alt = "";
            img.draggable = false;
            img.style.width = `${iconSizeMm}mm`;
            img.style.height = `${iconSizeMm}mm`;
            img.style.display = "block";
            img.style.objectFit = "contain";
            iconsWrap.appendChild(img);
          });

          infoRow.appendChild(iconsWrap);
        }

        rowsWrap.appendChild(infoRow);
        return;
      }

      // fallback (placeholder)
      const text = document.createElement("div");
      text.className = "infoRow__text infoRow__text--placeholder";
      text.textContent = lbl ? lbl : "LINKOVÁ INFORMACE";

      infoRow.appendChild(text);
      rowsWrap.appendChild(infoRow);
      return;
    }

    // LINES ROW
    // =========================
    ensureLinesRowShape(row, state.columns);
    const cols = row.columnsOverride === 4 ? 4 : 3;

    const rowEl = document.createElement("div");
    rowEl.className = `row cols-${cols} row--lines`;
    rowEl.style.height = `${rowH}mm`;
    const isLines075 = Math.abs(rowH - 51.75) < 0.02; // 0.75 řádku (stejné jako Název 0.75)

    row.cells.forEach((cell) => {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.style.height = `${rowH}mm`;

      const isLines075 = row.linesHeight === "075"; // přidej si to jednou nad forEach (viz níž)

      if (cell.cancelled) {
        tile.classList.add("tile--cancelled");
        if (isLines075) tile.classList.add("tile--cancelled--075");
      }

      if (cell.mode === "arrow") {
        // šipka vždy černá na bílém
        tile.style.setProperty("--tile-bg", "#ffffff");
        tile.style.setProperty("--tile-fg", "#000000");

        const icon = document.createElement("div");
        icon.className = "tile__icon";
        tile.appendChild(icon);
        injectArrowSvg(icon, cell.arrow);
      } else {
        const lt = cell.lineType || defaultType;
        const style = styles[lt] || styles[defaultType] || null;

        if (style) {
          tile.style.setProperty("--tile-bg", style.bg);
          tile.style.setProperty("--tile-fg", style.fg);
        }

        const basePt = fontSizeForColsAndText(cols, cell.text);
        const sizePt = isLines075 ? Math.round(basePt * 0.8) : basePt; // lehce menší
        tile.style.setProperty("--tile-font-size", `${sizePt}pt`);

        const text = document.createElement("div");
        text.className = "tile__text";
        text.textContent = cell.text || "";
        tile.appendChild(text);
      }

      rowEl.appendChild(tile);
    });

    rowsWrap.appendChild(rowEl);
  });

  signEl.appendChild(rowsWrap);

  computeAndSetSignHeight();
  requestAnimationFrame(updatePreviewScale);
}

function renderAll() {
  if (!state.selectedRowId && state.rows.length > 0) {
    state.selectedRowId = state.rows[0].id;
  }

  columnsRadios.forEach((r) => (r.checked = Number(r.value) === state.columns));

  if (trainzModeCheckbox) trainzModeCheckbox.checked = !!state.trainzMode;

  renderRowsList();
  renderRowEditor();
  renderSign();
  updateTrainzUi();
  updateSignHeightInfo(state.signHeightUnits);
}

// ---- bind UI ----
if (zoomOutBtn) {
  zoomOutBtn.addEventListener("click", () => {
    previewZoom = clamp(previewZoom / 1.1, 0.1, 1);
    requestAnimationFrame(updatePreviewScale);
  });
}

if (zoomInBtn) {
  zoomInBtn.addEventListener("click", () => {
    previewZoom = clamp(previewZoom * 1.1, 0.1, 1);
    requestAnimationFrame(updatePreviewScale);
  });
}

if (zoomResetBtn) {
  zoomResetBtn.addEventListener("click", () => {
    previewZoom = 1;
    requestAnimationFrame(updatePreviewScale);
  });
}

if (exportJpgBtn) {
  exportJpgBtn.addEventListener("click", async () => {
    try {
      if (!window.TabloExport?.exportSignAsJpg) {
        alert("Export JPG není načtený (chybí export.js / html-to-image).");
        return;
      }
      await window.TabloExport.exportSignAsJpg(signFrameEl);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Export JPG selhal.");
    }
  });
}

if (exportPdfBtn) {
  exportPdfBtn.addEventListener("click", async () => {
    try {
      if (!window.TabloExport?.exportSignAsPdf) {
        alert(
          "Export PDF není načtený (chybí export.js / jsPDF / html-to-image)."
        );
        return;
      }
      await window.TabloExport.exportSignAsPdf(signFrameEl);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Export PDF selhal.");
    }
  });
}

if (exportJpgTrsBtn) {
  exportJpgTrsBtn.addEventListener("click", async () => {
    try {
      if (!window.TabloExport?.exportSignAsJpg) {
        alert("Export JPG není načtený (chybí export.js / html-to-image).");
        return;
      }

      const units = Number.isFinite(state.signHeightUnits)
        ? state.signHeightUnits
        : computeSignHeightUnits();

      if (units > TRAINZ_MAX_UNITS) {
        const ok = confirm(
          "Cedule přesahuje maximální doporučenou výšku (7 řádků)"
        );
        if (!ok) return;
      }

      await window.TabloExport.exportSignAsJpg(signFrameEl || signEl, {
        targetWidthPx: TRAINZ_TRS_WIDTH_PX,
      });
    } catch (err) {
      console.error(err);
      alert(err?.message || "Export JPG (Trs) selhal.");
    }
  });
}

addRowBtn.addEventListener("click", addRow);

columnsRadios.forEach((r) => {
  r.addEventListener("change", (e) => {
    setColumns(Number(e.target.value));
  });
});

if (trainzModeCheckbox) {
  trainzModeCheckbox.addEventListener("change", (e) => {
    state.trainzMode = !!e.target.checked;
    updateTrainzUi();
    updateSignHeightInfo(state.signHeightUnits);
  });
}

if (rowTypeSelect) {
  rowTypeSelect.addEventListener("change", (e) => {
    setSelectedRowPreset(e.target.value);
  });
}

// Název: layout (dropdown)
if (nameLayoutSelect) {
  nameLayoutSelect.addEventListener("change", (e) => {
    const selected = state.rows.find((x) => x.id === state.selectedRowId);
    if (!selected || selected.type !== "name") return;

    selected.nameLayout = e.target.value; // one | two15 | two2 | three

    renderRowEditor();
    renderSign();
    renderRowsList();
    requestAnimationFrame(updatePreviewScale);
  });
}

// Název: size
nameSizeRadios.forEach((r) => {
  r.addEventListener("change", (e) => {
    const selected = state.rows.find((x) => x.id === state.selectedRowId);
    if (!selected || selected.type !== "name") return;

    selected.nameSize = Number(e.target.value) === 115 ? 115 : 140;

    renderSign();
    renderRowsList();
    requestAnimationFrame(updatePreviewScale);
  });
});

// Název: Výluka
if (nameOutageCheckbox) {
  nameOutageCheckbox.addEventListener("change", (e) => {
    const selected = state.rows.find((x) => x.id === state.selectedRowId);
    if (!selected || selected.type !== "name") return;

    selected.outage = e.target.checked;

    renderSign();
    renderRowsList();
    requestAnimationFrame(updatePreviewScale);
  });
}

// Název: texty
nameLine1Input.addEventListener("input", (e) => {
  const selected = state.rows.find((x) => x.id === state.selectedRowId);
  if (!selected || selected.type !== "name") return;

  selected.line1 = e.target.value;

  renderSign();
  renderRowsList();
  requestAnimationFrame(updatePreviewScale);
});

nameLine2Input.addEventListener("input", (e) => {
  const selected = state.rows.find((x) => x.id === state.selectedRowId);
  if (!selected || selected.type !== "name") return;

  selected.line2 = e.target.value;

  renderSign();
  renderRowsList();
  requestAnimationFrame(updatePreviewScale);
});

nameLine3Input.addEventListener("input", (e) => {
  const selected = state.rows.find((x) => x.id === state.selectedRowId);
  if (!selected || selected.type !== "name") return;

  selected.line3 = e.target.value;

  renderSign();
  renderRowsList();
  requestAnimationFrame(updatePreviewScale);
});

window.addEventListener("resize", () => {
  requestAnimationFrame(updatePreviewScale);
});

// Linková informace: typ
if (infoTypeSelect) {
  infoTypeSelect.addEventListener("change", (e) => {
    const selected = state.rows.find((x) => x.id === state.selectedRowId);
    if (!selected || selected.type !== "info") return;

    selected.infoType = e.target.value;
    ensureInfoRowShape(selected);

    renderRowEditor(); // <-- DŮLEŽITÉ (zobrazí/skryje pole Text podle needsText)

    renderSign();
    renderRowsList();
    requestAnimationFrame(updatePreviewScale);
  });
}

if (infoIconsAddBtn) {
  infoIconsAddBtn.addEventListener("click", () => {
    const selected = state.rows.find((x) => x.id === state.selectedRowId);
    if (!selected || selected.type !== "info") return;

    const rule = window.INFO_TYPE_RULES?.[selected.infoType];
    if (!rule || !Array.isArray(rule.iconOptions) || !rule.iconOptions.length)
      return;

    if (!Array.isArray(selected.infoIcons)) selected.infoIcons = [];
    if (selected.infoIcons.length >= 3) return;

    // přidáme novou ikonu – defaultně první z nabídky
    selected.infoIcons.push(rule.iconOptions[0].value);

    renderRowEditor();
    renderSign();
    renderRowsList();
    requestAnimationFrame(updatePreviewScale);
  });
}

if (infoIconsList) {
  infoIconsList.addEventListener("change", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLSelectElement)) return;
    if (t.dataset.role !== "icon-select") return;

    const selected = state.rows.find((x) => x.id === state.selectedRowId);
    if (!selected || selected.type !== "info") return;

    const idx = Number(t.dataset.index);
    if (!Array.isArray(selected.infoIcons) || Number.isNaN(idx)) return;

    selected.infoIcons[idx] = t.value || "";

    renderRowEditor();
    renderSign();
    renderRowsList();
    requestAnimationFrame(updatePreviewScale);
  });

  infoIconsList.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const selected = state.rows.find((x) => x.id === state.selectedRowId);
    if (!selected || selected.type !== "info") return;
    if (!Array.isArray(selected.infoIcons)) selected.infoIcons = [];

    const idx = Number(btn.dataset.index);
    const action = btn.dataset.action;
    if (Number.isNaN(idx)) return;

    if (action === "up" && idx > 0) {
      [selected.infoIcons[idx - 1], selected.infoIcons[idx]] = [
        selected.infoIcons[idx],
        selected.infoIcons[idx - 1],
      ];
    } else if (action === "down" && idx < selected.infoIcons.length - 1) {
      [selected.infoIcons[idx + 1], selected.infoIcons[idx]] = [
        selected.infoIcons[idx],
        selected.infoIcons[idx + 1],
      ];
    } else if (action === "remove") {
      selected.infoIcons.splice(idx, 1);
    }

    renderRowEditor();
    renderSign();
    renderRowsList();
    requestAnimationFrame(updatePreviewScale);
  });
}

if (infoTextInput) {
  infoTextInput.addEventListener("input", (e) => {
    const selected = state.rows.find((x) => x.id === state.selectedRowId);
    if (!selected || selected.type !== "info") return;

    selected.infoText = e.target.value || "";

    renderSign();
    renderRowsList();
    requestAnimationFrame(updatePreviewScale);
  });
}

// ---- init ----
renderAll();
requestAnimationFrame(updatePreviewScale);
