(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const els = {
    imageInput: $("#imageInput"), dropZone: $("#dropZone"), fileInfo: $("#fileInfo"), sourceThumb: $("#sourceThumb"), fileName: $("#fileName"), fileDimensions: $("#fileDimensions"), replaceImage: $("#replaceImage"), qualityInfo: $("#qualityInfo"), precisionSelect: $("#precisionSelect"), bigjpgButton: $("#bigjpgButton"),
    denoise: $("#denoise"), colorCount: $("#colorCount"), colorCountValue: $("#colorCountValue"), paletteStyle: $("#paletteStyle"), extractColors: $("#extractColors"), extractedColors: $("#extractedColors"),
    paletteInput: $("#paletteInput"), paletteStatus: $("#paletteStatus"),
    gridWidth: $("#gridWidth"), gridHeight: $("#gridHeight"), dither: $("#dither"), majorityFilter: $("#majorityFilter"), generatePattern: $("#generatePattern"), density: $("#density"), refreshMaterials: $("#refreshMaterials"),
    canvas: $("#patternCanvas"), emptyState: $("#emptyState"), canvasViewport: $("#canvasViewport"), statusText: $("#statusText"), liveDot: $(".live-dot"), canvasMeta: $("#canvasMeta"), zoom: $("#zoom"), zoomValue: $("#zoomValue"),
    showCodes: $("#showCodes"), pdfCellsPerPage: $("#pdfCellsPerPage"), modeBadge: $("#modeBadge"), legend: $("#legend"), materialsBody: $("#materialsBody"), totalStitches: $("#totalStitches"), copyMaterials: $("#copyMaterials"), downloadPng: $("#downloadPng"), downloadPdf: $("#downloadPdf"), downloadJson: $("#downloadJson"), toast: $("#toast")
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

  const SYMBOLS = ["●", "▲", "■", "◆", "✚", "✦", "○", "△", "□", "◇", "★", "※"];
  let sourceImage = null;
  let sourceFile = null;
  let customMardPalette = null;
  let state = { clusters: [], selectedColors: [], pattern: [], width: 0, height: 0, mode: "mard", paletteStyle: "all", stats: [] };
  let toastTimer;

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

  function colorDistance(a, b) { const aa = rgbToLab(a); const bb = rgbToLab(b); return Math.hypot(aa[0] - bb[0], aa[1] - bb[1], aa[2] - bb[2]); }
  function clamp(v, min = 0, max = 255) { return Math.max(min, Math.min(max, v)); }
  function rgbCss(rgb) { return `rgb(${rgb.map((v) => Math.round(v)).join(",")})`; }
  function hex(rgb) { return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase(); }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character])); }
  function contrastText(rgb) { return (.299 * rgb[0] + .587 * rgb[1] + .114 * rgb[2]) > 158 ? "#273025" : "#fffdf7"; }
  function contrastRgb(rgb) { return contrastText(rgb) === "#273025" ? [39, 48, 37] : [255, 253, 247]; }
  function getMode() { return $("input[name='colorMode']:checked").value; }
  function getEdgeMode() { return $("input[name='edgeMode']:checked").value; }
  function showToast(message) { clearTimeout(toastTimer); els.toast.textContent = message; els.toast.classList.add("show"); toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2600); }
  function setStatus(message, ready = false) { els.statusText.textContent = message; els.liveDot.classList.toggle("ready", ready); }
  function validDimension(input, fallback) { const n = Number(input.value); return Number.isFinite(n) ? Math.max(8, Math.min(240, Math.round(n))) : fallback; }

  function activeMardPalette() {
    const palette = customMardPalette || window.MARD_PALETTE_280 || DMC;
    return palette.length ? palette : DMC;
  }

  const STYLE_SERIES = {
    warm: new Set(["A", "E", "F", "G", "M"]),
    natural: new Set(["B", "C", "G", "H", "M"]),
    fresh: new Set(["B", "C", "D", "E", "P", "R", "Y"]),
    vivid: new Set(["A", "B", "C", "D", "E", "F", "R"])
  };

  function paletteForStyle(style) {
    const palette = activeMardPalette();
    if (style === "all") return palette;
    const filtered = palette.filter((color) => (color.tags || []).includes(style) || (STYLE_SERIES[style] && STYLE_SERIES[style].has(color.series)));
    return filtered.length >= 3 ? filtered : palette;
  }

  function gridForShortSide(shortSide) {
    const sourceWidth = sourceImage.naturalWidth;
    const sourceHeight = sourceImage.naturalHeight;
    let width = sourceWidth >= sourceHeight ? Math.round(shortSide * sourceWidth / sourceHeight) : shortSide;
    let height = sourceWidth >= sourceHeight ? shortSide : Math.round(shortSide * sourceHeight / sourceWidth);
    const fit = Math.min(240 / width, 240 / height, 1);
    width = Math.max(8, Math.round(width * fit));
    height = Math.max(8, Math.round(height * fit));
    return { width, height };
  }

  function updateQualityInfo() {
    if (!sourceImage) return;
    const sourceWidth = sourceImage.naturalWidth;
    const sourceHeight = sourceImage.naturalHeight;
    const width = validDimension(els.gridWidth, 120);
    const height = validDimension(els.gridHeight, 140);
    const pixelsPerBead = Math.min(sourceWidth / width, sourceHeight / height);
    const sourceShortSide = Math.min(sourceWidth, sourceHeight);
    const isLowResolution = sourceShortSide < 128 || pixelsPerBead < 2;
    const resolutionText = pixelsPerBead >= 1 ? `${pixelsPerBead.toFixed(1)} px/格` : "低于 1 px/格";
    els.qualityInfo.innerHTML = `<strong>原图 ${sourceWidth} × ${sourceHeight}px</strong> · 当前 ${width} × ${height} 格 · ${resolutionText}<br>${isLowResolution ? "原图细节不足，建议先用 Bigjpg 放大后再生成。" : "已按原图比例计算选项，越往下精度越高、格子越多。"}`;
    els.qualityInfo.classList.remove("hidden");
    els.qualityInfo.classList.toggle("warning", isLowResolution);
  }

  function populatePrecisionOptions() {
    if (!sourceImage) return;
    const sourceShortSide = Math.min(sourceImage.naturalWidth, sourceImage.naturalHeight);
    // Two source pixels per bead is a practical upper bound for a stable automatic choice.
    const recommendedMax = Math.max(8, Math.min(240, Math.floor(sourceShortSide / 2)));
    const candidateShortSides = [20, 30, 40, 50, 60, 80, 100, 120, 160, 200, 240]
      .filter((value) => value <= recommendedMax);
    if (!candidateShortSides.length || candidateShortSides[candidateShortSides.length - 1] !== recommendedMax) candidateShortSides.push(recommendedMax);

    const options = [];
    const seen = new Set();
    candidateShortSides.forEach((shortSide, index) => {
      const grid = gridForShortSide(shortSide);
      const key = `${grid.width}x${grid.height}`;
      if (seen.has(key)) return;
      seen.add(key);
      const level = index === 0 ? "低精度" : index === candidateShortSides.length - 1 ? "高精度" : `精度 ${index}`;
      options.push({ ...grid, label: `${level} · ${grid.width} × ${grid.height} 格（约 ${(grid.width * grid.height).toLocaleString()} 颗）` });
    });

    els.precisionSelect.innerHTML = options.map((option) => `<option value="${option.width}x${option.height}" data-width="${option.width}" data-height="${option.height}">${option.label}</option>`).join("") + '<option value="custom">自定义网格（手动输入）</option>';
    // Keep the default readable on mobile while still adapting to the source image.
    const defaultOption = options[Math.min(4, options.length - 1)];
    if (defaultOption) {
      els.precisionSelect.value = `${defaultOption.width}x${defaultOption.height}`;
      els.gridWidth.value = defaultOption.width;
      els.gridHeight.value = defaultOption.height;
    }
    els.precisionSelect.disabled = false;
    updateQualityInfo();
  }

  function applyPrecisionSelection() {
    const option = els.precisionSelect.selectedOptions[0];
    if (!option || !option.dataset.width) return;
    els.gridWidth.value = option.dataset.width;
    els.gridHeight.value = option.dataset.height;
    markPatternStale("精度已改变，请重新生成图解");
    updateQualityInfo();
  }

  function markPatternStale(message = "参数已改变，请重新生成图解") {
    if (!state.pattern.length) return;
    els.downloadPng.disabled = true;
    els.downloadPdf.disabled = true;
    els.downloadJson.disabled = true;
    els.copyMaterials.disabled = true;
    setStatus(message);
  }

  function markCustomPrecision() {
    if (!els.precisionSelect.disabled) els.precisionSelect.value = "custom";
    markPatternStale("网格尺寸已改变，请重新生成图解");
    updateQualityInfo();
  }

  function loadImage(file) {
    if (!file || !file.type.startsWith("image/")) { showToast("请选择 JPG、PNG 或 WEBP 图片"); return; }
    sourceFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        sourceImage = image;
        state = { ...state, clusters: [], selectedColors: [], pattern: [], stats: [], width: 0, height: 0 };
        els.sourceThumb.src = image.src;
        els.fileName.textContent = file.name;
        els.fileDimensions.textContent = `${image.naturalWidth} × ${image.naturalHeight}px`;
        els.fileInfo.classList.remove("hidden");
        els.extractColors.disabled = false;
        els.generatePattern.disabled = false;
        els.refreshMaterials.disabled = false;
        els.bigjpgButton.disabled = false;
        els.downloadPng.disabled = true;
        els.downloadPdf.disabled = true;
        els.downloadJson.disabled = true;
        els.copyMaterials.disabled = true;
        els.canvas.classList.add("hidden");
        els.emptyState.classList.remove("hidden");
        els.canvasMeta.textContent = "—";
        els.extractedColors.innerHTML = "";
        els.legend.innerHTML = '<div class="empty-result">生成图解后显示颜色图例</div>';
        els.materialsBody.innerHTML = '<tr><td colspan="4" class="empty-result">暂无数据</td></tr>';
        els.totalStitches.textContent = "—";
        populatePrecisionOptions();
        setStatus("图片已载入，等待生成", true);
        showToast("图片已载入，可以开始提取主色");
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function parseHexValue(value) {
    if (typeof value !== "string") return null;
    const match = value.trim().replace(/^0x/i, "").match(/^#?([0-9a-f]{6})$/i);
    if (!match) return null;
    const raw = match[1];
    return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
  }

  function parseRgbValue(value) {
    if (Array.isArray(value) && value.length >= 3) {
      const rgb = value.slice(0, 3).map(Number);
      return rgb.every((component) => Number.isFinite(component)) ? rgb.map((component) => clamp(component)) : null;
    }
    if (typeof value !== "string") return null;
    const match = value.match(/(?:rgb\s*\()?\s*(\d{1,3})\s*[,;\s]+\s*(\d{1,3})\s*[,;\s]+\s*(\d{1,3})\s*\)?/i);
    return match ? match.slice(1, 4).map((component) => clamp(Number(component))) : null;
  }

  function normalizePaletteRecord(record, index) {
    if (!record || typeof record !== "object") return null;
    const rawId = record.id ?? record.code ?? record.colorCode ?? record.mard ?? record.MARD ?? record.number;
    const rawName = record.name ?? record.label ?? record.title ?? "";
    const rawHex = record.hex ?? record.HEX ?? record.colorHex ?? record.value;
    const rawRgb = record.rgb ?? record.RGB ?? record.colorRgb ?? record.color;
    let id = rawId == null ? "" : String(rawId).trim();
    let rgb = parseHexValue(rawHex) || parseRgbValue(rawRgb) || parseRgbValue(rawHex);
    if (!rgb && Number.isFinite(Number(record.r)) && Number.isFinite(Number(record.g)) && Number.isFinite(Number(record.b))) rgb = [Number(record.r), Number(record.g), Number(record.b)].map((component) => clamp(component));
    if (parseHexValue(id) && rawHex && !parseHexValue(rawHex) && !parseRgbValue(rawHex)) {
      rgb = parseHexValue(id);
      id = String(rawHex).trim();
    } else if (parseHexValue(id) && rawName && !parseHexValue(rawName)) {
      rgb = parseHexValue(id);
      id = String(rawName).trim();
    }
    if (!rgb || !id) return null;
    const seriesMatch = id.match(/^[A-Za-z]+/);
    return { id, name: String(rawName || `MARD ${id}`), rgb, hex: hex(rgb), series: record.series || (seriesMatch ? seriesMatch[0].toUpperCase() : "") };
  }

  function splitPaletteLine(line) {
    return line.trim().split(/\s*[,;\t]\s*/).map((value) => value.trim()).filter(Boolean);
  }

  function parsePaletteText(text, fileName = "") {
    const trimmed = text.replace(/^\uFEFF/, "").trim();
    let records = [];
    if (fileName.toLowerCase().endsWith(".json") || trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) records = parsed;
      else if (Array.isArray(parsed.colors)) records = parsed.colors;
      else if (Array.isArray(parsed.palette)) records = parsed.palette;
      else if (Array.isArray(parsed.data)) records = parsed.data;
      else if (Array.isArray(parsed.items)) records = parsed.items;
      else if (parsed && typeof parsed === "object") {
        records = Object.entries(parsed).map(([key, value]) => typeof value === "object" && value !== null ? { ...value, id: value.id ?? value.code ?? key } : { id: key, value });
      }
    } else {
      records = trimmed.split(/\r?\n/).slice(0, 1000).map((line) => {
        const values = splitPaletteLine(line);
        const rgbIndex = values.findIndex((value) => parseHexValue(value) || parseRgbValue(value));
        let rgb = rgbIndex >= 0 ? parseHexValue(values[rgbIndex]) || parseRgbValue(values[rgbIndex]) : null;
        if (!rgb) {
          for (let index = 0; index <= values.length - 3; index++) {
            const triplet = values.slice(index, index + 3).map(Number);
            if (triplet.every((component) => Number.isFinite(component) && component >= 0 && component <= 255)) { rgb = triplet; break; }
          }
        }
        if (!rgb) return null;
        const id = values.find((value) => /^[A-Za-z]{1,4}\s*[-_]?\s*\d{1,4}$/i.test(value)) || values.find((value, index) => index !== rgbIndex && !/^\d+(?:\.\d+)?$/.test(value)) || `MARD-${values.length}`;
        return { id, name: id, rgb, hex: hex(rgb) };
      }).filter(Boolean);
    }
    const unique = new Map();
    records.map((record, index) => normalizePaletteRecord(record, index)).filter(Boolean).forEach((color) => {
      if (!unique.has(color.id)) unique.set(color.id, color);
    });
    return [...unique.values()];
  }

  async function importPaletteFile(file) {
    if (!file) return;
    try {
      const palette = parsePaletteText(await file.text(), file.name);
      if (palette.length < 3) throw new Error("至少需要 3 个有效色号和颜色值");
      customMardPalette = palette;
      els.paletteStatus.textContent = `已载入自定义色卡：${palette.length} 色。下次生成图解时使用这些色号。`;
      markPatternStale("色卡已改变，请重新生成图解");
      showToast(`已导入 ${palette.length} 个颜色`);
      if (sourceImage) setStatus("色卡已更新，请重新生成图解", true);
    } catch (error) {
      els.paletteStatus.textContent = `色卡导入失败：${error.message || "文件格式无法识别"}`;
      showToast("色卡文件无法识别，请检查 CSV/JSON 格式");
    } finally {
      els.paletteInput.value = "";
    }
  }

  function drawSourceToGrid(width, height) {
    const offscreen = document.createElement("canvas");
    offscreen.width = width; offscreen.height = height;
    const context = offscreen.getContext("2d", { willReadFrequently: true });
    const sourceRatio = sourceImage.naturalWidth / sourceImage.naturalHeight;
    const targetRatio = width / height;
    let sx = 0, sy = 0, sw = sourceImage.naturalWidth, sh = sourceImage.naturalHeight;
    if (sourceRatio > targetRatio) { sw = sourceImage.naturalHeight * targetRatio; sx = (sourceImage.naturalWidth - sw) / 2; }
    else { sh = sourceImage.naturalWidth / targetRatio; sy = (sourceImage.naturalHeight - sh) / 2; }
    context.imageSmoothingEnabled = true;
    context.drawImage(sourceImage, sx, sy, sw, sh, 0, 0, width, height);
    return context.getImageData(0, 0, width, height).data;
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

  function nearestColor(rgb, colors) { let nearest = colors[0], distance = Infinity; for (const color of colors) { const d = colorDistance(rgb, color.rgb || color); if (d < distance) { distance = d; nearest = color; } } return nearest; }

  function buildSelectedColors(clusters, mode, style, desiredCount) {
    if (mode === "original") return clusters.slice(0, desiredCount).map((cluster, index) => ({ id: `C${String(index + 1).padStart(2, "0")}`, name: `真实色${index + 1}`, rgb: cluster.rgb, original: true }));
    const palette = paletteForStyle(style);
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
        const color = nearestColor(rgb, colorObjects);
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

  function extract() {
    if (!sourceImage) return showToast("请先上传图片");
    const width = validDimension(els.gridWidth, 120), height = validDimension(els.gridHeight, 140), colorCount = Number(els.colorCount.value);
    els.gridWidth.value = width; els.gridHeight.value = height;
    setStatus("正在提取颜色…");
    requestAnimationFrame(() => {
      const data = drawSourceToGrid(width, height);
      const pixels = [];
      const radius = els.denoise.checked ? 1 : 0;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) pixels.push(averageGridColor(data, width, height, x, y, radius));
      const clusters = kmeans(pixels.filter((_, i) => i % Math.max(1, Math.floor(pixels.length / 6000)) === 0), colorCount);
      const mode = getMode(), style = els.paletteStyle.value;
      state.clusters = clusters; state.selectedColors = buildSelectedColors(clusters, mode, style, colorCount); state.mode = mode; state.paletteStyle = style; state.width = width; state.height = height; state.sourcePixels = pixels;
      renderExtractedColors();
      setStatus(`已提取 ${state.selectedColors.length} 种颜色，等待生成图解`, true);
      showToast("主色提取完成，可以生成图解");
    });
  }

  function generate() {
    if (!sourceImage) return showToast("请先上传图片");
    const width = validDimension(els.gridWidth, 120), height = validDimension(els.gridHeight, 140);
    setStatus("正在生成图解…");
    requestAnimationFrame(() => {
      const data = drawSourceToGrid(width, height), pixels = [];
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) pixels.push(averageGridColor(data, width, height, x, y, els.denoise.checked ? 1 : 0));
      const clusters = kmeans(pixels.filter((_, i) => i % Math.max(1, Math.floor(pixels.length / 6000)) === 0), Number(els.colorCount.value));
      const mode = getMode(), selectedColors = buildSelectedColors(clusters, mode, els.paletteStyle.value, Number(els.colorCount.value));
      let pattern = mapPixelsToPattern(pixels, width, height, selectedColors, mode, els.dither.checked);
      if (els.majorityFilter.checked || getEdgeMode() === "smooth") pattern = majorityPass(pattern, width, height, getEdgeMode());
      state = { ...state, clusters, selectedColors, pattern, width, height, mode, paletteStyle: els.paletteStyle.value, sourcePixels: pixels };
      renderExtractedColors(); renderPattern(); renderLegend(); renderMaterials();
      els.downloadPng.disabled = false; els.downloadPdf.disabled = false; els.downloadJson.disabled = false; els.copyMaterials.disabled = false;
      setStatus("图解已生成", true); showToast(`已生成 ${width} × ${height} 拼豆图纸`);
    });
  }

  function renderExtractedColors() {
    els.extractedColors.innerHTML = state.selectedColors.map((color) => `<div class="swatch"><div class="swatch-color" style="background:${rgbCss(color.rgb)}"></div><label>${escapeHtml(color.id)}</label></div>`).join("");
    els.modeBadge.textContent = state.mode === "mard" ? `MARD ${activeMardPalette().length} 色` : "原图真实色";
  }

  function renderPattern() {
    const { width, height, pattern } = state;
    const cellSize = Math.max(8, Math.min(18, Math.floor(1700 / Math.max(width, height))));
    els.canvas.width = width * cellSize; els.canvas.height = height * cellSize;
    const context = els.canvas.getContext("2d"); context.clearRect(0, 0, els.canvas.width, els.canvas.height);
    const symbolMap = new Map(state.selectedColors.map((color, index) => [color.id, SYMBOLS[index % SYMBOLS.length]]));
    pattern.forEach((color, index) => {
      const x = index % width, y = Math.floor(index / width), px = x * cellSize, py = y * cellSize;
      context.fillStyle = rgbCss(color.rgb); context.fillRect(px, py, cellSize, cellSize);
      context.strokeStyle = (x % 10 === 0 || y % 10 === 0) ? "rgba(37,34,26,.38)" : "rgba(37,34,26,.15)"; context.lineWidth = (x % 10 === 0 || y % 10 === 0) ? 1.2 : .55; context.strokeRect(px, py, cellSize, cellSize);
      if (cellSize >= 8) {
        const label = els.showCodes.checked ? color.id : symbolMap.get(color.id) || "·";
        context.fillStyle = contrastText(color.rgb);
        context.font = `700 ${Math.max(5, Math.min(9, Math.floor(cellSize * (label.length > 2 ? .34 : .55))))}px sans-serif`;
        context.textAlign = "center"; context.textBaseline = "middle"; context.fillText(label, px + cellSize / 2, py + cellSize / 2 + .5);
      }
    });
    applyZoom(); els.emptyState.classList.add("hidden"); els.canvas.classList.remove("hidden"); els.canvasMeta.textContent = `${width} × ${height} 格 · ${state.selectedColors.length} 色`;
  }

  function applyZoom() { const scale = Number(els.zoom.value) / 100; els.zoomValue.value = `${els.zoom.value}%`; els.zoomValue.textContent = `${els.zoom.value}%`; els.canvas.style.transform = `scale(${scale})`; els.canvas.style.transformOrigin = "center center"; els.canvas.style.margin = `${Math.max(0, (scale - 1) * 100)}px`; }

  function renderLegend() {
    const counts = new Map(); state.pattern.forEach((color) => counts.set(color.id, (counts.get(color.id) || 0) + 1));
    els.legend.innerHTML = state.selectedColors.map((color) => `<div class="legend-item"><div class="legend-color" style="background:${rgbCss(color.rgb)}"></div><div class="legend-main"><strong>${escapeHtml(color.id)} · ${escapeHtml(color.name)}</strong><small>${hex(color.rgb)} · RGB(${color.rgb.map((v) => Math.round(v)).join(",")})</small></div><span class="legend-count">${counts.get(color.id) || 0}</span></div>`).join("");
  }

  function renderMaterials() {
    const counts = new Map(); state.pattern.forEach((color) => counts.set(color.id, (counts.get(color.id) || 0) + 1));
    const total = state.pattern.length;
    const density = Math.max(1, Number(els.density.value) || 20);
    const rows = state.selectedColors.filter((color) => counts.has(color.id)).map((color) => { const count = counts.get(color.id); const length = count * (10 / density) * 0.016; return { color, count, percent: total ? count / total * 100 : 0, length }; }).sort((a, b) => b.count - a.count);
    state.stats = rows;
    els.materialsBody.innerHTML = rows.map(({ color, count, percent, length }) => `<tr><td><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${rgbCss(color.rgb)};margin-right:3px"></span>${escapeHtml(color.id)}</td><td>${count}</td><td>${percent.toFixed(2)}%</td><td>${length.toFixed(2)}m</td></tr>`).join("");
    els.totalStitches.textContent = total.toLocaleString();
  }

  function materialText() { return ["拼豆材料清单", `图纸：${state.width} × ${state.height}`, "", "颜色\t数量\t占比\t估算线长", ...state.stats.map(({ color, count, percent, length }) => `${color.id} ${color.name}\t${count}\t${percent.toFixed(2)}%\t${length.toFixed(2)}m`), "", `总针数\t${state.pattern.length}`].join("\n"); }

  function saveBlob(name, blob) { const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = name; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }
  function download(name, content, type) { saveBlob(name, new Blob([content], { type })); }
  function downloadJson() { download(`perler-pattern-${state.width}x${state.height}.json`, JSON.stringify({ width: state.width, height: state.height, mode: state.mode, palette: state.mode === "mard" ? `MARD ${activeMardPalette().length}` : "cluster colors", colors: state.selectedColors, cells: state.pattern.map((color) => color.id) }, null, 2), "application/json"); }

  // The PDF is assembled locally as vector drawing commands. It does not rasterize the
  // preview, so each cell stays sharp when printed and carries its color code.
  const PDF_WIDTH = 595.28;
  const PDF_HEIGHT = 841.89;
  const PDF_ENCODER = new TextEncoder();
  function pdfNumber(value) { return Number(value).toFixed(3).replace(/\.?(0+)$/, ""); }
  function pdfColor(rgb, operator = "rg") { return `${rgb.map((value) => (clamp(value) / 255).toFixed(4)).join(" ")} ${operator}`; }
  function pdfEscape(value) { return String(value).replace(/[^\x20-\x7e]/g, "?").replace(/[\\()]/g, (character) => `\\${character}`); }
  function pdfText(text, x, top, size, rgb = [39, 37, 31]) { return `${pdfColor(rgb)} BT /F1 ${pdfNumber(size)} Tf 1 0 0 1 ${pdfNumber(x)} ${pdfNumber(PDF_HEIGHT - top)} Tm (${pdfEscape(text)}) Tj ET`; }
  function pdfFillRect(rgb, x, top, width, height) { return `${pdfColor(rgb)} ${pdfNumber(x)} ${pdfNumber(PDF_HEIGHT - top - height)} ${pdfNumber(width)} ${pdfNumber(height)} re f`; }

  function buildPdfCoverPage(cellsPerPage) {
    const commands = ["q", pdfText("Perler Pattern", 40, 47, 22), pdfText("Vector grid PDF / every cell includes a color code", 40, 70, 9, [95, 91, 82]), pdfText(`Grid ${state.width} x ${state.height}    Cells ${state.pattern.length.toLocaleString()}    Page tile ${cellsPerPage} x ${cellsPerPage}`, 40, 96, 10, [95, 91, 82])];
    let top = 135;
    commands.push(pdfText("Material list", 40, top, 13));
    top += 22;
    state.stats.forEach(({ color, count, percent }) => {
      commands.push(pdfFillRect(color.rgb, 42, top - 11, 15, 15));
      commands.push(pdfText(`${color.id}  ${color.name}`, 67, top, 9));
      commands.push(pdfText(`${count.toLocaleString()} beads   ${percent.toFixed(2)}%`, 365, top, 9, [95, 91, 82]));
      top += 21;
    });
    commands.push(pdfText(`Palette: ${state.mode === "mard" ? `MARD ${activeMardPalette().length}` : "cluster colors"}`, 40, Math.min(top + 20, PDF_HEIGHT - 46), 9, [95, 91, 82]));
    commands.push(pdfText("Print at 100% scale. Use the tile headers to assemble large patterns.", 40, PDF_HEIGHT - 25, 8, [130, 124, 113]), "Q");
    return commands.join("\n");
  }

  function buildPdfGridPage(startX, startY, columns, rows) {
    const marginX = 30;
    const topReserved = 52;
    const bottomReserved = 27;
    const cellSize = Math.min((PDF_WIDTH - marginX * 2) / columns, (PDF_HEIGHT - topReserved - bottomReserved) / rows);
    const gridWidth = cellSize * columns;
    const gridHeight = cellSize * rows;
    const originX = (PDF_WIDTH - gridWidth) / 2;
    const originTop = topReserved + ((PDF_HEIGHT - topReserved - bottomReserved) - gridHeight) / 2;
    const commands = ["q", pdfText(`Columns ${startX + 1}-${startX + columns}   Rows ${startY + 1}-${startY + rows}`, 30, 28, 9), pdfText("Every cell shows its color code", 390, 28, 8, [95, 91, 82])];

    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const color = state.pattern[(startY + row) * state.width + startX + column];
        if (!color) continue;
        commands.push(pdfFillRect(color.rgb, originX + column * cellSize, originTop + row * cellSize, cellSize, cellSize));
      }
    }

    commands.push(`${pdfColor([48, 45, 39], "RG")} ${pdfNumber(Math.max(.25, Math.min(.7, cellSize / 15)))} w`);
    for (let column = 0; column <= columns; column++) {
      const x = originX + column * cellSize;
      commands.push(`${pdfNumber(x)} ${pdfNumber(PDF_HEIGHT - originTop)} m ${pdfNumber(x)} ${pdfNumber(PDF_HEIGHT - originTop + gridHeight)} l`);
    }
    for (let row = 0; row <= rows; row++) {
      const top = originTop + row * cellSize;
      const y = PDF_HEIGHT - top;
      commands.push(`${pdfNumber(originX)} ${pdfNumber(y)} m ${pdfNumber(originX + gridWidth)} ${pdfNumber(y)} l`);
    }
    commands.push("S");

    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const color = state.pattern[(startY + row) * state.width + startX + column];
        if (!color) continue;
        const label = String(color.id || "?").slice(0, 8);
        const size = Math.max(3.2, Math.min(8, cellSize * (label.length > 4 ? .28 : .36)));
        const x = originX + column * cellSize + cellSize / 2 - label.length * size * .27;
        const top = originTop + row * cellSize + cellSize / 2 + size * .34;
        commands.push(pdfText(label, x, top, size, contrastRgb(color.rgb)));
      }
    }
    commands.push(pdfText("Perler Pattern", 30, PDF_HEIGHT - 11, 7, [130, 124, 113]), "Q");
    return commands.join("\n");
  }

  function buildPdfFile(pages) {
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
      objects[pageNumber] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentNumber} 0 R >>`;
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
    if (!state.pattern.length) return showToast("请先生成拼豆图解");
    const cellsPerPage = Number(els.pdfCellsPerPage.value) || 50;
    els.downloadPdf.disabled = true;
    setStatus("正在生成矢量 PDF…");
    setTimeout(() => {
      try {
        const pages = [buildPdfCoverPage(cellsPerPage)];
        for (let startY = 0; startY < state.height; startY += cellsPerPage) {
          for (let startX = 0; startX < state.width; startX += cellsPerPage) pages.push(buildPdfGridPage(startX, startY, Math.min(cellsPerPage, state.width - startX), Math.min(cellsPerPage, state.height - startY)));
        }
        saveBlob(`perler-pattern-${state.width}x${state.height}.pdf`, new Blob([buildPdfFile(pages)], { type: "application/pdf" }));
        setStatus("PDF 已生成", true);
        showToast(`已导出 ${pages.length} 页矢量 PDF，每格包含色号`);
      } catch (error) {
        setStatus("PDF 导出失败");
        showToast(`PDF 导出失败：${error.message || "浏览器内存不足"}`);
      } finally {
        els.downloadPdf.disabled = false;
      }
    }, 30);
  }

  els.paletteStatus.textContent = `内置公开参考色卡：${activeMardPalette().length} 色；如与实物卡不同，可导入准确的 CSV/JSON。`;
  els.imageInput.addEventListener("change", (event) => loadImage(event.target.files[0]));
  els.replaceImage.addEventListener("click", () => els.imageInput.click());
  els.precisionSelect.addEventListener("change", applyPrecisionSelection);
  [els.gridWidth, els.gridHeight].forEach((input) => input.addEventListener("input", markCustomPrecision));
  els.bigjpgButton.addEventListener("click", () => {
    const opened = window.open("https://bigjpg.com/", "_blank", "noopener,noreferrer");
    if (!opened) showToast("请允许打开新窗口后访问 Bigjpg");
    else showToast("请在 Bigjpg 放大并下载图片，再重新上传到本页");
  });
  els.paletteInput.addEventListener("change", (event) => importPaletteFile(event.target.files[0]));
  ["dragenter", "dragover"].forEach((eventName) => els.dropZone.addEventListener(eventName, (event) => { event.preventDefault(); els.dropZone.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((eventName) => els.dropZone.addEventListener(eventName, (event) => { event.preventDefault(); els.dropZone.classList.remove("dragging"); }));
  els.dropZone.addEventListener("drop", (event) => loadImage(event.dataTransfer.files[0]));
  els.colorCount.addEventListener("input", () => { els.colorCountValue.textContent = els.colorCount.value; markPatternStale("颜色数已改变，请重新生成图解"); });
  els.paletteStyle.addEventListener("change", () => markPatternStale("颜色风格已改变，请重新生成图解"));
  [els.denoise, els.dither, els.majorityFilter].forEach((input) => input.addEventListener("change", () => markPatternStale("图解参数已改变，请重新生成图解")));
  $$('input[name="edgeMode"]').forEach((input) => input.addEventListener("change", () => markPatternStale("边缘处理已改变，请重新生成图解")));
  els.extractColors.addEventListener("click", extract); els.generatePattern.addEventListener("click", generate); els.refreshMaterials.addEventListener("click", renderMaterials); els.zoom.addEventListener("input", applyZoom);
  els.downloadPng.addEventListener("click", () => { if (state.pattern.length) els.canvas.toBlob((blob) => saveBlob(`perler-pattern-${state.width}x${state.height}.png`, blob), "image/png"); });
  els.downloadPdf.addEventListener("click", exportPdf);
  els.downloadJson.addEventListener("click", downloadJson);
  els.showCodes.addEventListener("change", () => { if (state.pattern.length) renderPattern(); });
  els.density.addEventListener("input", () => { if (state.pattern.length) renderMaterials(); });
  els.copyMaterials.addEventListener("click", async () => { try { await navigator.clipboard.writeText(materialText()); showToast("材料清单已复制"); } catch { showToast("当前浏览器不允许复制，请使用导出数据"); } });
  $$('input[name="colorMode"]').forEach((input) => input.addEventListener("change", () => { $$(".radio-card").forEach((card) => card.classList.toggle("selected", card.querySelector("input").checked)); markPatternStale("颜色模式已改变，请重新生成图解"); }));
})();
