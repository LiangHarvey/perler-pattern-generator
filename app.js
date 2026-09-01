(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const els = {
    imageInput: $("#imageInput"), dropZone: $("#dropZone"), fileInfo: $("#fileInfo"), sourceThumb: $("#sourceThumb"), fileName: $("#fileName"), fileDimensions: $("#fileDimensions"), replaceImage: $("#replaceImage"), qualityInfo: $("#qualityInfo"), precisionSelect: $("#precisionSelect"), bigjpgButton: $("#bigjpgButton"),
    denoise: $("#denoise"), colorCount: $("#colorCount"), colorCountValue: $("#colorCountValue"), paletteStyle: $("#paletteStyle"), extractColors: $("#extractColors"), extractedColors: $("#extractedColors"), extractedResultDetails: $("#extractedResultDetails"), extractedResultSummary: $("#extractedResultSummary"),
    gridWidth: $("#gridWidth"), gridHeight: $("#gridHeight"), dither: $("#dither"), majorityFilter: $("#majorityFilter"), generatePattern: $("#generatePattern"), density: $("#density"), refreshMaterials: $("#refreshMaterials"),
    canvas: $("#patternCanvas"), emptyState: $("#emptyState"), canvasViewport: $("#canvasViewport"), statusText: $("#statusText"), liveDot: $(".live-dot"), canvasMeta: $("#canvasMeta"), zoom: $("#zoom"), zoomValue: $("#zoomValue"),
    showCodes: $("#showCodes"), modeBadge: $("#modeBadge"), legend: $("#legend"), materialsBody: $("#materialsBody"), totalStitches: $("#totalStitches"), copyMaterials: $("#copyMaterials"), downloadPng: $("#downloadPng"), downloadPdf: $("#downloadPdf"), downloadJson: $("#downloadJson"), toast: $("#toast"), generatedResultDetails: $("#generatedResultDetails"), generatedResultSummary: $("#generatedResultSummary"),
    appShell: $(".app-shell"), controlsPanel: $(".controls-panel"), resultsPanel: $(".results-panel"), toggleControls: $("#toggleControls"), toggleResults: $("#toggleResults"), fitPattern: $("#fitPattern"), loadingOverlay: $("#loadingOverlay"), loadingTitle: $("#loadingTitle"), loadingDetail: $("#loadingDetail")
  };

  const DMC = [
    [310, "Black", [31, 32, 27], ["neutral", "sharp"]], [413, "Dark Pewter Gray", [111, 111, 102], ["neutral", "natural"]], [646, "Beaver Gray - DK", [101, 91, 73], ["earth", "natural"]], [898, "Coffee Bean - V DK", [72, 47, 33], ["earth", "warm"]],
    [934, "Avocado Green - BLACK", [50, 51, 36], ["natural", "earth"]], [3345, "Hunter Green - DK", [64, 85, 46], ["natural", "earth"]], [3364, "Pine Green", [142, 155, 109], ["natural", "fresh"]], [3813, "Blue Green - LT", [134, 195, 171], ["fresh", "natural"]],
    [3811, "Turquoise - V LT", [188, 227, 217], ["fresh"]], [3846, "Bright Turquoise", [28, 168, 190], ["fresh", "vivid"]], [806, "Peacock Blue", [54, 145, 158], ["fresh", "vivid"]], [597, "Turquoise", [85, 174, 181], ["fresh"]],
    [741, "Tangerine - MD", [230, 133, 25], ["warm", "vivid"]], [740, "Tangerine", [255, 139, 0], ["warm", "vivid"]], [783, "Golden Yellow - DK", [194, 150, 35], ["warm", "earth"]], [831, "Golden Olive - MED", [124, 95, 32], ["warm", "earth"]],
    [734, "Olive Green - LT", [187, 157, 84], ["warm", "earth"]], [301, "Mahogany - MD", [184, 67, 43], ["warm", "vivid"]], [347, "Salmon", [232, 117, 102], ["warm"]], [3712, "Salmon - MD", [241, 166, 147], ["warm"]],
    [3865, "Winter White", [249, 246, 221], ["neutral", "natural"]], [3866, "Mocha - BR LT", [250, 222, 177], ["warm", "earth"]], [975, "Golden Brown - LT", [221, 173, 92], ["warm", "earth"]], [746, "Off White", [255, 252, 224], ["neutral", "fresh"]],
    [3363, "Pine Green - MD", [111, 130, 76], ["natural", "earth"]], [3347, "Yellow Green - MD", [122, 153, 75], ["natural", "fresh"]], [772, "Yellow Green - V LT", [226, 238, 178], ["fresh", "natural"]], [704, "Chartreuse", [136, 173, 48], ["natural", "vivid"]],
    [3849, "Teal Green - LT", [87, 183, 162], ["fresh"]], [993, "Aquamarine - DK", [74, 142, 126], ["fresh", "natural"]], [3346, "Hunter Green", [55, 100, 62], ["natural"]], [890, "Pistachio Green - LT", [215, 226, 150], ["natural", "fresh"]],
    [762, "Pearl Gray - V LT", [225, 226, 202], ["neutral", "fresh"]], [415, "Pearl Gray", [170, 167, 150], ["neutral"]], [317, "Pewter Gray", [109, 103, 85], ["neutral", "earth"]], [3371, "Black Brown", [45, 35, 24], ["neutral", "earth"]]
  ].map(([id, name, rgb, tags]) => ({ id: String(id), name, rgb, tags }));

  const MARD_COLOR_COUNTS = [24, 48, 72, 96, 120, 144, 216, 264];
  const MARD_PRECISION_PROFILES = [
    { shortSide: 40, colors: 24, level: "低精度" },
    { shortSide: 60, colors: 48, level: "细节增强" },
    { shortSide: 80, colors: 72, level: "中等精度" },
    { shortSide: 100, colors: 96, level: "高清" },
    { shortSide: 120, colors: 120, level: "高精度" },
    { shortSide: 150, colors: 144, level: "超清" },
    { shortSide: 180, colors: 216, level: "极高精度" },
    { shortSide: 240, colors: 264, level: "MARD 高精度全色档" }
  ];

  // The supplied MARD reference card groups its colors into 24-color blocks.
  // Higher tiers are unions of the blocks shown at the bottom of that card.
  // Keep these IDs as the source-of-truth candidates so a selected tier never
  // borrows a color from a different tier.
  const MARD_SUBSET_GROUPS = Object.freeze({
    "1": ["B3", "C3", "D9", "E2", "G1", "A4", "B5", "C5", "D6", "E4", "G5", "A6", "B8", "C8", "D7", "F5", "G7", "A7", "H1", "H2", "H3", "H4", "H5", "H7"],
    "2": ["C2", "C13", "D19", "E8", "A13", "A11", "C10", "C6", "D18", "E3", "A10", "G9", "C11", "C7", "D21", "D13", "F13", "G13", "B12", "D3", "D5", "E7", "F8", "G8"],
    "3": ["A3", "B20", "D16", "D8", "E1", "G2", "B18", "B10", "D11", "D12", "E12", "G3", "B14", "B19", "D2", "D20", "E5", "F10", "B17", "B7", "C16", "D14", "E13", "F7"],
    "4": ["E11", "E14", "F1", "A14", "M6", "M5", "E15", "F14", "F9", "F2", "G14", "M9", "E9", "E6", "F12", "F3", "F11", "M12", "D15", "E10", "F4", "F6", "G17", "H6"],
    "5": ["A15", "A5", "A8", "A12", "A9", "G6", "A1", "B13", "B1", "B2", "B4", "B11", "H2", "C1", "B16", "B6", "C15", "B15", "C14", "D17", "D1", "C4", "C17", "C9"],
    "6": ["H8", "G15", "A2", "H13", "G16", "H9", "H10", "M1", "G11", "G4", "M4", "H14", "M10", "M2", "G12", "M13", "M7", "H11", "M11", "M3", "G10", "M14", "M8", "M15"],
    "7": ["P18", "P16", "P3", "P12", "P1", "T1", "P7", "P17", "P6", "P13", "P9", "P11", "P4", "P5", "P15", "P14", "P2", "R12", "P23", "P22", "P21", "P20", "P19", "P8"],
    "8": ["P10", "R11", "Y2", "Y3", "Q2", "Y4", "Y5", "Y1", "R3", "R4", "R5", "R8", "R9", "R2", "R1", "R10", "R6", "R7", "D10", "R13", "Q5", "B9", "C12", "D4"],
    "9": ["H17", "H18", "H19", "E16", "F16", "F17", "D23", "E24", "E19", "E18", "E17", "E20", "B24", "A16", "A17", "A18", "F24", "F23", "A24", "A22", "A21", "F21", "F22", "A19"],
    "10": ["A26", "A25", "A20", "A23", "G18", "H21", "B26", "B32", "B31", "B30", "B27", "B29", "C22", "C23", "C24", "B28", "C25", "C27", "H15", "H20", "H23", "H22", "C28", "C21"],
    "11": ["F15", "F19", "G20", "E21", "E22", "D26", "F25", "F20", "G19", "F18", "G21", "E23", "D25", "D22", "D24", "C20", "B21", "B25", "H16", "B23", "C18", "B22", "C19", "C26"],
    A: ["B10", "C2", "C3", "C13", "D16", "D17", "B6", "C4", "C10", "C17", "D1", "D11", "C15", "C11", "C5", "C6", "C7", "D2", "B19", "B7", "C8", "C9", "D3", "C16"],
    B: ["E12", "E2", "E8", "D19", "D8", "D9", "E6", "E4", "E3", "E9", "D12", "D6", "E5", "E10", "D5", "D13", "D20", "D18", "E7", "E13", "D21", "D14", "D7", "D15"],
    C: ["C14", "B20", "C1", "B18", "M5", "M6", "B3", "B16", "B13", "B1", "G13", "F10", "B5", "B4", "B2", "B14", "G7", "F11", "B15", "B12", "B8", "B17", "B11", "G8"],
    D: ["A15", "A3", "A11", "A9", "F14", "F12", "A4", "A13", "A6", "F1", "F2", "F3", "A5", "A10", "A7", "F13", "F9", "F6", "A8", "A14", "F4", "F5", "F8", "F7"],
    E: ["E15", "E1", "E14", "E11", "H2", "H1", "A12", "G3", "G2", "G1", "A1", "H12", "G6", "G5", "G9", "M9", "H3", "H4", "G14", "M12", "G17", "H5", "H6", "H7"]
  });
  const MARD_SUBSET_TIERS = Object.freeze({
    24: ["1"],
    48: ["1", "2"],
    72: ["1", "2", "3"],
    96: ["1", "2", "3", "4"],
    120: ["A", "B", "C", "D", "E"],
    144: ["A", "B", "C", "D", "E", "6"],
    216: ["A", "B", "C", "D", "E", "6", "9", "10", "11"],
    264: ["A", "B", "C", "D", "E", "6", "7", "8", "9", "10", "11"]
  });

  const SYMBOLS = ["●", "▲", "■", "◆", "✚", "✦", "○", "△", "□", "◇", "★", "※"];
  let sourceImage = null;
  let sourceFile = null;
  let sourceBounds = null;
  let state = { clusters: [], selectedColors: [], pattern: [], width: 0, height: 0, mode: "mard", paletteStyle: "all", requestedColorCount: 24, stats: [], autoFit: false };
  let toastTimer;
  let busy = false;

  // RGB -> LAB gives a perceptual distance that is more useful for color matching than raw RGB.
  function rgbToLab(rgb) {
    let [r, g, b] = rgb.map((v) => v / 255);
    [r, g, b] = [r, g, b].map((v) => v > .04045 ? Math.pow((v + .055) / 1.055, 2.4) : v / 12.92);
    const x = (r * .4124 + g * .3576 + b * .1805) / .95047;
    const y = (r * .2126 + g * .7152 + b * .0722);
    const z = (r * .0193 + g * .1192 + b * .9505) / 1.08883;
    const f = (v) => v > .008856 ? Math.cbrt(v) : (7.787 * v) + 16 / 116;
    const [fx, fy, fz] = [f(x), f(y), f(z)];
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }

  function colorDistance(a, b) {
    const aa = a && a.lab ? a.lab : rgbToLab(a && a.rgb ? a.rgb : a);
    const bb = b && b.lab ? b.lab : rgbToLab(b && b.rgb ? b.rgb : b);
    return Math.hypot(aa[0] - bb[0], aa[1] - bb[1], aa[2] - bb[2]);
  }

  // CIEDE2000 is substantially better than raw RGB/CIE76 at distinguishing
  // visually similar MARD beads, especially neutrals, blue-purple and red-pink.
  function deltaE2000(lab1, lab2) {
    const [l1, a1, b1] = lab1;
    const [l2, a2, b2] = lab2;
    const c1 = Math.hypot(a1, b1);
    const c2 = Math.hypot(a2, b2);
    const cMean = (c1 + c2) / 2;
    const cMean7 = cMean ** 7;
    const g = .5 * (1 - Math.sqrt(cMean7 / (cMean7 + 25 ** 7)));
    const a1Prime = (1 + g) * a1;
    const a2Prime = (1 + g) * a2;
    const c1Prime = Math.hypot(a1Prime, b1);
    const c2Prime = Math.hypot(a2Prime, b2);
    const hue = (a, b) => {
      const degrees = Math.atan2(b, a) * 180 / Math.PI;
      return degrees >= 0 ? degrees : degrees + 360;
    };
    const h1Prime = c1Prime < 1e-8 ? 0 : hue(a1Prime, b1);
    const h2Prime = c2Prime < 1e-8 ? 0 : hue(a2Prime, b2);
    const deltaLPrime = l2 - l1;
    const deltaCPrime = c2Prime - c1Prime;
    let deltaHuePrime = h2Prime - h1Prime;
    if (c1Prime * c2Prime < 1e-8) deltaHuePrime = 0;
    else if (deltaHuePrime > 180) deltaHuePrime -= 360;
    else if (deltaHuePrime < -180) deltaHuePrime += 360;
    const deltaHPrime = 2 * Math.sqrt(c1Prime * c2Prime) * Math.sin(deltaHuePrime * Math.PI / 360);
    const lMeanPrime = (l1 + l2) / 2;
    const cMeanPrime = (c1Prime + c2Prime) / 2;
    let hMeanPrime;
    if (c1Prime * c2Prime < 1e-8) hMeanPrime = h1Prime + h2Prime;
    else if (Math.abs(h1Prime - h2Prime) <= 180) hMeanPrime = (h1Prime + h2Prime) / 2;
    else if (h1Prime + h2Prime < 360) hMeanPrime = (h1Prime + h2Prime + 360) / 2;
    else hMeanPrime = (h1Prime + h2Prime - 360) / 2;
    const t = 1
      - .17 * Math.cos((hMeanPrime - 30) * Math.PI / 180)
      + .24 * Math.cos(2 * hMeanPrime * Math.PI / 180)
      + .32 * Math.cos((3 * hMeanPrime + 6) * Math.PI / 180)
      - .2 * Math.cos((4 * hMeanPrime - 63) * Math.PI / 180);
    const deltaTheta = 30 * Math.exp(-(((hMeanPrime - 275) / 25) ** 2));
    const cMeanPrime7 = cMeanPrime ** 7;
    const rC = 2 * Math.sqrt(cMeanPrime7 / (cMeanPrime7 + 25 ** 7));
    const lDelta = lMeanPrime - 50;
    const sL = 1 + .015 * lDelta ** 2 / Math.sqrt(20 + lDelta ** 2);
    const sC = 1 + .045 * cMeanPrime;
    const sH = 1 + .015 * cMeanPrime * t;
    const rT = -Math.sin(2 * deltaTheta * Math.PI / 180) * rC;
    const lTerm = deltaLPrime / sL;
    const cTerm = deltaCPrime / sC;
    const hTerm = deltaHPrime / sH;
    return Math.sqrt(Math.max(0, lTerm ** 2 + cTerm ** 2 + hTerm ** 2 + rT * cTerm * hTerm));
  }

  function mardPerceptualDistance(sourceLab, targetLab) {
    const sourceChroma = Math.hypot(sourceLab[1], sourceLab[2]);
    const targetChroma = Math.hypot(targetLab[1], targetLab[2]);
    const neutralMismatch = Math.min(sourceChroma, targetChroma) < 7 && Math.max(sourceChroma, targetChroma) > 14
      ? (Math.max(sourceChroma, targetChroma) - 14) * .18
      : 0;
    return deltaE2000(sourceLab, targetLab) + neutralMismatch;
  }

  function nearestMardMatch(rgb, colors) {
    const pixelLab = rgbToLab(rgb);
    const shortlist = [];
    const shortlistSize = Math.min(8, colors.length);
    for (let index = 0; index < colors.length; index++) {
      const color = colors[index];
      const lab = color.lab || rgbToLab(color.rgb || color);
      const dL = pixelLab[0] - lab[0];
      const dA = pixelLab[1] - lab[1];
      const dB = pixelLab[2] - lab[2];
      const quickDistance = dL * dL * 1.15 + dA * dA + dB * dB;
      const candidate = { index, color, lab, quickDistance };
      if (shortlist.length < shortlistSize) {
        shortlist.push(candidate);
        shortlist.sort((a, b) => a.quickDistance - b.quickDistance);
      } else if (quickDistance < shortlist[shortlist.length - 1].quickDistance) {
        shortlist[shortlist.length - 1] = candidate;
        for (let position = shortlist.length - 1; position > 0 && shortlist[position].quickDistance < shortlist[position - 1].quickDistance; position--) {
          const swap = shortlist[position - 1]; shortlist[position - 1] = shortlist[position]; shortlist[position] = swap;
        }
      }
    }
    let best = shortlist[0] || { index: 0, color: colors[0], lab: colors[0] ? colors[0].lab || rgbToLab(colors[0].rgb || colors[0]) : pixelLab };
    let bestDistance = Infinity;
    for (const candidate of shortlist) {
      const distance = mardPerceptualDistance(pixelLab, candidate.lab);
      if (distance < bestDistance) { bestDistance = distance; best = candidate; }
    }
    return { color: best.color, index: best.index, distance: bestDistance };
  }
  function clamp(v, min = 0, max = 255) { return Math.max(min, Math.min(max, v)); }
  function rgbCss(rgb) { return `rgb(${rgb.map((v) => Math.round(v)).join(",")})`; }
  function hex(rgb) { return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase(); }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character])); }
  function contrastText(rgb) { return (.299 * rgb[0] + .587 * rgb[1] + .114 * rgb[2]) > 158 ? "#273025" : "#fffdf7"; }
  function contrastRgb(rgb) { return contrastText(rgb) === "#273025" ? [39, 48, 37] : [255, 253, 247]; }
  function getMode() {
    const input = $("input[name='colorMode']:checked");
    const value = input ? input.value : "mard";
    return value === "dmc" ? "mard" : value;
  }
  function getEdgeMode() { return $("input[name='edgeMode']:checked").value; }
  function getPaletteStyle() { return els.paletteStyle ? els.paletteStyle.value : "all"; }
  function showToast(message) {
    if (!els.toast) return;
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("show");
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2600);
  }
  function setStatus(message, ready = false) { if (els.statusText) els.statusText.textContent = message; if (els.liveDot) els.liveDot.classList.toggle("ready", ready); }
  function setDisabled(element, disabled) { if (element) element.disabled = disabled; }
  function syncColorCountLabel() { if (els.colorCountValue && els.colorCount) els.colorCountValue.textContent = els.colorCount.value; }
  function validDimension(input, fallback) { const n = Number(input.value); return Number.isFinite(n) ? Math.max(8, Math.min(240, Math.round(n))) : fallback; }

  function setLoading(visible, title = "正在处理", detail = "请稍候，处理完成前页面不会响应其他操作。") {
    busy = visible;
    if (els.loadingOverlay) {
      els.loadingOverlay.classList.toggle("hidden", !visible);
      els.loadingOverlay.hidden = !visible;
      els.loadingOverlay.style.display = visible ? "grid" : "none";
      els.loadingOverlay.style.pointerEvents = visible ? "auto" : "none";
      els.loadingOverlay.setAttribute("aria-busy", String(visible));
      els.loadingOverlay.setAttribute("aria-hidden", String(!visible));
    }
    if (els.loadingTitle) els.loadingTitle.textContent = title;
    if (els.loadingDetail) els.loadingDetail.textContent = detail;
    if (document.body) document.body.classList.toggle("is-busy", visible);
  }

  // A single requestAnimationFrame runs before the browser paints. Use two
  // frames so the blocking overlay is visible before image analysis begins.
  function afterPaint(callback) {
    const schedule = typeof requestAnimationFrame === "function" ? requestAnimationFrame : (fn) => setTimeout(fn, 32);
    schedule(() => schedule(callback));
  }

  // The printed MARD chart uses A3/C13/H1 rather than zero-padded A03/C13/H01.
  // Keep the internal palette data flexible, but show and export the chart's
  // canonical code format.
  function canonicalMardId(value) { return String(value).trim().replace(/^([A-Za-z]+)0+(\d+)$/, "$1$2"); }
  function clonePaletteColor(color) {
    const id = canonicalMardId(color.id);
    const rgb = [...color.rgb];
    return { ...color, id, name: /^MARD\s+/i.test(String(color.name || "")) ? `MARD ${id}` : (color.name || `MARD ${id}`), rgb, hex: hex(rgb), lab: rgbToLab(rgb) };
  }

  function sourceContentBounds() {
    if (!sourceImage) return { x: 0, y: 0, width: 1, height: 1 };
    return sourceBounds || { x: 0, y: 0, width: sourceImage.naturalWidth, height: sourceImage.naturalHeight };
  }

  function detectContentBounds(image) {
    const full = { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };
    try {
      const sampleWidth = Math.min(220, image.naturalWidth);
      const sampleHeight = Math.max(1, Math.round(image.naturalHeight * sampleWidth / image.naturalWidth));
      const sampleCanvas = document.createElement("canvas");
      sampleCanvas.width = sampleWidth; sampleCanvas.height = sampleHeight;
      const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
      if (!context) return full;
      context.drawImage(image, 0, 0, sampleWidth, sampleHeight);
      const data = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
      const lineStats = (line, horizontal) => {
        const count = horizontal ? sampleWidth : sampleHeight;
        let r = 0, g = 0, b = 0;
        for (let index = 0; index < count; index++) {
          const x = horizontal ? index : line;
          const y = horizontal ? line : index;
          const offset = (y * sampleWidth + x) * 4;
          r += data[offset]; g += data[offset + 1]; b += data[offset + 2];
        }
        const mean = [r / count, g / count, b / count];
        let variance = 0;
        for (let index = 0; index < count; index++) {
          const x = horizontal ? index : line;
          const y = horizontal ? line : index;
          const offset = (y * sampleWidth + x) * 4;
          const luminance = data[offset] * .299 + data[offset + 1] * .587 + data[offset + 2] * .114;
          const meanLuminance = mean[0] * .299 + mean[1] * .587 + mean[2] * .114;
          variance += (luminance - meanLuminance) ** 2;
        }
        return { mean, luminance: mean[0] * .299 + mean[1] * .587 + mean[2] * .114, variance: variance / count };
      };
      const topReference = lineStats(0, true);
      const bottomReference = lineStats(sampleHeight - 1, true);
      const colorDistanceRgb = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      const isNeutralBar = (stats, reference) => {
        const neutral = stats.luminance <= 24 || stats.luminance >= 238;
        return neutral && stats.variance < 120 && colorDistanceRgb(stats.mean, reference.mean) < 35;
      };
      let top = 0;
      while (top < sampleHeight && isNeutralBar(lineStats(top, true), topReference)) top++;
      let bottom = sampleHeight - 1;
      while (bottom >= 0 && isNeutralBar(lineStats(bottom, true), bottomReference)) bottom--;
      const hasTopBar = top > sampleHeight * .02;
      const hasBottomBar = sampleHeight - 1 - bottom > sampleHeight * .02;
      const sameBarColor = colorDistanceRgb(topReference.mean, bottomReference.mean) < 35;
      if (hasTopBar && hasBottomBar && sameBarColor && bottom > top) {
        return { x: 0, y: Math.round(top / sampleHeight * image.naturalHeight), width: image.naturalWidth, height: Math.round((bottom - top + 1) / sampleHeight * image.naturalHeight) };
      }
    } catch (error) {
      // A browser may reject pixel reads for unusual local image formats; use the full image then.
    }
    return full;
  }

  function activeMardPalette() {
    const palette = window.MARD_PALETTE_280 || DMC;
    return palette.length ? palette.map(clonePaletteColor) : DMC;
  }

  function paletteForStyle() { return activeMardPalette(); }

  function canonicalMardId(id) {
    return String(id).toUpperCase().replace(/^([A-Z]+)(\d+)$/, (_, series, number) => `${series}${number.padStart(2, "0")}`);
  }

  function paletteForColorCount(colorCount) {
    // Tier definitions come from the official MARD card and include Q05 in the
    // 264-color tier. Build tiers from the complete 291-color reference rather
    // than the general 280-color view, which intentionally excludes Q03-Q05.
    const basePalette = (window.MARD_PALETTE_291 || window.MARD_PALETTE_280 || DMC).map(clonePaletteColor);
    const groupNames = MARD_SUBSET_TIERS[Number(colorCount)];
    if (!groupNames) return activeMardPalette();
    const subsetIds = new Set(groupNames.flatMap((groupName) => MARD_SUBSET_GROUPS[groupName] || []).map(canonicalMardId));
    const subset = basePalette.filter((color) => subsetIds.has(canonicalMardId(color.id)));
    if (subset.length !== Number(colorCount)) {
      console.warn(`MARD ${colorCount} 色档配置异常：实际加载 ${subset.length} 色。`);
    }
    return subset.length ? subset : activeMardPalette();
  }

  function gridForShortSide(shortSide) {
    const bounds = sourceContentBounds();
    const sourceWidth = bounds.width;
    const sourceHeight = bounds.height;
    let width = sourceWidth >= sourceHeight ? Math.round(shortSide * sourceWidth / sourceHeight) : shortSide;
    let height = sourceWidth >= sourceHeight ? shortSide : Math.round(shortSide * sourceHeight / sourceWidth);
    const fit = Math.min(240 / width, 240 / height, 1);
    width = Math.max(8, Math.round(width * fit));
    height = Math.max(8, Math.round(height * fit));
    return { width, height };
  }

  function updateQualityInfo() {
    if (!sourceImage || !els.qualityInfo) return;
    const sourceWidth = sourceImage.naturalWidth;
    const sourceHeight = sourceImage.naturalHeight;
    const bounds = sourceContentBounds();
    const width = validDimension(els.gridWidth, 120);
    const height = validDimension(els.gridHeight, 140);
    const colorCount = els.colorCount ? Number(els.colorCount.value) || 24 : 24;
    const pixelsPerBead = Math.min(bounds.width / width, bounds.height / height);
    const sourceShortSide = Math.min(bounds.width, bounds.height);
    const isLowResolution = sourceShortSide < 128 || pixelsPerBead < 2;
    const resolutionText = pixelsPerBead >= 1 ? `${pixelsPerBead.toFixed(1)} px/格` : "低于 1 px/格";
    const cropText = bounds.height < sourceHeight * .98 ? ` · 有效画面 ${Math.round(bounds.width)} × ${Math.round(bounds.height)}px` : "";
    els.qualityInfo.innerHTML = `<strong>原图 ${sourceWidth} × ${sourceHeight}px</strong>${cropText}<br>当前 ${width} × ${height} 格 · MARD ${colorCount} 色 · ${resolutionText}<br>${isLowResolution ? "原图细节不足，建议先用 Bigjpg 放大后再生成。" : "网格精度与 MARD 色数已联动推荐；越往下精度越高、格子和材料种类越多。"}`;
    els.qualityInfo.classList.remove("hidden");
    els.qualityInfo.classList.toggle("warning", isLowResolution);
  }

  function populatePrecisionOptions() {
    if (!sourceImage || !els.precisionSelect) return;
    const bounds = sourceContentBounds();
    const sourceShortSide = Math.min(bounds.width, bounds.height);
    // Two source pixels per bead is a practical upper bound for a stable automatic choice.
    const recommendedMax = Math.max(8, Math.min(240, Math.floor(sourceShortSide / 2)));
    const profiles = MARD_PRECISION_PROFILES.filter((profile) => profile.shortSide <= recommendedMax);
    if (!profiles.length || profiles[profiles.length - 1].shortSide !== recommendedMax) {
      const nearestProfile = MARD_PRECISION_PROFILES.reduce((best, profile) => Math.abs(profile.shortSide - recommendedMax) < Math.abs(best.shortSide - recommendedMax) ? profile : best, MARD_PRECISION_PROFILES[0]);
      profiles.push({ shortSide: recommendedMax, colors: nearestProfile.colors, level: "按原图上限" });
    }
    const options = [];
    const seen = new Set();
    profiles.forEach((profile, index) => {
      const grid = gridForShortSide(profile.shortSide);
      const key = `${grid.width}x${grid.height}`;
      if (seen.has(key)) return;
      seen.add(key);
      const level = index === 0 ? "低精度" : profile.level;
      options.push({ ...grid, shortSide: profile.shortSide, colors: profile.colors, label: `${level} · ${grid.width} × ${grid.height} 格 · MARD ${profile.colors} 色（约 ${(grid.width * grid.height).toLocaleString()} 颗）` });
    });

    els.precisionSelect.innerHTML = options.map((option) => `<option value="${option.width}x${option.height}" data-width="${option.width}" data-height="${option.height}" data-colors="${option.colors}">${option.label}</option>`).join("") + '<option value="custom">自定义网格 / MARD 色数（手动输入）</option>';
    // Prefer a 150-bead short side and its corresponding 144-color MARD tier
    // when the source contains enough pixels. It is a useful photo-pattern
    // compromise and matches the scale of the reference pattern.
    const preferredShortSide = Math.min(150, recommendedMax);
    const defaultOption = options.reduce((best, option) => !best || Math.abs(option.shortSide - preferredShortSide) < Math.abs(best.shortSide - preferredShortSide) ? option : best, null);
    if (defaultOption) {
      els.precisionSelect.value = `${defaultOption.width}x${defaultOption.height}`;
      els.gridWidth.value = defaultOption.width;
      els.gridHeight.value = defaultOption.height;
      if (els.colorCount) els.colorCount.value = String(defaultOption.colors);
      syncColorCountLabel();
    }
    els.precisionSelect.disabled = false;
    updateQualityInfo();
  }

  function applyPrecisionSelection() {
    if (!els.precisionSelect) return;
    const option = els.precisionSelect.selectedOptions[0];
    if (!option || !option.dataset.width) return;
    els.gridWidth.value = option.dataset.width;
    els.gridHeight.value = option.dataset.height;
    if (els.colorCount && option.dataset.colors) els.colorCount.value = option.dataset.colors;
    syncColorCountLabel();
    markPatternStale("精度已改变，请重新生成图解");
    updateQualityInfo();
  }

  function markPatternStale(message = "参数已改变，请重新生成图解") {
    if (!state.pattern.length) return;
    setDisabled(els.downloadPng, true);
    setDisabled(els.downloadPdf, true);
    setDisabled(els.downloadJson, true);
    setDisabled(els.copyMaterials, true);
    setStatus(message);
  }

  function markCustomPrecision() {
    if (els.precisionSelect && !els.precisionSelect.disabled) els.precisionSelect.value = "custom";
    markPatternStale("网格尺寸已改变，请重新生成图解");
    updateQualityInfo();
  }

  function setSidebarsHidden(hideControls, hideResults, refit = true) {
    if (!els.appShell) return;
    els.appShell.classList.toggle("hide-controls", hideControls);
    els.appShell.classList.toggle("hide-results", hideResults);
    if (els.toggleControls) {
      els.toggleControls.textContent = hideControls ? "显示设置" : "隐藏设置";
      els.toggleControls.setAttribute("aria-expanded", String(!hideControls));
    }
    if (els.toggleResults) {
      els.toggleResults.textContent = hideResults ? "显示结果" : "隐藏结果";
      els.toggleResults.setAttribute("aria-expanded", String(!hideResults));
    }
    if (refit && state.pattern.length) scheduleFitPattern();
  }

  function applyZoom() {
    if (!els.zoom || !els.canvas) return;
    const percent = Number(els.zoom.value) || 90;
    const scale = percent / 100;
    if (els.zoomValue) {
      els.zoomValue.value = `${percent}%`;
      els.zoomValue.textContent = `${percent}%`;
    }
    // Resize the canvas in layout space instead of using transform: scale().
    // Transforms do not enlarge the scrollable area, which made a zoomed chart
    // appear to get stuck at one edge on some touch browsers.
    if (els.canvas.width && els.canvas.height) {
      els.canvas.style.transform = "none";
      els.canvas.style.transformOrigin = "initial";
      els.canvas.style.width = `${Math.max(1, Math.round(els.canvas.width * scale))}px`;
      els.canvas.style.height = `${Math.max(1, Math.round(els.canvas.height * scale))}px`;
      els.canvas.style.margin = "0 auto";
    }
  }

  function fitPatternToViewport() {
    if (!state.pattern.length || !els.canvasViewport || !els.canvas || !els.zoom) return;
    const availableWidth = els.canvasViewport.clientWidth - 42;
    const availableHeight = els.canvasViewport.clientHeight - 42;
    if (availableWidth <= 0 || availableHeight <= 0 || !els.canvas.width || !els.canvas.height) return;
    const scale = Math.min(1, availableWidth / els.canvas.width, availableHeight / els.canvas.height);
    const percent = Math.round(Math.max(10, Math.min(150, scale * 100)));
    state.autoFit = true;
    els.zoom.value = String(percent);
    applyZoom();
  }

  function scheduleFitPattern() {
    if (!state.pattern.length) return;
    requestAnimationFrame(() => requestAnimationFrame(fitPatternToViewport));
  }

  function loadImage(file) {
    if (busy) return;
    const isImage = file && ((file.type && file.type.startsWith("image/")) || /\.(png|jpe?g|webp|gif)$/i.test(file.name || ""));
    if (!isImage) { showToast("请选择 JPG、PNG 或 WEBP 图片"); return; }
    sourceFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        sourceImage = image;
        sourceBounds = detectContentBounds(image);
        state = { ...state, clusters: [], selectedColors: [], pattern: [], stats: [], width: 0, height: 0, requestedColorCount: Number(els.colorCount.value) || 24, autoFit: false };
        els.sourceThumb.src = image.src;
        els.fileName.textContent = file.name;
        els.fileDimensions.textContent = `${image.naturalWidth} × ${image.naturalHeight}px`;
        els.fileInfo.classList.remove("hidden");
        els.extractColors.disabled = false;
        els.generatePattern.disabled = false;
        els.refreshMaterials.disabled = false;
        setDisabled(els.bigjpgButton, false);
        setDisabled(els.downloadPng, true);
        setDisabled(els.downloadPdf, true);
        setDisabled(els.downloadJson, true);
        setDisabled(els.copyMaterials, true);
        if (els.canvas) els.canvas.classList.add("hidden");
        if (els.emptyState) els.emptyState.classList.remove("hidden");
        if (els.canvasMeta) els.canvasMeta.textContent = "—";
        if (els.extractedColors) els.extractedColors.innerHTML = "";
        if (els.extractedResultDetails) els.extractedResultDetails.open = true;
        if (els.extractedResultSummary) els.extractedResultSummary.textContent = "上传图片后生成";
        if (els.legend) els.legend.innerHTML = '<div class="empty-result">生成图解后显示颜色图例</div>';
        if (els.materialsBody) els.materialsBody.innerHTML = '<tr><td colspan="4" class="empty-result">暂无数据</td></tr>';
        if (els.totalStitches) els.totalStitches.textContent = "—";
        if (els.generatedResultDetails) els.generatedResultDetails.open = true;
        if (els.generatedResultSummary) els.generatedResultSummary.textContent = "生成图解后显示";
        setSidebarsHidden(false, false, false);
        populatePrecisionOptions();
        setStatus("图片已载入，等待生成", true);
        showToast("图片已载入，可以开始提取主色");
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function drawSourceToGrid(width, height) {
    const offscreen = document.createElement("canvas");
    offscreen.width = width; offscreen.height = height;
    const context = offscreen.getContext("2d", { willReadFrequently: true });
    const bounds = sourceContentBounds();
    const sourceRatio = bounds.width / bounds.height;
    const targetRatio = width / height;
    let sx = bounds.x, sy = bounds.y, sw = bounds.width, sh = bounds.height;
    if (sourceRatio > targetRatio) { sw = bounds.height * targetRatio; sx = bounds.x + (bounds.width - sw) / 2; }
    else { sh = bounds.width / targetRatio; sy = bounds.y + (bounds.height - sh) / 2; }
    context.imageSmoothingEnabled = true;
    context.drawImage(sourceImage, sx, sy, sw, sh, 0, 0, width, height);
    return context.getImageData(0, 0, width, height).data;
  }

  function denoiseRadius(width, height) {
    if (!els.denoise || !els.denoise.checked) return 0;
    const bounds = sourceContentBounds();
    // The canvas downsample already performs area averaging. Only blur when a grid
    // cell contains fewer than two source pixels; otherwise fine facial details blur.
    return Math.min(bounds.width / width, bounds.height / height) < 2 ? 1 : 0;
  }

  function averageGridColor(data, width, height, x, y, radius = 0) {
    let r = 0, g = 0, b = 0, count = 0;
    for (let yy = Math.max(0, y - radius); yy <= Math.min(height - 1, y + radius); yy++) {
      for (let xx = Math.max(0, x - radius); xx <= Math.min(width - 1, x + radius); xx++) {
        const index = (yy * width + xx) * 4; r += data[index]; g += data[index + 1]; b += data[index + 2]; count++;
      }
    }
    return [r / count, g / count, b / count];
  }

  function kmeans(pixels, k) {
    const centers = [];
    // Farthest-point initialization is deterministic and keeps contrasting colors.
    centers.push(pixels[Math.floor(pixels.length / 2)] || [128, 128, 128]);
    while (centers.length < k) {
      let best = pixels[0], bestDistance = -1;
      for (const pixel of pixels) {
        const distance = Math.min(...centers.map((center) => colorDistance(pixel, center)));
        if (distance > bestDistance) { bestDistance = distance; best = pixel; }
      }
      centers.push(best);
    }
    let assignments = new Array(pixels.length).fill(0);
    for (let round = 0; round < 8; round++) {
      const sums = centers.map(() => [0, 0, 0, 0]);
      pixels.forEach((pixel, index) => {
        let nearest = 0, nearestDistance = Infinity;
        centers.forEach((center, centerIndex) => { const distance = colorDistance(pixel, center); if (distance < nearestDistance) { nearestDistance = distance; nearest = centerIndex; } });
        assignments[index] = nearest;
        sums[nearest][0] += pixel[0]; sums[nearest][1] += pixel[1]; sums[nearest][2] += pixel[2]; sums[nearest][3]++;
      });
      sums.forEach((sum, index) => { if (sum[3]) centers[index] = [sum[0] / sum[3], sum[1] / sum[3], sum[2] / sum[3]]; });
    }
    const counts = centers.map(() => 0); assignments.forEach((a) => counts[a]++);
    return centers.map((rgb, index) => ({ rgb, count: counts[index] })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, k);
  }

  function nearestColor(rgb, colors, useMardMatching = false) {
    if (!colors.length) throw new Error("当前 MARD 档位没有可用颜色");
    if (useMardMatching) return nearestMardMatch(rgb, colors).color;
    let nearest = colors[0], distance = Infinity;
    const pixelLab = rgbToLab(rgb);
    for (const color of colors) {
      const colorLab = color.lab || rgbToLab(color.rgb || color);
      const d = Math.hypot(pixelLab[0] - colorLab[0], pixelLab[1] - colorLab[1], pixelLab[2] - colorLab[2]);
      if (d < distance) { distance = d; nearest = color; }
    }
    return nearest;
  }

  function buildSelectedColors(clusters, mode, style, desiredCount, pixels = [], rankedPalette = null, candidatePalette = null) {
    if (mode === "original") return clusters.slice(0, desiredCount).map((cluster, index) => ({ id: `C${String(index + 1).padStart(2, "0")}`, name: `真实色${index + 1}`, rgb: cluster.rgb, lab: rgbToLab(cluster.rgb), original: true }));
    const palette = candidatePalette || paletteForStyle(style);
    // Rank the complete MARD palette against the actual grid pixels first. This
    // preserves frequent highlight/shadow colors better than choosing a single
    // palette color from each k-means center, which can make a photo look flat.
    if (pixels.length) {
      const ranked = rankedPalette || paletteFrequencyOrder(pixels, palette);
      const chosen = ranked.filter((item) => item.count > 0).slice(0, desiredCount).map((item) => item.color);
      if (chosen.length >= Math.min(desiredCount, palette.length)) return chosen;
      ranked.forEach(({ color }) => { if (chosen.length < desiredCount && !chosen.some((selected) => selected.id === color.id)) chosen.push(color); });
      if (chosen.length) return chosen;
    }
    const chosen = [];
    for (const cluster of clusters) {
      const sorted = [...palette].sort((a, b) => colorDistance(cluster.rgb, a.rgb) - colorDistance(cluster.rgb, b.rgb));
      const next = sorted.find((color) => !chosen.some((selected) => selected.id === color.id));
      if (next) chosen.push(next);
      if (chosen.length >= desiredCount) break;
    }
    return chosen.length ? chosen : palette.slice(0, desiredCount);
  }

  function mapPixelsToPattern(pixels, width, height, selectedColors, mode, useDither) {
    const pattern = new Array(width * height);
    const working = pixels.map((pixel) => [...pixel]);
    const colorObjects = selectedColors;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const rgb = working[index].map((v) => clamp(v));
        const color = nearestColor(rgb, colorObjects, mode === "mard");
        pattern[index] = color;
        if (useDither) {
          const error = rgb.map((v, i) => v - color.rgb[i]);
          const spread = [[1, 0, 7 / 16], [-1, 1, 3 / 16], [0, 1, 5 / 16], [1, 1, 1 / 16]];
          spread.forEach(([dx, dy, factor]) => { const nx = x + dx, ny = y + dy; if (nx >= 0 && nx < width && ny >= 0 && ny < height) { const ni = ny * width + nx; working[ni] = working[ni].map((v, i) => clamp(v + error[i] * factor)); } });
        }
      }
    }
    return pattern;
  }

  function majorityPass(pattern, width, height, edgeMode) {
    const result = pattern.slice();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && nx < width && ny >= 0 && ny < height) neighbors.push(pattern[ny * width + nx]); }
        const counts = new Map(); neighbors.forEach((color) => counts.set(color.id, (counts.get(color.id) || 0) + 1));
        const winner = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
        const currentNeighbors = counts.get(pattern[index].id) || 0;
        const threshold = edgeMode === "smooth" ? 3 : 5;
        if (winner && winner[1] >= threshold && winner[0] !== pattern[index].id && currentNeighbors <= 1) result[index] = neighbors.find((color) => color.id === winner[0]);
      }
    }
    return result;
  }

  function paletteFrequencyOrder(pixels, palette) {
    const counts = new Array(palette.length).fill(0);
    const totalDistance = new Array(palette.length).fill(0);
    const stride = Math.max(1, Math.ceil(pixels.length / 30000));
    for (let index = 0; index < pixels.length; index += stride) {
      const pixel = pixels[index];
      const match = nearestMardMatch(pixel, palette);
      counts[match.index]++;
      totalDistance[match.index] += match.distance;
    }
    return palette
      .map((color, index) => ({ color, count: counts[index], meanDistance: counts[index] ? totalDistance[index] / counts[index] : Infinity }))
      .sort((a, b) => b.count - a.count || a.meanDistance - b.meanDistance);
  }

  function histogramClusters(pixels, desiredCount) {
    const bucketSize = desiredCount > 96 ? 6 : 10;
    const buckets = new Map();
    pixels.forEach((pixel) => {
      const key = pixel.map((component) => Math.floor(component / bucketSize)).join(",");
      const bucket = buckets.get(key) || { sum: [0, 0, 0], count: 0 };
      bucket.sum = bucket.sum.map((value, channel) => value + pixel[channel]);
      bucket.count++;
      buckets.set(key, bucket);
    });
    return [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, desiredCount).map((bucket) => ({ rgb: bucket.sum.map((value) => value / bucket.count), count: bucket.count }));
  }

  function analyzePixels(pixels, desiredCount) {
    const mode = getMode();
    const style = getPaletteStyle();
    const sampledPixels = pixels.filter((_, index) => index % Math.max(1, Math.floor(pixels.length / 6000)) === 0);
    let rankedPalette = null;
    const candidatePalette = mode === "mard" ? paletteForColorCount(desiredCount) : null;
    let clusters;
    if (mode === "mard") {
      rankedPalette = paletteFrequencyOrder(pixels, candidatePalette);
      clusters = rankedPalette.slice(0, desiredCount).map(({ color, count }) => ({ rgb: color.rgb, count }));
    } else {
      clusters = desiredCount > 48 ? histogramClusters(sampledPixels, desiredCount) : kmeans(sampledPixels, desiredCount);
    }
    return { mode, style, clusters, selectedColors: buildSelectedColors(clusters, mode, style, desiredCount, pixels, rankedPalette, candidatePalette) };
  }

  function extract() {
    if (busy) return;
    if (!sourceImage) return showToast("请先上传图片");
    const width = validDimension(els.gridWidth, 120), height = validDimension(els.gridHeight, 140), colorCount = Number(els.colorCount.value);
    els.gridWidth.value = width; els.gridHeight.value = height;
    setLoading(true, "正在提取主色", "正在分析图像并匹配 MARD 色卡，请稍候…");
    setStatus("正在提取颜色…");
    afterPaint(() => {
      try {
        const data = drawSourceToGrid(width, height);
        const pixels = [];
        const radius = denoiseRadius(width, height);
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) pixels.push(averageGridColor(data, width, height, x, y, radius));
        const { mode, style, clusters, selectedColors } = analyzePixels(pixels, colorCount);
        state.clusters = clusters; state.selectedColors = selectedColors; state.mode = mode; state.paletteStyle = style; state.requestedColorCount = colorCount; state.width = width; state.height = height; state.sourcePixels = pixels;
        renderExtractedColors();
        if (els.extractedResultDetails) els.extractedResultDetails.open = false;
        setStatus(`已提取 ${state.selectedColors.length} 种颜色，等待生成图解`, true);
        showToast("主色提取完成，可以生成图解");
      } catch (error) {
        setStatus("主色提取失败");
        showToast(`主色提取失败：${error.message || "浏览器内存不足"}`);
      } finally {
        setLoading(false);
      }
    });
  }

  function generate() {
    if (busy) return;
    if (!sourceImage) return showToast("请先上传图片");
    const width = validDimension(els.gridWidth, 120), height = validDimension(els.gridHeight, 140);
    setLoading(true, "正在生成拼豆图解", "正在量化每个网格并写入 MARD 色号，请稍候…");
    setStatus("正在生成图解…");
    afterPaint(() => {
      try {
        const data = drawSourceToGrid(width, height), pixels = [];
        const radius = denoiseRadius(width, height);
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) pixels.push(averageGridColor(data, width, height, x, y, radius));
        const { mode, style, clusters, selectedColors } = analyzePixels(pixels, Number(els.colorCount.value));
        let pattern = mapPixelsToPattern(pixels, width, height, selectedColors, mode, els.dither.checked);
        if (els.majorityFilter.checked || getEdgeMode() === "smooth") pattern = majorityPass(pattern, width, height, getEdgeMode());
        state = { ...state, clusters, selectedColors, pattern, width, height, mode, paletteStyle: style, requestedColorCount: Number(els.colorCount.value), sourcePixels: pixels };
        renderExtractedColors(); renderPattern(); renderLegend(); renderMaterials();
        if (els.extractedResultDetails) els.extractedResultDetails.open = false;
        if (els.generatedResultDetails) els.generatedResultDetails.open = false;
        setDisabled(els.downloadPng, false); setDisabled(els.downloadPdf, false); setDisabled(els.downloadJson, false); setDisabled(els.copyMaterials, false);
        // In the vertical layout the upload/settings and legend targets remain
        // available above the chart after generation.
        setSidebarsHidden(false, false, false);
        setStatus("图解已生成", true); showToast(`已生成 ${width} × ${height} 拼豆图纸`);
        scheduleFitPattern();
      } catch (error) {
        setStatus("图解生成失败");
        showToast(`图解生成失败：${error.message || "浏览器内存不足"}`);
      } finally {
        setLoading(false);
      }
    });
  }

  function renderExtractedColors() {
    if (els.extractedColors) els.extractedColors.innerHTML = state.selectedColors.map((color) => `<div class="swatch"><div class="swatch-color" style="background:${rgbCss(color.rgb)}"></div><label>${escapeHtml(color.id)}</label></div>`).join("");
    if (els.extractedResultSummary) els.extractedResultSummary.textContent = state.selectedColors.length ? `${state.selectedColors.length} 色 · 点击展开查看` : "尚未提取";
    if (els.modeBadge) els.modeBadge.textContent = state.mode === "mard" ? `MARD ${state.requestedColorCount || state.selectedColors.length} 色档（卡组限定）` : "原图真实色";
  }

  function patternCanvasLayout(cellSize) {
    const { width, height } = state;
    const axisFontSize = Math.max(8, Math.min(16, Math.round(cellSize * .62)));
    const outerBorder = Math.max(8, Math.round(cellSize * .65));
    const leftAxis = Math.max(34, Math.ceil(axisFontSize * 4));
    const rightAxis = leftAxis;
    const topAxis = Math.max(30, Math.ceil(axisFontSize * 2.2));
    const bottomAxis = topAxis;
    const originX = outerBorder + leftAxis;
    const originY = outerBorder + topAxis;
    return {
      axisFontSize,
      outerBorder,
      leftAxis,
      rightAxis,
      topAxis,
      bottomAxis,
      originX,
      originY,
      gridWidth: width * cellSize,
      gridHeight: height * cellSize,
      canvasWidth: originX + width * cellSize + rightAxis + outerBorder,
      canvasHeight: originY + height * cellSize + bottomAxis + outerBorder
    };
  }

  function cellCodeFontSize(label, cellSize) {
    const textLength = Math.max(1, String(label).length);
    const horizontalPadding = Math.max(2, cellSize * .15);
    const availableWidth = Math.max(4, cellSize - horizontalPadding * 2);
    const widthLimitedSize = availableWidth / (textLength * .58);
    const preferredSize = cellSize * (textLength > 3 ? .3 : .42);
    return Math.max(5, Math.min(14, preferredSize, widthLimitedSize));
  }

  function drawPatternToCanvas(targetCanvas, cellSize, forceCodes = false) {
    const { width, height, pattern } = state;
    const layout = patternCanvasLayout(cellSize);
    targetCanvas.width = layout.canvasWidth;
    targetCanvas.height = layout.canvasHeight;
    const context = targetCanvas.getContext("2d");
    if (!context) throw new Error("浏览器不支持绘制图纸");
    context.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

    // Leave a clear white margin around the rulers and the pattern itself.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
    context.strokeStyle = "#d8d2c8";
    context.lineWidth = 1;
    context.strokeRect(layout.outerBorder + .5, layout.outerBorder + .5, layout.canvasWidth - layout.outerBorder * 2 - 1, layout.canvasHeight - layout.outerBorder * 2 - 1);

    // Every column and row receives a 1-based coordinate on all four sides.
    context.fillStyle = "#2f2c27";
    context.font = `700 ${layout.axisFontSize}px Arial, "Microsoft YaHei", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    for (let column = 0; column < width; column++) {
      const label = String(column + 1);
      const x = layout.originX + column * cellSize + cellSize / 2;
      context.fillText(label, x, layout.outerBorder + layout.topAxis / 2);
      context.fillText(label, x, layout.originY + layout.gridHeight + layout.bottomAxis / 2);
    }
    for (let row = 0; row < height; row++) {
      const label = String(row + 1);
      const y = layout.originY + row * cellSize + cellSize / 2;
      context.fillText(label, layout.outerBorder + layout.leftAxis / 2, y);
      context.fillText(label, layout.originX + layout.gridWidth + layout.rightAxis / 2, y);
    }
    context.strokeStyle = "#cfc8bd";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(layout.originX, layout.outerBorder);
    context.lineTo(layout.originX, layout.canvasHeight - layout.outerBorder);
    context.moveTo(layout.originX + layout.gridWidth, layout.outerBorder);
    context.lineTo(layout.originX + layout.gridWidth, layout.canvasHeight - layout.outerBorder);
    context.moveTo(layout.outerBorder, layout.originY);
    context.lineTo(layout.canvasWidth - layout.outerBorder, layout.originY);
    context.moveTo(layout.outerBorder, layout.originY + layout.gridHeight);
    context.lineTo(layout.canvasWidth - layout.outerBorder, layout.originY + layout.gridHeight);
    context.stroke();

    const symbolMap = new Map(state.selectedColors.map((color, index) => [color.id, SYMBOLS[index % SYMBOLS.length]]));
    pattern.forEach((color, index) => {
      const x = index % width, y = Math.floor(index / width), px = layout.originX + x * cellSize, py = layout.originY + y * cellSize;
      context.fillStyle = rgbCss(color.rgb); context.fillRect(px, py, cellSize, cellSize);
      context.strokeStyle = (x % 10 === 0 || y % 10 === 0) ? "rgba(37,34,26,.38)" : "rgba(37,34,26,.15)"; context.lineWidth = (x % 10 === 0 || y % 10 === 0) ? 1.2 : .55; context.strokeRect(px, py, cellSize, cellSize);
      if (cellSize >= 6) {
        const label = forceCodes || !els.showCodes || els.showCodes.checked ? color.id : symbolMap.get(color.id) || "·";
        const textColor = contrastText(color.rgb);
        const fontSize = cellCodeFontSize(label, cellSize);
        context.font = `700 ${fontSize}px Arial, "Microsoft YaHei", sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle";
        // A small opposite-color halo keeps codes readable on both dark and
        // light beads, including when a phone viewer scales the PNG down.
        context.strokeStyle = textColor === "#fffdf7" ? "rgba(0,0,0,.62)" : "rgba(255,255,255,.78)";
        context.lineWidth = Math.max(.8, fontSize * .12);
        context.strokeText(label, px + cellSize / 2, py + cellSize / 2 + .5);
        context.fillStyle = textColor;
        context.fillText(label, px + cellSize / 2, py + cellSize / 2 + .5);
      }
    });
    context.strokeStyle = "rgba(37,34,26,.55)";
    context.lineWidth = 1.4;
    context.strokeRect(layout.originX + .5, layout.originY + .5, layout.gridWidth - 1, layout.gridHeight - 1);
    return layout;
  }

  function renderPattern() {
    const { width, height } = state;
    if (!els.canvas) throw new Error("页面缺少图纸画布，请同时更新 index.html");
    // A larger preview canvas gives the browser enough source pixels for clear
    // labels. fitPatternToViewport may scale it down for the overview; users can
    // raise the zoom slider to inspect individual rows.
    const cellSize = Math.max(14, Math.min(24, Math.floor(4200 / Math.max(width, height))));
    drawPatternToCanvas(els.canvas, cellSize, false);
    applyZoom(); if (els.emptyState) els.emptyState.classList.add("hidden"); els.canvas.classList.remove("hidden"); if (els.canvasMeta) els.canvasMeta.textContent = `${width} × ${height} 格 · ${state.selectedColors.length} 色 · 四边坐标`;
  }

  function renderLegend() {
    if (!els.legend) return;
    const counts = new Map(); state.pattern.forEach((color) => counts.set(color.id, (counts.get(color.id) || 0) + 1));
    els.legend.innerHTML = state.selectedColors.map((color) => `<div class="legend-item"><div class="legend-color" style="background:${rgbCss(color.rgb)}"></div><div class="legend-main"><strong>${escapeHtml(color.id)} · ${escapeHtml(color.name)}</strong><small>${hex(color.rgb)} · RGB(${color.rgb.map((v) => Math.round(v)).join(",")})</small></div><span class="legend-count">${counts.get(color.id) || 0}</span></div>`).join("");
    if (els.generatedResultSummary) els.generatedResultSummary.textContent = state.pattern.length ? `${state.width} × ${state.height} 格 · 点击展开查看` : "生成图解后显示";
  }

  function renderMaterials() {
    if (!els.materialsBody) return;
    const counts = new Map(); state.pattern.forEach((color) => counts.set(color.id, (counts.get(color.id) || 0) + 1));
    const total = state.pattern.length;
    const density = Math.max(1, Number(els.density.value) || 20);
    const rows = state.selectedColors.filter((color) => counts.has(color.id)).map((color) => { const count = counts.get(color.id); const length = count * (10 / density) * 0.016; return { color, count, percent: total ? count / total * 100 : 0, length }; }).sort((a, b) => b.count - a.count);
    state.stats = rows;
    els.materialsBody.innerHTML = rows.map(({ color, count, percent, length }) => `<tr><td><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${rgbCss(color.rgb)};margin-right:3px"></span>${escapeHtml(color.id)}</td><td>${count}</td><td>${percent.toFixed(2)}%</td><td>${length.toFixed(2)}m</td></tr>`).join("");
    if (els.totalStitches) els.totalStitches.textContent = total.toLocaleString();
  }

  function materialText() { return ["拼豆材料清单", `图纸：${state.width} × ${state.height}`, "", "颜色\t数量\t占比\t估算线长", ...state.stats.map(({ color, count, percent, length }) => `${color.id} ${color.name}\t${count}\t${percent.toFixed(2)}%\t${length.toFixed(2)}m`), "", `总针数\t${state.pattern.length}`].join("\n"); }

  function saveBlob(name, blob) {
    if (!blob) throw new Error("浏览器无法生成导出文件");
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
  function download(name, content, type) { saveBlob(name, new Blob([content], { type })); }
  function downloadJson() { download(`perler-pattern-${state.width}x${state.height}.json`, JSON.stringify({ width: state.width, height: state.height, mode: state.mode, palette: state.mode === "mard" ? `MARD 280 standard / ${state.requestedColorCount || state.selectedColors.length} tier` : "cluster colors", colors: state.selectedColors, cells: state.pattern.map((color) => color.id) }, null, 2), "application/json"); }

  function exportPng() {
    if (busy) return;
    if (!state.pattern.length) return showToast("请先生成拼豆图解");
    setLoading(true, "正在生成高清 PNG", "正在绘制大字号 MARD 色号，请稍候…");
    afterPaint(() => {
      try {
        const exportCanvas = document.createElement("canvas");
        // Keep the longest edge around 4,800px while retaining at least 16px per
        // cell. This is readable after pinch-zoom without making phone memory use
        // unnecessarily extreme.
        const cellSize = Math.max(16, Math.min(26, Math.floor(4800 / Math.max(state.width, state.height))));
        drawPatternToCanvas(exportCanvas, cellSize, true);
        exportCanvas.toBlob((blob) => {
          try {
            if (!blob) throw new Error("浏览器无法生成 PNG");
            saveBlob(`perler-pattern-${state.width}x${state.height}.png`, blob);
            setStatus("PNG 已生成", true);
            showToast("已导出高清 PNG，每格包含清晰色号");
          } catch (error) {
            setStatus("PNG 导出失败");
            showToast(`PNG 导出失败：${error.message || "手机内存不足，请降低网格精度"}`);
          } finally {
            setLoading(false);
          }
        }, "image/png");
      } catch (error) {
        setStatus("PNG 导出失败");
        showToast(`PNG 导出失败：${error.message || "手机内存不足，请降低网格精度"}`);
        setLoading(false);
      }
    });
  }

  // The PDF is assembled locally as vector drawing commands. It does not rasterize the
  // preview, so each cell stays sharp when printed and carries its color code.
  const PDF_MIN_WIDTH = 595.28;
  const PDF_MIN_HEIGHT = 841.89;
  const PDF_ENCODER = new TextEncoder();
  function pdfNumber(value) { return Number(value).toFixed(3).replace(/\.?(0+)$/, ""); }
  function pdfColor(rgb, operator = "rg") { return `${rgb.map((value) => (clamp(value) / 255).toFixed(4)).join(" ")} ${operator}`; }
  function pdfEscape(value) { return String(value).replace(/[^\x20-\x7e]/g, "?").replace(/[\\()]/g, (character) => `\\${character}`); }
  function pdfText(text, x, top, size, rgb = [39, 37, 31], pageHeight = PDF_MIN_HEIGHT) { return `${pdfColor(rgb)} BT /F1 ${pdfNumber(size)} Tf 1 0 0 1 ${pdfNumber(x)} ${pdfNumber(pageHeight - top)} Tm (${pdfEscape(text)}) Tj ET`; }
  function pdfFillRect(rgb, x, top, width, height, pageHeight = PDF_MIN_HEIGHT) { return `${pdfColor(rgb)} ${pdfNumber(x)} ${pdfNumber(pageHeight - top - height)} ${pdfNumber(width)} ${pdfNumber(height)} re f`; }
  function pdfStrokeRect(rgb, x, top, width, height, lineWidth = 1, pageHeight = PDF_MIN_HEIGHT) { return `${pdfColor(rgb, "RG")} ${pdfNumber(lineWidth)} w ${pdfNumber(x)} ${pdfNumber(pageHeight - top - height)} ${pdfNumber(width)} ${pdfNumber(height)} re S`; }
  function pdfTextCentered(text, centerX, baselineTop, size, rgb = [39, 37, 31], pageHeight = PDF_MIN_HEIGHT) {
    const label = String(text);
    return pdfText(label, centerX - label.length * size * .25, baselineTop, size, rgb, pageHeight);
  }

  function buildPdfSinglePage() {
    const margin = 28;
    const header = 42;
    const footer = 20;
    // Keep a usable vector cell size. The page is allowed to be larger than A4 so
    // the complete pattern remains on one page instead of being split into tiles.
    const cellSize = 18;
    const layout = patternCanvasLayout(cellSize);
    const pageWidth = Math.max(PDF_MIN_WIDTH, layout.canvasWidth + margin * 2);
    const pageHeight = Math.max(PDF_MIN_HEIGHT, layout.canvasHeight + header + footer);
    const boardLeft = (pageWidth - layout.canvasWidth) / 2;
    const boardTop = header;
    const originX = boardLeft + layout.originX;
    const originTop = boardTop + layout.originY;
    const gridWidth = layout.gridWidth;
    const gridHeight = layout.gridHeight;
    const paletteName = state.mode === "mard" ? `MARD 280 standard / ${state.requestedColorCount || state.selectedColors.length} tier` : "cluster colors";
    const commands = [
      "q",
      pdfText(`Perler Pattern  ${state.width} x ${state.height} grid`, margin, 21, 12, [39, 37, 31], pageHeight),
      pdfText(`Palette: ${paletteName}   Cells: ${state.pattern.length.toLocaleString()}   Single-page vector PDF`, margin, 35, 7, [95, 91, 82], pageHeight),
      pdfFillRect([255, 255, 255], boardLeft, boardTop, layout.canvasWidth, layout.canvasHeight, pageHeight),
      pdfStrokeRect([216, 210, 200], boardLeft, boardTop, layout.canvasWidth, layout.canvasHeight, .8, pageHeight)
    ];

    const axisTextSize = layout.axisFontSize;
    const topAxisBaseline = boardTop + layout.outerBorder + layout.topAxis / 2 + axisTextSize * .34;
    const bottomAxisBaseline = originTop + gridHeight + layout.bottomAxis / 2 + axisTextSize * .34;
    const leftAxisCenter = boardLeft + layout.outerBorder + layout.leftAxis / 2;
    const rightAxisCenter = originX + gridWidth + layout.rightAxis / 2;
    for (let column = 0; column < state.width; column++) {
      const label = String(column + 1);
      const x = originX + column * cellSize + cellSize / 2;
      commands.push(pdfTextCentered(label, x, topAxisBaseline, axisTextSize, [47, 44, 39], pageHeight));
      commands.push(pdfTextCentered(label, x, bottomAxisBaseline, axisTextSize, [47, 44, 39], pageHeight));
    }
    for (let row = 0; row < state.height; row++) {
      const label = String(row + 1);
      const baseline = originTop + row * cellSize + cellSize / 2 + axisTextSize * .34;
      commands.push(pdfTextCentered(label, leftAxisCenter, baseline, axisTextSize, [47, 44, 39], pageHeight));
      commands.push(pdfTextCentered(label, rightAxisCenter, baseline, axisTextSize, [47, 44, 39], pageHeight));
    }
    commands.push(pdfStrokeRect([207, 200, 189], boardLeft + layout.outerBorder, boardTop + layout.outerBorder, layout.leftAxis + gridWidth + layout.rightAxis, layout.topAxis + gridHeight + layout.bottomAxis, .55, pageHeight));

    for (let row = 0; row < state.height; row++) {
      for (let column = 0; column < state.width; column++) {
        const color = state.pattern[row * state.width + column];
        if (!color) continue;
        commands.push(pdfFillRect(color.rgb, originX + column * cellSize, originTop + row * cellSize, cellSize, cellSize, pageHeight));
      }
    }

    commands.push(`${pdfColor([48, 45, 39], "RG")} ${pdfNumber(Math.max(.25, Math.min(.7, cellSize / 15)))} w`);
    for (let column = 0; column <= state.width; column++) {
      const x = originX + column * cellSize;
      commands.push(`${pdfNumber(x)} ${pdfNumber(pageHeight - originTop)} m ${pdfNumber(x)} ${pdfNumber(pageHeight - originTop - gridHeight)} l`);
    }
    for (let row = 0; row <= state.height; row++) {
      const top = originTop + row * cellSize;
      const y = pageHeight - top;
      commands.push(`${pdfNumber(originX)} ${pdfNumber(y)} m ${pdfNumber(originX + gridWidth)} ${pdfNumber(y)} l`);
    }
    commands.push("S");
    commands.push(pdfStrokeRect([48, 45, 39], originX, originTop, gridWidth, gridHeight, .9, pageHeight));

    for (let row = 0; row < state.height; row++) {
      for (let column = 0; column < state.width; column++) {
        const color = state.pattern[row * state.width + column];
        if (!color) continue;
        const label = String(color.id || "?").slice(0, 8);
        const size = cellCodeFontSize(label, cellSize);
        const x = originX + column * cellSize + cellSize / 2 - label.length * size * .27;
        const top = originTop + row * cellSize + cellSize / 2 + size * .34;
        commands.push(pdfText(label, x, top, size, contrastRgb(color.rgb), pageHeight));
      }
    }
    commands.push(pdfText("Perler Pattern  |  Print with fit-to-page if necessary", margin, pageHeight - 8, 7, [130, 124, 113], pageHeight), "Q");
    return { content: commands.join("\n"), pageWidth, pageHeight };
  }

  function buildPdfFile(pages, pageWidth, pageHeight) {
    const pageObjectNumbers = pages.map((_, index) => 4 + index * 2);
    const objects = [];
    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[2] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pages.length} >>`;
    objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    pages.forEach((content, index) => {
      const pageNumber = pageObjectNumbers[index];
      const contentNumber = pageNumber + 1;
      const stream = `${content}\n`;
      const length = PDF_ENCODER.encode(stream).length;
      objects[pageNumber] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfNumber(pageWidth)} ${pdfNumber(pageHeight)}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentNumber} 0 R >>`;
      objects[contentNumber] = `<< /Length ${length} >>\nstream\n${stream}endstream`;
    });

    let output = "%PDF-1.4\n";
    const offsets = new Array(objects.length).fill(0);
    for (let objectNumber = 1; objectNumber < objects.length; objectNumber++) {
      offsets[objectNumber] = PDF_ENCODER.encode(output).length;
      output += `${objectNumber} 0 obj\n${objects[objectNumber]}\nendobj\n`;
    }
    const xrefOffset = PDF_ENCODER.encode(output).length;
    output += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let objectNumber = 1; objectNumber < objects.length; objectNumber++) output += `${String(offsets[objectNumber]).padStart(10, "0")} 00000 n \n`;
    output += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return PDF_ENCODER.encode(output);
  }

  function exportPdf() {
    if (busy) return;
    if (!els.downloadPdf) return showToast("请先上传带有 PDF 导出按钮的新版 index.html");
    if (!state.pattern.length) return showToast("请先生成拼豆图解");
    els.downloadPdf.disabled = true;
    setLoading(true, "正在生成单页 PDF", "正在绘制矢量网格和每格色号，请稍候…");
    setStatus("正在生成单页整图 PDF…");
    setTimeout(() => {
      try {
        const page = buildPdfSinglePage();
        saveBlob(`perler-pattern-${state.width}x${state.height}.pdf`, new Blob([buildPdfFile([page.content], page.pageWidth, page.pageHeight)], { type: "application/pdf" }));
        setStatus("PDF 已生成", true);
        showToast("已导出单页整图矢量 PDF，每格包含色号");
      } catch (error) {
        setStatus("PDF 导出失败");
        showToast(`PDF 导出失败：${error.message || "浏览器内存不足"}`);
      } finally {
        els.downloadPdf.disabled = false;
        setLoading(false);
      }
    }, 30);
  }

  els.imageInput.addEventListener("change", (event) => loadImage(event.target.files[0]));
  els.replaceImage.addEventListener("click", () => els.imageInput.click());
  if (els.precisionSelect) els.precisionSelect.addEventListener("change", applyPrecisionSelection);
  [els.gridWidth, els.gridHeight].forEach((input) => input.addEventListener("input", markCustomPrecision));
  if (els.bigjpgButton) els.bigjpgButton.addEventListener("click", () => {
    const opened = window.open("https://bigjpg.com/", "_blank", "noopener,noreferrer");
    if (!opened) showToast("请允许打开新窗口后访问 Bigjpg");
    else showToast("请在 Bigjpg 放大并下载图片，再重新上传到本页");
  });
  ["dragenter", "dragover"].forEach((eventName) => els.dropZone.addEventListener(eventName, (event) => { event.preventDefault(); els.dropZone.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((eventName) => els.dropZone.addEventListener(eventName, (event) => { event.preventDefault(); els.dropZone.classList.remove("dragging"); }));
  els.dropZone.addEventListener("drop", (event) => loadImage(event.dataTransfer.files[0]));
  ["input", "change"].forEach((eventName) => els.colorCount.addEventListener(eventName, () => {
    syncColorCountLabel();
    if (els.precisionSelect && !els.precisionSelect.disabled) els.precisionSelect.value = "custom";
    markPatternStale("MARD 色数已改变，请重新生成图解");
    updateQualityInfo();
  }));
  if (els.paletteStyle) els.paletteStyle.addEventListener("change", () => markPatternStale("颜色参数已改变，请重新生成图解"));
  [els.denoise, els.dither, els.majorityFilter].forEach((input) => input.addEventListener("change", () => markPatternStale("图解参数已改变，请重新生成图解")));
  $$('input[name="edgeMode"]').forEach((input) => input.addEventListener("change", () => markPatternStale("边缘处理已改变，请重新生成图解")));
  els.extractColors.addEventListener("click", extract); els.generatePattern.addEventListener("click", generate); els.refreshMaterials.addEventListener("click", renderMaterials);
  els.zoom.addEventListener("input", () => { state.autoFit = false; applyZoom(); });
  els.downloadPng.addEventListener("click", exportPng);
  if (els.downloadPdf) els.downloadPdf.addEventListener("click", exportPdf);
  els.downloadJson.addEventListener("click", downloadJson);
  if (els.showCodes) els.showCodes.addEventListener("change", () => { if (state.pattern.length) renderPattern(); });
  els.density.addEventListener("input", () => { if (state.pattern.length) renderMaterials(); });
  els.copyMaterials.addEventListener("click", async () => { try { await navigator.clipboard.writeText(materialText()); showToast("材料清单已复制"); } catch { showToast("当前浏览器不允许复制，请使用导出数据"); } });
  $$('input[name="colorMode"]').forEach((input) => input.addEventListener("change", () => { $$(".radio-card").forEach((card) => card.classList.toggle("selected", card.querySelector("input").checked)); markPatternStale("颜色模式已改变，请重新生成图解"); }));
  if (els.toggleControls) els.toggleControls.addEventListener("click", () => {
    const hideControls = !els.appShell.classList.contains("hide-controls");
    setSidebarsHidden(hideControls, els.appShell.classList.contains("hide-results"));
  });
  if (els.toggleResults) els.toggleResults.addEventListener("click", () => {
    const hideResults = !els.appShell.classList.contains("hide-results");
    setSidebarsHidden(els.appShell.classList.contains("hide-controls"), hideResults);
  });
  if (els.fitPattern) els.fitPattern.addEventListener("click", () => { fitPatternToViewport(); showToast("图纸已适应当前窗口"); });
  if (window.addEventListener) window.addEventListener("resize", () => { if (state.autoFit) scheduleFitPattern(); });
})();
