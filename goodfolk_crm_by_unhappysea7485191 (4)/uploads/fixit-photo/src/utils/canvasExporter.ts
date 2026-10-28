import { Post, Business, PhotoAdjustments } from '../types';

export async function composeAndDownloadArtwork(
  post: Post,
  biz: Business,
  adjustments: PhotoAdjustments,
  customHeadline?: string
): Promise<void> {
  const imageUrl = post.imageUrl;
  if (!imageUrl) {
    throw new Error('No image available to download');
  }

  // Use proxy URL to prevent CORS taint on canvas
  const safeUrl = imageUrl.startsWith('data:') || imageUrl.startsWith('/uploads')
    ? imageUrl
    : `/api/crm/proxy-image?url=${encodeURIComponent(imageUrl)}`;

  // Determine canvas dimensions based on aspect ratio
  let width = 1080;
  let height = 1080;

  if (adjustments.aspectRatio === '4:5') {
    width = 1080;
    height = 1350;
  } else if (adjustments.aspectRatio === '9:16') {
    width = 1080;
    height = 1920;
  } else if (adjustments.aspectRatio === '16:9') {
    width = 1920;
    height = 1080;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');

  // Load image
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = safeUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image for rendering'));
  });

  // Apply filters to canvas context
  const b = adjustments.brightness ?? 100;
  const c = adjustments.contrast ?? 100;
  const s = adjustments.saturation ?? 100;
  const warmth = adjustments.warmth ?? 0;

  // Build CSS filter string
  const filterParts = [
    `brightness(${b}%)`,
    `contrast(${c}%)`,
    `saturate(${s}%)`,
  ];
  if (warmth > 0) {
    filterParts.push(`sepia(${Math.min(warmth * 1.5, 40)}%)`);
  } else if (warmth < 0) {
    filterParts.push(`hue-rotate(${warmth * 0.5}deg)`);
  }

  ctx.filter = filterParts.join(' ');

  // Draw background image scaled to cover
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  const drawX = (width - drawW) / 2;
  const drawY = (height - drawH) / 2;

  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  // Reset filter for overlays
  ctx.filter = 'none';

  // Apply vignette if requested
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
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, `rgba(0, 0, 0, ${(vignette / 100) * 0.85})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Draw Visual Movement Overlays
  const movement = adjustments.movement || 'editorial';
  const overlayStyle = adjustments.overlayStyle || 'classic';
  const headline = (customHeadline || post.headline || post.title || biz.name).toUpperCase();
  const font = post.designFont || biz.headingFont || 'DM Serif Display';
  const primaryColor = post.designPalette?.[0] || biz.websiteInsights?.colors?.[0] || '#5B0E14';
  const accentColor = post.designPalette?.[1] || biz.websiteInsights?.colors?.[1] || '#F1E194';

  // Base Gradient for legibility at bottom
  const bottomGrad = ctx.createLinearGradient(0, height * 0.5, 0, height);
  bottomGrad.addColorStop(0, 'rgba(15, 12, 10, 0)');
  bottomGrad.addColorStop(0.5, 'rgba(15, 12, 10, 0.45)');
  bottomGrad.addColorStop(1, 'rgba(15, 12, 10, 0.92)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, height * 0.5, width, height * 0.5);

  if (movement === 'brutalism') {
    // Sharp high-contrast brutalist badge
    ctx.fillStyle = primaryColor;
    ctx.fillRect(50, height - 280, width - 100, 210);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeRect(50, height - 280, width - 100, 210);

    // Accent line
    ctx.fillStyle = accentColor;
    ctx.fillRect(50, height - 280, width - 100, 8);

    // Headline
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(width * 0.046)}px "${font}", sans-serif`;
    ctx.fillText(headline.slice(0, 42), 80, height - 200);

    // Subtitle
    ctx.font = `600 ${Math.round(width * 0.022)}px "${biz.bodyFont || 'DM Sans'}", sans-serif`;
    ctx.fillStyle = accentColor;
    ctx.fillText(`${biz.name.toUpperCase()} · ${post.platform.toUpperCase()}`, 80, height - 120);
  } else if (movement === 'glassmorphism') {
    // Frosted card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.beginPath();
    ctx.roundRect(60, height - 290, width - 120, 210, 24);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Top pill tag
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(90, height - 265, 120, 26, 13);
    ctx.fill();

    ctx.fillStyle = '#1D211B';
    ctx.font = `bold ${Math.round(width * 0.015)}px "${biz.bodyFont || 'DM Sans'}", sans-serif`;
    ctx.fillText(biz.name.toUpperCase(), 105, height - 247);

    // Headline
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(width * 0.044)}px "${font}", serif`;
    ctx.fillText(headline.slice(0, 40), 90, height - 170);

    // Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `500 ${Math.round(width * 0.02)}px "${biz.bodyFont || 'DM Sans'}", sans-serif`;
    ctx.fillText(post.sub || biz.description.slice(0, 50), 90, height - 120);
  } else {
    // Classic Editorial Overlay
    // Brand Accent Bar
    ctx.fillStyle = accentColor;
    ctx.fillRect(60, height - 240, 50, 6);

    // Headline
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(width * 0.048)}px "${font}", serif`;

    // Word wrap headline if long
    const words = headline.split(/\s+/);
    let line1 = '';
    let line2 = '';
    for (const w of words) {
      if ((line1 + ' ' + w).length < 24) {
        line1 = line1 ? `${line1} ${w}` : w;
      } else {
        line2 = line2 ? `${line2} ${w}` : w;
      }
    }

    if (line2) {
      ctx.fillText(line1, 60, height - 170);
      ctx.fillText(line2, 60, height - 115);
    } else {
      ctx.fillText(line1 || headline, 60, height - 140);
    }

    // Subtitle & Platform tag
    ctx.font = `600 ${Math.round(width * 0.02)}px "${biz.bodyFont || 'DM Sans'}", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.fillText(biz.name.toUpperCase(), 60, height - 60);

    ctx.font = `500 ${Math.round(width * 0.018)}px "${biz.bodyFont || 'DM Sans'}", sans-serif`;
    ctx.fillStyle = accentColor;
    ctx.textAlign = 'right';
    ctx.fillText(post.platform.toUpperCase(), width - 60, height - 60);
    ctx.textAlign = 'left';
  }

  // Trigger download
  const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = `${biz.name.toLowerCase().replace(/\W+/g, '-')}-${post.id}-artwork.jpg`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
