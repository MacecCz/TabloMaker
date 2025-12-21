// export.js — nový soubor (ulož vedle main.js)
(function () {
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function defaultFilename(ext) {
    const d = new Date();
    return (
      "cedule_" +
      d.getFullYear() +
      "-" +
      pad2(d.getMonth() + 1) +
      "-" +
      pad2(d.getDate()) +
      "_" +
      pad2(d.getHours()) +
      pad2(d.getMinutes()) +
      pad2(d.getSeconds()) +
      "." +
      ext
    );
  }

  function downloadDataUrl(dataUrl, filename) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function getSignWidthMmFallback400() {
    const root = getComputedStyle(document.documentElement);
    const v = root.getPropertyValue("--sign-width").trim();
    const m = v.match(/^([\d.]+)\s*mm$/i);
    return m ? Number(m[1]) : 400;
  }

  function getMmVarFromRoot(name, fallback) {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    const m = v.match(/^([\d.]+)\s*mm$/i);
    return m ? Number(m[1]) : fallback;
  }

  function isFrameNode(node) {
    return Boolean(
      node &&
        (node.id === "signFrame" ||
          (node.classList && node.classList.contains("signFrame")))
    );
  }

  function exportWidthMmForNode(node) {
    const signWidth = getMmVarFromRoot("--sign-width", 400);
    if (!isFrameNode(node)) return signWidth;

    // bílý okraj je poloviční oproti béžovému (pad-h) => na obou stranách dohromady +1× pad-h
    const padH = getMmVarFromRoot("--pad-h", 0);
    return signWidth + padH;
  }

  function defaultBgForNode(node) {
    return isFrameNode(node) ? "#ffffff" : "#D7D1C9";
  }

  function createOffscreenClone(node) {
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-100000px";
    host.style.top = "0";
    host.style.background = "transparent";
    host.style.padding = "0";
    host.style.margin = "0";
    host.style.transform = "none";
    host.style.zIndex = "-1";

    const clone = node.cloneNode(true);
    host.appendChild(clone);
    document.body.appendChild(host);
    return { host, clone };
  }

  async function ensureDeps(kind) {
    if (!window.htmlToImage) {
      throw new Error(
        "Chybí knihovna html-to-image. Přidej ji do index.html (html-to-image.min.js)."
      );
    }
    if (kind === "pdf") {
      if (!window.jspdf || !window.jspdf.jsPDF) {
        throw new Error(
          "Chybí knihovna jsPDF. Přidej ji do index.html (jspdf.umd.min.js)."
        );
      }
    }
    if (document.fonts?.ready) await document.fonts.ready;
  }

async function exportSignAsJpg(node, opts) {
  opts = opts || {};
  if (!node) throw new Error("Nenalezen prvek cedule pro export.");
  await ensureDeps("jpg");

  const { host, clone } = createOffscreenClone(node);
  try {
    const rect = clone.getBoundingClientRect();

    // pixelRatio určuje výsledné rozlišení; pro Trainz export chceme fixní šířku (např. 752px)
    let pixelRatio = typeof opts.pixelRatio === "number" ? opts.pixelRatio : 3;
    if (
      typeof opts.targetWidthPx === "number" &&
      opts.targetWidthPx > 0 &&
      rect.width
    ) {
      pixelRatio = opts.targetWidthPx / rect.width;
    }

    const isFrame =
      clone.id === "signFrame" || clone.classList?.contains("signFrame");

    const dataUrl = await window.htmlToImage.toJpeg(clone, {
      quality: typeof opts.quality === "number" ? opts.quality : 0.95,
      pixelRatio,
      backgroundColor: opts.backgroundColor || (isFrame ? "#ffffff" : "#D7D1C9"),
      cacheBust: true,
    });

    downloadDataUrl(dataUrl, opts.filename || defaultFilename("jpg"));
  } finally {
    host.remove();
  }
}


  async function exportSignAsPdf(node, opts) {
    opts = opts || {};
    if (!node) throw new Error("Nenalezen prvek cedule pro export.");
    await ensureDeps("pdf");

    const { host, clone } = createOffscreenClone(node);
    try {
      const pngDataUrl = await window.htmlToImage.toPng(clone, {
        pixelRatio: typeof opts.pixelRatio === "number" ? opts.pixelRatio : 3,
        backgroundColor: opts.backgroundColor || defaultBgForNode(node),
        cacheBust: true,
      });

      const rect = clone.getBoundingClientRect();
      const widthMm =
        typeof opts.widthMm === "number"
          ? opts.widthMm
          : exportWidthMmForNode(node);
      const heightMm = rect.width
        ? widthMm * (rect.height / rect.width)
        : widthMm;

      const pdf = new window.jspdf.jsPDF({
        unit: "mm",
        format: [widthMm, heightMm],
        orientation: widthMm >= heightMm ? "landscape" : "portrait",
        compress: true,
      });

      pdf.addImage(
        pngDataUrl,
        "PNG",
        0,
        0,
        widthMm,
        heightMm,
        undefined,
        "FAST"
      );
      pdf.save(opts.filename || defaultFilename("pdf"));
    } finally {
      host.remove();
    }
  }

  window.TabloExport = { exportSignAsJpg, exportSignAsPdf };
})();
