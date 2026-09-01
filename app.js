(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const els = {
    imageInput: $("#imageInput"), dropZone: $("#dropZone"), fileInfo: $("#fileInfo"), sourceThumb: $("#sourceThumb"), fileName: $("#fileName"), fileDimensions: $("#fileDimensions"), replaceImage: $("#replaceImage"),
    denoise: $("#denoise"), colorCount: $("#colorCount"), colorCountValue: $("#colorCountValue"), paletteStyle: $("#paletteStyle"), extractColors: $("#extractColors"), extractedColors: $("#extractedColors"),
    gridWidth: $("#gridWidth"), gridHeight: $("#gridHeight"), dither: $("#dither"), majorityFilter: $("#majorityFilter"), generatePattern: $("#generatePattern"), density: $("#density"), refreshMaterials: $("#refreshMaterials"),
    canvas: $("#patternCanvas"), emptyState: $("#emptyState"), canvasViewport: $("#canvasViewport"), statusText: $("#statusText"), liveDot: $(".live-dot"), canvasMeta: $("#canvasMeta"), zoom: $("#zoom"), zoomValue: $("#zoomValue"),
    modeBadge: $("#modeBadge"), legend: $("#legend"), materialsBody: $("#materialsBody"), totalStitches: $("#totalStitches"), copyMaterials: $("#copyMaterials"), downloadPng: $("#downloadPng"), downloadJson: $("#downloadJson"), toast: $("#toast")
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
  let state = { clusters: [], selectedColors: [], pattern: [], width: 0, height: 0, mode: "dmc", paletteStyle: "all", stats: [] };
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
  function getMode() { return $("input[name='colorMode']:checked").value; }
  function getEdgeMode() { return $("input[name='edgeMode']:checked").value; }
  function showToast(message) { clearTimeout(toastTimer); els.toast.textContent = message; els.toast.classList.add("show"); toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2600); }
  function setStatus(message, ready = false) { els.statusText.textContent = message; els.liveDot.classList.toggle("ready", ready); }
  function validDimension(input, fallback) { const n = Number(input.value); return Number.isFinite(n) ? Math.max(8, Math.min(240, Math.round(n))) : fallback; }

  function paletteForStyle(style) {
    if (style === "all") return DMC;
    return DMC.filter((color) => color.tags.includes(style));
  }

  function loadImage(file) {
    if (!file || !file.type.startsWith("image/")) { showToast("请选择 JPG、PNG 或 WEBP 图片"); return; }
    sourceFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        sourceImage = image;
        els.sourceThumb.src = image.src;
        els.fileName.textContent = file.name;
        els.fileDimensions.textContent = `${image.naturalWidth} × ${image.naturalHeight}px`;
        els.fileInfo.classList.remove("hidden");
        els.extractColors.disabled = false;
        els.generatePattern.disabled = false;
        els.refreshMaterials.disabled = false;
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
      els.downloadPng.disabled = false; els.downloadJson.disabled = false; els.copyMaterials.disabled = false;
      setStatus("图解已生成", true); showToast(`已生成 ${width} × ${height} 拼豆图纸`);
    });
  }

  function renderExtractedColors() { els.extractedColors.innerHTML = state.selectedColors.map((color) => `<div class="swatch"><div class="swatch-color" style="background:${rgbCss(color.rgb)}"></div><label>${color.id}</label></div>`).join(""); els.modeBadge.textContent = state.mode === "dmc" ? "DMC 色卡" : "原图真实色"; }

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
      if (cellSize >= 10) { context.fillStyle = "rgba(20,20,17,.62)"; context.font = `700 ${Math.max(6, Math.floor(cellSize * .55))}px sans-serif`; context.textAlign = "center"; context.textBaseline = "middle"; context.fillText(symbolMap.get(color.id) || "·", px + cellSize / 2, py + cellSize / 2 + .5); }
    });
    applyZoom(); els.emptyState.classList.add("hidden"); els.canvas.classList.remove("hidden"); els.canvasMeta.textContent = `${width} × ${height} 格 · ${state.selectedColors.length} 色`;
  }

  function applyZoom() { const scale = Number(els.zoom.value) / 100; els.zoomValue.value = `${els.zoom.value}%`; els.zoomValue.textContent = `${els.zoom.value}%`; els.canvas.style.transform = `scale(${scale})`; els.canvas.style.transformOrigin = "center center"; els.canvas.style.margin = `${Math.max(0, (scale - 1) * 100)}px`; }

  function renderLegend() {
    const counts = new Map(); state.pattern.forEach((color) => counts.set(color.id, (counts.get(color.id) || 0) + 1));
    els.legend.innerHTML = state.selectedColors.map((color) => `<div class="legend-item"><div class="legend-color" style="background:${rgbCss(color.rgb)}"></div><div class="legend-main"><strong>${color.id} · ${color.name}</strong><small>${hex(color.rgb)} · RGB(${color.rgb.map((v) => Math.round(v)).join(",")})</small></div><span class="legend-count">${counts.get(color.id) || 0}</span></div>`).join("");
  }

  function renderMaterials() {
    const counts = new Map(); state.pattern.forEach((color) => counts.set(color.id, (counts.get(color.id) || 0) + 1));
    const total = state.pattern.length;
    const rows = state.selectedColors.filter((color) => counts.has(color.id)).map((color) => { const count = counts.get(color.id); const length = count * .008; return { color, count, percent: count / total * 100, length }; }).sort((a, b) => b.count - a.count);
    state.stats = rows;
    els.materialsBody.innerHTML = rows.map(({ color, count, percent, length }) => `<tr><td><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${rgbCss(color.rgb)};margin-right:3px"></span>${color.id}</td><td>${count}</td><td>${percent.toFixed(2)}%</td><td>${length.toFixed(2)}m</td></tr>`).join("");
    els.totalStitches.textContent = total.toLocaleString();
  }

  function materialText() { return ["拼豆材料清单", `图纸：${state.width} × ${state.height}`, "", "颜色\t数量\t占比\t估算线长", ...state.stats.map(({ color, count, percent, length }) => `${color.id} ${color.name}\t${count}\t${percent.toFixed(2)}%\t${length.toFixed(2)}m`), "", `总针数\t${state.pattern.length}`].join("\n"); }

  function download(name, content, type) { const blob = new Blob([content], { type }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }
  function downloadJson() { download("perler-pattern.json", JSON.stringify({ width: state.width, height: state.height, mode: state.mode, colors: state.selectedColors, cells: state.pattern.map((color) => color.id) }, null, 2), "application/json"); }

  els.imageInput.addEventListener("change", (event) => loadImage(event.target.files[0]));
  els.replaceImage.addEventListener("click", () => els.imageInput.click());
  ["dragenter", "dragover"].forEach((eventName) => els.dropZone.addEventListener(eventName, (event) => { event.preventDefault(); els.dropZone.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((eventName) => els.dropZone.addEventListener(eventName, (event) => { event.preventDefault(); els.dropZone.classList.remove("dragging"); }));
  els.dropZone.addEventListener("drop", (event) => loadImage(event.dataTransfer.files[0]));
  els.colorCount.addEventListener("input", () => { els.colorCountValue.textContent = els.colorCount.value; });
  els.extractColors.addEventListener("click", extract); els.generatePattern.addEventListener("click", generate); els.refreshMaterials.addEventListener("click", renderMaterials); els.zoom.addEventListener("input", applyZoom);
  els.downloadPng.addEventListener("click", () => { if (state.pattern.length) els.canvas.toBlob((blob) => { const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "perler-pattern.png"; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }, "image/png"); });
  els.downloadJson.addEventListener("click", downloadJson);
  els.copyMaterials.addEventListener("click", async () => { try { await navigator.clipboard.writeText(materialText()); showToast("材料清单已复制"); } catch { showToast("当前浏览器不允许复制，请使用导出数据"); } });
  $$('input[name="colorMode"]').forEach((input) => input.addEventListener("change", () => { $$(".radio-card").forEach((card) => card.classList.toggle("selected", card.querySelector("input").checked)); }));
})();
