import { photoEnglishText } from "./photoText.js";
function safeFilePart(value) {
  return value.normalize("NFKD").replace(/[^\p{L}\p{N}-]+/gu, "-").replace(/^-|-$/g, "").slice(0, 70) || "business";
}
function drawWrapped(ctx, text, x, baseline, maxWidth, lineHeight, maxLines = 2) {
  const hasArabic = /[\u0600-\u06ff]/.test(text);
  const previousAlign = ctx.textAlign;
  const previousDirection = ctx.direction;
  if ("direction" in ctx) ctx.direction = hasArabic ? "rtl" : "ltr";
  ctx.textAlign = hasArabic ? "right" : "left";
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length) {
    let last = visible[visible.length - 1];
    while (last && ctx.measureText(`${last}\u2026`).width > maxWidth) last = last.slice(0, -1).trimEnd();
    visible[visible.length - 1] = `${last}\u2026`;
  }
  visible.forEach((value, index) => ctx.fillText(value, hasArabic ? x + maxWidth : x, baseline + index * lineHeight, maxWidth));
  ctx.textAlign = previousAlign;
  if ("direction" in ctx) ctx.direction = previousDirection;
  return visible.length;
}
async function renderArtworkBlob(post, biz, adjustments, customHeadline) {
  const imageUrl = post.imageUrl;
  if (!imageUrl) {
    throw new Error("No image available to download");
  }
  const safeUrl = imageUrl.startsWith("data:") || imageUrl.startsWith("/uploads") ? imageUrl : `/api/crm/proxy-image?url=${encodeURIComponent(imageUrl)}`;
  let width = 1080;
  let height = 1080;
  if (adjustments.aspectRatio === "4:5") {
    width = 1080;
    height = 1350;
  } else if (adjustments.aspectRatio === "9:16") {
    width = 1080;
    height = 1920;
  } else if (adjustments.aspectRatio === "16:9") {
    width = 1920;
    height = 1080;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = safeUrl;
  await new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image for rendering"));
  });
  const b = adjustments.brightness ?? 100;
  const c = adjustments.contrast ?? 100;
  const s = adjustments.saturation ?? 100;
  const warmth = adjustments.warmth ?? 0;
  const filterParts = [
    `brightness(${b}%)`,
    `contrast(${c}%)`,
    `saturate(${s}%)`
  ];
  if (warmth > 0) {
    filterParts.push(`sepia(${Math.min(warmth * 1.5, 40)}%)`);
  } else if (warmth < 0) {
    filterParts.push(`hue-rotate(${warmth * 0.5}deg)`);
  }
  ctx.filter = filterParts.join(" ");
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  const drawX = (width - drawW) / 2;
  const drawY = (height - drawH) / 2;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.filter = "none";
  const vignette = adjustments.vignette ?? 0;
  if (vignette > 0) {
    const radius = Math.max(width, height) * 0.75;
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      radius * 0.35,
      width / 2,
      height / 2,
      radius
    );
    grad.addColorStop(0, "rgba(0, 0, 0, 0)");
    grad.addColorStop(1, `rgba(0, 0, 0, ${vignette / 100 * 0.85})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
  const movement = adjustments.movement || "editorial";
  const overlayStyle = adjustments.overlayStyle || "classic";
  const headline = photoEnglishText(customHeadline || post.headline || post.title || biz.name);
  const brandName = photoEnglishText(biz.name);
  const subtitle = photoEnglishText(post.sub || brandName);
  const font = post.designFont || biz.headingFont || "DM Serif Display";
  const subFont = post.subFont || biz.bodyFont || "DM Sans";
  const primaryColor = post.designPalette?.[0] || biz.websiteInsights?.colors?.[0] || "#5B0E14";
  const accentColor = post.designPalette?.[1] || biz.websiteInsights?.colors?.[1] || "#F1E194";
  const headlineColor = post.headlineColor || "#FFFFFF";
  const subtitleColor = post.subColor || accentColor;
  const bottomGrad = ctx.createLinearGradient(0, height * 0.5, 0, height);
  bottomGrad.addColorStop(0, "rgba(15, 12, 10, 0)");
  bottomGrad.addColorStop(0.5, "rgba(15, 12, 10, 0.45)");
  bottomGrad.addColorStop(1, "rgba(15, 12, 10, 0.92)");
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, height * 0.5, width, height * 0.5);
  if (overlayStyle === "bold-badge") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    ctx.fillRect(0, height * 0.69, width, height * 0.31);
    ctx.fillStyle = primaryColor;
    ctx.fillRect(56, height - 244, Math.max(6, Math.round(width * 0.012)), 174);
  } else if (overlayStyle === "split") {
    ctx.fillStyle = "rgba(10, 10, 10, 0.3)";
    ctx.fillRect(0, 0, Math.round(width * 0.46), height);
  } else if (overlayStyle === "quiet") {
    ctx.fillStyle = "rgba(10, 10, 10, 0.16)";
    ctx.fillRect(0, height * 0.78, width, height * 0.22);
  } else if (overlayStyle === "minimal") {
    ctx.fillStyle = accentColor;
    ctx.fillRect(60, height - 242, Math.max(28, Math.round(width * 0.09)), 3);
  }
  if (movement === "brutalism") {
    ctx.fillStyle = primaryColor;
    ctx.fillRect(50, height - 280, width - 100, 210);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 6;
    ctx.strokeRect(50, height - 280, width - 100, 210);
    ctx.fillStyle = accentColor;
    ctx.fillRect(50, height - 280, width - 100, 8);
    ctx.fillStyle = headlineColor;
    ctx.font = `bold ${Math.round(width * 0.046)}px "${font}", sans-serif`;
    drawWrapped(ctx, headline, 80, height - 200, width - 160, Math.round(width * 0.052), 2);
    ctx.font = `600 ${Math.round(width * 0.022)}px "${subFont}", sans-serif`;
    ctx.fillStyle = subtitleColor;
    drawWrapped(ctx, subtitle, 80, height - 126, width - 300, Math.round(width * 0.025), 2);
    ctx.textAlign = "right";
    ctx.fillText(post.platform.toUpperCase(), width - 80, height - 94);
    ctx.textAlign = "left";
  } else if (movement === "glassmorphism") {
    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.beginPath();
    ctx.roundRect(60, height - 290, width - 120, 210, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.38)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = accentColor;
    ctx.font = `bold ${Math.round(width * 0.019)}px "${subFont}", sans-serif`;
    drawWrapped(ctx, brandName, 90, height - 254, width - 180, Math.round(width * 0.024), 2);
    ctx.fillStyle = headlineColor;
    ctx.font = `bold ${Math.round(width * 0.044)}px "${font}", serif`;
    drawWrapped(ctx, headline, 90, height - 208, width - 180, Math.round(width * 0.05), 2);
    ctx.fillStyle = subtitleColor;
    ctx.font = `500 ${Math.round(width * 0.02)}px "${subFont}", sans-serif`;
    ctx.fillText(subtitle, 90, height - 96, width - 180);
  } else {
    ctx.fillStyle = accentColor;
    ctx.fillRect(60, height - 240, 50, 6);
    ctx.fillStyle = headlineColor;
    ctx.font = `bold ${Math.round(width * 0.048)}px "${font}", serif`;
    drawWrapped(ctx, headline, 60, height - 175, width - 120, Math.round(width * 0.055), 2);
    ctx.font = `600 ${Math.round(width * 0.02)}px "${subFont}", sans-serif`;
    ctx.fillStyle = subtitleColor;
    drawWrapped(ctx, subtitle, 60, height - 104, width * 0.68, Math.round(width * 0.022), 2);
    ctx.font = `500 ${Math.round(width * 0.018)}px "${biz.bodyFont || "DM Sans"}", sans-serif`;
    ctx.fillStyle = accentColor;
    ctx.textAlign = "right";
    ctx.fillText(post.platform.toUpperCase(), width - 60, height - 60);
    ctx.textAlign = "left";
  }
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not encode artwork")), "image/jpeg", 0.94));
}
function downloadBlob(blob, filename) {
  const anchor = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 6e4);
}
async function composeAndDownloadArtwork(post, biz, adjustments, customHeadline) {
  const blob = await renderArtworkBlob(post, biz, adjustments, customHeadline);
  downloadBlob(blob, `${safeFilePart(biz.name)}-${safeFilePart(post.id)}-artwork.jpg`);
}
function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = crc >>> 1 ^ (crc & 1 ? 3988292384 : 0);
  }
  return (crc ^ -1) >>> 0;
}
function buildCampaignZip(entries) {
  const encoder = new TextEncoder();
  const locals = [];
  const centrals = [];
  let offset = 0;
  const put16 = (view, at, value) => view.setUint16(at, value, true);
  const put32 = (view, at, value) => view.setUint32(at, value, true);
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const checksum = crc32(entry.data);
    const local = new Uint8Array(30 + name.length + entry.data.length);
    const lv = new DataView(local.buffer);
    put32(lv, 0, 67324752);
    put16(lv, 4, 20);
    put16(lv, 6, 2048);
    put16(lv, 8, 0);
    put32(lv, 14, checksum);
    put32(lv, 18, entry.data.length);
    put32(lv, 22, entry.data.length);
    put16(lv, 26, name.length);
    local.set(name, 30);
    local.set(entry.data, 30 + name.length);
    locals.push(local);
    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    put32(cv, 0, 33639248);
    put16(cv, 4, 20);
    put16(cv, 6, 20);
    put16(cv, 8, 2048);
    put16(cv, 10, 0);
    put32(cv, 16, checksum);
    put32(cv, 20, entry.data.length);
    put32(cv, 24, entry.data.length);
    put16(cv, 28, name.length);
    put32(cv, 42, offset);
    central.set(name, 46);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((sum, item) => sum + item.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  put32(ev, 0, 101010256);
  put16(ev, 8, entries.length);
  put16(ev, 10, entries.length);
  put32(ev, 12, centralSize);
  put32(ev, 16, offset);
  return new Blob([...locals, ...centrals, end], { type: "application/zip" });
}
async function downloadCampaignBundle(posts, biz, onProgress) {
  const encoder = new TextEncoder();
  const entries = [];
  const csv = [["Title", "Platform", "Scheduled time", "Caption", "Image source", "Image URL or photo status", "Research Sources"].map((value) => `"${value}"`).join(",")];
  const bundlePosts = posts;
  if (!bundlePosts.length) throw new Error("There are no campaign posts to download.");
  for (let i = 0; i < bundlePosts.length; i++) {
    const post = bundlePosts[i];
    if (post.imageUrl) {
      const adjustments = post.adjustments || { brightness: 100, contrast: 100, saturation: 100, warmth: 0, vignette: 10, aspectRatio: "1:1", movement: "editorial", overlayStyle: "classic" };
      const blob = await renderArtworkBlob(post, biz, adjustments);
      const filename = `${String(i + 1).padStart(3, "0")}-${safeFilePart(post.title || post.id)}.jpg`;
      entries.push({ name: `artwork/${filename}`, data: new Uint8Array(await blob.arrayBuffer()) });
    }
    const fields = [post.title, post.platform, post.time, post.caption, post.imageSource?.provider || "", post.imageUrl || post.imageStatus || "Photo needed", (post.researchSources || []).map((source) => source.url).join(" | ")];
    csv.push(fields.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(","));
    onProgress?.(i + 1, bundlePosts.length);
  }
  entries.push({ name: "captions.csv", data: encoder.encode(csv.join("\r\n")) });
  entries.push({ name: "README.txt", data: encoder.encode(`${biz.name}
Campaign artwork and captions exported from Goodfolk CRM.
${entries.length - 1} artwork files are in the artwork folder.
All ${bundlePosts.length} campaign drafts are listed in captions.csv, including drafts still waiting for photos.
`) });
  downloadBlob(buildCampaignZip(entries), `${safeFilePart(biz.name)}-campaign-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.zip`);
}
export {
  buildCampaignZip,
  composeAndDownloadArtwork,
  downloadCampaignBundle,
  renderArtworkBlob
};
